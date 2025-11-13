const mysql = require('mysql2/promise')

const connectDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    })
    console.log('✅ Database connected successfully!')
    return connection
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
  }
}

module.exports = { connectDB }
