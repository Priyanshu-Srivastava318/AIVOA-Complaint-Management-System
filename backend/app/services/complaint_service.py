from sqlalchemy.orm import Session
from sqlalchemy import select

from app import models, schemas


def list_complaints(db: Session, skip: int = 0, limit: int = 100) -> list[models.Complaint]:
    stmt = select(models.Complaint).order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit)
    return list(db.scalars(stmt))


def get_complaint(db: Session, complaint_id: str) -> models.Complaint | None:
    return db.get(models.Complaint, complaint_id)


def get_lightweight_complaints_for_dedup(db: Session) -> list[dict]:
    """Small projection used by the duplicate-detection LangGraph node."""
    rows = db.query(
        models.Complaint.id,
        models.Complaint.batch_lot_number,
        models.Complaint.product_name,
        models.Complaint.detailed_description,
    ).all()
    return [
        {"id": r.id, "batch_lot_number": r.batch_lot_number,
         "product_name": r.product_name, "detailed_description": r.detailed_description}
        for r in rows
    ]


def create_complaint(db: Session, payload: schemas.ComplaintCreate) -> models.Complaint:
    complaint = models.Complaint(**payload.model_dump(exclude_unset=True))
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


def update_complaint(db: Session, complaint_id: str, payload: schemas.ComplaintUpdate) -> models.Complaint | None:
    complaint = get_complaint(db, complaint_id)
    if not complaint:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(complaint, field, value)
    db.commit()
    db.refresh(complaint)
    return complaint


def delete_complaint(db: Session, complaint_id: str) -> bool:
    complaint = get_complaint(db, complaint_id)
    if not complaint:
        return False
    db.delete(complaint)
    db.commit()
    return True
