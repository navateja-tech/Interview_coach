import { Suspense, lazy, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { startSession } from "../api/client";
import UploadStepper from "../components/UploadStepper";

const PdfPreview = lazy(() => import("../components/PdfPreview"));

const JD_MAX_CHARS = 5000;

function CheckIcon() {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      className="w-4 h-4"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

function ResumeFileCard({ file, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3"
    >
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-red-500">
          <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-ink truncate">{file.name}</p>
        <p className="text-[11px] text-muted">{(file.size / 1024).toFixed(0)} KB</p>
      </div>
      <CheckIcon />
      <button onClick={onRemove} className="text-muted hover:text-red-500 transition-colors shrink-0">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
          <path d="M6 7h12M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m2 0-.7 12.1a1.5 1.5 0 0 1-1.5 1.4H9.2a1.5 1.5 0 0 1-1.5-1.4L7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </motion.div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);
  const jdFileInputRef = useRef(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDragOver, setResumeDragOver] = useState(false);

  const [jdMode, setJdMode] = useState("text"); // "text" | "file"
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState(null);

  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const jdProvided = jdMode === "file" ? Boolean(jdFile) : jdText.trim().length > 0;
  const canStart = Boolean(resumeFile) && jdProvided && !isStarting;

  const handleResumeDrop = (e) => {
    e.preventDefault();
    setResumeDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setResumeFile(file);
  };

  const handleStart = async () => {
    if (!canStart) return;
    setIsStarting(true);
    setStartError("");
    try {
      const data = await startSession(resumeFile, {
        jobDescription: jdMode === "text" ? jdText : undefined,
        jdFile: jdMode === "file" ? jdFile : undefined,
      });
      navigate("/interview", {
        state: {
          sessionId: data.session_id,
          question: data.question,
          questionNumber: data.question_number,
          totalQuestions: data.total_questions,
        },
      });
    } catch (err) {
      setStartError(err.message || "Something went wrong starting the interview.");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="h-dvh bg-gradient-to-b from-surface via-white to-surface flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-border/60">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-glow">
              AI
            </div>
            <span className="font-semibold text-ink tracking-tight whitespace-nowrap hidden md:inline">Interview Coach</span>
          </div>
          <UploadStepper resumeDone={Boolean(resumeFile)} jdDone={jdProvided} />
          <button
            type="button"
            title="Need help?"
            className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent/40 transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.4v.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M12 17v.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 md:px-10 py-6 flex flex-col">
          {/* intro */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 mb-6"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
                <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 12.5h4M9 15.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">Let's get you interview-ready</h1>
              <p className="text-xs sm:text-sm text-muted mt-0.5">
                Upload your resume and add the job description to personalize your interview experience.
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* resume panel */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-3xl border border-border shadow-card p-5 sm:p-6 flex flex-col min-h-[420px]"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-semibold text-ink">Upload your resume</p>
                  <p className="text-xs text-muted mt-0.5">We'll analyze your experience and skills to generate relevant questions.</p>
                </div>
                <span className="text-[11px] text-muted whitespace-nowrap hidden sm:block">Supported: PDF (max 5MB)</span>
              </div>

              <div className={`flex-1 min-h-0 grid ${resumeFile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-4`}>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setResumeDragOver(true);
                  }}
                  onDragLeave={() => setResumeDragOver(false)}
                  onDrop={handleResumeDrop}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors py-8 px-4 text-center"
                  style={{ borderColor: resumeDragOver ? "#2F6FEF" : "#E4ECFB" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-accent/70 mb-3">
                    <path d="M12 15V4M12 4 8 8M12 4l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm font-medium text-ink">Drag & drop your resume here</p>
                  <p className="text-xs text-muted my-2">or</p>
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => resumeInputRef.current?.click()}
                    className="flex items-center gap-1.5 text-sm font-medium bg-accent text-white rounded-full px-5 py-2.5 hover:bg-accent-dark transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                      <path d="M12 15V4M12 4 8 8M12 4l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Choose file
                  </motion.button>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
                  />
                </div>

                <AnimatePresence>
                  {resumeFile && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="min-h-[220px] sm:min-h-0"
                    >
                      <Suspense fallback={<div className="h-full rounded-2xl border border-border bg-surface/30 flex items-center justify-center text-xs text-muted">Loading preview…</div>}>
                        <PdfPreview file={resumeFile} />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 space-y-3">
                <AnimatePresence>
                  {resumeFile && <ResumeFileCard file={resumeFile} onRemove={() => setResumeFile(null)} />}
                </AnimatePresence>
                <div className="flex items-start gap-2 rounded-xl bg-accent/5 px-3.5 py-2.5">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M12 11v5M12 8v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <p className="text-[11px] text-muted leading-relaxed">
                    We only use your resume to generate relevant interview questions.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* JD panel */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="bg-white rounded-3xl border border-border shadow-card p-5 sm:p-6 flex flex-col min-h-[420px]"
            >
              <p className="text-sm font-semibold text-ink">Paste the JD or upload the JD PDF</p>
              <p className="text-xs text-muted mt-0.5 mb-4">We'll tailor questions to this role.</p>

              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setJdMode("text")}
                  className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-1.5 transition-colors ${
                    jdMode === "text" ? "bg-accent text-white" : "bg-surface text-muted"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                    <path d="M4 17.5V20h2.5L18 8.5l-2.5-2.5L4 17.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                  Paste text
                </button>
                <button
                  onClick={() => setJdMode("file")}
                  className={`flex items-center gap-1.5 text-xs font-medium rounded-full px-3.5 py-1.5 transition-colors ${
                    jdMode === "file" ? "bg-accent text-white" : "bg-surface text-muted"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                    <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  Upload PDF
                </button>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <AnimatePresence mode="wait">
                  {jdMode === "text" ? (
                    <motion.div key="jd-text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-0 flex flex-col">
                      <textarea
                        value={jdText}
                        onChange={(e) => setJdText(e.target.value.slice(0, JD_MAX_CHARS))}
                        placeholder="We are looking for a ... to join our team.

Responsibilities:
- ...

Requirements:
- ..."
                        className="flex-1 w-full resize-none rounded-2xl border border-border bg-surface/40 p-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                      />
                      <p className="text-[11px] text-muted text-right mt-1.5">{jdText.length} / {JD_MAX_CHARS} characters</p>
                    </motion.div>
                  ) : (
                    <motion.div key="jd-file" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-h-0 flex flex-col gap-3">
                      <div className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border text-center px-4 py-6">
                        {jdFile ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" className="w-9 h-9 text-accent mb-3">
                              <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <p className="text-sm font-medium text-ink truncate max-w-full">{jdFile.name}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-muted mb-4">JD should be displayed here</p>
                            <motion.button
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => jdFileInputRef.current?.click()}
                              className="text-sm font-medium bg-accent text-white rounded-full px-5 py-2.5 hover:bg-accent-dark transition-colors"
                            >
                              Choose PDF
                            </motion.button>
                          </>
                        )}
                        <input
                          ref={jdFileInputRef}
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-accent/5 px-3.5 py-2.5 mt-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent shrink-0 mt-0.5">
                  <path d="M12 3.5a5 5 0 0 1 3 9c-.6.5-1 1-1 2h-4c0-1-.4-1.5-1-2a5 5 0 0 1 3-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 18.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <p className="text-[11px] text-muted leading-relaxed">
                  <span className="font-medium text-ink">Tip:</span> Include role responsibilities, required skills, and qualifications.
                  This helps AI generate highly relevant and personalized questions.
                </p>
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {startError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm px-4 py-3 overflow-hidden"
              >
                {startError}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pb-6">
            <Link to="/" className="text-sm text-muted hover:text-ink transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to landing page
            </Link>

            <div className="text-right">
              <motion.button
                whileHover={canStart ? { scale: 1.04 } : {}}
                whileTap={canStart ? { scale: 0.96 } : {}}
                onClick={handleStart}
                disabled={!canStart}
                className="flex items-center gap-2 rounded-full bg-accent text-white font-semibold px-7 py-3 shadow-glow hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isStarting && (
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                  />
                )}
                {isStarting ? "Starting…" : "Start Interview"}
                {!isStarting && (
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </motion.button>
              <p className="text-[11px] text-muted mt-2">Your interview begins right after this.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
