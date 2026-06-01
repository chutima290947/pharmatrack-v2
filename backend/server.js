require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const authRoutes    = require('./routes/auth')
const patientRoutes = require('./routes/patients')
const logRoutes     = require('./routes/logs')      
const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))


// Routes
app.use('/api/auth',     authRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/logs',     logRoutes)                

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    imed: !!process.env.IMED_BASE_URL ? 'connected' : 'not configured',
  })
})

app.get('*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`✅ PharmaTrack Server running on http://localhost:${PORT}`)

})