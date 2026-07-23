import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchComplaints } from '../store/complaintSlice'
import { RefreshCw, AlertCircle, Search } from 'lucide-react'
import ComplaintDetailModal from './ComplaintDetailModal'

const SEVERITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-amber-100 text-amber-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700',
}

const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-purple-100 text-purple-700',
  Urgent: 'bg-red-100 text-red-700',
}

const SEVERITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Critical']
const STATUS_OPTIONS = ['All', 'Pending Triage', 'In Review', 'Closed']

export default function Dashboard() {
  const dispatch = useDispatch()
  const { list, status, error } = useSelector((s) => s.complaints)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    dispatch(fetchComplaints())
  }, [dispatch])

  const loading = status === 'loading'

  const filtered = useMemo(() => {
    return list.filter((c) => {
      const matchesSearch =
        !search ||
        [c.product_name, c.batch_lot_number, c.customer_name, c.complaint_type]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(search.toLowerCase()))

      const matchesSeverity = severityFilter === 'All' || c.initial_severity === severityFilter
      const matchesStatus = statusFilter === 'All' || (c.status || 'Pending Triage') === statusFilter

      return matchesSearch && matchesSeverity && matchesStatus
    })
  }, [list, search, severityFilter, statusFilter])

  const stats = {
    total: list.length,
    critical: list.filter((c) => c.initial_severity === 'Critical').length,
    urgent: list.filter((c) => c.priority === 'Urgent').length,
    pending: list.filter((c) => (c.status || 'Pending Triage') === 'Pending Triage').length,
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Complaints Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of all logged complaints</p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchComplaints())}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Complaints" value={stats.total} />
        <StatCard label="Critical Severity" value={stats.critical} accent="text-red-600" />
        <StatCard label="Urgent Priority" value={stats.urgent} accent="text-purple-600" />
        <StatCard label="Pending Triage" value={stats.pending} accent="text-amber-600" />
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, batch, customer, type..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {SEVERITY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt === 'All' ? 'All Severities' : opt}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt === 'All' ? 'All Statuses' : opt}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 mb-4 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load complaints: {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <Th>ID</Th>
              <Th>Product</Th>
              <Th>Batch/Lot</Th>
              <Th>Type</Th>
              <Th>Severity</Th>
              <Th>Priority</Th>
              <Th>Status</Th>
              <Th>Date</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && list.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">Loading complaints...</td>
              </tr>
            )}
            {!loading && filtered.length === 0 && !error && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-400">
                  {list.length === 0 ? 'No complaints logged yet.' : 'No complaints match your filters.'}
                </td>
              </tr>
            )}
            {filtered.map((c) => (
              <tr
                key={c.id}
                onClick={() => setSelected(c)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{String(c.id).slice(0, 8)}</td>
                <td className="px-4 py-3 text-gray-900">{c.product_name || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.batch_lot_number || '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.complaint_type || '—'}</td>
                <td className="px-4 py-3">
                  {c.initial_severity ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SEVERITY_COLORS[c.initial_severity] || 'bg-gray-100 text-gray-700'}`}>
                      {c.initial_severity}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3">
                  {c.priority ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[c.priority] || 'bg-gray-100 text-gray-700'}`}>
                      {c.priority}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">{c.status || 'Pending Triage'}</td>
                <td className="px-4 py-3 text-gray-500">{c.complaint_date || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ComplaintDetailModal complaint={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function StatCard({ label, value, accent = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-semibold ${accent}`}>{value}</p>
    </div>
  )
}

function Th({ children }) {
  return <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">{children}</th>
}