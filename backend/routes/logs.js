const express = require('express')
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

// GET /api/logs
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { vn } = req.query
    const { rows } = vn
      ? await pool.query(
          `SELECT id, vn, hn, patient_name, medication, bottle_number, total_bottles,
            TO_CHAR(dispensed_date, 'YYYY-MM-DD') AS dispensed_date, pharmacist, created_at
           FROM dispense_logs WHERE vn = $1 ORDER BY bottle_number ASC`,
          [vn]
        )
      : await pool.query(
          `SELECT id, vn, hn, patient_name, medication, bottle_number, total_bottles,
            TO_CHAR(dispensed_date, 'YYYY-MM-DD') AS dispensed_date, pharmacist, created_at
           FROM dispense_logs ORDER BY created_at DESC LIMIT 20`
        )
    res.json({ logs: rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router