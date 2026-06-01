export default function Sidebar({ navigate, activePage }) {
  return (
    <nav className="fixed left-0 top-0 h-full w-64 border-r border-slate-100 bg-white flex flex-col p-4 z-50">
      {/* Logo */}
      <div className="mb-8 px-4 flex flex-col items-center text-center">
        <div className="w-full h-28 flex items-center justify-center mb-5">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQiLV12xH86XDA2G8WBJv6zb6VaeqyNX7EGDA&s"
            alt="Hospital Logo"
            className="w-42 h-42 object-contain"
          />
        </div>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1">
        <button
          onClick={() => navigate('calendar')}
          className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm w-full text-left transition-colors ${
            activePage === 'calendar' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined">calendar_month</span>Dispensing Calendar
        </button>

        <button
          onClick={() => navigate('add-patient')}
          className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm w-full text-left transition-colors ${
            activePage === 'add-patient' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined">add_circle</span>Add VN
        </button>

        <button
          onClick={() => navigate('dashboard')}
          className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm w-full text-left transition-colors ${
            activePage === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined">dashboard</span>Dashboard
        </button>

        <button
          onClick={() => navigate('adr')}
          className={`flex items-center gap-3 px-4 py-3 rounded-md font-medium text-sm w-full text-left transition-colors ${
            activePage === 'adr' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span className="material-symbols-outlined">health_and_safety</span>ADR
        </button>
      </div>

      {/* Status Legend */}
      <div className="mt-auto p-4 bg-white border border-slate-200 rounded-xl">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Status Legend</h3>
        <ul className="flex flex-col gap-3">
          <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs font-semibold text-slate-700">Follow-up Call</span></li>
          <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="text-xs font-semibold text-slate-700">Appointment / Production</span></li>
          <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-500" /><span className="text-xs font-semibold text-slate-700">Checked / Ready</span></li>
          <li className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs font-semibold text-slate-700">Dispensed</span></li>
        </ul>
      </div>
    </nav>
  )
}