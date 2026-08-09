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

    questions = [
        QAResult(
            n=i + 1,
            title=h["question"].category,
            sentiment=_sentiment_for(h["evaluation"].overall),
            note=h["evaluation"].feedback,
        )
        for i, h in enumerate(history)
    ]

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
