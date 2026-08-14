from app.llm_chains import generate_summary
from app.schemas import MetricBreakdown, QAResult, ResultsResponse


def _avg(values: list[int]) -> int:
    return round(sum(values) / len(values)) if values else 0


def _label_for(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 50:
        return "Fair"
    return "Needs work"


def _sentiment_for(score: int) -> str:
    if score >= 75:
        return "Positive"
    if score >= 55:
        return "Neutral"
    return "Needs work"


_DIMENSION_LABELS = {
    "relevance": "Relevance to the question",
    "structure": "Answer structure (STAR)",
    "depth": "Depth of detail",
    "clarity": "Clarity of communication",
    "grammar": "Grammar",
}


def _fallback_strengths_and_improvements(evaluation) -> tuple[list[str], list[str]]:
    """Fallback only: if the model didn't return specific_strengths/
    specific_improvements for some reason, derive something from the raw
    dimension scores rather than showing an empty panel. The LLM's own
    grounded, answer-specific bullets (evaluation.specific_strengths/
    specific_improvements) are always preferred over this.
    """
    dims = {
        "relevance": evaluation.relevance,
        "structure": evaluation.structure,
        "depth": evaluation.depth,
        "clarity": evaluation.clarity,
        "grammar": evaluation.grammar,
    }
    strengths = [f"Strong {_DIMENSION_LABELS[k]}" for k, v in dims.items() if v >= 80]
    improvements = [f"Work on {_DIMENSION_LABELS[k]}" for k, v in dims.items() if v < 60]

    if not strengths:
        best_key = max(dims, key=dims.get)
        strengths = [f"Relatively strongest on {_DIMENSION_LABELS[best_key]}"]
    if not improvements:
        worst_key = min(dims, key=dims.get)
        improvements = [f"Most room to grow: {_DIMENSION_LABELS[worst_key]}"]

    return strengths[:4], improvements[:4]


def _strengths_and_improvements_for(evaluation) -> tuple[list[str], list[str]]:
    strengths = evaluation.specific_strengths or None
    improvements = evaluation.specific_improvements or None
    if strengths and improvements:
        return strengths[:4], improvements[:4]

    fallback_strengths, fallback_improvements = _fallback_strengths_and_improvements(evaluation)
    return strengths[:4] if strengths else fallback_strengths, improvements[:4] if improvements else fallback_improvements


def compute_results(history: list[dict]) -> ResultsResponse:
    evaluations = [h["evaluation"] for h in history]

    relevance = _avg([e.relevance for e in evaluations])
    structure = _avg([e.structure for e in evaluations])
    depth = _avg([e.depth for e in evaluations])
    clarity = _avg([e.clarity for e in evaluations])
    grammar = _avg([e.grammar for e in evaluations])
    overall = _avg([e.overall for e in evaluations])
    # "Confidence" isn't a directly-scored dimension (that needs voice/video
    # signal) — approximate it from clarity + structure, which correlate
    # with how confidently an answer reads.
    confidence = _avg([clarity, structure])

    metrics = [
        MetricBreakdown(label="Relevance", score=relevance, sub_metrics=[["Avg. across answers", relevance]]),
        MetricBreakdown(label="STAR structure", score=structure, sub_metrics=[["Avg. across answers", structure]]),
        MetricBreakdown(label="Depth", score=depth, sub_metrics=[["Avg. across answers", depth]]),
        MetricBreakdown(label="Clarity", score=clarity, sub_metrics=[["Avg. across answers", clarity]]),
        MetricBreakdown(label="Grammar", score=grammar, sub_metrics=[["Avg. across answers", grammar]]),
        MetricBreakdown(label="Confidence (est.)", score=confidence, sub_metrics=[["Clarity + structure blend", confidence]]),
    ]

    radar = [
        ["Relevance", relevance],
        ["Structure", structure],
        ["Depth", depth],
        ["Clarity", clarity],
        ["Grammar", grammar],
    ]

    questions = []
    for i, h in enumerate(history):
        q_strengths, q_improvements = _strengths_and_improvements_for(h["evaluation"])
        questions.append(
            QAResult(
                n=i + 1,
                title=h["question"].category,
                sentiment=_sentiment_for(h["evaluation"].overall),
                note=h["evaluation"].feedback,
                question_text=h["question"].text,
                answer_text=h["answer"],
                model_answer=h["evaluation"].model_answer,
                score=h["evaluation"].overall,
                strengths=q_strengths,
                improvements=q_improvements,
            )
        )

    strengths, improvements = generate_summary(history)

    return ResultsResponse(
        overall_score=overall,
        overall_label=_label_for(overall),
        metrics=metrics,
        radar=radar,
        questions=questions,
        strengths=strengths,
        improvements=improvements,
    )
