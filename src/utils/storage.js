const KEY = 'pharmatrack_patients'

export const getAll = () => {
  try { return Promise.resolve(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { return Promise.resolve([]) }
}

export const saveAll = (arr) => localStorage.setItem(KEY, JSON.stringify(arr))

export const createPatient = (patient) => {
  const all = JSON.parse(localStorage.getItem(KEY) || '[]')
  const total = patient.totalBottles || patient.total_bottles || 1
  const now = Date.now()
  const record = {
    id:               now,
    updatedAt:        now,
    vn:               patient.vn,
    hn:               patient.hn || '',
    patientName:      patient.patientName || patient.patient_name || '',
    phone:            patient.phone || '',
    medication:       patient.medication || '',
    totalBottles:     total,
    remainingBottles: total,
    status:           patient.status || 'followup',
    activeDate:       patient.activeDate || patient.active_date || '',
    startDate:        patient.startDate || patient.start_date || '',
    followupDate:     patient.followupDate || patient.follow_up_date || '',
    productionDate:   patient.productionDate || patient.production_date || null,
    cycleCount:       patient.cycleCount || patient.cycle_count || 1,
  }
  all.push(record)
  saveAll(all)
  return Promise.resolve({ success: true, id: record.id })
}

export const updatePatient = (id, data) => {
  const all = JSON.parse(localStorage.getItem(KEY) || '[]')
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return Promise.resolve({ success: false })
  all[idx] = {
    ...all[idx],
    updatedAt:        Date.now(),
    phone:            data.phone            ?? all[idx].phone,
    status:           data.status           ?? all[idx].status,
    activeDate:       data.activeDate       ?? all[idx].activeDate,
    followupDate:     data.followupDate     ?? all[idx].followupDate,
    productionDate:   data.productionDate   ?? all[idx].productionDate,
    remainingBottles: data.remainingBottles ?? all[idx].remainingBottles,
    cycleCount:       data.cycleCount       ?? all[idx].cycleCount,
  }
  saveAll(all)
  return Promise.resolve({ success: true })
}

export const deletePatient = (id) => {
  const all = JSON.parse(localStorage.getItem(KEY) || '[]').filter(p => p.id !== id)
  saveAll(all)
  return Promise.resolve({ success: true })
}

export const dispensePatient = (id, dispensedDate, phone) => {
  const all = JSON.parse(localStorage.getItem(KEY) || '[]')
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return Promise.resolve({ success: false })

  const p = all[idx]
  const bottleNumber = (p.totalBottles || 1) - (p.remainingBottles ?? 0) + 1
  const rem = Math.max(0, (p.remainingBottles ?? 0) - 1)
  const isDone = rem <= 0

  _saveLog(p, bottleNumber, dispensedDate)
  _saveHistory(p, dispensedDate, isDone)

  const base = p.activeDate || dispensedDate
  const d = new Date(base + 'T00:00:00')
  d.setDate(d.getDate() + 31)
  const nextFU = toISO(d)

  all.splice(idx, 1)

  if (isDone) {
    saveAll(all)
    return Promise.resolve({ success: true, done: true, remaining: 0, nextFollowup: null })
  }

  const now = Date.now()
  all.push({
    id:               now,
    updatedAt:        now,
    vn:               p.vn,
    hn:               p.hn || '',
    patientName:      p.patientName,
    phone:            phone || p.phone,
    medication:       p.medication,
    totalBottles:     p.totalBottles,
    remainingBottles: rem,
    status:           'followup',
    activeDate:       nextFU,
    startDate:        p.startDate,
    followupDate:     nextFU,
    productionDate:   null,
    cycleCount:       (p.cycleCount || 1) + 1,
  })
  saveAll(all)
  return Promise.resolve({ success: true, done: false, remaining: rem, nextFollowup: nextFU })
}

const _saveHistory = (patient, dispensedDate, isDone = false) => {
  const KEY_H = 'pharmatrack_history'
  const hist = JSON.parse(localStorage.getItem(KEY_H) || '[]')
  hist.push({
    id:             Date.now(),
    vn:             patient.vn,
    hn:             patient.hn,
    patient_name:   patient.patientName,
    phone:          patient.phone,
    medication:     patient.medication,
    total_bottles:  patient.totalBottles,
    cycle_count:    patient.cycleCount,
    dispensed_date: dispensedDate,
    is_done:        isDone,
  })
  localStorage.setItem(KEY_H, JSON.stringify(hist))
}

const _saveLog = (patient, bottleNumber, dispensedDate) => {
  const KEY_L = 'pharmatrack_logs'
  const logs = JSON.parse(localStorage.getItem(KEY_L) || '[]')
  const pharmacist = localStorage.getItem('pharmatrack_pharmacist') || '—'
  logs.push({
    id:             Date.now(),
    vn:             patient.vn,
    hn:             patient.hn,
    patient_name:   patient.patientName,
    medication:     patient.medication,
    total_bottles:  patient.totalBottles,
    bottle_number:  bottleNumber,
    dispensed_date: dispensedDate,
    pharmacist:     pharmacist,
  })
  localStorage.setItem(KEY_L, JSON.stringify(logs))
}

export const saveHistory = () => Promise.resolve({ success: true })
export const saveLog     = () => Promise.resolve({ success: true })

export const getHistory = (year, month) => {
  let hist = JSON.parse(localStorage.getItem('pharmatrack_history') || '[]')
  if (year)  hist = hist.filter(h => h.dispensed_date?.startsWith(String(year)))
  if (month) hist = hist.filter(h => parseInt(h.dispensed_date?.slice(5, 7)) === month)
  // ✅ เรียงใหม่→เก่าเสมอ
  return Promise.resolve([...hist].reverse())
}

export const getLogs = (q) => {
  const logs = JSON.parse(localStorage.getItem('pharmatrack_logs') || '[]')
  // ✅ เรียงใหม่→เก่าเสมอ (id = Date.now() มากกว่า = ใหม่กว่า)
  const sorted = [...logs].sort((a, b) => b.id - a.id)
  if (!q) return Promise.resolve(sorted)
  const ql = q.toLowerCase()
  return Promise.resolve(
    sorted.filter(l =>
      l.patient_name?.toLowerCase().includes(ql) ||
      l.vn?.toLowerCase().includes(ql) ||
      l.hn?.toLowerCase().includes(ql)
    )
  )
}

export const toISO = (d) =>
  d.getFullYear() + '-' +
  String(d.getMonth() + 1).padStart(2, '0') + '-' +
  String(d.getDate()).padStart(2, '0')

export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d
}

export const fmt = (iso) => {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export const ST = {
  followup:   { label:'Follow-up',  dot:'bg-red-500',    border:'border-red-500',    bg:'bg-red-50',    txt:'text-red-700',    hd:'text-red-600'    },
  production: { label:'Appt/Prod.', dot:'bg-yellow-400', border:'border-yellow-400', bg:'bg-yellow-50', txt:'text-yellow-700', hd:'text-yellow-600' },
  ready:      { label:'Ready',      dot:'bg-blue-500',   border:'border-blue-500',   bg:'bg-blue-50',   txt:'text-blue-700',   hd:'text-blue-600'   },
  dispensed:  { label:'Dispensed',  dot:'bg-green-500',  border:'border-green-500',  bg:'bg-green-50',  txt:'text-green-700',  hd:'text-green-600'  },
}