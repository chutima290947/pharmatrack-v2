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
  const clean = iso.slice(0, 10)  // ตัด timezone ออก
  const [y, m, d] = clean.split('-')
  return `${d}/${m}/${y}`
}

export const ST = {
  followup:   { label:'Follow-up',  dot:'bg-red-500',    border:'border-red-500',    bg:'bg-red-50',    txt:'text-red-700',    hd:'text-red-600'    },
  production: { label:'Appt/Prod.', dot:'bg-yellow-400', border:'border-yellow-400', bg:'bg-yellow-50', txt:'text-yellow-700', hd:'text-yellow-600' },
  ready:      { label:'Ready',      dot:'bg-blue-500',   border:'border-blue-500',   bg:'bg-blue-50',   txt:'text-blue-700',   hd:'text-blue-600'   },
  dispensed:  { label:'Dispensed',  dot:'bg-green-500',  border:'border-green-500',  bg:'bg-green-50',  txt:'text-green-700',  hd:'text-green-600'  },
}

// ── ฟังก์ชันด้านล่างนี้ไม่ได้ใช้แล้ว (ย้ายไป Neon แล้ว) แต่เก็บไว้ไม่ให้ import error ──

export const getAll          = () => Promise.resolve([])
export const saveAll         = () => {}
export const createPatient   = () => Promise.resolve({ success: false })
export const updatePatient   = () => Promise.resolve({ success: false })
export const deletePatient   = () => Promise.resolve({ success: false })
export const dispensePatient = () => Promise.resolve({ success: false })
export const getHistory      = () => Promise.resolve([])
export const getLogs         = () => Promise.resolve([])
export const saveHistory     = () => Promise.resolve({ success: true })
export const saveLog         = () => Promise.resolve({ success: true })