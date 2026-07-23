from typing import Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session

from app import schemas, models
from app.database import get_db
from app.config import get_settings
from app.services.document_parser import extract_text_from_upload
from app.services.complaint_service import get_lightweight_complaints_for_dedup, get_complaint
from app.agents.langgraph_workflow import run_complaint_intake
from app.agents.groq_client import run_chat_completion

router = APIRouter(prefix="/ai", tags=["ai-assistant"])
settings = get_settings()


@router.post("/extract", response_model=schemas.ExtractionResponse)
async def extract_complaint(
    db: Session = Depends(get_db),
    file: Optional[UploadFile] = File(default=None),
    text: Optional[str] = Form(default=None),
):
    """
    Runs the LangGraph complaint-intake agent over either an uploaded file
    (PDF/DOCX/TXT/EML) or raw pasted text, and returns extracted fields plus
    all bonus-feature AI outputs (completeness, risk, duplicates, root cause,
    CAPA, summary) so the frontend can populate the form and chat panel.
    """
    if not file and not text:
        raise HTTPException(status_code=400, detail="Provide either a file or pasted text.")

    if file:
        if file.size and file.size > settings.MAX_UPLOAD_MB * 1024 * 1024:
            raise HTTPException(status_code=400, detail=f"File exceeds {settings.MAX_UPLOAD_MB}MB limit.")
        source_text = await extract_text_from_upload(file)
    else:
        source_text = text

    if not source_text or not source_text.strip():
        raise HTTPException(status_code=400, detail="No readable text found in the submitted complaint.")

    existing = get_lightweight_complaints_for_dedup(db)
    result = run_complaint_intake(source_text, existing)

    return schemas.ExtractionResponse(
        extracted_fields=result.get("extracted_fields", {}),
        completeness_score=result.get("completeness_score", 0),
        missing_fields=result.get("missing_fields", []),
        ai_summary=result.get("ai_summary", ""),
        root_cause_recommendation=result.get("root_cause_recommendation", ""),
        capa_recommendation=result.get("capa_recommendation", ""),
        risk_classification=result.get("risk_classification", ""),
        risk_justification=result.get("risk_justification", ""),
        duplicate_of=result.get("duplicate_of"),
        duplicate_confidence=result.get("duplicate_confidence"),
        agent_trace=result.get("trace", []),
    )


CHAT_SYSTEM_PROMPT = """You are the AI Complaint Intake Assistant embedded in a
pharmaceutical Customer Complaint Management System (a QMS module). Help the QA
user understand the complaint currently open in the form, answer questions about
its fields, risk classification, root cause hypotheses, and CAPA recommendations.
Be concise and professional. If you don't have enough context, say so plainly."""


@router.post("/chat", response_model=schemas.ChatMessageOut)
async def chat_with_assistant(payload: schemas.ChatMessageIn, db: Session = Depends(get_db)):
    context = ""
    if payload.complaint_id:
        complaint = get_complaint(db, payload.complaint_id)
        if complaint:
            context = (
                f"\n\nCURRENT COMPLAINT CONTEXT:\n"
                f"Product: {complaint.product_name}, Batch: {complaint.batch_lot_number}, "
                f"Type: {complaint.complaint_type}, Severity: {complaint.initial_severity}, "
                f"Priority: {complaint.priority}\n"
                f"Description: {complaint.detailed_description}\n"
                f"AI Summary: {complaint.ai_summary}\n"
                f"Root Cause: {complaint.root_cause_recommendation}\n"
                f"CAPA: {complaint.capa_recommendation}"
            )

    messages = [
        {"role": "system", "content": CHAT_SYSTEM_PROMPT + context},
        {"role": "user", "content": payload.message},
    ]
    reply = run_chat_completion(messages, model=settings.GROQ_MODEL_REASONING)

    if payload.complaint_id:
        db.add(models.ChatMessage(complaint_id=payload.complaint_id, role="user", content=payload.message))
        db.add(models.ChatMessage(complaint_id=payload.complaint_id, role="assistant", content=reply))
        db.commit()

    return schemas.ChatMessageOut(role="assistant", content=reply)
