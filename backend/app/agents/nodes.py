"""
LangGraph node implementations for the Complaint Intake Agent.

Each node takes the shared ComplaintAgentState, does one focused job
(mirroring a real QMS complaint-triage workflow), and returns the fields
it updates. Keeping nodes single-purpose makes the graph easy to extend
with new bonus features (add a node, wire it into the graph in workflow.py).
"""
from __future__ import annotations
from typing import TypedDict, Optional, List
from difflib import SequenceMatcher

from app.agents.groq_client import run_json_completion, run_completion
from app.config import get_settings

settings = get_settings()

REQUIRED_FIELDS = [
    "complaint_source", "customer_name", "product_name", "product_strength_grade",
    "batch_lot_number", "manufacturing_date", "expiry_date", "quantity_affected",
    "complaint_type", "complaint_date", "detailed_description",
]


class ComplaintAgentState(TypedDict, total=False):
    # input
    source_text: str
    existing_complaints: List[dict]  # lightweight dicts for duplicate detection

    # working / output
    extracted_fields: dict
    completeness_score: float
    missing_fields: List[str]
    risk_classification: str
    risk_justification: str
    root_cause_recommendation: str
    capa_recommendation: str
    ai_summary: str
    duplicate_of: Optional[str]
    duplicate_confidence: Optional[float]
    trace: List[str]  # human-readable log for the demo UI


def _log(state: ComplaintAgentState, message: str) -> None:
    state.setdefault("trace", []).append(message)


# ---------------------------------------------------------------------------
# Node 1: Field extraction
# ---------------------------------------------------------------------------
EXTRACTION_SYSTEM_PROMPT = """You are a Quality Assurance data-entry assistant for a
pharmaceutical (API & FDF) manufacturer's Customer Complaint Management System.
Extract structured fields from the complaint text (an email, letter, or report).

Return ONLY a JSON object with exactly these keys (use null when a value is genuinely
not present in the text -- never invent data):
complaint_source, customer_name, product_name, product_strength_grade, batch_lot_number,
manufacturing_date (YYYY-MM-DD), expiry_date (YYYY-MM-DD), quantity_affected,
complaint_type, complaint_date (YYYY-MM-DD), detailed_description.

complaint_source should be one of: "Email", "Phone Call", "Portal", "Letter", "Field Visit"
if inferable, else your best label.
complaint_type should be a short QMS category, e.g. "Product Quality Defect",
"Packaging Defect", "Adverse Event", "Delivery/Shipping Issue", "Documentation Discrepancy".
detailed_description should be a clean 2-4 sentence paraphrase of the issue, not a verbatim copy.
"""


def extract_fields_node(state: ComplaintAgentState) -> dict:
    _log(state, "🔎 extract_fields: calling gemma2-9b-it to pull structured fields from source text")
    data = run_json_completion(
        EXTRACTION_SYSTEM_PROMPT,
        f"COMPLAINT TEXT:\n{state['source_text']}",
        model=settings.GROQ_MODEL_FAST,
    )
    _log(state, f"✅ extract_fields: extracted {sum(1 for v in data.values() if v)} / {len(REQUIRED_FIELDS)} fields")
    return {"extracted_fields": data}


# ---------------------------------------------------------------------------
# Node 2: Completeness checker (bonus feature)
# ---------------------------------------------------------------------------
def completeness_checker_node(state: ComplaintAgentState) -> dict:
    fields = state.get("extracted_fields", {})
    missing = [f for f in REQUIRED_FIELDS if not fields.get(f)]
    score = round(100 * (len(REQUIRED_FIELDS) - len(missing)) / len(REQUIRED_FIELDS), 2)
    _log(state, f"📋 completeness_checker: {score}% complete, missing={missing or 'none'}")
    return {"completeness_score": score, "missing_fields": missing}


# ---------------------------------------------------------------------------
# Node 3: AI risk classification (bonus feature)
# ---------------------------------------------------------------------------
RISK_SYSTEM_PROMPT = """You are a pharmaceutical Quality Risk Management (QRM) expert
following ICH Q9 principles. Given complaint details, classify the risk and recommend
an initial severity + priority for triage.

Return ONLY JSON with keys:
risk_classification (one of "Critical", "Major", "Minor"),
initial_severity (one of "Low", "Medium", "High", "Critical"),
priority (one of "Low", "Medium", "High", "Urgent"),
risk_justification (1-3 sentences explaining the reasoning, referencing patient safety,
regulatory, and product quality impact where relevant).
"""


