/**
 * usePatients hook
 * ดึงข้อมูลจาก pharmatrack-api (MySQL) แทน localStorage
 */

import { useState, useEffect, useCallback } from 'react'
import { Patient } from '../types/patient'
import * as api from '../utils/api'

// ── date helpers (ใช้ทั่วทั้งแอป) ──────────────────────────
export function toISO(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

export function addDays(iso: string, n: number): Date {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

// ── hook ─────────────────────────────────────────────────────
export function usePatients() {
  const [patients,  setPatients]  = useState<Patient[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // โหลดข้อมูลจาก API
  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.getPatients()
      setPatients(data.patients)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // เพิ่มผู้ป่วยใหม่ 1 คน
  const addPatient = useCallback(async (p: Patient) => {
    await api.createPatient(p)
    await load()
  }, [load])

  // Import หลายคนพร้อมกัน
  const addPatients = useCallback(async (patients: Patient[]) => {
    const result = await api.bulkImport(patients)
    await load()
    return { added: result.added, dupes: result.dupes }
  }, [load])

  // อัปเดตสถานะ
  const updatePatient = useCallback(async (id: number, changes: Partial<Patient>) => {
    await api.updatePatient(id, changes)
    await load()
  }, [load])

  // จ่ายยา
  const dispense = useCallback(async (id: number, dispensedDate: string, phone: string) => {
    const result = await api.dispensePatient(id, dispensedDate, phone)
    await load()
    return result
  }, [load])

  // ลบ
  const removePatient = useCallback(async (id: number) => {
    await api.deletePatient(id)
    await load()
  }, [load])

  // ค้นหา (client-side filter จาก patients ที่โหลดมาแล้ว)
  const searchLocal = useCallback((q: string): Patient[] => {
    if (!q.trim()) return []
    const lower = q.toLowerCase()
    return patients.filter(p =>
      p.vn.toLowerCase().includes(lower) ||
      p.patientName.toLowerCase().includes(lower)
    )
  }, [patients])

  return {
    patients,
    loading,
    error,
    load,
    addPatient,
    addPatients,
    updatePatient,
    dispense,
    removePatient,
    searchLocal,
  }
}