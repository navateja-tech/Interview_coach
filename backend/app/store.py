"""
In-memory interview session store.

Sessions are lost on server restart. For production this would move to Redis
or a small Postgres table, but for a mock-interview session that lasts a few
minutes, in-memory is a reasonable tradeoff for now.
"""
from typing import Any

SESSIONS: dict[str, dict[str, Any]] = {}


def new_session(session_id: str, resume_text: str, jd_text: str, first_question) -> None:
    SESSIONS[session_id] = {
        "resume_text": resume_text,
        "jd_text": jd_text,
        "current_question": first_question,
        "history": [],  # list of {"question": Question, "answer": str, "evaluation": Evaluation}
    }


def get_session(session_id: str) -> dict[str, Any] | None:
    return SESSIONS.get(session_id)
