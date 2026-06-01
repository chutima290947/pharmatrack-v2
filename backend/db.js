require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

// ทดสอบเชื่อมต่อครั้งเดียว
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Neon connected')
  })
  .catch((err) => {
    console.error('❌ Neon connection error:', err.message)
  })

// กัน server crash
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error', err)
})

module.exports = pool