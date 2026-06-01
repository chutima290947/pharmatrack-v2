export type PatientStatus = 'followup' | 'production' | 'ready' | 'dispensed'

export interface Patient {
  id: number
  hn: string | null 
  vn: string
  patientName: string
  phone: string
  medication: string
  totalBottles: number
  remainingBottles: number
  startDate: string        // ISO: YYYY-MM-DD
  followupDate: string     // ISO: YYYY-MM-DD  (+31 from startDate)
  activeDate: string       // ISO: วันที่แสดงบนปฏิทิน
  status: PatientStatus
  productionDate: string | null
  cycleCount: number
}

export const STATUS_CFG: Record<PatientStatus, {
  label: string
  dot: string
  border: string
  bg: string
  txt: string
  hd: string
}> = {
  followup:   { label:'Follow-up',  dot:'bg-red-500',    border:'border-red-500',    bg:'bg-red-50',    txt:'text-red-700',    hd:'text-red-600'    },
  production: { label:'Appt/Prod.', dot:'bg-yellow-400', border:'border-yellow-400', bg:'bg-yellow-50', txt:'text-yellow-700', hd:'text-yellow-600' },
  ready:      { label:'Ready',      dot:'bg-blue-500',   border:'border-blue-500',   bg:'bg-blue-50',   txt:'text-blue-700',   hd:'text-blue-600'   },
  dispensed:  { label:'Dispensed',  dot:'bg-green-500',  border:'border-green-500',  bg:'bg-green-50',  txt:'text-green-700',  hd:'text-green-600'  },
}