"""
End-to-end smoke test for the AI Interview Coach backend.

Runs the *entire* flow -- start session -> answer every question -> fetch
results -- against your real GROQ_API_KEY, using an in-process test
client (no need to have `uvicorn` running separately). Prints each step so
you can eyeball that the adaptive question logic and scoring are sane.

Usage:
    cd backend
    cp .env.example .env   # then edit .env and set your GROQ_API_KEY
    pip install -r requirements.txt
    python scripts/test_full_flow.py
"""
import io
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

SAMPLE_RESUME_TEXT = """
Jordan Lee
Software Engineer

EXPERIENCE
Backend Engineer, Northwind Logistics (2023-2026)
- Built a FastAPI service handling 40k+ requests/day for shipment tracking
- Migrated a monolithic Flask app to a set of FastAPI microservices
- Wrote a pytest suite that raised test coverage from 40% to 85%

PROJECTS
Interview Coach -- an adaptive AI mock-interview platform
- FastAPI backend, LangChain + Groq for question generation and scoring
- React frontend with live voice-driven interview sessions

SKILLS
Python, FastAPI, PostgreSQL, React, LangChain, Docker
"""

SAMPLE_JD_TEXT = """
We're hiring a Backend Engineer to build and scale our Python/FastAPI
services. You'll own service reliability, write tests, and collaborate
with the frontend team on API design. Experience with LangChain or LLM
integrations is a plus. Familiarity with Docker and CI/CD pipelines
preferred.
"""


def _fake_pdf_bytes(text: str) -> bytes:
    """Build a minimal single-page PDF containing the given text, using reportlab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.setFont("Helvetica", 10)

    y = 740
    for line in text.strip().splitlines():
        line = line.strip()
        if not line:
            y -= 6
            continue
        c.drawString(50, y, line)
        y -= 14
        if y < 50:
            c.showPage()
            c.setFont("Helvetica", 10)
            y = 740

    c.save()
    return buf.getvalue()


def main():
    client = TestClient(app)

    print("=" * 70)
    print("1. Starting session (uploading resume + JD)...")
    print("=" * 70)
    resp = client.post(
        "/api/session/start",
        files={"resume": ("resume.pdf", _fake_pdf_bytes(SAMPLE_RESUME_TEXT), "application/pdf")},
        data={"job_description": SAMPLE_JD_TEXT},
    )
    if resp.status_code != 200:
        print(f"FAILED ({resp.status_code}): {resp.text}")
        sys.exit(1)

    data = resp.json()
    session_id = data["session_id"]
    question = data["question"]
    total = data["total_questions"]
    print(f"session_id: {session_id}")
    print(f"Q1/{total} [{question['category']}]: {question['text']}")
    print(f"  based_on: {question['based_on']}\n")

    # A canned "answer" per category, just to give the model something
    # concrete to score and follow up on.
    sample_answers = {
        "Behavioral": (
            "At Northwind, our shipment tracking service started failing under peak load. "
            "I profiled the bottleneck to a synchronous DB call, added connection pooling and "
            "an async batch endpoint, which cut p99 latency from 2.1s to 300ms."
        ),
        "Technical": (
            "FastAPI's dependency injection lets you share things like DB sessions across "
            "routes cleanly. I use it to inject a scoped SQLAlchemy session per request and "
            "close it automatically, which avoided connection leaks we used to have in Flask."
        ),
        "Project": (
            "On the Interview Coach project, the adaptive question logic asks the LLM to "
            "decide between a follow-up or a new topic based on the running conversation "
            "history, using a structured-output Pydantic schema so the decision is typed."
        ),
        "JD-gap": (
            "I haven't used CI/CD pipelines extensively yet, but I've set up GitHub Actions "
            "for test runs on this project and would want to extend that to full deploy "
            "pipelines with staged rollouts."
        ),
    }

    question_num = 1
    while True:
        answer = sample_answers.get(question["category"], "I approached it methodically and delivered results.")
        print("-" * 70)
        print(f"Answering Q{question_num}...")
        resp = client.post(f"/api/session/{session_id}/answer", json={"answer": answer})
        if resp.status_code != 200:
            print(f"FAILED ({resp.status_code}): {resp.text}")
            sys.exit(1)
        data = resp.json()
        ev = data["evaluation"]
        print(f"  scores: relevance={ev['relevance']} structure={ev['structure']} depth={ev['depth']} "
              f"clarity={ev['clarity']} grammar={ev['grammar']} overall={ev['overall']}")
        print(f"  feedback: {ev['feedback']}")

        if data["is_complete"]:
            print("\nInterview complete.")
            break

        question = data["next_question"]
        question_num = data["question_number"]
        print(f"\nQ{question_num}/{total} [{question['category']}]: {question['text']}")
        print(f"  based_on: {question['based_on']}\n")

    print("=" * 70)
    print("2. Fetching results...")
    print("=" * 70)
    resp = client.get(f"/api/session/{session_id}/results")
    if resp.status_code != 200:
        print(f"FAILED ({resp.status_code}): {resp.text}")
        sys.exit(1)
    results = resp.json()
    print(json.dumps(results, indent=2))

    print("\n✅ Full flow completed successfully.")


if __name__ == "__main__":
    main()
