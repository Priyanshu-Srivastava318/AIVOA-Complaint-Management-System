from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.database import get_db
from app.services import complaint_service

router = APIRouter(prefix="/complaints", tags=["complaints"])


@router.get("", response_model=List[schemas.ComplaintOut])
def get_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return complaint_service.list_complaints(db, skip, limit)


@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    complaint = complaint_service.get_complaint(db, complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.post("", response_model=schemas.ComplaintOut, status_code=201)
def create_complaint(payload: schemas.ComplaintCreate, db: Session = Depends(get_db)):
    return complaint_service.create_complaint(db, payload)


@router.put("/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(complaint_id: str, payload: schemas.ComplaintUpdate, db: Session = Depends(get_db)):
    complaint = complaint_service.update_complaint(db, complaint_id, payload)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.delete("/{complaint_id}", status_code=204)
def delete_complaint(complaint_id: str, db: Session = Depends(get_db)):
    if not complaint_service.delete_complaint(db, complaint_id):
        raise HTTPException(status_code=404, detail="Complaint not found")
