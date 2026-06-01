import { useState, useEffect, useCallback } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import Toast from '../components/Toast'
import { getPatients, getLogs } from '../utils/api'
import { fmt } from '../utils/storage'

const STATUS_LABEL = {
  followup:   { label: '🔴', cls: 'bg-red-50 text-red-700 border border-red-200' },
  production: { label: '🟡', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  ready:      { label: '🔵', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  completed:  { label: '🟢', cls: 'bg-slate-100 text-slate-500 border border-slate-200' },
}

const toDate = (val) => {
  if (!val) return null
  return new Date(val).toISOString().slice(0, 10)
}

export default function DashboardPage({ navigate }) {
  const [patients,  setPatients]  = useState([])
  const [completed, setCompleted] = useState([])
  const [logs,      setLogs]      = useState([])
  const [loading,   setLoading]   = useState(true)
  const [tab,       setTab]       = useState('active')
  const [search,    setSearch]    = useState('')
  const [selected,  setSelected]  = useState(null)
  const [vnLogs,    setVnLogs]    = useState([])
  const [toast,     setToast]     = useState(null)
  const [logFilter, setLogFilter] = useState('all')

  const load = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    const pts  = await getPatients()
    const hist = await getLogs()
    const mapped = pts.patients.map(p => ({
      ...p,
      patientName:      p.patient_name,
      totalBottles:     p.total_bottles,
      remainingBottles: p.remaining_bottles,
      startDate:        toDate(p.start_date),
      followupDate:     toDate(p.followup_date),
      activeDate:       toDate(p.active_date || p.start_date),
      productionDate:   toDate(p.production_date),
      cycleCount:       p.cycle_count,
      isActive:         p.status !== 'completed' && p.remaining_bottles > 0,
    }))
    setPatients(mapped)
    setLogs(hist.logs.map(l => ({
      ...l,
      dispensed_date: toDate(l.dispensed_date),
    })).slice(0, 20))
    setCompleted([])
    setLoading(false)
  }, [])

  useEffect(() => { load(true) }, [load])

  useEffect(() => {
    const id = setInterval(() => load(false), 3000)
    return () => clearInterval(id)
  }, [load])

  const openDetail = async (p) => {
    setSelected(p)
    const result = await getLogs(p.vn)
    const filtered = (result.logs || [])
      .filter(l => l.vn === p.vn)
      .map(l => ({ ...l, dispensed_date: toDate(l.dispensed_date) }))
      .sort((a, b) => a.bottle_number - b.bottle_number)
    setVnLogs(filtered)
  }

  const todayISO = new Date().toISOString().slice(0, 10)
  const stats = {
    total:          patients.length,
    active:         patients.filter(p => p.isActive).length,
    completed:      patients.filter(p => !p.isActive).length,
    followupToday:  patients.filter(p => p.activeDate === todayISO && p.status === 'followup').length,
    dispensedToday: logs.filter(l => l.dispensed_date === todayISO).length,
  }

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'today') return l.dispensed_date === todayISO
    if (logFilter === 'month') return l.dispensed_date?.slice(0, 7) === todayISO.slice(0, 7)
    return true
  })

  const allRecords = [
    ...patients
      .filter(p => !p.isStartEvent),
    ...completed.map(h => ({
      id:               h.id,
      vn:               h.vn,
      hn:               h.hn || '',
      patientName:      h.patient_name,
      medication:       h.medication,
      totalBottles:     h.total_bottles,
      remainingBottles: 0,
      status:           'completed',
      followupDate:     null,
      activeDate:       toDate(h.dispensed_date),
      isActive:         false,
      dispensed_date:   toDate(h.dispensed_date),
    }))
  ]

  const dedupedByVN = {}
  allRecords.forEach(p => {
    if (!dedupedByVN[p.vn] || p.isActive) dedupedByVN[p.vn] = p
  })
  const uniqueRecords = Object.values(dedupedByVN)

  const groupByHN = {}
  uniqueRecords.forEach(p => {
    const key = p.hn?.trim() || p.patientName?.trim() || p.vn
    if (!groupByHN[key]) groupByHN[key] = []
    groupByHN[key].push(p)
  })

  const groupedByHN = {}
  Object.entries(groupByHN).forEach(([key, group]) => {
    groupedByHN[key] = group
      .sort((a, b) => {
        const aTime = new Date(b.updated_at || b.created_at || 0).getTime()
        const bTime = new Date(a.updated_at || a.created_at || 0).getTime()
        return aTime - bTime
      })
      .slice(0, 2)
  })

    const filterGroup = (group) => group.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        p.vn.toLowerCase().includes(q) ||
        (p.patientName || '').toLowerCase().includes(q) ||
        (p.hn || '').toLowerCase().includes(q)
      const matchTab =
        tab === 'all'       ? true :
        tab === 'active'    ? p.isActive :
        tab === 'completed' ? (p.status === 'completed' || p.remainingBottles <= 0) : true
      return matchSearch && matchTab
    })

