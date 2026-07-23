# AIVOA — AI-Powered Customer Complaint Management System

A pharmaceutical QMS (Quality Management System) Customer Complaint module that uses
an AI agent pipeline (LangGraph + Groq) to automatically extract, triage, and enrich
customer complaints from uploaded documents or pasted text.

---

## Tech Stack

- **Frontend:** React + Redux Toolkit, Tailwind CSS, Vite
- **Backend:** FastAPI, SQLAlchemy
- **Database:** PostgreSQL (Neon.tech)
- **AI Agent Framework:** LangGraph (StateGraph)
- **LLM Provider:** Groq
- **Font:** Google Inter

---

## Project Overview

Quality Assurance teams at pharmaceutical API/FDF manufacturers need to log customer
complaints quickly, assess their severity, and route them into the QMS triage process.
This system lets a QA user upload a complaint document (PDF/DOCX/TXT/EML) or paste raw
text, and an AI agent pipeline automatically:

1. Extracts structured fields (product, batch, customer, complaint details)
2. Scores completeness and flags missing fields
3. Classifies risk (severity/priority)
4. Detects possible duplicate complaints against existing records
5. Recommends a root cause hypothesis
6. Recommends CAPA (Corrective and Preventive Action) steps
7. Generates a plain-language complaint summary

The extracted data populates the intake form, which the QA user can review, edit, and
save. Saved complaints appear on a searchable/filterable Dashboard, and a chat assistant
lets the user ask follow-up questions about any complaint with full context.

---

## Architecture

```
Frontend (React + Redux)
   │
   ├── FileUpload / Paste → POST /ai/extract
   │        └── LangGraph pipeline (7 sequential nodes) → Groq LLM calls
   │
   ├── ComplaintForm → POST /complaints (save)
   ├── Dashboard → GET /complaints (list, filter, search)
   ├── ComplaintDetailModal → GET /complaints/{id}
   └── Chat panel → POST /ai/chat (context-aware, uses saved complaint data)

Backend (FastAPI)
   ├── routers/ai_assistant.py       → /ai/extract, /ai/chat
   ├── routers/complaints.py         → CRUD for /complaints
   ├── agents/langgraph_workflow.py  → StateGraph definition
   ├── agents/nodes.py               → individual pipeline node implementations
   ├── agents/groq_client.py         → Groq API wrapper
   ├── services/                     → DB query helpers, document parsing
   └── database.py, models.py, schemas.py → SQLAlchemy + Pydantic
```

---

## LangGraph Pipeline

```
extract_fields → completeness_checker → classify_risk → detect_duplicates
  → recommend_root_cause → recommend_capa → complaint_summary → END
```

Each node reads/writes to a shared `ComplaintAgentState` dict. LangGraph merges partial
state updates automatically, so each node only needs to return the keys it owns. Node
IDs are deliberately kept distinct from the state keys they populate (e.g. the node
`classify_risk` writes to the `risk_classification` state field) to avoid LangGraph's
"node ID collides with state key" restriction.

---

## Key Design Decisions

- **Model substitution:** The assignment specifies `gemma2-9b-it`, but Groq deprecated
  this model on **2025-08-08**. We substituted `llama-3.1-8b-instant` (same speed/price
  tier) for fast field extraction, and `llama-3.3-70b-versatile` for longer-context
  reasoning tasks (summary, root cause, CAPA, chat). Both are configurable via the
  `GROQ_MODEL_FAST` / `GROQ_MODEL_REASONING` environment variables, so swapping models
  back or trying others requires no code changes.

- **Sequential LangGraph pipeline:** Chosen over a single mega-prompt so each AI feature
  (completeness, risk, duplicates, root cause, CAPA, summary) is independently
  testable, debuggable, and can use a different model/temperature suited to its task,
  rather than asking one prompt to do everything at once.

- **Neon Postgres:** Serverless Postgres with branch-based environments, making it easy
  to keep dev/test data isolated from production without spinning up separate DB
  instances.

- **Redux Toolkit:** Centralized state for form data, AI insights, and chat messages —
  avoids prop-drilling between `ComplaintForm`, `AIInsightsPanel`, `Dashboard`, and the
  chat panel, and makes async flows (extraction, save, fetch) easy to track via
  `status`/`error` state.

- **Duplicate detection is advisory, not blocking:** The pipeline flags a possible
  duplicate with a confidence score, but does not prevent saving — the QA user makes
  the final call, consistent with how a human-in-the-loop QMS triage process works.

---

## Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A Neon (or any Postgres) database
- A Groq API key ([console.groq.com/keys](https://console.groq.com/keys))

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://<user>:<password>@<neon-host>/<db>?sslmode=require
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL_FAST=llama-3.1-8b-instant
GROQ_MODEL_REASONING=llama-3.3-70b-versatile
CORS_ORIGINS=http://localhost:5173
```

Run the server:

```bash
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on first run via SQLAlchemy's `create_all()`. If you
add/change model fields later and are not using Alembic, you may need to manually
`ALTER TABLE` or start from a fresh database.

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Run the dev server:

```bash
npm run dev
```

Visit **http://localhost:5173**.

---

## Bonus AI Features Implemented

- ✅ Complaint Completeness Checker
- ✅ Root Cause Recommendation
- ✅ Duplicate Complaint Detection
- ✅ CAPA Recommendation
- ✅ Complaint Summary
- ✅ AI Risk Classification

---

## Core Workflow

1. **Log Complaint** tab → upload a document or paste complaint text
2. AI pipeline runs → form auto-populates with extracted fields + AI insights panel
   (completeness score, risk classification, root cause, CAPA, summary, duplicate flag)
3. QA user reviews/edits fields → clicks **Save Complaint**
4. On success, redirected to the **Dashboard** → complaint appears in the table with
   stats (total, critical, urgent, pending)
5. Dashboard supports search (product/batch/customer/type) and filters (severity,
   status)
6. Clicking a row opens a detail panel with the full complaint + AI insights
7. The chat assistant panel can be asked questions about the currently open complaint

---

## Demo Video

[Link to be added]

---

## Repository Structure

```
aivoa-complaint-system/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── langgraph_workflow.py
│   │   │   ├── nodes.py
│   │   │   └── groq_client.py
│   │   ├── routers/
│   │   │   ├── ai_assistant.py
│   │   │   └── complaints.py
│   │   ├── services/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── store/
    │   ├── api/
    │   └── App.jsx
    ├── package.json
    └── .env.example
```