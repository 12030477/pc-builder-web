const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const Joi = require('joi')
const nodemailer = require('nodemailer')
const pool = require('../config/database')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
})

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required()
})

// Register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      })
    }

    const { name, email, password } = value

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT user_id FROM user WHERE email = ?',
      [email]
    )

    if (existingUsers.length > 0) {
      return res.status(409).json({
        status: 'error',
        message: 'Email already registered'
      })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO user (name, email, password, created_at) VALUES (?, ?, ?, NOW())',
      [name, email, hashedPassword]
    )

    res.status(201).json({
      status: 'success',
      success: true,
      message: 'User registered successfully',
      userId: result.insertId
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Registration failed'
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      })
    }

    const { email, password } = value

    // Find user
    const [users] = await pool.execute(
      'SELECT user_id, name, email, password, is_admin FROM user WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      })
    }

    const user = users[0]

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Remove password from response
    delete user.password

    res.json({
      status: 'success',
      success: true,
      message: 'Login successful',
      token,
      user
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Login failed'
    })
  }
})

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    success: true,
    user: req.user
  })
})

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      })
    }

    const { email } = value

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT user_id, name, email FROM user WHERE email = ?',
      [email]
    )

    if (users.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Email not found'
      })
    }

    const user = users[0]

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now

    // Delete any existing reset tokens for this user
    await pool.execute(
      'DELETE FROM password_resets WHERE email = ?',
      [email]
    )

    // Insert new reset token
    await pool.execute(
      'INSERT INTO password_resets (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
      [user.user_id, email, resetToken, expiresAt]
    )

    // Send email (if email is configured)
    let emailSent = false
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(`\n📧 Attempting to send password reset email to: ${email}`)
      console.log(`   From: ${process.env.SMTP_FROM || process.env.SMTP_USER}`)
      console.log(`   SMTP Host: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT || 587}`)
      
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          tls: {
            rejectUnauthorized: false
          },
          debug: true, // Enable debug logging
          logger: true // Enable logging
        })

        // Try to verify transporter configuration (optional, don't fail if it fails)
        try {
          await transporter.verify()
          console.log('✅ SMTP server is ready to send emails')
        } catch (verifyError) {
          console.warn('⚠️ SMTP verification failed, but continuing:', verifyError.message)
          console.warn('   Error code:', verifyError.code)
          console.warn('   This might be a Gmail security issue. Trying to send anyway...')
          // Continue anyway - verification might fail but sending might still work
        }

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password/${resetToken}`
        
        console.log(`   Reset URL: ${resetUrl}`)
        console.log('   Sending email...')
        
        const mailInfo = await transporter.sendMail({
          from: `"PC Builder" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
          to: email,
          subject: 'Password Reset Request - PC Builder',
          headers: {
            'X-Mailer': 'PC Builder',
            'X-Priority': '1',
            'Importance': 'high'
          },
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset Request</title>
              </head>
              <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
                  <tr>
                    <td align="center">
                      <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                          <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PC Builder</h1>
                          </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                          <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
                            <p style="color: #666666; line-height: 1.6; font-size: 16px;">Hello ${user.name},</p>
                            <p style="color: #666666; line-height: 1.6; font-size: 16px;">We received a request to reset your password for your PC Builder account. Click the button below to reset your password:</p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                              <tr>
                                <td align="center">
                                  <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">Reset Password</a>
                                </td>
                              </tr>
                            </table>
                            <p style="color: #666666; line-height: 1.6; font-size: 14px;">Or copy and paste this link into your browser:</p>
                            <p style="color: #3b82f6; word-break: break-all; font-size: 14px; background-color: #f0f0f0; padding: 10px; border-radius: 4px;">${resetUrl}</p>
                            <p style="color: #ff6b6b; font-weight: bold; font-size: 14px; margin-top: 20px;">⚠️ This link will expire in 1 hour for security reasons.</p>
                            <p style="color: #999999; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                          </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                          <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #999999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PC Builder. All rights reserved.</p>
                            <p style="color: #999999; font-size: 12px; margin: 5px 0 0 0;">This is an automated email. Please do not reply to this message.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
            </html>
          `,
          text: `
Password Reset Request - PC Builder

Hello ${user.name},

We received a request to reset your password for your PC Builder account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} PC Builder. All rights reserved.
This is an automated email. Please do not reply to this message.
          `
        })
        console.log(`✅ Password reset email sent successfully!`)
        console.log(`   Message ID: ${mailInfo.messageId}`)
        console.log(`   To: ${email}`)
        console.log(`   Response: ${mailInfo.response || 'N/A'}\n`)
        emailSent = true
      } catch (emailError) {
        console.error('❌ Email sending failed!')
        console.error('   Error:', emailError.message)
        console.error('   Code:', emailError.code)
        console.error('   Command:', emailError.command)
        console.error('   Response:', emailError.response)
        console.error('   Response Code:', emailError.responseCode)
        console.error('   Response Message:', emailError.responseMessage)
        console.error('\n💡 Troubleshooting:')
        console.error('   1. Verify Gmail App Password is correct')
        console.error('   2. Check that 2-Factor Authentication is enabled')
        console.error('   3. Verify SMTP settings in .env file')
        console.error('   4. Check Gmail security settings')
        console.error('   5. Run: npm run test-email (in backend folder)\n')
        // Don't fail the request if email fails - token is still saved to database
        emailSent = false
      }
    } else {
      console.warn('⚠️ Email not configured. Password reset token saved to database but email not sent.')
      console.warn('   Missing: SMTP_HOST, SMTP_USER, or SMTP_PASS in .env')
      console.warn('   Configure email settings in backend/.env to enable email notifications.\n')
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Password reset email sent successfully'
    })

  } catch (error) {
    console.error('❌ Forgot password error:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    })
    res.status(500).json({
      status: 'error',
      success: false,
      message: error.message || 'Failed to process password reset request'
    })
  }
})

// Verify Reset Token
router.get('/verify-reset-token/:token', async (req, res) => {
  try {
    const { token } = req.params

    const [resets] = await pool.execute(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    )

    if (resets.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      })
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Valid reset token'
    })

  } catch (error) {
    console.error('Verify reset token error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify reset token'
    })
  }
})

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      })
    }

    const { token, password } = value

    // Verify token
    const [resets] = await pool.execute(
      'SELECT * FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [token]
    )

    if (resets.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token'
      })
    }

    const reset = resets[0]

    // Hash new password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Update user password
    await pool.execute(
      'UPDATE user SET password = ? WHERE email = ?',
      [hashedPassword, reset.email]
    )

    // Delete reset token
    await pool.execute(
      'DELETE FROM password_resets WHERE token = ?',
      [token]
    )

    res.json({
      status: 'success',
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password'
    })
  }
})

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    status: 'success',
    message: 'Logged out successfully'
  })
})

module.exports = router