def risk_classification_node(state: ComplaintAgentState) -> dict:
    fields = state.get("extracted_fields", {})
    _log(state, "⚠️ risk_classification: calling llama-3.3-70b-versatile for ICH Q9-style risk assessment")
    result = run_json_completion(
        RISK_SYSTEM_PROMPT,
        f"COMPLAINT FIELDS:\n{fields}",
        model=settings.GROQ_MODEL_REASONING,
    )
    # fold severity/priority back into extracted_fields so the form can populate them
    merged_fields = {**fields}
    if result.get("initial_severity"):
        merged_fields["initial_severity"] = result["initial_severity"]
    if result.get("priority"):
        merged_fields["priority"] = result["priority"]

    _log(state, f"✅ risk_classification: {result.get('risk_classification', 'Unclassified')} risk")
    return {
        "extracted_fields": merged_fields,
        "risk_classification": result.get("risk_classification", "Unclassified"),
        "risk_justification": result.get("risk_justification", ""),
    }


# ---------------------------------------------------------------------------
# Node 4: Duplicate complaint detection (bonus feature)
# ---------------------------------------------------------------------------
def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, (a or "").lower(), (b or "").lower()).ratio()


def duplicate_detection_node(state: ComplaintAgentState) -> dict:
    fields = state.get("extracted_fields", {})
    candidates = state.get("existing_complaints", [])
    _log(state, f"🔁 duplicate_detection: comparing against {len(candidates)} existing complaints")

    best_match, best_score = None, 0.0
    for c in candidates:
        # weight batch number heavily (near-deterministic signal), blend with description similarity
        batch_match = 1.0 if fields.get("batch_lot_number") and fields.get("batch_lot_number") == c.get("batch_lot_number") else 0.0
        desc_sim = _similarity(fields.get("detailed_description", ""), c.get("detailed_description", ""))
        product_match = 1.0 if fields.get("product_name") and fields.get("product_name") == c.get("product_name") else 0.0
        score = 0.5 * batch_match + 0.35 * desc_sim + 0.15 * product_match
        if score > best_score:
            best_score, best_match = score, c.get("id")

    threshold = 0.55
    if best_score >= threshold:
        _log(state, f"⚠️ duplicate_detection: possible duplicate of {best_match} (confidence {round(best_score*100,1)}%)")
        return {"duplicate_of": best_match, "duplicate_confidence": round(best_score * 100, 2)}

    _log(state, "✅ duplicate_detection: no likely duplicate found")
    return {"duplicate_of": None, "duplicate_confidence": round(best_score * 100, 2)}


# ---------------------------------------------------------------------------
# Node 5: Root cause recommendation (bonus feature)
# ---------------------------------------------------------------------------
ROOT_CAUSE_PROMPT = """You are a pharmaceutical manufacturing quality investigator.
Given the complaint details, suggest the 2-3 MOST LIKELY root cause hypotheses an
investigator should check first (e.g. raw material variance, process deviation,
equipment malfunction, packaging line issue, storage/transport excursion, labeling error).
Be specific to the complaint, not generic. Keep it to 3-5 sentences, plain text (no JSON)."""


def root_cause_node(state: ComplaintAgentState) -> dict:
    fields = state.get("extracted_fields", {})
    _log(state, "🧪 root_cause_recommendation: generating investigation hypotheses")
    text = run_completion(
        ROOT_CAUSE_PROMPT,
        f"COMPLAINT FIELDS:\n{fields}",
        model=settings.GROQ_MODEL_REASONING,
    )
    return {"root_cause_recommendation": text.strip()}


# ---------------------------------------------------------------------------
# Node 6: CAPA recommendation (bonus feature)
# ---------------------------------------------------------------------------
CAPA_PROMPT = """You are a QA/CAPA specialist. Given the complaint details and the
likely root cause hypotheses already identified, draft a concise CAPA (Corrective and
Preventive Action) recommendation: 1-2 immediate corrections, 1-2 corrective actions,
and 1 preventive action. Format as short bullet points (plain text, use "- ")."""


def capa_recommendation_node(state: ComplaintAgentState) -> dict:
    fields = state.get("extracted_fields", {})
    root_cause = state.get("root_cause_recommendation", "")
    _log(state, "🛠️ capa_recommendation: drafting corrective/preventive actions")
    text = run_completion(
        CAPA_PROMPT,
        f"COMPLAINT FIELDS:\n{fields}\n\nROOT CAUSE HYPOTHESES:\n{root_cause}",
        model=settings.GROQ_MODEL_REASONING,
    )
    return {"capa_recommendation": text.strip()}


# ---------------------------------------------------------------------------
# Node 7: Complaint summary (bonus feature)
# ---------------------------------------------------------------------------
SUMMARY_PROMPT = """Summarize this pharmaceutical customer complaint in 2-3 sentences
for a QA manager's daily triage review. Be factual and concise, plain text only."""


def summary_node(state: ComplaintAgentState) -> dict:
    fields = state.get("extracted_fields", {})
    _log(state, "📝 complaint_summary: generating manager-facing summary")
    text = run_completion(
        SUMMARY_PROMPT,
        f"COMPLAINT FIELDS:\n{fields}",
        model=settings.GROQ_MODEL_REASONING,
    )
    return {"ai_summary": text.strip()}
