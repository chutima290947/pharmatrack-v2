import { useState, useEffect, useRef, useCallback } from 'react'
import { fmt, ST } from '../utils/storage'

const TIMEOUT_MS = 30 * 60 * 1000
const WARNING_MS =  5 * 60 * 1000

export default function TopBar({
  navigate,
  onOpenPatient,
  patients = [],
  activePage,
}) {
  const [query,     setQuery]     = useState('')
  const [showDrop,  setShowDrop]  = useState(false)
  const [showMenu,  setShowMenu]  = useState(false)
  const [showWarn,  setShowWarn]  = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loginTime, setLoginTime] = useState('')

  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const timerRef = useRef(null)
  const warnRef  = useRef(null)
  const countRef = useRef(null)

  const pharmacistName = localStorage.getItem('pharmatrack_pharmacist') || 'เภสัชกร'
  const initial = pharmacistName.trim().charAt(0).toUpperCase()

  // บันทึกเวลา login
  useEffect(() => {
    let t = sessionStorage.getItem('pharmatrack_login_time')
    if (!t) {
      t = new Date().toISOString()
      sessionStorage.setItem('pharmatrack_login_time', t)
    }
    setLoginTime(t)
  }, [])

  const loginTimeStr = loginTime
    ? new Date(loginTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : '-'

  const loginDateStr = loginTime
    ? new Date(loginTime).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-'

  const handleLogout = useCallback((auto = false) => {
    clearTimeout(timerRef.current)
    clearTimeout(warnRef.current)
    clearInterval(countRef.current)
    setShowWarn(false)
    setShowMenu(false)
    if (auto || confirm('ต้องการออกจากระบบ?')) {
      localStorage.removeItem('pharmatrack_pharmacist')
      sessionStorage.removeItem('pharmatrack_login_time')
      navigate('login')
    }
  }, [navigate])

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current)
    clearTimeout(warnRef.current)
    clearInterval(countRef.current)
    setShowWarn(false)

    warnRef.current = setTimeout(() => {
      setShowWarn(true)
      setCountdown(WARNING_MS / 1000)
      countRef.current = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(countRef.current); return 0 }
          return c - 1
        })
      }, 1000)
    }, TIMEOUT_MS - WARNING_MS)

    timerRef.current = setTimeout(() => handleLogout(true), TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart']
    const onActivity = () => resetTimer()
    events.forEach(e => window.addEventListener(e, onActivity))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity))
      clearTimeout(timerRef.current)
      clearTimeout(warnRef.current)
      clearInterval(countRef.current)
    }
  }, [resetTimer])

  const results = query.trim()
    ? patients.filter(
        p =>
          p.activeDate &&
          !p.isStartEvent &&
          (
            p.vn.toLowerCase().includes(query.toLowerCase()) ||
            (p.patientName || '').toLowerCase().includes(query.toLowerCase())
          )
      )
    : []

  const doSearch = q => {
    setQuery(q)
    setShowDrop(!!q.trim())
  }

  const pickSearch = id => {
    setQuery('')
    setShowDrop(false)
    if (onOpenPatient) onOpenPatient(id)
  }

  const fmtCountdown = s => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <>
      {/* Session timeout warning */}
      {showWarn && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm mx-4 overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-500 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
              <div>
                <p className="font-bold text-amber-800">Session กำลังหมดอายุ</p>
                <p className="text-xs text-amber-600">ไม่มีการใช้งานนานเกินไป</p>
              </div>
            </div>
            <div className="px-6 py-5 text-center">
              <p className="text-4xl font-black text-slate-800 tabular-nums mb-1">{fmtCountdown(countdown)}</p>
              <p className="text-sm text-slate-500 mb-5">ระบบจะออกจากระบบอัตโนมัติ</p>
              <div className="flex gap-3">
                <button
                  onClick={() => handleLogout(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  ออกจากระบบ
                </button>
                <button
                  onClick={resetTimer}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors"
                >
                  ใช้งานต่อ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 right-0 left-64 h-16 flex items-center justify-between px-6 bg-white border-b border-slate-100 z-40">

        {/* LEFT */}
        <div className="flex items-center gap-6 flex-1">
          <div className="flex flex-col leading-tight min-w-fit">
            <h1 className="text-2xl font-black tracking-tight text-blue-900">PharmaTrack</h1>
          </div>

          {activePage === 'calendar' && (
            <div className="max-w-md w-full relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
              <input
                type="text"
                value={query}
                autoComplete="off"
                placeholder="Search VN / Patient name…"
                onChange={e => doSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') { setQuery(''); setShowDrop(false) }
                }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
              />
              {showDrop && (
                <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-72 overflow-y-auto">
                  {results.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-400 italic">ไม่พบข้อมูล</div>
                  ) : results.map(p => {
                    const st = ST[p.status] || ST.followup
                    return (
                      <div key={p.id} onClick={() => pickSearch(p.id)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${st.dot} flex-shrink-0`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{p.patientName}</p>
                          <p className="text-xs text-slate-400">{p.vn} · {p.medication || ''} · {fmt(p.activeDate)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 ml-4">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-slate-400 text-[16px]">schedule</span>
          <span className="text-sm font-bold text-slate-700 tabular-nums">{clock}</span>
          <span className="text-slate-500 font-light">|</span>
        </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-2.5 hover:bg-slate-100 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-600 to-blue-400 flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                {initial}
              </div>
              <div className="flex flex-col leading-tight text-left">
                <p className="text-sm font-bold text-slate-800 max-w-[140px] truncate">{pharmacistName}</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">pharmacist</p>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-[18px]">expand_more</span>
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">

                  {/* Profile */}
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800 truncate">{pharmacistName}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">pharmacist</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">login</span>
                      <span>Logged in {loginDateStr}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="material-symbols-outlined text-[13px] text-slate-400">schedule</span>
                      <span>Time {loginTimeStr}</span>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={() => handleLogout(false)}
                    className="flex items-center gap-2 w-full px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  )
}