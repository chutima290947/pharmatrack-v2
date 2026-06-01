// utils/auth.js
const BASE = ''

export async function fetchPharmacistName(id, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: id, password })
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Login failed')

  // บันทึก token ไว้ใช้กับ API calls
  localStorage.setItem('pharmatrack_token', data.token)

  return data.fullname || id
}