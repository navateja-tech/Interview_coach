import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-surface via-white to-surface flex flex-col">
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex items-center px-6 md:px-10 py-5"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-glow">
            AI
          </div>
          <span className="font-semibold text-ink tracking-tight">Interview Coach</span>
        </div>
      </motion.header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-16 max-w-3xl mx-auto text-center w-full">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-[3rem] border border-border bg-white/70 backdrop-blur-sm shadow-card px-10 py-16 flex flex-col items-center"
        >
          <motion.div
            className="relative w-28 h-28 rounded-full mb-8"
            style={{
              background: "radial-gradient(circle at 32% 28%, #BFDBFF 0%, #5B8DF7 35%, #2F6FEF 62%, #123B99 100%)",
              boxShadow: "0 30px 70px -18px rgba(47,111,239,0.5)",
            }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-ink leading-tight">
            Ace every interview with AI
          </h1>
          <p className="mt-4 text-sm md:text-base text-muted max-w-md">
            Upload your resume and a job description, and practice a live, adaptive
            mock interview — one question at a time.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <Link to="/upload">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 25px 70px -12px rgba(47,111,239,0.55)" }}
              whileTap={{ scale: 0.96 }}
              className="mt-10 rounded-full bg-accent text-white font-semibold px-10 py-4 shadow-glow hover:bg-accent-dark transition-colors"
            >
              Start interview
            </motion.button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
