import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { submitAnswer } from "../api/client";
import useCountUp from "../hooks/useCountUp";

const SpeechRecognitionCtor =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
const ANSWER_MAX_CHARS = 5000;

function formatDuration(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function InlineCountUp({ value }) {
  const animated = useCountUp(value, { duration: 700 });
  return <>{animated}</>;
}

function ProgressRing({ value, total, size = 34 }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? (value - 1) / total : 0;
  const offset = c - pct * c;
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
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-ink">
        {value}/{total}
      </span>
    </div>
  );
}

function SpeakingWaveform({ active }) {
  const bars = Array.from({ length: 64 }).map((_, i) => 0.15 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.35)) * 0.85);
  return (
    <div className="flex items-center gap-[2px] w-full h-8">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 max-w-[3px] rounded-full bg-accent"
          animate={active ? { scaleY: [0.15, h, 0.2, h * 0.7, 0.15] } : { scaleY: 0.15 }}
          transition={{ duration: 1.1, repeat: active ? Infinity : 0, delay: i * 0.015, ease: "easeInOut" }}
          style={{ height: "100%", transformOrigin: "center" }}
        />
      ))}
    </div>
  );
}

function ProgressSidebarContent({ history, questionNumber, totalQuestions }) {
  const answered = history.length;
  const pct = totalQuestions > 0 ? (answered / totalQuestions) * 100 : 0;

  const items = Array.from({ length: totalQuestions }).map((_, i) => {
    const n = i + 1;
    if (n <= answered) return { n, status: "done" };
    if (n === questionNumber) return { n, status: "current" };
    return { n, status: "upcoming" };
  });

  return (
    <>
      <div className="rounded-2xl border border-border bg-white p-4 mb-5">
        <p className="text-xs font-semibold text-ink mb-3">Interview Progress</p>
        <p className="text-2xl font-bold text-ink leading-none">
          {answered} <span className="text-muted text-base font-medium">/ {totalQuestions}</span>
        </p>
        <p className="text-[11px] text-muted mt-1 mb-3">Questions Completed</p>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-3">History of questions</p>
      <div className="relative flex flex-col gap-2 mb-5">
        {items.map((item, i) => (
          <div key={item.n} className="relative flex items-start gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  item.status === "done"
                    ? "bg-accent text-white"
                    : item.status === "current"
                    ? "bg-accent text-white shadow-glow"
                    : "bg-white border border-border text-muted"
                }`}
              >
                {item.status === "done" ? (
                  <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  item.n
                )}
              </div>
              {i < items.length - 1 && <div className="w-px flex-1 min-h-[18px] bg-border" />}
            </div>
            <div className={`flex-1 rounded-lg px-2.5 py-1.5 -mt-0.5 ${item.status === "current" ? "bg-accent/10" : ""}`}>
              <p className={`text-xs font-medium ${item.status === "upcoming" ? "text-muted" : "text-ink"}`}>
                Q{item.n} {item.status === "current" && "(current)"}
              </p>
              <p className="text-[10px] text-muted">
                {item.status === "done" ? "Completed" : item.status === "current" ? "In progress" : "Upcoming"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-accent/5 p-4">
        <p className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1.5">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
            <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          Tip
        </p>
        <p className="text-[11px] text-muted leading-relaxed">
          Be specific, give examples, and structure your answers clearly.
        </p>
      </div>
    </>
  );
}

export default function LiveInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state;

  const [elapsed, setElapsed] = useState(0);
  const [question, setQuestion] = useState(initial?.question ?? null);
  const [questionNumber, setQuestionNumber] = useState(initial?.questionNumber ?? 1);
  const [totalQuestions, setTotalQuestions] = useState(initial?.totalQuestions ?? 1);
  const [answerText, setAnswerText] = useState("");
  const [history, setHistory] = useState([]); // { question, answer, evaluation }
  const [lastFeedback, setLastFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!initial?.sessionId) {
      navigate("/upload", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // read the current question aloud, drive the waveform while it does
  useEffect(() => {
    if (!question || typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(question.text);
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return () => window.speechSynthesis.cancel();
  }, [question]);

  const toggleMic = () => {
    if (!SpeechRecognitionCtor) {
      setSubmitError("Voice input isn't supported in this browser -- try typing, or use Chrome.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const text = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setAnswerText((prev) => (prev ? `${prev} ${text}` : text).slice(0, ANSWER_MAX_CHARS));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const focusTextInput = () => textareaRef.current?.focus();
  const clearResponse = () => setAnswerText("");

  const submit = async (textOverride) => {
    const answer = (textOverride ?? answerText).trim();
    if (!answer || isSubmitting || !initial?.sessionId) return;
    setIsSubmitting(true);
    setSubmitError("");
    const askedQuestion = question;
    try {
      const data = await submitAnswer(initial.sessionId, answer);
      setHistory((h) => [...h, { question: askedQuestion, answer, evaluation: data.evaluation }]);
      setLastFeedback(data.evaluation);
      setAnswerText("");

      if (data.is_complete) {
        setTimeout(() => navigate("/"), 1400);
      } else {
        setQuestion(data.next_question);
        setQuestionNumber(data.question_number);
        setTotalQuestions(data.total_questions);
      }
    } catch (err) {
      setSubmitError(err.message || "Something went wrong submitting your answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDontKnow = () => submit("I don't know the answer, please provide an explanation.");

  if (!initial?.sessionId) return null;

  const EndInterviewButton = ({ className }) => (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/")}
      className={`flex items-center gap-1.5 text-sm font-medium rounded-full border border-red-200 text-red-500 hover:bg-red-50 transition-colors shrink-0 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
        <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      End Interview
    </motion.button>
  );

  return (
    <div className="h-dvh bg-gradient-to-b from-surface via-white to-surface flex flex-col overflow-hidden">
      {/* header */}
      <header className="shrink-0 border-b border-border/60">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-glow">
              AI
            </div>
            <span className="font-semibold text-ink tracking-tight whitespace-nowrap hidden lg:inline">Interview Coach</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-ink bg-surface border border-border rounded-full px-3 py-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-accent">
                <rect x="9" y="3.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {question?.category ? `${question.category} Interview` : "Mock Interview"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {formatDuration(elapsed)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 text-xs font-medium text-muted border border-border rounded-full px-3 py-1.5"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Progress
            </button>
            <EndInterviewButton className="hidden sm:flex px-3.5 py-1.5" />
            <span className="hidden md:block text-xs text-muted whitespace-nowrap">Question {questionNumber} of {totalQuestions}</span>
            <ProgressRing value={questionNumber} total={totalQuestions} />
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex max-w-6xl mx-auto w-full">
        {/* progress sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 border-r border-border/60 px-4 py-6 overflow-y-auto">
          <ProgressSidebarContent history={history} questionNumber={questionNumber} totalQuestions={totalQuestions} />
        </aside>

        {/* progress drawer (mobile/tablet) */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 bg-ink/30 z-40 lg:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white z-50 px-4 py-6 overflow-y-auto lg:hidden shadow-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">Progress</p>
                  <button onClick={() => setSidebarOpen(false)} className="text-muted">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <ProgressSidebarContent history={history} questionNumber={questionNumber} totalQuestions={totalQuestions} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* main scroll area */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col">
            <div className="flex items-center justify-between mb-3 md:hidden">
              <span className="text-xs text-muted">Question {questionNumber} of {totalQuestions}</span>
              <span className="text-xs text-muted flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {formatDuration(elapsed)}
              </span>
            </div>

            {/* AI interviewer speaking card */}
            <div className="rounded-2xl border border-border bg-white shadow-card p-4 sm:p-5 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
                    <rect x="5" y="8" width="14" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="9.5" cy="13" r="1" fill="currentColor" />
                    <circle cx="14.5" cy="13" r="1" fill="currentColor" />
                  </svg>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink leading-tight">AI Interviewer</p>
                  <p className="text-xs text-muted leading-tight">
                    {speaking ? "Speaking…" : listening ? "Listening…" : "Waiting for your response"}
                  </p>
                </div>
              </div>
              <SpeakingWaveform active={speaking || listening} />
            </div>

            {/* question text */}
            <AnimatePresence mode="wait">
              <motion.div
                key={questionNumber}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-border bg-white px-5 py-4 mb-3"
              >
                <p className="text-sm text-ink font-medium leading-relaxed">{question?.text}</p>
                {question?.category && (
                  <span className="inline-block mt-2 text-[11px] font-medium text-accent bg-accent/10 rounded-full px-2.5 py-0.5">
                    {question.category}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {/* response box */}
            <div className="rounded-2xl border border-border bg-white overflow-hidden">
              <textarea
                ref={textareaRef}
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value.slice(0, ANSWER_MAX_CHARS))}
                placeholder="Your response..."
                disabled={isSubmitting}
                className="w-full h-24 sm:h-28 resize-none p-4 text-sm text-ink placeholder:text-muted focus:outline-none"
              />
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-surface/40">
                <div className="flex items-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={toggleMic}
                    title={listening ? "Stop recording" : "Record answer"}
                    className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                      listening ? "bg-accent text-white" : "text-muted hover:text-ink"
                    }`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                      <rect x="9" y="3.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span>{listening ? "Listening…" : "Speech input"}</span>
                  </motion.button>
                  <button onClick={clearResponse} className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                      <path d="M6 7h12M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1a1.5 1.5 0 0 1-1.5 1.4H9.2a1.5 1.5 0 0 1-1.5-1.4L7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Clear
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-muted whitespace-nowrap">{answerText.length} / {ANSWER_MAX_CHARS}</span>
                  <button onClick={focusTextInput} className="text-xs font-medium text-accent hover:text-accent-dark transition-colors">
                    Type
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={handleDontKnow}
                disabled={isSubmitting}
                className="text-xs text-muted hover:text-accent transition-colors underline decoration-dotted underline-offset-2 disabled:opacity-40"
              >
                I don't know the answer — provide explanation
              </button>
            </div>

            <AnimatePresence>
              {submitError && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-xs text-red-500 overflow-hidden"
                >
                  {submitError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* feedback */}
            <AnimatePresence>
              {lastFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: 14, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22 }}
                  className="mt-4 rounded-2xl border border-border bg-white p-4"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-ink">Feedback</p>
                    <span className="text-[11px] font-semibold text-accent-dark">
                      Score <InlineCountUp value={lastFeedback.overall} />%
                    </span>
                  </div>
                  <p className="text-xs text-muted">{lastFeedback.feedback}</p>
                  {lastFeedback.model_answer && (
                    <div className="mt-3 pt-3 border-t border-border/70">
                      <p className="text-[11px] font-medium text-ink mb-1">Model answer</p>
                      <p className="text-[11px] text-muted leading-relaxed">{lastFeedback.model_answer}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* actions */}
            <div className="mt-6 flex items-center justify-between gap-3 pb-6">
              <EndInterviewButton className="px-4 sm:px-5 py-2.5" />

              <motion.button
                whileHover={answerText.trim() && !isSubmitting ? { scale: 1.04 } : {}}
                whileTap={answerText.trim() && !isSubmitting ? { scale: 0.96 } : {}}
                onClick={() => submit()}
                disabled={!answerText.trim() || isSubmitting}
                className="flex items-center gap-2 text-sm font-semibold rounded-full px-5 sm:px-7 py-3 bg-accent text-white shadow-glow hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-0"
              >
                {isSubmitting ? (
                  <motion.span
                    className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0">
                    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" />
                  </svg>
                )}
                <span className="truncate">{isSubmitting ? "Scoring…" : "Score and improve the response"}</span>
                {!isSubmitting && (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 shrink-0">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </motion.button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
