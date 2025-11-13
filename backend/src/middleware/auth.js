const jwt = require('jsonwebtoken')
const pool = require('../config/database')

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access token required'
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    // Verify user still exists and is active
    const [users] = await pool.execute(
      'SELECT user_id, name, email, is_admin FROM user WHERE user_id = ?',
      [decoded.userId]
    )
    
    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      })
    }

    req.user = users[0]
    next()
  } catch (error) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token'
    })
  }
}

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required'
    })
  }
  next()
}

module.exports = {
  authenticateToken,
  requireAdmin
}
