from typing import Literal, Optional
from pydantic import BaseModel, Field


class Question(BaseModel):
    text: str = Field(description="The interview question text")
    category: Literal["Behavioral", "Technical", "Project", "JD-gap"] = Field(
        description="Category of the question"
    )
    based_on: str = Field(
        description="The resume/JD keyword or project this question is based on"
    )


class NextQuestionDecision(BaseModel):
    action: Literal["follow_up", "new_topic"] = Field(
        description="Whether to dig deeper on the same topic or move to a new one"
    )
    question: Question


class Evaluation(BaseModel):
    relevance: int = Field(ge=0, le=100, description="How directly the answer addressed the question")
    structure: int = Field(ge=0, le=100, description="STAR structure: Situation/Task/Action/Result")
    depth: int = Field(ge=0, le=100, description="Specificity and depth of detail")
    clarity: int = Field(ge=0, le=100, description="Clarity and conciseness of communication")
    grammar: int = Field(ge=0, le=100, description="Grammatical correctness")
    overall: int = Field(ge=0, le=100, description="Overall score for this answer")
    feedback: str = Field(description="1-2 sentences of constructive feedback")
    model_answer: str = Field(description="A brief improved example answer")


class StartSessionResponse(BaseModel):
    session_id: str
    question: Question
    question_number: int
    total_questions: int


class AnswerRequest(BaseModel):
    answer: str


class AnswerResponse(BaseModel):
    evaluation: Evaluation
    next_question: Optional[Question] = None
    is_complete: bool
    question_number: int
    total_questions: int


class MetricBreakdown(BaseModel):
    label: str
    score: int
    sub_metrics: list[list] = []  # [[name, value], ...]


class QAResult(BaseModel):
    n: int
    title: str
    sentiment: Literal["Positive", "Neutral", "Needs work"]
    note: str


class ResultsResponse(BaseModel):
    overall_score: int
    overall_label: str
    metrics: list[MetricBreakdown]
    radar: list[list]  # [[label, value], ...]
    questions: list[QAResult]
    strengths: list[str]
    improvements: list[str]
