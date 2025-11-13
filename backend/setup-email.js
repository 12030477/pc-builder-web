const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

async function setupEmail() {
  console.log('\n📧 PC Builder - Email Configuration Setup\n')
  console.log('This script will help you configure Gmail SMTP for sending emails.')
  console.log('You will need a Gmail App Password. See docs/GMAIL_SETUP.md for instructions.\n')

  const envPath = path.join(__dirname, '.env')
  let envContent = ''

  // Read existing .env file if it exists
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  } else {
    // Read from env.example if .env doesn't exist
    const examplePath = path.join(__dirname, 'env.example')
    if (fs.existsSync(examplePath)) {
      envContent = fs.readFileSync(examplePath, 'utf8')
    } else {
      console.error('❌ Error: env.example file not found!')
      process.exit(1)
    }
  }

  // Ask for email configuration
  console.log('Enter your Gmail configuration:')
  const smtpUser = await question('Gmail address (e.g., pcbuilderassist@gmail.com): ')
  const smtpPass = await question('Gmail App Password (16 characters, no spaces): ')

  if (!smtpUser || !smtpPass) {
    console.error('❌ Error: Email and App Password are required!')
    rl.close()
    process.exit(1)
  }

  // Update .env content
  envContent = envContent.replace(/SMTP_USER=.*/g, `SMTP_USER=${smtpUser}`)
  envContent = envContent.replace(/SMTP_PASS=.*/g, `SMTP_PASS=${smtpPass}`)
  envContent = envContent.replace(/SMTP_FROM=.*/g, `SMTP_FROM=${smtpUser}`)
  envContent = envContent.replace(/ADMIN_EMAIL=.*/g, `ADMIN_EMAIL=${smtpUser}`)

  // Ensure FRONTEND_URL is set correctly
  if (!envContent.includes('FRONTEND_URL=http://localhost:3002')) {
    envContent = envContent.replace(/FRONTEND_URL=.*/g, 'FRONTEND_URL=http://localhost:3002')
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent, 'utf8')

  console.log('\n✅ Email configuration saved to .env file!')
  console.log('\n📝 Next steps:')
  console.log('1. Make sure you have enabled 2-Factor Authentication on your Gmail account')
  console.log('2. Generate a Gmail App Password (see docs/GMAIL_SETUP.md)')
  console.log('3. Update SMTP_PASS in .env with your App Password')
  console.log('4. Restart your backend server: cd backend && npm start')
  console.log('5. Test email functionality by requesting a password reset\n')

  rl.close()
}

setupEmail().catch((error) => {
  console.error('❌ Error:', error.message)
  rl.close()
  process.exit(1)
})

