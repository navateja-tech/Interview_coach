import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getResults } from "../api/client";
import useCountUp from "../hooks/useCountUp";

const SENTIMENT_STYLES = {
  Positive: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
  Neutral: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  "Needs work": { bg: "bg-red-50", text: "text-red-500", dot: "bg-red-500" },
};

const SCORE_NOTE = {
  Excellent: "Outstanding work — you're interview-ready.",
  Good: "Solid performance! A little more practice will make it perfect.",
  Fair: "You're getting there — a few focused reps will help a lot.",
  "Needs work": "Don't worry, this is exactly what practice is for.",
};

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function ScoreGauge({ value, label, size = 168 }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const animated = useCountUp(value, { duration: 1300 });
  const offset = c - (animated / 100) * c;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E4ECFB" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#2F6FEF"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold text-ink leading-none">{animated}%</p>
        <p className="text-xs font-medium text-accent mt-1">{label}</p>
      </div>
    </div>
  );
}

function MetricCard({ label, score, index }) {
  const animated = useCountUp(score, { duration: 900 });
  const band = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Needs work";
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.06, duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: "0 16px 40px -16px rgba(15,27,45,0.18)" }}
      className="bg-white rounded-2xl border border-border p-4 transition-shadow"
    >
      <p className="text-xs font-medium text-muted mb-1">{label}</p>
      <p className="text-xl font-bold text-ink">{animated}%</p>
      <p className="text-[11px] text-accent-dark font-medium mb-2">{band}</p>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <motion.div
          className="h-full bg-accent rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: 0.2 + index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

function QuestionRow({ q, active, onClick }) {
  const s = SENTIMENT_STYLES[q.sentiment];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors ${
        active ? "bg-accent/10" : "hover:bg-black/[0.02]"
      }`}
    >
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5 ${s.dot}`}>
        {q.n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink line-clamp-2">{q.question_text}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{q.sentiment}</span>
        <span className="text-[11px] font-semibold text-ink">{Math.round(q.score / 10)}/10</span>
      </div>
    </button>
  );
}

const TABS = ["Your Answer", "Ideal Answer", "AI Feedback"];

