import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Drawer from '../components/Drawer'
import Toast from '../components/Toast'
import { getPatients, updatePatient, dispensePatient, getLogs } from '../utils/api'
import { toISO, fmt, ST } from '../utils/storage'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function CalendarPage({ navigate, jumpTo }) {
  const today = new Date()
  const [yr, setYr] = useState(today.getFullYear())
  const [mo, setMo] = useState(today.getMonth())
  const [patients, setPatients] = useState([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activePatient, setActivePatient] = useState(null)
  const [activeId, setActiveId] = useState(null)
  const [toast, setToast] = useState(null)
  const [showFilter, setShowFilter] = useState(false)

  const todayISO = toISO(today)

    const [todayLogs, setTodayLogs] = useState([])

  const loadTodayLogs = async () => {
    const data = await getLogs()
    const filtered = data.logs.filter(l => l.dispensed_date === todayISO)
    setTodayLogs(filtered)
  }

  useEffect(() => { loadPatients(); loadTodayLogs() }, [])

  // ── Year options: 2 ปีก่อน ถึง 2 ปีหน้า ──
  const yearOptions = Array.from({ length: 5 }, (_, i) => today.getFullYear() - 2 + i)

  useEffect(() => {
    if (jumpTo) {
      const [y, m] = jumpTo.split('-')
      setYr(parseInt(y))
      setMo(parseInt(m) - 1)
    }
  }, [jumpTo])

  const loadPatients = async () => {
    const data = await getPatients()
    const mapped = data.patients
      .filter(p => p.status !== 'completed' && p.remaining_bottles > 0) // ← เพิ่ม filter
      .map(p => ({
        ...p,
        patientName:      p.patient_name,
        totalBottles:     p.total_bottles,
        remainingBottles: p.remaining_bottles,
        startDate:        p.start_date?.slice(0, 10),
        followupDate:     p.followup_date?.slice(0, 10),
        activeDate:       (p.active_date || p.start_date)?.slice(0, 10),
        productionDate:   p.production_date?.slice(0, 10),
        cycleCount:       p.cycle_count,
      }))
    setPatients(mapped)
  }

  const showToast = (msg, icon = 'check_circle', iconColor = 'text-green-400') => {
    setToast({ msg, icon, iconColor })
    setTimeout(() => setToast(null), 3500)
  }

  const changeMonth = (d) => {
    setMo(prev => {
      let next = prev + d
      if (next > 11) { next = 0; setYr(y => y + 1) }
      if (next < 0)  { next = 11; setYr(y => y - 1) }
      return next
    })
  }

  const goToday = () => { setYr(today.getFullYear()); setMo(today.getMonth()) }

  const openById = (id) => {
    const p = patients.find(x => x.id === id)
    if (!p) return
    setActiveId(id)
    setActivePatient(p)
    setDrawerOpen(true)
  }

  const openByDate = (iso) => {
    const evts = patients.filter(p => p.activeDate === iso)
    if (evts.length >= 1) { openById(evts[0].id); return }
    setActiveId(null)
    setActivePatient(null)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setActiveId(null)
    setActivePatient(null)
  }

  const saveDrawer = async ({ curStatus, phone, activeDate }) => {
    if (!activeId) { closeDrawer(); return }
    const p = patients.find(x => x.id === activeId)
    if (!p) { closeDrawer(); return }

    if (curStatus === 'dispensed') {
      const dispensedDate = toISO(new Date())
      const result = await dispensePatient(p.id, dispensedDate, phone)
      await loadPatients()
      await loadTodayLogs()
      closeDrawer()
      if (result.done) {
        showToast(`${p.patientName} รับยาครบทุกขวดแล้ว ✓`, 'check_circle', 'text-green-400')
      } else {
        showToast(`จ่ายยาสำเร็จ! เหลือ ${result.remaining} ขวด · 🔴 Follow-up ${fmt(result.nextFollowup)}`, 'event_upcoming', 'text-red-400')
      }
      return
    }

    const updates = {
      hn:               p.hn,
      phone:            phone || p.phone,
      status:           curStatus,
      active_date:      activeDate || p.activeDate,
      followup_date:    curStatus === 'production' && activeDate
                          ? (() => { const d = new Date(activeDate + 'T00:00:00'); d.setDate(d.getDate() + 31); return toISO(d) })()
                          : p.followupDate,
      production_date:  curStatus === 'production' ? activeDate : p.productionDate,
      remaining_bottles: p.remainingBottles,
      cycle_count:      p.cycleCount,
    }
    await updatePatient(p.id, updates)
    await loadPatients()
    closeDrawer()
    showToast('บันทึกสำเร็จ', 'check_circle', 'text-green-400')
  }

  const byDate = {}
  patients.forEach(p => {
    const d = p.activeDate
    if (!d) return
    if (!byDate[d]) byDate[d] = []
    byDate[d].push(p)
  })

  const firstDow  = new Date(yr, mo, 1).getDay()
  const daysInMon = new Date(yr, mo + 1, 0).getDate()
  const rows      = Math.ceil((firstDow + daysInMon) / 7)
  const cells     = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < 7; c++) {
      const day   = r * 7 + c - firstDow + 1
      const valid = day >= 1 && day <= daysInMon
      const iso   = valid ? `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : ''
      cells.push({ day, valid, iso, col: c })
    }
  }

  const isWeekend = (col) => col === 0 || col === 6

  return (
    <div className="text-gray-900">
      <Sidebar navigate={navigate} activePage="calendar" />
      <TopBar
        navigate={navigate}
        activePage="calendar"
        onOpenPatient={openById}
        patients={patients}
      />

      <main className="ml-64 mt-16 min-h-screen bg-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-6 py-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
            <div className="px-4 py-1.5 bg-gradient-to-r from-red-50 to-blue-50 border border-slate-200 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">Dispensing Calendar</h2>
            </div>

              {/* ── Month / Year Picker ── */}
              <div className="flex items-center gap-2 ml-2">
                <select
                  value={mo}
                  onChange={e => setMo(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i}>{m}</option>
                  ))}
                </select>

                <select
                  value={yr}
                  onChange={e => setYr(parseInt(e.target.value))}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 shadow-sm outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer">
                  {yearOptions.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={goToday}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                Today
              </button>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                <button onClick={() => changeMonth(-1)}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all border-r border-slate-200">
                  <span className="material-symbols-outlined text-[18px] leading-none">chevron_left</span>
                </button>
                <button onClick={() => changeMonth(1)}
                  className="px-3 py-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
                  <span className="material-symbols-outlined text-[18px] leading-none">chevron_right</span>
                </button>
              </div>

              <div className="w-px h-5 bg-slate-200" />

              {/* Filter / Today Summary */}
              <div className="relative">
                <button
                  onClick={() => { setShowFilter(v => !v); loadTodayLogs() }}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Summary
                </button>

                {showFilter && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowFilter(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">สรุปวันนี้</h3>
                          <p className="text-[11px] text-slate-400">{new Date().toLocaleDateString('th-TH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</p>
                        </div>
                        <button onClick={() => setShowFilter(false)} className="text-slate-400 hover:text-slate-600">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                      {(() => {
                      const uniqueVNs = [...new Map(todayLogs.map(l => [l.vn, l])).values()]
                        return (
                          <div className="p-4">
                            <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-lg" style={{fontVariationSettings:"'FILL' 1"}}>check_circle</span>
                              </div>
                              <div>
                                <p className="text-2xl font-black text-green-700">{uniqueVNs.length} <span className="text-sm font-semibold">ราย</span></p>
                                <p className="text-xs text-green-600">จ่ายยาสำเร็จวันนี้</p>
                              </div>
                            </div>
                            {uniqueVNs.length === 0 ? (
                              <div className="text-center py-4 text-slate-400">
                                <span className="material-symbols-outlined text-3xl block mb-1">inbox</span>
                                <p className="text-sm">ยังไม่มีการจ่ายยาวันนี้</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {uniqueVNs.map((l, i) => (
                                  <div key={l.vn} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold text-slate-800 truncate">{l.patient_name}</p>
                                      <p className="text-xs text-slate-400">{l.vn} · {l.medication}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-green-600 flex-shrink-0">ขวดที่ {l.bottle_number}/{l.total_bottles}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Calendar grid ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="grid grid-cols-7">
              {DAYS.map((d, i) => (
                <div key={d}
                  className={`py-3 text-center text-[11px] font-bold uppercase tracking-widest border-b border-slate-100
                    ${i === 0 ? 'text-red-400 bg-red-50/60' : i === 6 ? 'text-blue-400 bg-blue-50/60' : 'text-slate-400 bg-white'}`}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridAutoRows:'minmax(110px,auto)' }}>
              {cells.map(({ day, valid, iso, col }, i) => {
                const row     = Math.floor(i / 7)
                const borderR = col < 6 ? 'border-r' : ''
                const borderB = row < rows - 1 ? 'border-b' : ''

                if (!valid) {
                  return (
                    <div key={i}
                      className={`${borderR} ${borderB} border-slate-100 p-2
                        ${isWeekend(col) ? 'bg-slate-50/70' : 'bg-slate-50/30'}`} />
                  )
                }

                const isToday = iso === todayISO
                const evts    = byDate[iso] || []
                const hasEvts = evts.length > 0

                return (
                  <div key={i} onClick={() => openByDate(iso)}
                    className={`${borderR} ${borderB} border-slate-100 p-2 cursor-pointer transition-colors group
                      ${isWeekend(col) ? 'bg-blue-50/20 hover:bg-blue-50/50' : 'bg-white hover:bg-slate-50/80'}`}>

                    <div className="mb-1.5">
                      {isToday ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold shadow-sm">
                          {day}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-colors
                          group-hover:bg-slate-100
                          ${isWeekend(col)
                            ? (hasEvts ? 'text-blue-500' : 'text-blue-300')
                            : (hasEvts ? 'text-slate-700' : 'text-slate-300')
                          }`}>
                          {day}
                        </span>
                      )}
                    </div>

                    {evts.map(p => {
                      const st = ST[p.status] || ST.followup
                      if (evts.length >= 3) {
                        return (
                          <div key={p.id}
                            onClick={e => { e.stopPropagation(); openById(p.id) }}
                            className={`${st.bg} border-l-[3px] ${st.border} px-1.5 py-0.5 rounded-r-md mb-0.5 cursor-pointer hover:shadow-sm transition-all`}>
                            <p className={`text-[9px] font-bold ${st.hd} truncate leading-none`}>{p.vn}</p>
                            <p className={`text-[10px] font-bold ${st.hd} truncate`}>{p.patientName}</p>
                          </div>
                        )
                      }
                      return (
                        <div key={p.id}
                          onClick={e => { e.stopPropagation(); openById(p.id) }}
                          className={`${st.bg} border-l-[3px] ${st.border} px-1.5 py-1 rounded-r-md mb-1 cursor-pointer hover:-translate-y-px hover:shadow-md transition-all`}>
                          <p className={`text-[10px] font-bold ${st.hd}`}>{p.vn}</p>
                          <p className="text-[11px] font-semibold text-slate-800 truncate">{p.patientName}</p>
                          <p className={`text-[10px] ${st.txt}`}>{p.medication || 'N/A'} · {st.label}</p>
                          <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-400 font-semibold">
                            <span className="material-symbols-outlined text-[10px]">inventory_2</span>
                            {p.remainingBottles ?? 0} bottle{(p.remainingBottles ?? 0) !== 1 ? 's' : ''}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>

      <Drawer open={drawerOpen} patient={activePatient} onClose={closeDrawer} onSave={saveDrawer} />
      <Toast toast={toast} />
    </div>
  )
}