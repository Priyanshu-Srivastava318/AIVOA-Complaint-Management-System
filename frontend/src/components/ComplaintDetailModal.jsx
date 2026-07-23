import { X } from 'lucide-react'
import AIInsightsPanel from './AIInsightsPanel'

export default function ComplaintDetailModal({ complaint, onClose }) {
  if (!complaint) return null

  const insights = {
    completeness_score: complaint.completeness_score,
    missing_fields: complaint.missing_fields,
    ai_summary: complaint.ai_summary,
    root_cause_recommendation: complaint.root_cause_recommendation,
    capa_recommendation: complaint.capa_recommendation,
    risk_classification: complaint.risk_classification,
    risk_justification: complaint.risk_justification,
    duplicate_of: complaint.duplicate_of,
    duplicate_confidence: complaint.duplicate_confidence,
  }

  const hasInsights = Object.values(insights).some((v) =>
    Array.isArray(v) ? v.length > 0 : v != null && v !== ''
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-xl bg-white shadow-xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Complaint Details</h3>
            <p className="text-xs text-gray-500 font-mono">{complaint.id}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <DetailSection title="Origin & Customer">
            <Field label="Complaint Source" value={complaint.complaint_source} />
            <Field label="Customer Name" value={complaint.customer_name} />
          </DetailSection>

          <DetailSection title="Product & Batch">
            <Field label="Product Name" value={complaint.product_name} />
            <Field label="Product Strength/Grade" value={complaint.product_strength_grade} />
            <Field label="Batch/Lot Number" value={complaint.batch_lot_number} />
            <Field label="Manufacturing Date" value={complaint.manufacturing_date} />
            <Field label="Expiry Date" value={complaint.expiry_date} />
            <Field label="Quantity Affected" value={complaint.quantity_affected} />
          </DetailSection>

          <DetailSection title="Complaint Details">
            <Field label="Complaint Type" value={complaint.complaint_type} />
            <Field label="Complaint Date" value={complaint.complaint_date} />
            <Field label="Description" value={complaint.detailed_description} full />
          </DetailSection>

          <DetailSection title="Assessment">
            <Field label="Severity" value={complaint.initial_severity} />
            <Field label="Priority" value={complaint.priority} />
            <Field label="Status" value={complaint.status} />
          </DetailSection>

          {hasInsights && <AIInsightsPanel insights={insights} />}
        </div>
      </div>
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h4>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  )
}

function Field({ label, value, full }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || '—'}</p>
    </div>
  )
}