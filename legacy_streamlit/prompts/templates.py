from langchain_core.prompts import ChatPromptTemplate

QUESTION_GENERATION_PROMPT = ChatPromptTemplate.from_template(
    """You are an expert technical interviewer preparing a mock interview for a candidate.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}

Generate exactly {num_questions} interview questions tailored to this candidate and role.

Distribute the questions across these categories:
- Behavioral: general behavioral/situational questions (e.g. "Tell me about a time...")
- Technical: conceptual/technical questions based on skills that appear in BOTH the resume and JD
- Project: questions that reference specific projects, tools, or experience named in the resume
- JD-gap: probing questions about skills required in the JD but NOT clearly present in the resume
  (e.g. "Have you worked with X? How would you approach learning/using it?")

Aim for a roughly even spread across all four categories, adapted to how many
resume/JD keywords are available in each category. Also assign a difficulty
(Easy, Medium, Hard) to each question, and note which specific resume/JD
keyword or project each question is based on (the "based_on" field).

Return exactly {num_questions} questions total.
"""
)
