import { useState, useEffect } from 'react'
import { fmt, ST, addDays, toISO } from '../utils/storage'

const FLOW_ORDER = ['followup', 'production', 'ready', 'dispensed']
const FLOW_BORDERS = ['border-red-500', 'border-yellow-400', 'border-blue-500', 'border-green-500']
const FLOW_RINGS = ['ring-red-400/40', 'ring-yellow-300/40', 'ring-blue-400/40', 'ring-green-400/40']
const FLOW_DIM = ['border-red-200', 'border-yellow-200', 'border-blue-200', 'border-green-200']
const FLOW_DOTS = ['bg-red-400', 'bg-yellow-400', 'bg-blue-400', 'bg-green-400']

function DispenseWarning({ patient, status }) {
  if (status !== 'dispensed' || !patient) return null
  const rem = patient.remainingBottles ?? 0
  const base = patient.productionDate || patient.activeDate || ''
  const nextFU = base ? fmt(toISO(addDays(base, 31))) : '?'
  return (
    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex gap-2">
        <span className="material-symbols-outlined text-amber-500 text-base flex-shrink-0">warning</span>
        <div className="text-xs text-amber-700 leading-relaxed">
          {rem > 1 ? (
            <><strong>เมื่อ Save จะเกิดขึ้น:</strong><br/>
            • ยาลดลงเหลือ <strong>{rem - 1} ขวด</strong><br/>
            • สร้างนัด 🔴 Follow-up ใหม่วันที่ <strong>{nextFU}</strong></>
          ) : (
            <><strong>นี่คือขวดสุดท้าย!</strong><br/>
            • ยาลดลงเหลือ <strong>0 ขวด</strong><br/>
            • ผู้ป่วยจะ<strong>หายออกจากปฏิทิน</strong></>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Drawer({ open, patient, onClose, onSave }) {
  const [curStatus, setCurStatus] = useState('followup')
  const [phone, setPhone] = useState('')
  const [activeDate, setActiveDate] = useState('')

  useEffect(() => {
    if (patient) {
      setCurStatus(patient.status || 'followup')
      setPhone(patient.phone || '')
      setActiveDate(patient.activeDate || '')
    } else {
      setCurStatus('followup')
      setPhone('')
      setActiveDate('')
    }
  }, [patient])

  const rem = patient ? (patient.remainingBottles ?? 0) : 0
  const flowIdx = FLOW_ORDER.indexOf(curStatus)

  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[55] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <aside className={`fixed right-0 top-0 h-full z-[60] w-[460px] flex flex-col bg-white border-l border-slate-200 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Patient Status</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-700">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Flow indicator */}
          <div className="flex items-center bg-slate-50 rounded-xl p-3 border border-slate-200">
            {FLOW_ORDER.map((s, i) => (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex-1 flex flex-col items-center gap-1">
                  <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                    ${i === flowIdx ? `${FLOW_BORDERS[i]} bg-white ring-4 ${FLOW_RINGS[i]} scale-110` :
                      i < flowIdx ? `${FLOW_BORDERS[i]} bg-white opacity-40` :
                      `${FLOW_DIM[i]} bg-white opacity-25`}`}>
                    <span className={`w-3 h-3 rounded-full ${FLOW_DOTS[i]}`} />
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase text-center leading-tight">
                    {['Follow-up\nCall', 'Appt/\nProd.', 'Ready/\nCheck', 'Dispensed'][i].split('\n').map((t, j) => (
                      <span key={j}>{t}<br/></span>
                    ))}
                  </p>
                </div>
                {i < 3 && <span className="text-slate-300 font-bold text-lg mb-4">→</span>}
              </div>
            ))}
          </div>

          {/* Profile */}
          <section className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">{patient?.patientName || '—'}</h3>
              <p className="text-slate-500 text-sm">
                VN: {patient?.vn || '—'}{patient?.hn ? ` · HN: ${patient.hn}` : ''}
              </p>
            </div>
            <div className="flex flex-col items-center px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl min-w-[60px]">
              <span className="text-2xl font-black text-blue-700 leading-none">{patient ? rem : '—'}</span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider mt-0.5 text-center">Bot.lift</span>
            </div>
          </section>

          {/* Phone */}
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <span className="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">call</span>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="font-medium bg-transparent border-none outline-none w-full text-slate-700 text-sm"
              placeholder="Phone number" />
          </div>

          {/* Medication info */}
          <section>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Medication Info</h4>
            <div className="p-4 border border-slate-200 rounded-xl space-y-2.5 bg-slate-50/50 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Medication</span><span className="font-bold text-blue-700">{patient?.medication || '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Total Prescribed</span><span className="font-semibold">{patient ? `${patient.totalBottles ?? '—'} Bottles` : '—'}</span></div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-200">
                <span className="text-slate-500">Remaining Bot</span>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">{patient ? `${rem} Bottle${rem !== 1 ? 's' : ''}` : '—'}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-200">
                <span className="text-slate-500">Start Date</span>
                <span className="font-semibold">{fmt(patient?.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">🟡 Production Date</span>
                <span className="font-semibold text-yellow-700">{fmt(patient?.productionDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">🔴 Next Follow-up</span>
                <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-bold rounded-full">{fmt(patient?.followupDate)}</span>
              </div>
            </div>
          </section>

          {/* Status picker */}
          <section>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Update Status</h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { s: 'followup',   dot: 'bg-red-500',    label: 'Follow-up Call',   active: 'border-red-500 bg-red-50 text-red-700' },
                { s: 'production', dot: 'bg-yellow-400', label: 'Appointment/Prod.', active: 'border-yellow-400 bg-yellow-50 text-yellow-700' },
                { s: 'ready',      dot: 'bg-blue-500',   label: 'Checked / Ready',  active: 'border-blue-500 bg-blue-50 text-blue-700' },
                { s: 'dispensed',  dot: 'bg-green-500',  label: 'Dispensed ✓',      active: 'border-green-500 bg-green-50 text-green-700' },
              ].map(({ s, dot, label, active }) => (
                <button key={s} onClick={() => setCurStatus(s)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border-2 transition-all
                    ${curStatus === s ? active : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${dot} flex-shrink-0`} />
                  {label}
                </button>
              ))}
            </div>
            <DispenseWarning patient={patient} status={curStatus} />
            {curStatus === 'dispensed' && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="material-symbols-outlined text-blue-500 text-[18px] flex-shrink-0" style={{fontVariationSettings:"'FILL' 1"}}>medication</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-0.5">เภสัชกรผู้จ่ายยา</p>
                <p className="text-sm font-bold text-blue-700 truncate">
                  {localStorage.getItem('pharmatrack_pharmacist') || '—'}
                </p>
              </div>
            </div>
          )}
          </section>

          {/* Calendar date */}
          <section>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Calendar Date <span className="normal-case font-normal">(วันที่แสดงบนปฏิทิน)</span>
            </label>
            <div className="relative">
              <input type="date" value={activeDate} onChange={e => setActiveDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg text-sm px-3 py-2 pr-10 outline-none focus:ring-2 focus:ring-blue-300 cursor-pointer" />
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">calendar_today</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 italic">เปลี่ยนวันที่นี้เพื่อย้าย event ไปวันอื่น</p>
          </section>
        </div>

        <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex flex-col gap-3 flex-shrink-0">
          <button onClick={() => onSave({ curStatus, phone, activeDate })}
            className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
            Save Changes
          </button>
          <button onClick={onClose}
            className="w-full bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-all">
            Cancel
          </button>
        </div>
      </aside>
    </>
  )
}