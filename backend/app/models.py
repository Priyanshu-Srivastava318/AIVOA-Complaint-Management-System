import uuid
import enum
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Text, Date, DateTime, Enum, Numeric, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class SeverityEnum(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    critical = "Critical"


class PriorityEnum(str, enum.Enum):
    low = "Low"
    medium = "Medium"
    high = "High"
    urgent = "Urgent"


class StatusEnum(str, enum.Enum):
    pending_triage = "Pending Triage"
    triaged = "Triaged"
    under_investigation = "Under Investigation"
    capa_assigned = "CAPA Assigned"
    closed = "Closed"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)

    # 1. Origin & Customer Details
    complaint_source = Column(String(120))
    customer_name = Column(String(255))

    # 2. Product & Batch Identification
    product_name = Column(String(255))
    product_strength_grade = Column(String(120))
    batch_lot_number = Column(String(120))
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    quantity_affected = Column(String(60))  # kept as string ("50 kg") for flexibility

    # 3. Complaint Details
    complaint_type = Column(String(120))
    complaint_date = Column(Date, nullable=True)
    detailed_description = Column(Text)

    # 4. Initial Assessment & Priority
    initial_severity = Column(Enum(SeverityEnum, native_enum=False), nullable=True)
    priority = Column(Enum(PriorityEnum, native_enum=False), nullable=True)
    status = Column(Enum(StatusEnum, native_enum=False), default=StatusEnum.pending_triage)

    # --- AI-generated enrichment (bonus features) ---
    completeness_score = Column(Numeric(5, 2), nullable=True)       # 0-100
    missing_fields = Column(JSON, nullable=True)                    # list[str]
    ai_summary = Column(Text, nullable=True)
    root_cause_recommendation = Column(Text, nullable=True)
    capa_recommendation = Column(Text, nullable=True)
    risk_classification = Column(String(60), nullable=True)
    risk_justification = Column(Text, nullable=True)
    duplicate_of = Column(UUID(as_uuid=False), ForeignKey("complaints.id"), nullable=True)
    duplicate_confidence = Column(Numeric(5, 2), nullable=True)
    raw_source_text = Column(Text, nullable=True)  # original pasted/extracted text, for audit

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chat_messages = relationship("ChatMessage", back_populates="complaint", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    complaint_id = Column(UUID(as_uuid=False), ForeignKey("complaints.id"), nullable=True)
    role = Column(String(20))  # "user" | "assistant"
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="chat_messages")
