from io import BytesIO

import pdfplumber
from fastapi import UploadFile


async def extract_resume_text(resume: UploadFile) -> str:
    """Extract raw text from an uploaded resume PDF."""
    raw = await resume.read()
    text_parts = []
    with pdfplumber.open(BytesIO(raw)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)
