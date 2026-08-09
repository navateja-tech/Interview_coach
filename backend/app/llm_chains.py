from langchain_core.prompts import ChatPromptTemplate
from langchain_groq import ChatGroq

from app.config import GROQ_API_KEY, GROQ_MODEL
from app.schemas import Evaluation, NextQuestionDecision, Question

_llm = None


def get_llm():
    """Lazily construct the Groq client so import doesn't fail without a key set."""
    global _llm
    if _llm is None:
        if not GROQ_API_KEY:
            raise RuntimeError(
                "GROQ_API_KEY is not set. Copy backend/.env.example to backend/.env "
                "and add your key from https://console.groq.com/keys"
            )
        _llm = ChatGroq(model=GROQ_MODEL, api_key=GROQ_API_KEY, temperature=0.7)
    return _llm


def _invoke(chain, payload, retries=2):
    """Run a chain and translate upstream Groq errors into a clean, user-facing message.

    Without this, a Groq-side error (quota exhausted, rate limited, model
    overloaded, transient network error) bubbles up as a raw 500 with a full
    stack trace. We catch it here and re-raise as a RuntimeError, which
    app/main.py's exception handler turns into a clean 503 JSON response.

    Transient connection failures (e.g. httpx.RemoteProtocolError -- "Server
    disconnected without sending a response", common on flaky networks or
    behind some antivirus/proxy SSL inspection) are retried a couple of
    times with a short backoff before giving up, since they're often a
    one-off blip rather than a real outage.
    """
    import time

    last_exc = None
    for attempt in range(retries + 1):
        try:
            return chain.invoke(payload)
        except Exception as exc:  # noqa: BLE001 - deliberately broad: any Groq/network failure
            last_exc = exc
            message = str(exc)
            is_transient = "RemoteProtocolError" in type(exc).__name__ or "disconnected" in message.lower()
            if is_transient and attempt < retries:
                time.sleep(1.5 * (attempt + 1))
                continue
            break

    exc = last_exc
    message = str(exc)
    if "rate_limit" in message.lower() or "429" in message:
        raise RuntimeError(
            "The AI service hit its rate/quota limit. Wait a bit and try again, or check your "
            "Groq usage at https://console.groq.com/settings/limits."
        ) from exc
    if "invalid_api_key" in message.lower() or "401" in message or "authentication" in message.lower():
        raise RuntimeError(
            "The Groq API key was rejected. Double-check GROQ_API_KEY in backend/.env."
        ) from exc
    if "RemoteProtocolError" in type(exc).__name__ or "disconnected" in message.lower():
        raise RuntimeError(
            "Couldn't reach Groq's servers (connection was dropped before a response came back). "
            "This is usually a network/proxy/antivirus issue rather than a code bug -- see the "
            "troubleshooting steps in README.md."
        ) from exc
    raise RuntimeError(
        "The AI service failed to respond. This is usually transient — try again in a moment."
    ) from exc


# ---------------------------------------------------------------------------
# 1. First question
# ---------------------------------------------------------------------------

FIRST_QUESTION_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert interviewer conducting a live mock interview.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Ask ONE opening interview question — usually a warm, background-style
question (e.g. about their most relevant project or experience) that draws
on a specific detail from the resume and connects to the job description.
Note the specific resume/JD keyword or project this question is based on
in the "based_on" field.
"""
)


def generate_first_question(resume_text: str, jd_text: str) -> Question:
    chain = FIRST_QUESTION_PROMPT | get_llm().with_structured_output(Question)
    return _invoke(chain, {"resume_text": resume_text, "jd_text": jd_text})


# ---------------------------------------------------------------------------
# 2. Adaptive next question
# ---------------------------------------------------------------------------

NEXT_QUESTION_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert interviewer conducting a live, adaptive mock interview.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

INTERVIEW SO FAR (question -> candidate's answer):
{history}

Decide what to ask next:
- If the candidate's last answer was shallow, vague, or left something
  interesting unexplored, ask a natural FOLLOW-UP question that digs
  deeper into that same answer. Set action to "follow_up".
- Otherwise, move to a NEW topic (a different category: Behavioral,
  Technical, Project, or JD-gap) that hasn't been well covered yet. Set
  action to "new_topic".

Ask exactly one question, tailored to the resume and JD, and note which
resume/JD keyword or project it is based on in "based_on".
"""
)


def generate_next_question(resume_text: str, jd_text: str, history: list[dict]) -> NextQuestionDecision:
    history_text = "\n".join(
        f"Q{i+1} ({h['question'].category}): {h['question'].text}\nA{i+1}: {h['answer']}"
        for i, h in enumerate(history)
    )
    chain = NEXT_QUESTION_PROMPT | get_llm().with_structured_output(NextQuestionDecision)
    return _invoke(chain, {"resume_text": resume_text, "jd_text": jd_text, "history": history_text})


# ---------------------------------------------------------------------------
# 3. Answer evaluation (STAR rubric)
# ---------------------------------------------------------------------------

EVALUATION_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert interview coach scoring one answer from a mock interview.

QUESTION ({category}): {question_text}

CANDIDATE'S ANSWER:
{answer}

Score the answer from 0-100 on each dimension:
- relevance: how directly it addresses the question
- structure: how well it follows the STAR method (Situation, Task, Action,
  Result) — for non-behavioral questions, score how logically organized
  the explanation is
- depth: specificity and depth of detail (concrete numbers, decisions,
  tradeoffs) vs. vague generalities
- clarity: how clear and concise the communication is
- grammar: grammatical correctness

Then give an "overall" score (0-100), 1-2 sentences of constructive
feedback, and a brief improved example answer ("model_answer") the
candidate could learn from.
"""
)


def evaluate_answer(question: Question, answer: str) -> Evaluation:
    chain = EVALUATION_PROMPT | get_llm().with_structured_output(Evaluation)
    return _invoke(chain, {"category": question.category, "question_text": question.text, "answer": answer})


# ---------------------------------------------------------------------------
# 4. Session-level strengths / improvements summary
# ---------------------------------------------------------------------------

SUMMARY_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert interview coach writing a short wrap-up summary for a
candidate after a full mock interview.

Below are the questions, answers, and per-answer feedback from the session:
{history}

Write:
- "strengths": 2-3 short bullet points on what the candidate did well,
  across the whole interview
- "improvements": 2-3 short bullet points on what to work on next time

Keep each bullet under 15 words.
"""
)


def generate_summary(history: list[dict]) -> tuple[list[str], list[str]]:
    from pydantic import BaseModel

    class Summary(BaseModel):
        strengths: list[str]
        improvements: list[str]

    history_text = "\n\n".join(
        f"Q{i+1} ({h['question'].category}): {h['question'].text}\n"
        f"A{i+1}: {h['answer']}\n"
        f"Feedback: {h['evaluation'].feedback}"
        for i, h in enumerate(history)
    )
    chain = SUMMARY_PROMPT | get_llm().with_structured_output(Summary)
    result = _invoke(chain, {"history": history_text})
    return result.strengths, result.improvements
