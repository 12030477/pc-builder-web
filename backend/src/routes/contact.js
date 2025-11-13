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

    // Send email notification (optional)
    try {
      await sendContactEmail(name, email, subject, message)
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Don't fail the request if email fails
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
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  const mailOptions = {
    from: process.env.SMTP_FROM || 'noreply@pcpartpicker.com',
    to: process.env.ADMIN_EMAIL || 'admin@pcpartpicker.com',
    subject: `New Contact Form Message: ${subject}`,
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #1e90ff;">New Contact Form Message</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <p><small>This message was sent from the PC Part Picker contact form.</small></p>
        </body>
      </html>
    `,
    text: `
      New Contact Form Message
      
      From: ${name} (${email})
      Subject: ${subject}
      
      Message:
      ${message}
      
      This message was sent from the PC Part Picker contact form.
    `
  }

  await transporter.sendMail(mailOptions)
}

module.exports = router
