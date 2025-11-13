const mysql = require('mysql2/promise')

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: parseInt(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'pc_builder_db',
  charset: 'utf8mb4',
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Database connected successfully')
    connection.release()
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    console.error('⚠️  Please make sure MySQL is running and database is set up')
    console.error('📖 See DATABASE_SETUP.md for setup instructions')
    // Don't exit - allow server to start but API calls will fail gracefully
  }
}

// Initialize database connection
testConnection()

module.exports = pool
