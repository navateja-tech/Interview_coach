from typing import Literal
from pydantic import BaseModel, Field


class Question(BaseModel):
    text: str = Field(description="The interview question text")
    category: Literal["Behavioral", "Technical", "Project", "JD-gap"] = Field(
        description="Category of the question"
    )
    difficulty: Literal["Easy", "Medium", "Hard"] = Field(
        description="Difficulty level of the question"
    )
    based_on: str = Field(
        description="The resume/JD keyword or project this question is based on"
    )


class QuestionSet(BaseModel):
    questions: list[Question] = Field(description="List of generated interview questions")
