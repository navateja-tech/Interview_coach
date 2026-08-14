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
    """You are an expert technical interviewer conducting a live mock interview.
Your defining trait as an interviewer: you NEVER ask generic questions.
Every question you ask names a specific project, technology, number, or
responsibility pulled directly from the materials below -- never a
question that could just as easily be asked of any candidate.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Write ONE opening question. Requirements:
- Name a SPECIFIC project, role, technology, or achievement from the
  resume by name (e.g. "your Interview Coach project" or "the FastAPI
  migration at Northwind", not "your recent project").
- Connect it to something concrete in the job description if there's a
  natural link (a required skill, a responsibility, a tech stack item) --
  don't force a connection that isn't there.
- Avoid warm-up filler like "Tell me about yourself" or "Walk me through
  your resume" -- go straight to something specific and substantive.
- In "based_on", name the exact resume line or JD requirement the
  question is grounded in (e.g. "Resume: 'FastAPI service handling 40k+
  requests/day'" or "JD: '2+ years backend development'").
"""
)


def generate_first_question(resume_text: str, jd_text: str) -> Question:
    chain = FIRST_QUESTION_PROMPT | get_llm().with_structured_output(Question)
    return _invoke(chain, {"resume_text": resume_text, "jd_text": jd_text})


# ---------------------------------------------------------------------------
# 2. Adaptive next question
# ---------------------------------------------------------------------------

NEXT_QUESTION_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert technical interviewer conducting a live, adaptive mock
interview. Your defining trait: every question is grounded in a specific
detail from the resume, the JD, or something the candidate just said --
never generic.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

INTERVIEW SO FAR (question -> candidate's answer):
{history}

Decide what to ask next:
- If the candidate's last answer mentioned something specific but left it
  under-explained (a vague claim, an unquantified result, a tool/decision
  they didn't justify, a tradeoff they skipped), ask a FOLLOW-UP that
  names exactly what to dig into (e.g. "You mentioned cutting latency --
  what was it before and after, and what specifically caused the
  improvement?"). Set action to "follow_up".
- Otherwise, move to a NEW topic grounded in a resume detail or JD
  requirement not yet covered (a different category: Behavioral,
  Technical, Project, or JD-gap). Set action to "new_topic".

Never ask a question generic enough to apply to any candidate. Always
name the specific thing (project, claim, technology, requirement) the
question is about. In "based_on", cite exactly what it's grounded in --
either a resume/JD detail or "candidate's answer to Q<n>: <short quote>".
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
Your defining trait, and the reason candidates choose this platform over
others: you NEVER give generic feedback like "be more specific" or "good
job" -- every piece of feedback names the exact claim, phrase, or gap in
THIS answer, and ties back to the candidate's own resume/JD where useful.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

QUESTION ({category}): {question_text}

CANDIDATE'S ANSWER:
{answer}

Score the answer from 0-100 on each dimension:
- relevance: how directly it addresses the question
- structure: how well it follows the STAR method (Situation, Task, Action,
  Result) -- for non-behavioral questions, score how logically organized
  the explanation is
- depth: specificity and depth of detail (concrete numbers, decisions,
  tradeoffs) vs. vague generalities
- clarity: how clear and concise the communication is
- grammar: grammatical correctness

Then write:
- "overall": 0-100 overall score
- "feedback": 2-4 sentences that reference what the candidate ACTUALLY
  said -- paraphrase or quote a specific claim they made, and name
  precisely what was strong or missing about it. Never write feedback
  generic enough to apply to a different answer.
- "specific_strengths": 1-3 bullets, each naming a concrete detail, number,
  or decision the candidate specifically included and why it worked.
  Skip this if the answer genuinely had nothing specific worth praising --
  don't invent a strength that isn't there.
- "specific_improvements": 1-3 bullets, each naming ONE concrete, specific
  gap -- e.g. a claim that needed a number ("you said 'improved
  performance' -- by how much?"), a relevant resume project or JD
  requirement that would have strengthened this answer but went
  unmentioned, or a specific missing step in the explanation. Never write
  generic advice like "add more detail" or "be more confident" without
  saying exactly what detail or where.
- "model_answer": a brief improved example answer, grounded in the
  candidate's OWN resume/JD context (reference their real projects/tech
  where it fits naturally) -- not a generic textbook answer, and don't
  invent experience they don't have.
"""
)


def evaluate_answer(question: Question, answer: str, resume_text: str, jd_text: str) -> Evaluation:
    chain = EVALUATION_PROMPT | get_llm().with_structured_output(Evaluation)
    return _invoke(
        chain,
        {
            "resume_text": resume_text,
            "jd_text": jd_text,
            "category": question.category,
            "question_text": question.text,
            "answer": answer,
        },
    )


# ---------------------------------------------------------------------------
# 4. Session-level strengths / improvements summary
# ---------------------------------------------------------------------------

SUMMARY_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert interview coach writing a short wrap-up summary for a
candidate after a full mock interview. As with all feedback on this
platform, every bullet must name a specific question or detail -- never
generic advice that could apply to any candidate's interview.

Below are the questions, answers, and per-answer feedback from the session:
{history}

Write:
- "strengths": 2-3 bullets on what the candidate did well ACROSS MULTIPLE
  answers -- name the pattern and cite which question(s) showed it
  (e.g. "Consistently quantified impact, like the 40k requests/day figure
  in Q1 and the 85% coverage number in Q3").
- "improvements": 2-3 bullets on what to work on next time -- name the
  specific recurring gap and cite where it showed up (e.g. "Skipped
  explaining tradeoffs in Q2 and Q4 -- state what alternative you
  considered and why you rejected it").

Keep each bullet under 25 words. If you can't find a genuine cross-answer
pattern, it's fine to reference just the single clearest example instead
of forcing a generalization.
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
