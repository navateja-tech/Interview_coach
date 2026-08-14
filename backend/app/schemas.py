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
    feedback: str = Field(
        description="2-4 sentences of feedback that reference specific things the candidate actually "
        "said (paraphrase or quote a specific claim), not generic advice"
    )
    specific_strengths: list[str] = Field(
        default_factory=list,
        description="1-3 bullets naming a concrete thing this answer did well, each referencing a "
        "specific detail, example, or phrase from the candidate's actual answer",
    )
    specific_improvements: list[str] = Field(
        default_factory=list,
        description="1-3 bullets naming a concrete, specific gap in this answer -- e.g. a claim that "
        "needed a number/example, a relevant resume project or JD requirement that went unmentioned, "
        "or a specific missing step -- never generic advice like 'be more detailed'",
    )
    model_answer: str = Field(
        description="A brief improved example answer, grounded in the candidate's actual resume/JD "
        "context (use their real project/tech names where relevant, don't invent unrelated experience)"
    )


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
    question_text: str
    answer_text: str
    model_answer: str
    score: int = Field(ge=0, le=100, description="This question's overall score (0-100)")
    strengths: list[str] = Field(default_factory=list, description="Derived from this question's dimension scores")
    improvements: list[str] = Field(default_factory=list, description="Derived from this question's dimension scores")


class ResultsResponse(BaseModel):
    overall_score: int
    overall_label: str
    metrics: list[MetricBreakdown]
    radar: list[list]  # [[label, value], ...]
    questions: list[QAResult]
    strengths: list[str]
    improvements: list[str]
