import { useState } from 'react'
import LoginPage from './pages/LoginPage'
import CalendarPage from './pages/CalendarPage'
import AddPatientPage from './pages/AddPatientPage'
import DashboardPage from './pages/DashboardPage'

export default function App() {
  const [page, setPage] = useState('login')
  const [calendarKey, setCalendarKey] = useState(0)
  const [jumpTo, setJumpTo] = useState(null)

  const navigate = (p, params = {}) => {
    if (p === 'calendar') {
      setJumpTo(params.jumpTo || null)
      setCalendarKey(k => k + 1)
    }
    setPage(p)
  }

  if (page === 'login')       return <LoginPage onLogin={() => navigate('calendar')} />
  if (page === 'calendar')    return <CalendarPage key={calendarKey} navigate={navigate} jumpTo={jumpTo} />
  if (page === 'add-patient') return <AddPatientPage navigate={navigate} />
  if (page === 'dashboard')   return <DashboardPage navigate={navigate} />
  return null
}