import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

from models.schemas import QuestionSet
from prompts.templates import QUESTION_GENERATION_PROMPT


def get_llm():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable not set. "
            "Get a free key at https://aistudio.google.com/apikey"
        )
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        google_api_key=api_key,
        temperature=0.7,
    )


def generate_questions(resume_text: str, jd_text: str, num_questions: int) -> QuestionSet:
    """
    Generate interview questions grounded in the resume and job description.
    """
    llm = get_llm()
    structured_llm = llm.with_structured_output(QuestionSet)

    chain = QUESTION_GENERATION_PROMPT | structured_llm

    result: QuestionSet = chain.invoke(
        {
            "resume_text": resume_text,
            "jd_text": jd_text,
            "num_questions": num_questions,
        }
    )
    return result
