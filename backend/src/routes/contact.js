const express = require('express')
const nodemailer = require('nodemailer')
const pool = require('../config/database')

const router = express.Router()

// Contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      })
    }

    // Save to database
    const [result] = await pool.execute(
      `INSERT INTO contact_messages (name, email, subject, message, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [name, email, subject, message]
    )

    // Send email notification (if email is configured)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        await sendContactEmail(name, email, subject, message)
        console.log(`✅ Contact form email sent to ${process.env.ADMIN_EMAIL || 'pcbuilderassist@gmail.com'}`)
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError.message)
        console.error('Email error details:', {
          code: emailError.code,
          command: emailError.command,
          response: emailError.response,
          responseCode: emailError.responseCode
        })
        // Don't fail the request if email fails, but log it
      }
    } else {
      console.warn('⚠️ Email not configured. Contact form message saved to database but email not sent.')
      console.warn('Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to enable email notifications.')
    }

    res.json({
      status: 'success',
      message: 'Thank you for your message! We will get back to you within 24-48 hours.',
      messageId: result.insertId
    })

  } catch (error) {
    console.error('Contact form error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to send message. Please try again later.'
    })
  }
})

// Get contact messages (admin)
router.get('/', async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM contact_messages ORDER BY is_read ASC, created_at DESC'
    )

    res.json({
      status: 'success',
      messages
    })

  } catch (error) {
    console.error('Get contact messages error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    })
  }
})

// Mark message as read
router.put('/:id/read', async (req, res) => {
  try {
    const messageId = req.params.id

    await pool.execute(
      'UPDATE contact_messages SET is_read = 1 WHERE id = ?',
      [messageId]
    )

    res.json({
      status: 'success',
      message: 'Message marked as read'
    })

  } catch (error) {
    console.error('Mark message as read error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update message'
    })
  }
})

// Mark message as replied
router.put('/:id/replied', async (req, res) => {
  try {
    const messageId = req.params.id

    await pool.execute(
      'UPDATE contact_messages SET is_replied = 1 WHERE id = ?',
      [messageId]
    )

    res.json({
      status: 'success',
      message: 'Message marked as replied'
    })

  } catch (error) {
    console.error('Mark message as replied error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to update message'
    })
  }
})

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const messageId = req.params.id

    await pool.execute(
      'DELETE FROM contact_messages WHERE id = ?',
      [messageId]
    )

    res.json({
      status: 'success',
      message: 'Message deleted successfully'
    })

  } catch (error) {
    console.error('Delete message error:', error)
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete message'
    })
  }
})

// Email sending function
async function sendContactEmail(name, email, subject, message) {
  // Create transporter (configure with your email service)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
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
    console.log('✅ SMTP server is ready to send emails (contact form)')
  } catch (verifyError) {
    console.warn('⚠️ SMTP verification failed (contact form), but continuing:', verifyError.message)
    // Continue anyway - verification might fail but sending might still work
  }

  const mailOptions = {
    from: `"PC Builder" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@pcbuilder.com'}>`,
    to: process.env.ADMIN_EMAIL || 'pcbuilderassist@gmail.com',
    replyTo: email,
    subject: `New Contact Form Message: ${subject}`,
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
          <title>New Contact Form Message</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #3b82f6; padding: 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">PC Builder - New Contact Message</h1>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="color: #333333; margin-top: 0; font-size: 20px;">New Contact Form Message</h2>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <strong style="color: #666666; font-size: 14px;">From:</strong>
                            <span style="color: #333333; font-size: 14px;">${name} (${email})</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
                            <strong style="color: #666666; font-size: 14px;">Subject:</strong>
                            <span style="color: #333333; font-size: 14px;">${subject}</span>
                          </td>
                        </tr>
                      </table>
                      <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                        <p style="color: #333333; line-height: 1.8; font-size: 16px; margin: 0; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
                      </div>
                      <p style="color: #999999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">This message was sent from the PC Builder contact form. You can reply directly to this email to respond to ${name}.</p>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #999999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} PC Builder. All rights reserved.</p>
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
New Contact Form Message - PC Builder

From: ${name} (${email})
Subject: ${subject}

Message:
${message}

---
This message was sent from the PC Builder contact form.
You can reply directly to this email to respond to ${name}.

© ${new Date().getFullYear()} PC Builder. All rights reserved.
    `
  }

  const mailInfo = await transporter.sendMail(mailOptions)
  console.log(`✅ Contact form email sent successfully!`)
  console.log(`   Message ID: ${mailInfo.messageId}`)
  console.log(`   To: ${process.env.ADMIN_EMAIL || 'pcbuilderassist@gmail.com'}`)
  console.log(`   Response: ${mailInfo.response || 'N/A'}\n`)
  return mailInfo
}

module.exports = router
