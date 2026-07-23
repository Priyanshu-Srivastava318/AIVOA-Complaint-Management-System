from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ComplaintBase(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None

    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity_affected: Optional[str] = None

    complaint_type: Optional[str] = None
    complaint_date: Optional[date] = None
    detailed_description: Optional[str] = None

    initial_severity: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class ComplaintCreate(ComplaintBase):
    pass


class ComplaintUpdate(ComplaintBase):
    pass


class ComplaintOut(ComplaintBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    completeness_score: Optional[float] = None
    missing_fields: Optional[List[str]] = None
    ai_summary: Optional[str] = None
    root_cause_recommendation: Optional[str] = None
    capa_recommendation: Optional[str] = None
    risk_classification: Optional[str] = None
    risk_justification: Optional[str] = None
    duplicate_of: Optional[str] = None
    duplicate_confidence: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class ExtractionRequest(BaseModel):
    """Body for /ai/extract when submitting raw pasted text."""
    text: str


class ExtractionResponse(BaseModel):
    extracted_fields: ComplaintBase
    completeness_score: float
    missing_fields: List[str]
    ai_summary: str
    root_cause_recommendation: str
    capa_recommendation: str
    risk_classification: str
    risk_justification: str
    duplicate_of: Optional[str] = None
    duplicate_confidence: Optional[float] = None
    agent_trace: List[str]  # human-readable log of LangGraph node execution, for the UI/demo


class ChatMessageIn(BaseModel):
    complaint_id: Optional[str] = None
    message: str


class ChatMessageOut(BaseModel):
    role: str
    content: str
