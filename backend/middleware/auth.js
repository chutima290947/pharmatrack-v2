const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'pharmatrack_secret_key_change_in_production'

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { authMiddleware, JWT_SECRET }
