import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'
import { createPatient } from '../utils/api'
import { toISO, addDays, fmt } from '../utils/storage'

const MEDS = [
  { value: '', label: 'Select medication...' },
  { value: 'PRN 5%', label: 'PRN 5% Solution' },
  { value: 'PRN 2%', label: 'PRN 2% Solution' },
  { value: 'PRN 10%', label: 'PRN 10% Solution' },
  { value: 'PRN 1%', label: 'PRN 1% Solution' },
  { value: 'Amoxicillin 500mg', label: 'Amoxicillin 500mg' },
  { value: 'Lisinopril 10mg', label: 'Lisinopril 10mg' },
  { value: 'Metformin 850mg', label: 'Metformin 850mg' },
]

function toDisplay(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export default function AddPatientPage({ navigate }) {
  const today = toISO(new Date())
  const [vn, setVn] = useState('')
  const [hn, setHn] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [startDate, setStartDate] = useState(today)
  const [med, setMed] = useState('')
  const [bottles, setBottles] = useState(3)
  const [fuISO, setFuISO] = useState('')
  const [saving, setSaving] = useState(false)

  // errors
  const [phoneErr, setPhoneErr] = useState('')
  const [nameErr, setNameErr] = useState('')

  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate + 'T12:00:00')
      d.setDate(d.getDate() + 31)
      setFuISO(d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'))
    } else {
      setFuISO('')
    }
  }, [startDate])

  // Phone: ตัวเลขเท่านั้น ไม่เกิน 10 หลัก
  const handlePhone = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(raw)
    if (raw.length > 0 && raw.length < 10) {
      setPhoneErr('ต้องกรอกตัวเลข 10 หลัก')
    } else {
      setPhoneErr('')
    }
  }

  // Name: ตัวอักษรไทย อังกฤษ และช่องว่างเท่านั้น
  const handleName = (e) => {
    const raw = e.target.value.replace(/[^a-zA-Zก-๙\s]/g, '')
    setName(raw)
    if (raw.trim().length > 0 && raw.trim().split(/\s+/).length < 2) {
      setNameErr('กรุณากรอกชื่อและนามสกุล')
    } else {
      setNameErr('')
    }
  }

  const remaining = Math.max(0, bottles - 1)
  const todayLabel = new Date(today + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  const savePatient = async () => {
    // validate ก่อน save
    let hasError = false
    if (!vn.trim() || !name.trim() || !phone.trim() || !startDate) {
      alert('กรุณากรอกข้อมูลให้ครบ:\n• Visit Number (VN)\n• ชื่อผู้ป่วย\n• เบอร์โทรศัพท์\n• Start Date')
      return
    }
    if (phone.length !== 10) {
      setPhoneErr('ต้องกรอกตัวเลข 10 หลัก')
      hasError = true
    }
    if (name.trim().split(/\s+/).length < 2) {
      setNameErr('กรุณากรอกชื่อและนามสกุล')
      hasError = true
    }
    if (hasError) return

    setSaving(true)
    try {
      await createPatient({
        vn:                vn.trim(),
        hn:                hn.trim() || null,
        patient_name:      name.trim(),    
        phone:             phone.trim(),
        start_date:        startDate,       
        followup_date:     fuISO,           
        medication:        med || 'N/A',
        total_bottles:     bottles,         
        remaining_bottles: bottles,         
        status:            'followup',
        active_date:       startDate,
      })

      alert(`✅ บันทึกสำเร็จ!\n\nVN: ${vn}\nHN: ${hn || '-'}\nชื่อ: ${name}\nStart: ${toDisplay(startDate)}\nFollow-up: ${toDisplay(fuISO)}`)
      navigate('calendar')
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="text-gray-900">
      <Sidebar navigate={navigate} activePage="add-patient" />
      <TopBar navigate={navigate} onOpenPatient={() => {}} patients={[]} />

      <main className="ml-64 mt-16 min-h-screen bg-slate-200/60">
        <div className="max-w-[1600px] mx-auto px-6 py-5">
          <div className="mb-5 flex justify-between items-end">
            <div className="px-4 py-1.5 bg-gradient-to-r from-red-50 to-blue-50 border border-slate-200 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">Initiate Medication Tracking (VN)</h2>
            </div>
            <p className="text-sm text-slate-500">Date: <span className="font-medium text-slate-800">{todayLabel}</span></p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">

              {/* Patient Info */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5 text-blue-700">
                  <span className="material-symbols-outlined">person</span>
                  <h3 className="text-lg font-semibold">Patient Information</h3>
                </div>
                <div className="grid grid-cols-3 gap-5">
                  <div className="space-y-1.5 ">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Visit Number (VN) <span className="text-red-400">*</span></label>
                    <input type="text" value={vn} onChange={e => setVn(e.target.value)} placeholder="e.g. VN-2023-001"
                      className="w-full border border-slate-200 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-blue-300 outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Hospital Number (HN)</label>
                    <input type="text" value={hn} onChange={e => setHn(e.target.value)} placeholder="e.g. HN-12345"
                      className="w-full border border-slate-200 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-blue-300 outline-none" />
                  </div>

                  {/* Patient Name */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Patient Full Name <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={handleName}
                      placeholder="Enter patient's legal name"
                      className={`w-full border rounded-lg text-sm py-2.5 px-3 focus:ring-2 outline-none ${nameErr ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-300'}`}
                    />
                    {nameErr
                      ? <p className="text-[11px] text-red-500 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{nameErr}</p>
                      : <p className="text-[11px] text-slate-400"></p>
                    }
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Phone Number <span className="text-red-400">*</span></label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">call</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={phone}
                        onChange={handlePhone}
                        placeholder="0812345678"
                        maxLength={10}
                        className={`w-full pl-10 border rounded-lg text-sm py-2.5 pr-3 focus:ring-2 outline-none ${phoneErr ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-300'}`}
                      />
                      {/* counter */}
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold ${phone.length === 10 ? 'text-green-500' : 'text-slate-400'}`}>
                      </span>
                    </div>
                    {phoneErr
                      ? <p className="text-[11px] text-red-500 flex items-center gap-1"><span className="material-symbols-outlined text-sm">error</span>{phoneErr}</p>
                      : <p className="text-[11px] text-slate-400"></p>
                    }
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Start Date <span className="text-red-400">*</span></label>
                    <div className="relative w-1/2">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">calendar_today</span>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="w-full pl-10 border border-slate-200 rounded-lg text-sm py-2.5 pr-3 focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer" />
                    </div>
                    {fuISO && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg w-fit mt-2">
                        <span className="material-symbols-outlined text-red-500 text-base">event_upcoming</span>
                        <div>
                          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider leading-none mb-0.5">Follow-up Date (Start + 31 Days)</p>
                          <p className="text-sm font-bold text-red-700">{toDisplay(fuISO)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Medication */}
              <div className="p-6 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-5 text-blue-700">
                  <span className="material-symbols-outlined">medication</span>
                  <h3 className="text-lg font-semibold">Medication Details</h3>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Medication Name</label>
                    <select value={med} onChange={e => setMed(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-blue-300 outline-none bg-white">
                      {MEDS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bottles Prescribed</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={bottles}
                      onChange={e => setBottles(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full border border-slate-200 rounded-lg text-sm py-2.5 px-3 focus:ring-2 focus:ring-blue-300 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5 text-blue-700">
                  <span className="material-symbols-outlined">analytics</span>
                  <h3 className="text-lg font-semibold">Initialization Preview</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center text-center">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">CURRENT CYCLE</p>
                    <p className="text-2xl font-bold text-blue-900">1 Bottle</p>
                    <p className="text-xs text-blue-600 mt-1">Dispensed at Start</p>
                  </div>
                  <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex flex-col items-center text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">REMAINING STOCK</p>
                    <p className="text-2xl font-bold text-slate-800">{remaining} Bottle{remaining !== 1 ? 's' : ''}</p>
                    <p className="text-xs text-slate-500 mt-1">In Patient Quota</p>
                  </div>
                  <div className={`p-4 bg-red-50 border border-red-100 rounded-xl flex flex-col items-center text-center transition-opacity duration-300 ${fuISO ? 'opacity-100' : 'opacity-40'}`}>
                    <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">FIRST FOLLOW-UP</p>
                    <p className="text-2xl font-bold text-red-700">{fuISO ? toDisplay(fuISO) : '—'}</p>
                    <p className="text-xs text-red-500 mt-1">Auto-calc: Start + 31 Days</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
                <button onClick={() => navigate('calendar')}
                  className="px-6 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-white text-sm transition-colors">
                  Cancel
                </button>
                <button onClick={savePatient} disabled={saving}
                  className="px-6 py-2.5 rounded-lg bg-blue-700 text-white font-semibold flex items-center gap-2 hover:bg-blue-800 active:scale-95 transition-all shadow-sm text-sm disabled:opacity-50">
                  <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  {saving ? 'Saving...' : 'Save VN'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}