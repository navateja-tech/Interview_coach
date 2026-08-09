from dotenv import load_dotenv
load_dotenv()

import streamlit as st

from utils.resume_parser import extract_resume_text
from chains.question_generator import generate_questions

st.set_page_config(page_title="AI Interview Coach", page_icon="🎯", layout="centered")

st.title("🎯 AI Interview Coach")
st.caption("v1 — Upload your resume + paste a job description to get tailored interview questions.")

CATEGORY_ORDER = ["Behavioral", "Technical", "Project", "JD-gap"]
CATEGORY_ICONS = {
    "Behavioral": "🗣️",
    "Technical": "⚙️",
    "Project": "🛠️",
    "JD-gap": "🔍",
}

with st.form("input_form"):
    resume_file = st.file_uploader("Upload your resume (PDF)", type=["pdf"])
    jd_text = st.text_area("Paste the Job Description", height=220,
                            placeholder="Paste the full job description here...")
    num_questions = st.slider("Number of questions to generate", min_value=4, max_value=20, value=10)
    submitted = st.form_submit_button("Generate Questions", use_container_width=True)

if submitted:
    if not resume_file:
        st.error("Please upload your resume.")
    elif not jd_text.strip():
        st.error("Please paste a job description.")
    else:
        with st.spinner("Reading your resume..."):
            resume_text = extract_resume_text(resume_file)

        if not resume_text.strip():
            st.error("Couldn't extract text from that PDF. Try a different file (avoid scanned/image-only PDFs).")
        else:
            with st.spinner("Generating tailored interview questions..."):
                try:
                    question_set = generate_questions(resume_text, jd_text, num_questions)
                    st.session_state["question_set"] = question_set
                except Exception as e:
                    st.error(f"Something went wrong generating questions: {e}")

if "question_set" in st.session_state:
    question_set = st.session_state["question_set"]
    st.divider()
    st.subheader("Your Tailored Interview Questions")

    grouped = {cat: [] for cat in CATEGORY_ORDER}
    for q in question_set.questions:
        grouped.setdefault(q.category, []).append(q)

    for category in CATEGORY_ORDER:
        questions = grouped.get(category, [])
        if not questions:
            continue
        st.markdown(f"### {CATEGORY_ICONS.get(category, '')} {category} ({len(questions)})")
        for i, q in enumerate(questions, start=1):
            with st.container(border=True):
                st.markdown(f"**{i}. {q.text}**")
                st.caption(f"Difficulty: {q.difficulty}  •  Based on: {q.based_on}")
