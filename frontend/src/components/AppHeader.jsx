export default function AppHeader({ maxWidth = "max-w-2xl", right }) {
  return (
    <header className="shrink-0 border-b border-border/60">
      <div className={`${maxWidth} mx-auto w-full flex items-center justify-between px-4 sm:px-6 py-4`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center text-white font-bold text-sm shadow-glow shrink-0">
            AI
          </div>
          <span className="font-semibold text-ink tracking-tight whitespace-nowrap">Interview Coach</span>
        </div>
        {right}
      </div>
    </header>
  );
}
