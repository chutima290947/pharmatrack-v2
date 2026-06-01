// utils/auth.js
// แก้แค่ไฟล์นี้จุดเดียวเมื่อได้ iMed API

export async function fetchPharmacistName(id, password) {
  try {
    // TODO: เปลี่ยนเป็น iMed API เมื่อได้ endpoint
    // const res = await fetch('https://imed.hospital.com/api/auth/login', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username: id, password })
    // })
    // const data = await res.json()
    // return data.fullname || data.firstname + ' ' + data.lastname

    return id // ใช้ ID ชั่วคราวจนกว่าจะได้ iMed API
  } catch (err) {
    console.error('iMed auth error:', err)
    return id // fallback เป็น ID ถ้า API ล้มเหลว
  }
}