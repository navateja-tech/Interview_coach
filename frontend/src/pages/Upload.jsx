import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { startSession } from "../api/client";
import AppHeader from "../components/AppHeader";

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

function Panel({ title, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl border border-border shadow-card flex flex-col overflow-hidden min-h-[360px] sm:min-h-[400px] lg:min-h-[440px]"
    >
      <div className="px-5 sm:px-6 py-4 border-b border-border bg-surface/60 shrink-0">
        <p className="text-sm font-semibold text-ink">{title}</p>
      </div>
      <div className="flex-1 p-5 sm:p-6 flex flex-col min-h-0">{children}</div>
    </motion.div>
  );
}

function PanelFooter({ onSave, onReupload, saved, canSave }) {
  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
      <motion.button
        whileHover={canSave ? { scale: 1.04 } : {}}
        whileTap={canSave ? { scale: 0.96 } : {}}
        onClick={onSave}
        disabled={!canSave}
        className="text-sm font-medium rounded-full bg-accent text-white px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-accent-dark transition-colors flex items-center gap-1.5"
      >
        <AnimatePresence mode="wait">
          {saved ? (
            <motion.span key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5">
              <CheckIcon /> Saved
            </motion.span>
          ) : (
            <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              Save
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <button onClick={onReupload} className="text-sm text-muted hover:text-ink transition-colors">
        Re-upload
      </button>
    </div>
  );
}

export default function Upload() {
  const navigate = useNavigate();
  const resumeInputRef = useRef(null);
  const jdFileInputRef = useRef(null);

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeDragOver, setResumeDragOver] = useState(false);
  const [resumeSaved, setResumeSaved] = useState(false);

  const [jdMode, setJdMode] = useState("text"); // "text" | "file"
  const [jdText, setJdText] = useState("");
  const [jdFile, setJdFile] = useState(null);
  const [jdSaved, setJdSaved] = useState(false);

  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");

  const jdProvided = jdMode === "file" ? Boolean(jdFile) : jdText.trim().length > 0;
  const canStart = Boolean(resumeFile) && jdProvided && !isStarting;

  const flashSaved = (setter) => {
    setter(true);
    setTimeout(() => setter(false), 1500);
  };

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
      <AppHeader maxWidth="max-w-5xl" />

      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 md:px-10 py-6 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* resume panel */}
            <Panel title="Upload your resume">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setResumeDragOver(true);
                }}
                onDragLeave={() => setResumeDragOver(false)}
                onDrop={handleResumeDrop}
                className="flex-1 min-h-0 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-colors"
                style={{ borderColor: resumeDragOver ? "#2F6FEF" : "#E4ECFB" }}
              >
              <AnimatePresence mode="wait">
                {resumeFile ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center px-6"
                  >
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-accent mx-auto mb-3">
                      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <p className="text-sm font-medium text-ink truncate max-w-xs">{resumeFile.name}</p>
                    <p className="text-xs text-muted mt-1">{(resumeFile.size / 1024).toFixed(0)} KB · resume should be displayed here</p>
                  </motion.div>
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center px-6">
                    <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-accent/60 mx-auto mb-3">
                      <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                    <p className="text-sm text-muted mb-4">A preview should be here</p>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => resumeInputRef.current?.click()}
                      className="text-sm font-medium bg-accent text-white rounded-full px-5 py-2.5 hover:bg-accent-dark transition-colors"
                    >
                      Choose PDF
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <PanelFooter
              onSave={() => flashSaved(setResumeSaved)}
              onReupload={() => {
                setResumeFile(null);
                resumeInputRef.current?.click();
              }}
              saved={resumeSaved}
              canSave={Boolean(resumeFile)}
            />
          </Panel>

          {/* JD panel */}
          <Panel title="Paste the JD or upload the JD PDF">
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setJdMode("text")}
                className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                  jdMode === "text" ? "bg-accent text-white" : "bg-surface text-muted"
                }`}
              >
                Paste text
              </button>
              <button
                onClick={() => setJdMode("file")}
                className={`text-xs font-medium rounded-full px-3 py-1.5 transition-colors ${
                  jdMode === "file" ? "bg-accent text-white" : "bg-surface text-muted"
                }`}
              >
                Upload PDF
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {jdMode === "text" ? (
                  <motion.textarea
                    key="jd-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                    placeholder="JD should be displayed here"
                    className="flex-1 w-full resize-none rounded-2xl border-2 border-dashed border-border bg-surface/40 p-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
                  />
                ) : (
                  <motion.div
                    key="jd-file"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border"
                  >
                    {jdFile ? (
                      <div className="text-center px-6">
                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-accent mx-auto mb-3">
                          <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                        <p className="text-sm font-medium text-ink truncate max-w-xs">{jdFile.name}</p>
                      </div>
                    ) : (
                      <div className="text-center px-6">
                        <p className="text-sm text-muted mb-4">JD should be displayed here</p>
                        <motion.button
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => jdFileInputRef.current?.click()}
                          className="text-sm font-medium bg-accent text-white rounded-full px-5 py-2.5 hover:bg-accent-dark transition-colors"
                        >
                          Choose PDF
                        </motion.button>
                      </div>
                    )}
                    <input
                      ref={jdFileInputRef}
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => setJdFile(e.target.files?.[0] ?? null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <PanelFooter
              onSave={() => flashSaved(setJdSaved)}
              onReupload={() => {
                setJdText("");
                setJdFile(null);
                if (jdMode === "file") jdFileInputRef.current?.click();
              }}
              saved={jdSaved}
              canSave={jdProvided}
            />
          </Panel>
        </div>

        <AnimatePresence>
          {startError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm px-4 py-3 overflow-hidden"
            >
              {startError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between mt-8">
          <Link to="/" className="text-sm text-muted hover:text-ink transition-colors flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
              <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to landing page
          </Link>

          <motion.button
            whileHover={canStart ? { scale: 1.04 } : {}}
            whileTap={canStart ? { scale: 0.96 } : {}}
            onClick={handleStart}
            disabled={!canStart}
            className="rounded-full bg-accent text-white font-semibold px-8 py-3 shadow-glow hover:bg-accent-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2"
          >
            {isStarting && (
              <motion.span
                className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              />
            )}
            {isStarting ? "Starting…" : "Start interview"}
          </motion.button>
        </div>
        </div>
      </main>
    </div>
  );
}
