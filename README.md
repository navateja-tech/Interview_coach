# AI Interview Coach

An adaptive AI mock-interview platform. Upload a resume + paste a job
description, and it runs a live, one-on-one interview: one question at a
time, where the AI decides whether to follow up on your last answer or move
to a new topic, scores each answer against a STAR-based rubric, and ends
with a results dashboard.

## Project structure

```
backend/             FastAPI backend -- session state, LangChain + Groq chains
frontend/             React (Vite + Tailwind) frontend
legacy_streamlit/     Original v1 prototype (Streamlit, batch question generation) -- kept for reference, not used by the app anymore
```

## Running it locally

You need two terminals -- one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env and set GROQ_API_KEY (free key: https://console.groq.com/keys)

uvicorn app.main:app --reload --port 8000
```

The API is now at `http://localhost:8000`. Interactive docs at
`http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install

cp .env.example .env
# VITE_API_BASE_URL defaults to http://localhost:8000, only change if needed

npm run dev
```

Open `http://localhost:5173`.

Note: the Upload page renders an in-browser preview of your resume PDF
using `pdfjs-dist`. It's lazy-loaded (only downloaded once you actually
select a resume file), so it doesn't add to the initial page load.

## Testing the full flow with a real Groq key

Before clicking through the UI, you can verify the whole adaptive interview
loop (start -> 6 rounds of answer/next-question -> results) in one command:

```bash
cd backend
source venv/bin/activate
pip install -r requirements-dev.txt   # adds reportlab, used only to build a test PDF
python scripts/test_full_flow.py
```

This generates a synthetic resume PDF in-memory, posts it + a sample job
description to `/api/session/start`, answers every question with a canned
(but realistic) response, and prints each question, score breakdown, and
the final results payload -- so you can confirm your `GROQ_API_KEY` is
wired up correctly and the scores look sane before testing through the
actual browser UI.

## How the interview flow works

1. **Landing page** (`/`) — minimal intro, "Start interview" goes to Upload.
2. **Upload page** (`/upload`) — upload a resume PDF, and either paste a job
   description or upload a JD PDF. "Start interview" calls
   `POST /api/session/start`, which extracts text from both, generates an
   opening question with Groq, and returns a `session_id`.
3. **Live Interview page** (`/interview`) — shows the current question (read
   aloud via the browser's speech synthesis, with a live waveform), lets you
   answer by typing or speaking (via the browser's speech recognition —
   audio never leaves the browser, only the transcribed text is sent to the
   backend). "Score and improve the response" calls
   `POST /api/session/{id}/answer`, which scores the answer and returns
   either the next question or marks the interview complete. A left sidebar
   tracks the questions discussed so far. "End interview" returns to
   Landing.

There's no separate results/analytics page in the current UI — scoring
feedback (including a model answer) shows inline after each response. The
backend still exposes `GET /api/session/{id}/results` (aggregated scores +
radar-chart-ready data) if a summary view gets added back later.

## Troubleshooting

**"Failed to fetch" in the browser / `httpx.RemoteProtocolError: Server
disconnected without sending a response` in the backend logs** -- this means
the connection to Groq's servers was dropped before any response came
back. It's a network-layer issue, not a code bug. The backend now retries
transient failures like this automatically (2 retries with backoff) and
returns a clean error instead of a raw 500 if it still fails. If it keeps
happening:

- Temporarily disable any VPN, and check whether your antivirus/firewall
  (Windows Defender, Brave Shields, corporate proxy, etc.) does SSL
  inspection on outbound HTTPS -- this can break long-lived API connections.
- Test raw connectivity from the same machine:
  `curl -I https://api.groq.com` -- if this hangs or
  fails, it's confirmed to be network-level, not this app.
- Try a different network (e.g. mobile hotspot) to rule out ISP/router
  interference.
- If you're behind a proxy, `pip install` and Groq calls both need the
  proxy configured (`HTTPS_PROXY` env var).

## Known limitations / next steps

- **Sessions are in-memory** -- they're lost on backend restart. Fine for a
  demo/single-run interview; swap for Redis or Postgres if this needs to
  survive restarts or scale across multiple backend instances.
- **No dedicated results/summary page in the UI** -- feedback is shown
  inline after each answer instead. The backend's `/results` endpoint still
  computes an aggregated score if a summary screen gets added back.
- **Eye contact / voice clarity aren't measured.** Those need video/audio
  signal analysis, which isn't implemented. The scored dimensions are all
  text-derivable instead: Relevance, STAR Structure, Depth, Clarity,
  Grammar, and an estimated Confidence (derived from clarity + structure).
- **Voice is browser-based** (Web Speech API), not a Groq audio pipeline --
  simpler and free, but quality/support varies by browser (works best in
  Chrome) and requires an internet connection for recognition.
