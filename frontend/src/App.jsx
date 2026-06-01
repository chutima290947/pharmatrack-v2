import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import AddPatientPage from './pages/AddPatientPage'
import DashboardPage from './pages/DashboardPage'

// เช็ค token ตอนเริ่ม
const getInitialPage = () => {
  const token = localStorage.getItem('pharmatrack_token')
  const pharmacist = localStorage.getItem('pharmatrack_pharmacist')
  if (!token || !pharmacist) return 'login'
  const saved = localStorage.getItem('pharmatrack_page')
  return saved || 'calendar'
}

export default function App() {
  const [page, setPage] = useState(getInitialPage)  // ← เปลี่ยนตรงนี้
  const [calendarKey, setCalendarKey] = useState(0)
  const [jumpTo, setJumpTo] = useState(null)

  const navigate = (p, params = {}) => {
    if (p === 'calendar') {
      setJumpTo(params.jumpTo || null)
      setCalendarKey(k => k + 1)
    }
    localStorage.setItem('pharmatrack_page', p)  // ← บันทึกหน้าปัจจุบัน
    setPage(p)
  }

  if (page === 'login')       return <LoginPage onLogin={() => navigate('calendar')} />
  if (page === 'calendar')    return <CalendarPage key={calendarKey} navigate={navigate} jumpTo={jumpTo} />
  if (page === 'add-patient') return <AddPatientPage navigate={navigate} />
  if (page === 'dashboard')   return <DashboardPage navigate={navigate} />
  return null
}