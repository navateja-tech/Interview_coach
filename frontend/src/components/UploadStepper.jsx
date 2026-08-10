const STEPS = ["Resume", "Job Description", "Start Interview"];

function StepNode({ index, label, status }) {
  // status: "done" | "active" | "upcoming"
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
          status === "done"
            ? "bg-accent text-white"
            : status === "active"
            ? "bg-accent text-white shadow-glow"
            : "bg-white border border-border text-muted"
        }`}
      >
        {status === "done" ? (
          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          index + 1
        )}
      </div>
      <span className={`text-[11px] whitespace-nowrap ${status === "upcoming" ? "text-muted" : "text-ink font-medium"}`}>
        {label}
      </span>
    </div>
  );
}

export default function UploadStepper({ resumeDone, jdDone }) {
  const statuses = [
    resumeDone ? "done" : "active",
    resumeDone ? (jdDone ? "done" : "active") : "upcoming",
    resumeDone && jdDone ? "active" : "upcoming",
  ];

  return (
    <div className="hidden sm:flex items-center">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <StepNode index={i} label={label} status={statuses[i]} />
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-10 md:w-16 mx-2 mb-4 transition-colors ${
                statuses[i] === "done" ? "bg-accent" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
