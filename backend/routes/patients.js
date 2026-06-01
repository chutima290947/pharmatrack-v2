const express = require('express')
const pool = require('../db')
const { authMiddleware } = require('../middleware/auth')
const router = express.Router()

// Helper: แปลง DATE fields ให้เป็น YYYY-MM-DD string
const DATE_SELECT = `
  id, vn, hn, patient_name, phone, medication,
  total_bottles, remaining_bottles, status, cycle_count,
  TO_CHAR(active_date,     'YYYY-MM-DD') AS active_date,
  TO_CHAR(start_date,      'YYYY-MM-DD') AS start_date,
  TO_CHAR(followup_date,   'YYYY-MM-DD') AS followup_date,
  TO_CHAR(production_date, 'YYYY-MM-DD') AS production_date,
  created_at, created_by, updated_at, updated_by
`

// GET /api/patients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${DATE_SELECT} FROM patients ORDER BY created_at DESC`)
    res.json({ patients: rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/patients/search
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const q = `%${req.query.q || ''}%`
    const { rows } = await pool.query(
      `SELECT ${DATE_SELECT} FROM patients
       WHERE vn ILIKE $1 OR patient_name ILIKE $1 OR hn ILIKE $1
       ORDER BY created_at DESC`,
      [q]
    )
    res.json({ patients: rows })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/patients/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${DATE_SELECT} FROM patients WHERE id = $1`,
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Patient not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/patients
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { vn, hn, patient_name, phone, medication, total_bottles, remaining_bottles, start_date, active_date, followup_date, production_date, status, cycle_count } = req.body
    const { rows } = await pool.query(
      `INSERT INTO patients (vn, hn, patient_name, phone, medication, total_bottles, remaining_bottles, start_date, active_date, followup_date, production_date, status, cycle_count, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING ${DATE_SELECT}`,
      [vn, hn, patient_name, phone, medication, total_bottles, remaining_bottles ?? total_bottles, start_date, active_date, followup_date, production_date || null, status || 'followup', cycle_count || 1, req.user.username]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'VN already exists' })
    res.status(500).json({ error: e.message })
  }
})

// POST /api/patients/bulk
router.post('/bulk', authMiddleware, async (req, res) => {
  const { patients } = req.body
  let added = 0, dupes = 0, errors = []
  for (const p of patients) {
    try {
      await pool.query(
        `INSERT INTO patients (vn, hn, patient_name, phone, medication, total_bottles, remaining_bottles, start_date, active_date, followup_date, status, cycle_count, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [p.vn, p.hn, p.patient_name, p.phone, p.medication, p.total_bottles, p.remaining_bottles ?? p.total_bottles, p.start_date, p.active_date, p.followup_date, p.status || 'followup', p.cycle_count || 1, req.user.username]
      )
      added++
    } catch (e) {
      if (e.code === '23505') dupes++
      else errors.push({ vn: p.vn, error: e.message })
    }
  }
  res.json({ added, dupes, errors })
})

// PUT /api/patients/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const fields = Object.keys(req.body)
    const values = Object.values(req.body)
    const set = fields.map((f, i) => `${f} = $${i + 1}`).join(', ')
    const { rows } = await pool.query(
      `UPDATE patients SET ${set}, updated_at = NOW(), updated_by = $${fields.length + 2}
       WHERE id = $${fields.length + 1}
       RETURNING ${DATE_SELECT}`,
      [...values, req.params.id, req.user.username]
    )
    if (!rows[0]) return res.status(404).json({ error: 'Patient not found' })
    res.json(rows[0])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/patients/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM patients WHERE id = $1', [req.params.id])
    if (!rowCount) return res.status(404).json({ error: 'Patient not found' })
    res.json({ message: 'Deleted successfully' })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/patients/:id/dispense
router.post('/:id/dispense', authMiddleware, async (req, res) => {
  try {
    const { dispensedDate, phone } = req.body
      console.log('dispensedDate:', dispensedDate)
    const pharmacist = req.user.fullname || req.user.username

    const { rows } = await pool.query('SELECT * FROM patients WHERE id = $1', [req.params.id])
    const p = rows[0]
    if (!p) return res.status(404).json({ error: 'Patient not found' })

    const bottleNumber = p.total_bottles - p.remaining_bottles + 1
    const newRemaining = p.remaining_bottles - 1
    const done = newRemaining <= 0

    // บันทึก log
    await pool.query(
      `INSERT INTO dispense_logs (vn, hn, patient_name, medication, bottle_number, total_bottles, dispensed_date, pharmacist)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p.vn, p.hn || '', p.patient_name, p.medication, bottleNumber, p.total_bottles, dispensedDate, pharmacist]
    )

  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const nextFollowup = done ? null : (() => {
    const isFirstBottle = bottleNumber === 1
    const baseDate = isFirstBottle
      ? formatDate(new Date(p.start_date))
      : formatDate(new Date(p.active_date))
    const [y, m, day] = baseDate.split('-').map(Number)
    const d = new Date(y, m - 1, day + 31)
    return formatDate(d)
  })()

    // อัปเดต patient
    await pool.query(
      `UPDATE patients SET
        remaining_bottles = $1,
        status            = $2,
        followup_date     = $3,
        active_date       = $4,
        phone             = $5,
        cycle_count       = cycle_count + 1,
        updated_at        = NOW()
       WHERE id = $6`,
      [newRemaining, done ? 'completed' : 'followup', nextFollowup, nextFollowup, phone || p.phone, p.id]
    )

    res.json({ done, remaining: newRemaining, nextFollowup })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router