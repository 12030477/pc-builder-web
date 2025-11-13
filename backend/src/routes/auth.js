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
      'INSERT INTO password_resets (email, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [email, resetToken, expiresAt]
    )

    // Send email (if email is configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransporter({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })

        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`
        
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Password Reset Request - PC Part Picker',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #3b82f6;">Password Reset Request</h2>
              <p>Hello ${user.name},</p>
              <p>You requested a password reset for your PC Part Picker account.</p>
              <p>Click the button below to reset your password:</p>
              <a href="${resetUrl}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Reset Password</a>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px;">PC Part Picker Team</p>
            </div>
          `
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the request if email fails
      }
    }

    res.json({
      status: 'success',
      success: true,
      message: 'Password reset email sent successfully'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request'
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
