import { useEffect } from 'react'

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className={`fixed bottom-6 right-6 z-[9999] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm transition-all duration-300 ${toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <span className={`material-symbols-outlined ${toast.iconColor}`}>{toast.icon}</span>
      <p className="text-sm font-semibold">{toast.msg}</p>
    </div>
  )
}