const filteredGroups = Object.values(groupedByHN)
  .map(group => filterGroup(group))
  .filter(group => group.length > 0)
  .sort((a, b) => {
    const aTime = new Date(b[0].updated_at || b[0].created_at || 0).getTime()
    const bTime = new Date(a[0].updated_at || a[0].created_at || 0).getTime()
    return aTime - bTime
  })

  const totalFiltered = filteredGroups.reduce((sum, g) => sum + g.length, 0)

  const statCards = [
    { label: 'ผู้ป่วยทั้งหมด',  value: stats.total,          icon: 'group',          color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-l-blue-500' },
    { label: 'ยังค้างรับยา',     value: stats.active,         icon: 'medication',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-l-amber-500' },
    { label: 'รับยาครบแล้ว',     value: stats.completed,      icon: 'check_circle',   color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-l-green-500' },
    { label: 'Follow-up วันนี้', value: stats.followupToday,  icon: 'event_upcoming', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-l-red-500' },
    { label: 'จ่ายยาวันนี้',     value: stats.dispensedToday, icon: 'local_shipping', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-l-purple-500' },
  ]

  const getBottleRows = (p, logs) => {
    const total = p.totalBottles || 0
    const dispensedCount = total - (p.remainingBottles ?? 0)
    return Array.from({ length: total }, (_, i) => {
      const bottleNum = i + 1
      const isReceived = bottleNum <= dispensedCount
      const log = logs.find(l => l.bottle_number === bottleNum)
      return { bottleNum, isReceived, log }
    })
  }

  return (
    <div className="text-gray-900">
      <Sidebar navigate={navigate} activePage="dashboard" />
      <TopBar navigate={navigate} patients={patients} onOpenPatient={() => {}} />

      <main className="ml-64 mt-16 min-h-screen bg-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-6 py-5">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="px-4 py-1.5 bg-gradient-to-r from-red-50 to-blue-50 border border-slate-200 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
            </div>
            <button onClick={() => load(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-sm">refresh</span>Refresh
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-5">
            {statCards.map(c => (
              <div key={c.label} className={`bg-white p-5 rounded-xl border border-slate-200 border-l-4 ${c.border} shadow-sm`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 ${c.bg} rounded-lg flex items-center justify-center`}>
                    <span className={`material-symbols-outlined ${c.color} text-xl`}>{c.icon}</span>
                  </div>
                </div>
                <p className="text-3xl font-black text-slate-800">{loading ? '...' : c.value}</p>
                <p className="text-xs text-slate-500 font-semibold mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-12 gap-6">

            {/* Patient table */}
            <div className="col-span-12 lg:col-span-7">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-slate-900">บันทึกติดตามการรับยา</h3>
                    <span className="text-xs text-slate-400">{totalFiltered} รายการ</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                      {[['active','กำลังติดตาม'],['completed','รับครบแล้ว'],['all','ทั้งหมด']].map(([v,l]) => (
                        <button key={v} onClick={() => setTab(v)}
                          className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${tab === v ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                    <div className="relative flex-1">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหา HN / VN / ชื่อ..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-300"/>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {['HN / ชื่อ-สกุล','VN','ชื่อยา','ทั้งหมด','ค้าง','สถานะ','Follow-up',''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">กำลังโหลด...</td></tr>
                      ) : filteredGroups.length === 0 ? (
                        <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">ไม่พบข้อมูล</td></tr>
                      ) : filteredGroups.map((group) =>
                        group.map((p, idx) => {
                          const st = STATUS_LABEL[p.status] || STATUS_LABEL.followup
                          const isFirst = idx === 0
                          const rowSpan = group.length
                          return (
                            <tr key={p.id}
                              onClick={() => openDetail(p)}
                              className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${selected?.id === p.id ? 'bg-blue-50' : ''} ${!isFirst ? 'border-t border-dashed border-slate-100' : ''}`}>

                              {isFirst && (
                                <td className="px-4 py-3 align-middle border-r border-slate-100" rowSpan={rowSpan}>
                                  <p className="font-bold text-slate-800 text-sm truncate max-w-[140px]">{p.patientName}</p>
                                  {p.hn && <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">HN: {p.hn}</p>}
                                </td>
                              )}

                              <td className="px-4 py-3">
                                <span className="font-mono text-xs font-bold text-blue-700">{p.vn}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">{p.medication || '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="px-2 py-0.5 bg-slate-100 rounded font-bold text-slate-700">{p.totalBottles}</span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded font-bold ${p.remainingBottles > 0 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                                  {p.remainingBottles}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold ${st.cls}`}>{st.label}</span>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">{fmt(p.followupDate)}</td>
                              <td className="px-4 py-3">
                                <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Detail panel */}
            <div className="col-span-12 lg:col-span-5 space-y-4">
              {selected ? (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">รายละเอียด VN</h3>
                    <button onClick={() => { setSelected(null); setVnLogs([]) }}
                      className="text-slate-400 hover:text-slate-600 transition-colors">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        ['ชื่อ-สกุล', selected.patientName],
                        ['HN', selected.hn || '—'],
                        ['VN', selected.vn],
                        ['ชื่อยา', selected.medication || '—'],
                      ].map(([label, val]) => (
                        <div key={label} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
                          <p className="font-bold text-slate-800">{val}</p>
                        </div>
                      ))}
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">ยาทั้งหมด</p>
                        <p className="text-2xl font-black text-blue-700">{selected.totalBottles} <span className="text-sm font-semibold">ขวด</span></p>
                      </div>
                      <div className={`rounded-lg p-3 border ${selected.remainingBottles > 0 ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selected.remainingBottles > 0 ? 'text-amber-400' : 'text-green-400'}`}>ยาคงเหลือ</p>
                        <p className={`text-2xl font-black ${selected.remainingBottles > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                          {selected.remainingBottles} <span className="text-sm font-semibold">ขวด</span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">ประวัติการรับยาแต่ละขวด</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">ขวดที่</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">วันที่รับ</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">เภสัช</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">สถานะ</span>
                        </div>
                        {getBottleRows(selected, vnLogs).map(({ bottleNum, isReceived, log }) => (
                          <div key={bottleNum}
                            className={`grid grid-cols-4 gap-2 px-3 py-2 rounded-lg border ${isReceived ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${isReceived ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                {bottleNum}
                              </span>
                              <span className="text-xs text-slate-600">ขวดที่ {bottleNum}</span>
                            </div>
                            <span className="text-xs font-semibold text-slate-700 flex items-center">
                              {log ? fmt(log.dispensed_date) : '—'}
                            </span>
                            <span className="text-xs text-blue-600 font-semibold flex items-center truncate">
                              {log?.pharmacist || '—'}
                            </span>
                            <span className={`text-[10px] font-bold flex items-center ${isReceived ? 'text-green-600' : 'text-slate-400'}`}>
                              {isReceived ? '✅ รับแล้ว' : '⏳ รอรับ'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center">
                  <span className="material-symbols-outlined text-slate-300 text-5xl">touch_app</span>
                  <p className="text-slate-400 text-sm mt-2">คลิกที่ผู้ป่วยเพื่อดูรายละเอียด</p>
                </div>
              )}

              {/* Recent logs */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">การจ่ายยาล่าสุด</h3>
                  <span className="text-xs text-slate-400">20 รายการล่าสุด</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {filteredLogs.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีประวัติ</p>
                  ) : filteredLogs.map(l => (
                    <div key={l.id} className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{l.patient_name}</p>
                        <p className="text-xs text-slate-400">{l.vn} · {l.medication}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold text-green-600">ขวดที่ {l.bottle_number}/{l.total_bottles}</p>
                        <p className="text-[10px] text-slate-400">{fmt(l.dispensed_date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Toast toast={toast} />
    </div>
  )
}