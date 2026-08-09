import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CHECKLIST = ["Resume-based questions", "Adaptive AI interviewer", "Instant feedback"];

const STATS = [
  {
    key: "questions",
    value: "6",
    label: "Questions per session",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <path d="M12 17.5v-.6c0-1 .6-1.6 1.4-2.1.9-.6 1.6-1.4 1.6-2.5A3 3 0 0 0 12 9.3a3 3 0 0 0-3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="20.2" r="0.9" fill="currentColor" />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    key: "adaptive",
    value: "AI",
    label: "Adaptive follow-ups",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <path d="M9 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3M15 4.5a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3M9 4.5a3 3 0 0 1 3-1.5 3 3 0 0 1 3 1.5M9 19.5a3 3 0 0 0 3 1.5 3 3 0 0 0 3-1.5M6 9h3M6 15h3M15 9h3M15 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    key: "anytime",
    value: "24/7",
    label: "Practice anytime",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Upload resume",
    desc: "Upload your resume and let the AI understand your experience.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <path d="M12 15V4M12 4 8 8M12 4l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    n: "02",
    title: "Add job description",
    desc: "Paste the job description for the role you're targeting.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5A1.5 1.5 0 0 1 7 3.5Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M9 12.5h6M9 15.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "03",
    title: "Practice interview",
    desc: "Answer realistic questions generated specifically for you.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <rect x="9" y="3.5" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9 20.5h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    n: "04",
    title: "Get feedback",
    desc: "Receive detailed feedback on your answers and performance.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-accent">
        <path d="M4 17 L8.5 10.5 L12 13.5 L20 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 5h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

function FloatingBadge({ className, delay, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: [0, -6, 0], scale: 1 }}
      transition={{
        opacity: { delay, duration: 0.4 },
        scale: { delay, duration: 0.4 },
        y: { delay: delay + 0.4, duration: 4, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`absolute bg-white rounded-xl shadow-card border border-border px-3.5 py-2.5 flex items-center gap-2.5 ${className}`}
    >
      {children}
    </motion.div>
  );
}

function VoiceOrb() {
  const bars = [0.4, 0.7, 1, 0.55, 0.8, 0.45, 0.65];
  return (
    <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto">
      {/* orbit ring */}
      <motion.div
        className="absolute inset-[-14px] rounded-full border border-accent/25"
        style={{ borderTopColor: "transparent", borderLeftColor: "transparent" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
      />
      {/* small orbiting dots */}
      {[0, 1].map((i) => (
        <motion.div
          key={i}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 10 + i * 4, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="absolute w-2.5 h-2.5 rounded-full bg-accent/50"
            style={{ top: i === 0 ? "-4px" : "auto", bottom: i === 1 ? "10%" : "auto", left: i === 1 ? "-6px" : "50%" }}
          />
        </motion.div>
      ))}

      <motion.div
        className="absolute inset-4 rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle at 32% 28%, #7FB1FF 0%, #4E86F5 40%, #2F6FEF 68%, #123B99 100%)",
          boxShadow: "0 40px 90px -20px rgba(47,111,239,0.55)",
        }}
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-[3px] h-10">
          {bars.map((h, i) => (
            <motion.span
              key={i}
              className="w-[3px] rounded-full bg-white"
              animate={{ scaleY: [0.3, h, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.08, ease: "easeInOut" }}
              style={{ height: "100%", transformOrigin: "center" }}
            />
          ))}
        </div>
      </motion.div>

      <FloatingBadge className="-top-2 -left-6 sm:-left-10" delay={0.5}>
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
            <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 20c1.2-3.5 4-5 7-5s5.8 1.5 7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-ink leading-tight">AI Interviewer</p>
          <p className="text-[10px] text-muted leading-tight">Analyzing response…</p>
        </div>
      </FloatingBadge>

      <FloatingBadge className="top-8 -right-4 sm:-right-10" delay={0.65}>
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent shrink-0">
          <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] font-medium text-ink whitespace-nowrap">Question 04 / 06</p>
      </FloatingBadge>

      <FloatingBadge className="-bottom-4 -right-2 sm:-right-8" delay={0.8}>
        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-left">
          <p className="text-xs font-semibold text-ink leading-tight">Adaptive Questions</p>
          <p className="text-[10px] text-muted leading-tight">Tailored to your profile</p>
        </div>
      </FloatingBadge>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="h-dvh overflow-y-auto bg-gradient-to-b from-surface via-white to-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between bg-white/80 backdrop-blur-sm border border-border rounded-2xl shadow-card px-4 sm:px-6 py-3"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-glow shrink-0">
              AI
            </div>
            <span className="font-semibold text-ink tracking-tight whitespace-nowrap">Interview Coach</span>
          </div>
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-1.5 text-sm font-semibold rounded-full bg-accent text-white px-4 sm:px-5 py-2 shadow-glow hover:bg-accent-dark transition-colors"
            >
              Get Started
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          </Link>
        </motion.header>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* hero */}
        <div className="grid md:grid-cols-2 gap-10 md:gap-6 items-center py-12 sm:py-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-accent bg-accent/10 rounded-full px-3 py-1.5 mb-5"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" />
              </svg>
              AI-POWERED INTERVIEW PRACTICE
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5 }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight text-ink leading-[1.1]"
            >
              Prepare smarter.
              <br />
              Interview with{" "}
              <span className="text-accent underline decoration-accent/30 decoration-4 underline-offset-4">
                confidence.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.5 }}
              className="mt-5 text-sm sm:text-base text-muted max-w-md"
            >
              Practice realistic interviews tailored to your resume and target job
              description. Get adaptive questions and actionable feedback powered by AI.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.5 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              <Link to="/upload">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 25px 70px -12px rgba(47,111,239,0.55)" }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 text-sm font-semibold rounded-full bg-accent text-white px-6 py-3 shadow-glow hover:bg-accent-dark transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" fill="currentColor" />
                  </svg>
                  Start Free Interview
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              </Link>
              <a href="#how-it-works">
                <motion.button
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 text-sm font-semibold rounded-full bg-white border border-border text-ink px-6 py-3 hover:bg-black/[0.02] transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 9.5v5l4.5-2.5-4.5-2.5Z" fill="currentColor" />
                  </svg>
                  See How It Works
                </motion.button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
            >
              {CHECKLIST.map((item) => (
                <span key={item} className="flex items-center gap-1.5 text-xs text-muted">
                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-accent shrink-0">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <VoiceOrb />
          </motion.div>
        </div>

        {/* stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="text-center pb-12"
        >
          <p className="text-sm text-muted mb-5">
            Built for students and early-career developers preparing for technical interviews.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {STATS.map((s) => (
              <div key={s.key} className="flex items-center gap-3 bg-white rounded-2xl border border-border shadow-card px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">{s.icon}</div>
                <div className="text-left">
                  <p className="text-lg font-bold text-ink leading-tight">{s.value}</p>
                  <p className="text-xs text-muted leading-tight">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* steps */}
        <div id="how-it-works" className="pb-16 scroll-mt-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">From resume to interview-ready</h2>
            <p className="text-sm text-muted mt-2">Everything you need to practice smarter.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-3 items-stretch">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative flex items-center">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: i * 0.1, duration: 0.45 }}
                  whileHover={{ y: -3, boxShadow: "0 16px 40px -16px rgba(15,27,45,0.18)" }}
                  className="relative w-full bg-white rounded-2xl border border-border shadow-card p-5 pt-7"
                >
                  <div className="absolute -top-3.5 left-5 w-7 h-7 rounded-full bg-accent text-white text-[11px] font-bold flex items-center justify-center shadow-glow">
                    {step.n}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mb-3">{step.icon}</div>
                  <p className="text-sm font-semibold text-ink mb-1">{step.title}</p>
                  <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                </motion.div>
                {i < STEPS.length - 1 && (
                  <svg viewBox="0 0 24 24" fill="none" className="hidden lg:block w-5 h-5 text-accent/40 shrink-0 mx-1">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
