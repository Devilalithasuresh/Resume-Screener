import json
import re
from functools import lru_cache

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import get_settings


ANALYSIS_SYSTEM_PROMPT = """You are an expert ATS (Applicant Tracking System) resume analyzer and technical recruiter.
Analyze the candidate resume against the job description and return ONLY valid JSON with no markdown or extra text.

Return this exact JSON structure:
{
  "match_score": <number 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
  "skill_match_score": <number 0-100>,
  "experience_match_score": <number 0-100>,
  "education_match_score": <number 0-100>
}

Be specific, actionable, and recruiter-focused. Extract skills mentioned in both documents."""


INTERVIEW_SYSTEM_PROMPT = """You are a senior technical interviewer.
Based on the missing skills and job requirements, generate 5 targeted interview questions.
Return ONLY valid JSON:
{
  "interview_questions": ["question1", "question2", "question3", "question4", "question5"]
}"""


def _parse_json_response(content: str) -> dict:
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?\n?", "", content)
        content = re.sub(r"\n?```$", "", content)

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise ValueError("Failed to parse AI response as JSON")


@lru_cache
def _get_llm() -> ChatGroq:
    settings = get_settings()
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not configured. Please set it in your .env file.")
    return ChatGroq(
        groq_api_key=settings.groq_api_key,
        model_name=settings.groq_model,
        temperature=0.2,
    )


def analyze_with_groq(resume_text: str, job_description: str, candidate_info: dict) -> dict:
    llm = _get_llm()

    user_prompt = f"""Job Description:
{job_description}

Candidate Name: {candidate_info.get('name', 'Unknown')}
Candidate Skills: {', '.join(candidate_info.get('skills', []))}
Candidate Experience Summary: {candidate_info.get('experience', 'N/A')}
Candidate Education: {candidate_info.get('education', 'N/A')}

Full Resume:
{resume_text[:8000]}

Analyze this resume against the job description."""

    messages = [
        SystemMessage(content=ANALYSIS_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ]

    response = llm.invoke(messages)
    return _parse_json_response(response.content)


def generate_interview_questions(
    job_description: str,
    missing_skills: list[str],
    resume_text: str,
) -> list[str]:
    llm = _get_llm()

    user_prompt = f"""Job Description:
{job_description[:3000]}

Missing Skills: {', '.join(missing_skills) if missing_skills else 'None identified'}

Resume excerpt:
{resume_text[:2000]}

Generate interview questions to assess gaps and verify candidate fit."""

    messages = [
        SystemMessage(content=INTERVIEW_SYSTEM_PROMPT),
        HumanMessage(content=user_prompt),
    ]

    try:
        response = llm.invoke(messages)
        data = _parse_json_response(response.content)
        return data.get("interview_questions", [])
    except Exception:
        return [
            f"Can you describe your experience with {skill}?" for skill in missing_skills[:5]
        ] or ["Tell us about a challenging project relevant to this role."]


def fallback_analysis(resume_text: str, job_description: str, skills: list[str]) -> dict:
    """Rule-based fallback when Groq API is unavailable."""
    jd_lower = job_description.lower()
    resume_lower = resume_text.lower()

    jd_words = set(re.findall(r"[a-zA-Z+#.]{2,}", jd_lower))
    resume_words = set(re.findall(r"[a-zA-Z+#.]{2,}", resume_lower))
    matched = [s for s in skills if s.lower() in jd_lower or s.lower() in resume_words & jd_words]

    common_tech = [
        "python", "java", "javascript", "react", "sql", "docker", "kubernetes",
        "aws", "fastapi", "machine learning", "node.js", "typescript",
    ]
    missing = [t for t in common_tech if t in jd_lower and t not in resume_lower][:8]

    skill_score = min(100, int(len(matched) / max(len(jd_words & resume_words), 1) * 100))
    exp_score = 70 if "experience" in resume_lower else 40
    edu_score = 75 if "bachelor" in resume_lower or "master" in resume_lower or "degree" in resume_lower else 50

    return {
        "match_score": int(skill_score * 0.5 + exp_score * 0.3 + edu_score * 0.2),
        "matched_skills": matched[:10],
        "missing_skills": missing,
        "strengths": [
            f"Demonstrates {matched[0]} experience" if matched else "Relevant background identified",
            "Resume contains structured experience section" if "experience" in resume_lower else "Clear career progression",
        ],
        "weaknesses": [
            f"Missing {missing[0]} experience" if missing else "Some job requirements not explicitly covered",
            "Consider adding more quantifiable achievements",
        ],
        "recommendations": [
            f"Highlight experience with {missing[0]}" if missing else "Align resume keywords with job description",
            "Add measurable impact metrics to project descriptions",
            "Include certifications relevant to the role",
        ],
        "skill_match_score": skill_score,
        "experience_match_score": exp_score,
        "education_match_score": edu_score,
    }
