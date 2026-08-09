const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function handle(res) {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function startSession(resumeFile, { jobDescription, jdFile } = {}) {
  const form = new FormData();
  form.append("resume", resumeFile);
  if (jdFile) {
    form.append("jd_file", jdFile);
  } else {
    form.append("job_description", jobDescription || "");
  }
  const res = await fetch(`${API_BASE}/api/session/start`, {
    method: "POST",
    body: form,
  });
  return handle(res);
}

export async function submitAnswer(sessionId, answer) {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ answer }),
  });
  return handle(res);
}

export async function getResults(sessionId) {
  const res = await fetch(`${API_BASE}/api/session/${sessionId}/results`);
  return handle(res);
}
