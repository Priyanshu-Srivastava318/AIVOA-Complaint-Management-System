import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateField, resetForm, saveComplaint } from '../store/complaintSlice'
import { TextField, TextAreaField, SelectField } from './FormField'
import AIInsightsPanel from './AIInsightsPanel'
import { CheckCircle2, X } from 'lucide-react'

const SEVERITY_OPTIONS = ['Low', 'Medium', 'High', 'Critical']
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent']

export default function ComplaintForm({ onSaved }) {
  const dispatch = useDispatch()
  const { form, status, aiInsights } = useSelector((s) => s.complaints)
  const [savedComplaint, setSavedComplaint] = useState(null)
  const [saveError, setSaveError] = useState(null)

  const set = (field) => (value) => dispatch(updateField({ field, value }))

  const handleSave = async () => {
    setSaveError(null)
    try {
      const result = await dispatch(saveComplaint(form)).unwrap()
      console.log('Complaint saved:', result)
      setSavedComplaint(result)
      setTimeout(() => onSaved?.(), 1200)
    } catch (err) {
      console.error('Save failed:', err)
      setSaveError(err?.message || 'Something went wrong while saving. Please try again.')
    }
  }

  const handleReset = () => {
    dispatch(resetForm())
    setSavedComplaint(null)
    setSaveError(null)
  }

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Log Customer Complaint</h2>
          <p className="text-sm text-gray-500">API &amp; FDF Quality Assurance Module</p>
        </div>
        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-3 py-1 rounded-full">
          {form.status || 'Pending Triage'}
        </span>
      </div>

      {savedComplaint && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Complaint logged successfully</p>
              <p className="text-xs text-emerald-600 mt-0.5">
                ID: {savedComplaint.id ?? '—'} · Status: {savedComplaint.status || 'Pending Triage'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSavedComplaint(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4 flex items-start justify-between gap-3">
          <p className="text-sm text-red-700">{saveError}</p>
          <button type="button" onClick={() => setSaveError(null)} className="text-red-600 hover:text-red-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-8 bg-white rounded-xl border border-gray-200 p-6">
        <Section title="1. Origin & Customer Details">
          <TextField label="Complaint Source" value={form.complaint_source} onChange={set('complaint_source')} />
          <TextField label="Customer Name" value={form.customer_name} onChange={set('customer_name')} />
        </Section>

        <Section title="2. Product & Batch Identification">
          <TextField label="Product Name" value={form.product_name} onChange={set('product_name')} />
          <TextField label="Product Strength/Grade" value={form.product_strength_grade} onChange={set('product_strength_grade')} />
          <TextField label="Batch/Lot Number" value={form.batch_lot_number} onChange={set('batch_lot_number')} />
          <TextField label="Manufacturing Date" type="date" value={form.manufacturing_date} onChange={set('manufacturing_date')} />
          <TextField label="Expiry Date" type="date" value={form.expiry_date} onChange={set('expiry_date')} />
          <TextField label="Quantity Affected" value={form.quantity_affected} onChange={set('quantity_affected')} />
        </Section>

        <Section title="3. Complaint Details">
          <TextField label="Complaint Type" value={form.complaint_type} onChange={set('complaint_type')} />
          <TextField label="Complaint Date" type="date" value={form.complaint_date} onChange={set('complaint_date')} />
          <div className="sm:col-span-2">
            <TextAreaField
              label="Detailed Complaint Description"
              value={form.detailed_description}
              onChange={set('detailed_description')}
            />
          </div>
        </Section>

        <Section title="4. Initial Assessment & Priority">
          <SelectField label="Initial Severity" value={form.initial_severity} onChange={set('initial_severity')} options={SEVERITY_OPTIONS} />
          <SelectField label="Priority" value={form.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} />
        </Section>

        {aiInsights.ai_summary && <AIInsightsPanel insights={aiInsights} />}

        <div className="flex justify-between pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset Form
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={status === 'saving'}
            className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-md hover:bg-brand-700 disabled:opacity-60"
          >
            {status === 'saving' ? 'Saving…' : 'Save Complaint'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  )
}