function FeedbackPanel({ question }) {
  const [tab, setTab] = useState(TABS[0]);

  useEffect(() => setTab(TABS[0]), [question.n]);

  const tabContent = {
    "Your Answer": question.answer_text,
    "Ideal Answer": question.model_answer,
    "AI Feedback": question.note,
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="text-sm font-medium text-ink leading-relaxed">
          <span className="text-accent font-semibold">Q{question.n}.</span> {question.question_text}
        </p>
        <div className="shrink-0 w-12 h-12 rounded-full border-2 border-accent flex flex-col items-center justify-center">
          <span className="text-sm font-bold text-ink leading-none">{Math.round(question.score / 10)}</span>
          <span className="text-[8px] text-muted leading-none">/10</span>
        </div>
      </div>

      <div className="flex gap-1 mb-3 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs font-medium px-3 py-2 -mb-px border-b-2 transition-colors ${
              tab === t ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="text-xs text-muted leading-relaxed min-h-[60px]"
        >
          {tabContent[tab]}
        </motion.p>
      </AnimatePresence>

      <div className="grid sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-border">
        <div>
          <p className="text-xs font-semibold text-emerald-600 mb-2">Strengths</p>
          <ul className="space-y-1.5">
            {question.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted leading-snug">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-amber-600 mb-2">Areas to improve</p>
          <ul className="space-y-1.5">
            {question.improvements.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted leading-snug">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5">
                  <path d="M12 9v4M12 16.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M10.3 4.4 2.7 18a1.5 1.5 0 0 0 1.3 2.2h16a1.5 1.5 0 0 0 1.3-2.2L13.7 4.4a1.5 1.5 0 0 0-2.6 0Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.sessionId;
  const duration = location.state?.duration;

  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      navigate("/upload", { replace: true });
      return;
    }
    let cancelled = false;
    setLoading(true);
    getResults(sessionId)
      .then((data) => {
        if (!cancelled) setResults(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load results.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  const handleShare = async () => {
    if (!results) return;
    const summary = `I scored ${results.overall_score}% (${results.overall_label}) on a mock interview with AI Interview Coach.`;
    try {
      if (navigator.share) {
        await navigator.share({ text: summary });
      } else {
        await navigator.clipboard.writeText(summary);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 1800);
      }
    } catch {
      // user cancelled share sheet -- ignore
    }
  };

  const todayLabel = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className="min-h-dvh bg-gradient-to-b from-surface via-white to-surface print:bg-white">
      <header className="border-b border-border/60 print:hidden">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-glow shrink-0">
                AI
              </div>
              <span className="font-semibold text-ink tracking-tight whitespace-nowrap hidden sm:inline">Interview Coach</span>
            </div>
            <Link to="/upload" className="text-xs text-muted hover:text-ink transition-colors flex items-center gap-1 ml-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New Interview
            </Link>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-medium rounded-full border border-border px-3 py-1.5 text-ink hover:bg-black/[0.02] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M12 15V4M12 4 8 8M12 4l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download Report
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs font-medium rounded-full bg-accent text-white px-3.5 py-1.5 hover:bg-accent-dark transition-colors relative"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <circle cx="18" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="6" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8.2 10.8 15.8 6.2M8.2 13.2l7.6 4.6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {shareCopied ? "Copied!" : "Share Result"}
            </button>
          </div>
        </div>
      </header>

      {loading && <div className="px-6 py-16 text-sm text-muted text-center">Loading your results…</div>}

      {error && !loading && (
        <div className="max-w-md mx-auto px-6 py-10">
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm px-4 py-3">{error}</div>
        </div>
      )}

      {results && !loading && (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* completion banner */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight flex items-center gap-2">
              Interview Completed! <span>🎉</span>
            </h1>
            <p className="text-sm text-muted mt-1">Great job! You've completed the interview.</p>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
                  <rect x="9" y="3.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="font-medium text-ink">Mock Interview</span>
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
                  <rect x="3.5" y="4.5" width="17" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M3.5 9h17M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {todayLabel}
              </span>
              {typeof duration === "number" && (
                <span className="flex items-center gap-1.5 text-xs text-muted">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {formatDuration(duration)} duration
                </span>
              )}
            </div>
          </motion.div>

          {/* score section */}
          <div className="grid lg:grid-cols-12 gap-5 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="lg:col-span-4 bg-white rounded-2xl border border-border p-6 flex flex-col items-center text-center"
            >
              <p className="text-sm font-medium text-ink self-start mb-2">Overall Score</p>
              <ScoreGauge value={results.overall_score} label={results.overall_label} />
              <p className="text-xs text-muted mt-3">{SCORE_NOTE[results.overall_label] || SCORE_NOTE.Good}</p>
            </motion.div>

            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {results.metrics.map((m, i) => (
                <MetricCard key={m.label} label={m.label} score={m.score} index={i} />
              ))}
            </div>
          </div>

          {/* overall takeaways */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-4 mt-5"
          >
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-emerald-600 mb-2">What stood out across the interview</p>
              <ul className="space-y-1.5">
                {results.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5">
                      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-border p-5">
              <p className="text-xs font-semibold text-amber-600 mb-2">Focus on next time</p>
              <ul className="space-y-1.5">
                {results.improvements.map((s, i) => (
                  <li key={i} className="text-xs text-muted flex items-start gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5">
                      <path d="M12 9v4M12 16.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* question-wise performance */}
          <div className="grid lg:grid-cols-12 gap-5 mt-5">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="lg:col-span-5 bg-white rounded-2xl border border-border p-3"
            >
              <p className="text-xs font-semibold text-ink px-2 py-2">Question-wise performance</p>
              <div className="flex flex-col gap-1">
                {results.questions.map((q, i) => (
                  <QuestionRow key={q.n} q={q} active={i === selected} onClick={() => setSelected(i)} />
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-7"
            >
              {results.questions[selected] && <FeedbackPanel question={results.questions[selected]} />}
            </motion.div>
          </div>

          {/* CTA */}
          <div className="flex justify-center mt-8 pb-4 print:hidden">
            <Link to="/upload">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 text-sm font-semibold rounded-full bg-accent text-white px-7 py-3 shadow-glow hover:bg-accent-dark transition-colors"
              >
                Start New Interview
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </main>
      )}
    </div>
  );
}
