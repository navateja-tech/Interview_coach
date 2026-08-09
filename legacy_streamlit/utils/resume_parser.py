import pdfplumber
from io import BytesIO


def extract_resume_text(uploaded_file) -> str:
    """
    Extract raw text from an uploaded resume PDF (Streamlit UploadedFile object).
    """
    text_parts = []
    with pdfplumber.open(BytesIO(uploaded_file.read())) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)
