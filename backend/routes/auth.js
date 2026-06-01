require('dotenv').config()
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../db')
const { JWT_SECRET } = require('../middleware/auth')
const router = express.Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' })
  }
  try {
    // ดึงจาก Neon
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Invalid username or password' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid username or password' })

    const token = jwt.sign(
      { username, fullname: user.fullname, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    )
    return res.json({ token, fullname: user.fullname, role: user.role })
  } catch (err) {
    console.error('[auth] login error:', err.message)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

module.exports = router