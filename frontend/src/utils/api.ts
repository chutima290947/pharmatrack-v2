const BASE = import.meta.env.VITE_API_URL || ''

function getToken(): string {
  return localStorage.getItem('pharmatrack_token') || ''
}

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  let data

  try {
    data = await res.json()
  } catch {
    throw new Error('Invalid server response')
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

// ─────────────────────────────────────────────
// Patients
// ─────────────────────────────────────────────

export const getPatients = () =>
  req<{ patients: any[] }>('GET', '/api/patients')

export const searchPatients = (q: string) =>
  req<{ patients: any[] }>(
    'GET',
    `/api/patients/search?q=${encodeURIComponent(q)}`
  )

export const createPatient = (p: any) =>
  req('POST', '/api/patients', p)

export const bulkImport = (patients: any[]) =>
  req<{
    added: number
    dupes: number
    errors: any[]
  }>('POST', '/api/patients/bulk', { patients })

export const updatePatient = (
  id: number,
  changes: any
) =>
  req(
    'PUT',
    `/api/patients/${id}`,
    changes
  )

export const dispensePatient = (
  id: number,
  dispensedDate: string,
  phone: string
) =>
  req<{
    done: boolean
    remaining: number
    nextFollowup: string | null
  }>(
    'POST',
    `/api/patients/${id}/dispense`,
    {
      dispensedDate,
      phone,
    }
  )

export const deletePatient = (id: number) =>
  req(
    'DELETE',
    `/api/patients/${id}`
  )

// ─────────────────────────────────────────────
// Logs
// ─────────────────────────────────────────────

export const getLogs = (vn?: string) =>
  req<{ logs: any[] }>(
    'GET',
    vn
      ? `/api/logs?vn=${encodeURIComponent(vn)}`
      : '/api/logs'
  )

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────

export const healthCheck = () =>
  req<{
    status: string
    timestamp: string
    imed: string
  }>('GET', '/api/health')