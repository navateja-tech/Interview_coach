import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { submitAnswer } from "../api/client";
import useCountUp from "../hooks/useCountUp";
import AppHeader from "../components/AppHeader";

const SpeechRecognitionCtor =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

function VocalWaveform({ active }) {
  const bars = Array.from({ length: 32 }).map((_, i) => 0.25 + Math.abs(Math.sin(i * 0.7)) * 0.75);
  return (
    <div className="flex items-center justify-between w-full h-14 sm:h-16 px-6 sm:px-10">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="flex-1 max-w-[4px] mx-[1.5px] rounded-full bg-accent"
          animate={active ? { scaleY: [0.25, h, 0.3, h * 0.8, 0.25] } : { scaleY: 0.15 }}
          transition={{ duration: 1.4, repeat: active ? Infinity : 0, delay: i * 0.03, ease: "easeInOut" }}
          style={{ height: "100%", transformOrigin: "center" }}
        />
      ))}
    </div>
  );
}

function InlineCountUp({ value }) {
  const animated = useCountUp(value, { duration: 700 });
  return <>{animated}</>;
}

function HistoryList({ history, question, questionNumber }) {
  return (
    <div className="flex flex-col gap-2">
      {history.map((h, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xs text-muted bg-surface/60 rounded-lg px-3 py-2"
        >
          <span className="text-ink font-medium">Q{i + 1}.</span> {h.question.text}
        </motion.div>
      ))}
      {question && (
        <div className="text-xs text-accent-dark bg-accent/10 rounded-lg px-3 py-2 font-medium">
          Q{questionNumber} (current)
        </div>
      )}
      {history.length === 0 && (
        <p className="text-xs text-muted/70">Nothing yet — your first question is on the right.</p>
      )}
    </div>
  );
}

export default function LiveInterview() {
  const location = useLocation();
  const navigate = useNavigate();
  const initial = location.state;

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
  const [historyOpen, setHistoryOpen] = useState(false);

  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!initial?.sessionId) {
      navigate("/upload", { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setAnswerText((prev) => (prev ? `${prev} ${text}` : text));
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

  return (
    <div className="h-dvh bg-gradient-to-b from-surface via-white to-surface flex flex-col overflow-hidden">
      <AppHeader
        maxWidth="max-w-6xl"
        right={
          <div className="flex items-center gap-3">
            <p className="text-xs text-muted hidden sm:block">Question {questionNumber} of {totalQuestions}</p>
            <button
              onClick={() => setHistoryOpen(true)}
              className="md:hidden flex items-center gap-1.5 text-xs font-medium text-muted border border-border rounded-full px-3 py-1.5"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              History
            </button>
          </div>
        }
      />

      <div className="flex-1 min-h-0 flex max-w-6xl mx-auto w-full">
        {/* history sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border/60 px-4 py-6 overflow-y-auto">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-4">History of questions discussed</p>
          <HistoryList history={history} question={question} questionNumber={questionNumber} />
        </aside>

        {/* history drawer (mobile) */}
        <AnimatePresence>
          {historyOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setHistoryOpen(false)}
                className="fixed inset-0 bg-ink/30 z-40 md:hidden"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 32 }}
                className="fixed inset-y-0 left-0 w-72 max-w-[80vw] bg-white z-50 px-4 py-6 overflow-y-auto md:hidden shadow-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-muted uppercase tracking-wide">History</p>
                  <button onClick={() => setHistoryOpen(false)} className="text-muted">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <HistoryList history={history} question={question} questionNumber={questionNumber} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* main scroll area */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col">
            <p className="text-xs text-muted mb-3 sm:hidden">Question {questionNumber} of {totalQuestions}</p>

            {/* moving vocals animation */}
            <div className="rounded-3xl border border-border bg-white shadow-card flex items-center justify-center py-5 sm:py-6 mb-5">
              <VocalWaveform active={speaking || listening} />
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
                onChange={(e) => setAnswerText(e.target.value)}
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
                    <span>{listening ? "Listening…" : "Speech"}</span>
                  </motion.button>
                  <button onClick={clearResponse} className="text-xs text-muted hover:text-ink transition-colors">
                    Clear
                  </button>
                </div>
                <button onClick={focusTextInput} className="text-xs font-medium text-accent hover:text-accent-dark transition-colors">
                  Type
                </button>
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
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/")}
                className="text-sm font-medium rounded-full px-4 sm:px-5 py-2.5 border border-border text-red-500 hover:bg-red-50 transition-colors shrink-0"
              >
                End interview
              </motion.button>

              <motion.button
                whileHover={answerText.trim() && !isSubmitting ? { scale: 1.04 } : {}}
                whileTap={answerText.trim() && !isSubmitting ? { scale: 0.96 } : {}}
                onClick={() => submit()}
                disabled={!answerText.trim() || isSubmitting}
                className="flex items-center gap-2 text-sm font-semibold rounded-full px-5 sm:px-7 py-3 bg-accent text-white shadow-glow hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-0"
              >
                {isSubmitting && (
                  <motion.span
                    className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white shrink-0"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <span className="truncate">{isSubmitting ? "Scoring…" : "Score and improve the response"}</span>
              </motion.button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
