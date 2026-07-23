# Demo Video Script (target: 10–15 minutes)

Use this as a checklist/talking-points guide — don't read it verbatim, explain in your own
words and show your actual running app + code.

## 1. Intro (30–60s)
- Who you are, what you built: AI-powered Customer Complaint Management module for a
  pharma API/FDF QMS.
- One-sentence pitch: "Drop in a complaint email or document, and an AI agent extracts every
  QMS field, checks completeness, classifies risk, flags duplicates, and drafts a CAPA —
  turning a 15-minute manual data-entry task into 15 seconds."

## 2. Quick QMS context (30–60s)
- What a Customer Complaint record is in a pharma QMS and why triage speed/completeness
  matters (GMP investigation clock starts here).

## 3. Frontend workflow walkthrough (3–4 min)
- Show the empty form (left) + AI Assistant panel (right) — mirror of the reference screenshot.
- Drag & drop `sample_complaint_1.txt` → show extraction progress bar.
- Point out: form auto-populates section by section (Origin & Customer, Product & Batch,
  Complaint Details, Initial Assessment & Priority).
- Show the **AI Triage Insights** card: completeness %, AI summary, risk classification +
  justification, root cause hypotheses, CAPA recommendation.
- Save the complaint → mention it's now in Postgres.
- Ask the chat assistant a follow-up question about the open complaint, show the contextual
  answer.
- Submit `sample_complaint_3_duplicate_demo.txt` (after seeding) to show **Duplicate
  Complaint Detection** flagging a match against the AMOX-B2201 record.

## 4. Working of all implemented AI tools (2–3 min)
Walk through each bonus feature and *why* it's useful in a real QMS:
- Completeness Checker
- AI Risk Classification (mention ICH Q9 framing)
- Duplicate Complaint Detection (explain the heuristic: batch match + description similarity)
- Root Cause Recommendation
- CAPA Recommendation
- Complaint Summary
- Conversational assistant

## 5. Code flow & architecture (3–4 min)
- Show `backend/app/main.py` → routers → `ai_assistant.py` → `/ai/extract`.
- Show `document_parser.py` (file → text) briefly.
- Open `agents/nodes.py`: explain each node is single-purpose, reads/writes shared state.
- Open `agents/langgraph_workflow.py`: trace through `extract_fields → completeness_checker →
  risk_classification → duplicate_detection → root_cause_recommendation →
  capa_recommendation → complaint_summary`.
- Show `groq_client.py`: explain why two models are used (gemma2-9b-it for fast extraction,
  llama-3.3-70b-versatile for reasoning/chat).
- Show `models.py` / Postgres schema quickly.
- Frontend: show `complaintSlice.js` (`runExtraction` thunk hitting `/ai/extract`), and how
  `ComplaintForm.jsx` reads from Redux state.

## 6. LangGraph implementation deep-dive (1–2 min)
- Show the actual `StateGraph` construction — nodes, edges, `compile()`.
- Mention `agent_trace` in the API response: a human-readable log of what each node did,
  useful for debugging/demonstrating the pipeline (show it in the network tab or console).
- Mention this design makes adding new AI features additive, not a rewrite.

## 7. Key design decisions (1–2 min)
Summarize (from the README):
- LangGraph over one big prompt — staged, traceable, extensible.
- Two Groq models chosen by task.
- Duplicate detection as a deterministic heuristic rather than an LLM call.
- Redux slices split by concern.
- Scoped-down document parsing (no OCR) per assignment scope.

## 8. Wrap-up (30s)
- Recap what's implemented vs. bonus, and one thing you'd add next with more time (e.g. CAPA
  workflow tracking, user auth/roles, OCR for scanned complaints).
