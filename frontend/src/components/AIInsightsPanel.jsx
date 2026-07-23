import { AlertTriangle, CheckCircle2, Copy, Sparkles, Wrench } from 'lucide-react'

export default function AIInsightsPanel({ insights }) {
  const {
    completeness_score, missing_fields, ai_summary, risk_classification,
    risk_justification, root_cause_recommendation, capa_recommendation,
    duplicate_of, duplicate_confidence,
  } = insights

  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-5 space-y-4">
      <div className="flex items-center gap-2 text-brand-700 font-semibold text-sm">
        <Sparkles className="h-4 w-4" />
        AI Triage Insights
      </div>

      {completeness_score != null && (
        <InsightRow icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} title={`Completeness: ${completeness_score}%`}>
          {missing_fields?.length ? `Missing: ${missing_fields.join(', ')}` : 'All required fields present.'}
        </InsightRow>
      )}

      {ai_summary && (
        <InsightRow icon={<Sparkles className="h-4 w-4 text-brand-600" />} title="Complaint Summary">
          {ai_summary}
        </InsightRow>
      )}

      {risk_classification && (
        <InsightRow icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} title={`Risk Classification: ${risk_classification}`}>
          {risk_justification}
        </InsightRow>
      )}

      {root_cause_recommendation && (
        <InsightRow icon={<Wrench className="h-4 w-4 text-indigo-600" />} title="Root Cause Recommendation">
          {root_cause_recommendation}
        </InsightRow>
      )}

      {capa_recommendation && (
        <InsightRow icon={<Wrench className="h-4 w-4 text-indigo-600" />} title="CAPA Recommendation">
          <span className="whitespace-pre-wrap">{capa_recommendation}</span>
        </InsightRow>
      )}

      {duplicate_of && (
        <InsightRow icon={<Copy className="h-4 w-4 text-red-600" />} title={`Possible Duplicate (${duplicate_confidence}% confidence)`}>
          Matches existing complaint ID: {duplicate_of}
        </InsightRow>
      )}
    </div>
  )
}

function InsightRow({ icon, title, children }) {
  return (
    <div className="flex gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <div className="text-sm text-gray-600">{children}</div>
      </div>
    </div>
  )
}