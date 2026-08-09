from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.analytics import compute_results
from app.config import MAX_QUESTIONS
from app.llm_chains import evaluate_answer, generate_first_question, generate_next_question
from app.resume_parser import extract_resume_text
from app.schemas import AnswerRequest, AnswerResponse, ResultsResponse, StartSessionResponse
from app.store import get_session, new_session

router = APIRouter()


@router.post("/start", response_model=StartSessionResponse)
async def start_session(
    resume: UploadFile = File(...),
    job_description: str | None = Form(None),
    jd_file: UploadFile | None = File(None),
):
    if jd_file is not None:
        jd_text = await extract_resume_text(jd_file)
    else:
        jd_text = (job_description or "").strip()

    if not jd_text.strip():
        raise HTTPException(
            status_code=400, detail="Provide a job description, either pasted as text or as a PDF upload"
        )

    resume_text = await extract_resume_text(resume)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract any text from the resume PDF")

    first_question = generate_first_question(resume_text, jd_text)

    session_id = str(uuid4())
    new_session(session_id, resume_text, jd_text, first_question)

    return StartSessionResponse(
        session_id=session_id,
        question=first_question,
        question_number=1,
        total_questions=MAX_QUESTIONS,
    )


@router.post("/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(session_id: str, payload: AnswerRequest):
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if session["current_question"] is None:
        raise HTTPException(status_code=400, detail="This interview session has already ended")
    if not payload.answer.strip():
        raise HTTPException(status_code=400, detail="Answer cannot be empty")

    current_question = session["current_question"]
    evaluation = evaluate_answer(current_question, payload.answer)
    session["history"].append({"question": current_question, "answer": payload.answer, "evaluation": evaluation})

    question_number = len(session["history"])

    if question_number >= MAX_QUESTIONS:
        session["current_question"] = None
        return AnswerResponse(
            evaluation=evaluation,
            next_question=None,
            is_complete=True,
            question_number=question_number,
            total_questions=MAX_QUESTIONS,
        )

    decision = generate_next_question(session["resume_text"], session["jd_text"], session["history"])
    session["current_question"] = decision.question

    return AnswerResponse(
        evaluation=evaluation,
        next_question=decision.question,
        is_complete=False,
        question_number=question_number + 1,
        total_questions=MAX_QUESTIONS,
    )


@router.get("/{session_id}/results", response_model=ResultsResponse)
async def get_results(session_id: str):
    session = get_session(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")
    if not session["history"]:
        raise HTTPException(status_code=400, detail="No answers submitted yet for this session")

    return compute_results(session["history"])
