"""
Lightweight document -> text extraction for uploaded complaint files.
Per the assignment, production-grade OCR/parsing is NOT required, so this
covers the common demo formats: .txt, .eml, .docx, .pdf (text layer only).
"""
import email
from email import policy
from io import BytesIO

from fastapi import UploadFile, HTTPException


async def extract_text_from_upload(file: UploadFile) -> str:
    filename = (file.filename or "").lower()
    content = await file.read()

    if filename.endswith(".txt"):
        return content.decode("utf-8", errors="ignore")

    if filename.endswith(".eml"):
        msg = email.message_from_bytes(content, policy=policy.default)
        parts = [f"Subject: {msg.get('subject', '')}", f"From: {msg.get('from', '')}"]
        body = msg.get_body(preferencelist=("plain",))
        if body:
            parts.append(body.get_content())
        return "\n".join(parts)

    if filename.endswith(".docx"):
        import docx  # python-docx
        doc = docx.Document(BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)

    if filename.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(BytesIO(content))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported file type for '{file.filename}'. Supported: PDF, DOCX, TXT, EML.",
    )
