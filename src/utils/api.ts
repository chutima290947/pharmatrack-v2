/**
 * PharmaTrack API Client
 * ทุก request ไปที่ pharmatrack-api (port 3001)
 */

const BASE = 'http://localhost:3001'

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}

// ── Patients ────────────────────────────────────────────────

/** ดึงผู้ป่วยทั้งหมดที่มี active_date (แสดงบนปฏิทิน) */
export const getPatients = () =>
  req<{ patients: any[] }>('GET', '/api/patients')

/** ค้นหาด้วย VN หรือชื่อ */
export const searchPatients = (q: string) =>
  req<{ patients: any[] }>('GET', `/api/patients/search?q=${encodeURIComponent(q)}`)

/** เพิ่มผู้ป่วยใหม่ 1 คน */
export const createPatient = (p: any) =>
  req('POST', '/api/patients', p)

/** Import หลายคนพร้อมกัน */
export const bulkImport = (patients: any[]) =>
  req<{ added: number; dupes: number; errors: any[] }>('POST', '/api/patients/bulk', { patients })

/** อัปเดตสถานะ / วันที่ */
export const updatePatient = (id: number, changes: any) =>
  req('PUT', `/api/patients/${id}`, changes)

/** จ่ายยา → ลด remaining, สร้าง follow-up ใหม่ */
export const dispensePatient = (id: number, dispensedDate: string, phone: string) =>
  req<{ done: boolean; remaining: number; nextFollowup: string | null }>(
    'POST', `/api/patients/${id}/dispense`, { dispensedDate, phone }
  )

/** ลบผู้ป่วย */
export const deletePatient = (id: number) =>
  req('DELETE', `/api/patients/${id}`)

/** เช็คว่า API server ออนไลน์ไหม */
export const healthCheck = () =>
  req<{ status: string; db: string }>('GET', '/api/health')