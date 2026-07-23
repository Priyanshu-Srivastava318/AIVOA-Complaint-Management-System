import { ShieldCheck, FileText, LayoutDashboard } from 'lucide-react'

export default function Header({ view, onViewChange }) {
  return (
    <header className="border-b border-gray-200 bg-white px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-brand-600 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-semibold text-gray-900 leading-tight">AIVOA Complaint Management</h1>
          <p className="text-xs text-gray-500 leading-tight">Pharmaceutical API &amp; FDF Quality Assurance Module</p>
        </div>
      </div>

      <nav className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <TabButton active={view === 'form'} onClick={() => onViewChange('form')} icon={<FileText className="h-4 w-4" />}>
          Log Complaint
        </TabButton>
        <TabButton active={view === 'dashboard'} onClick={() => onViewChange('dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>
          Dashboard
        </TabButton>
      </nav>
    </header>
  )
}

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
        active ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
      }`}
    >
      {icon}
      {children}
    </button>
  )
}