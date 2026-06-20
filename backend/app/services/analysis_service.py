import json
from typing import Any

from sqlalchemy.orm import Session

from app.models import Analysis, Candidate
from app.services.ai_service import analyze_with_groq, fallback_analysis, generate_interview_questions
from app.services.semantic_service import compute_ats_score, compute_semantic_similarity


def _to_json_list(data: list | None) -> str:
    return json.dumps(data or [])


def _from_json_list(data: str | None) -> list:
    if not data:
        return []
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return []


def create_candidate(db: Session, parsed: dict[str, Any]) -> Candidate:
    candidate = Candidate(
        name=parsed.get("name"),
        email=parsed.get("email"),
        phone=parsed.get("phone"),
        resume_text=parsed["resume_text"],
        skills=_to_json_list(parsed.get("skills", [])),
        education=parsed.get("education"),
        experience=parsed.get("experience"),
        filename=parsed.get("filename"),
    )
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


def analyze_candidate(
    db: Session,
    candidate: Candidate,
    job_description: str,
    use_ai: bool = True,
) -> Analysis:
    skills = _from_json_list(candidate.skills)
    candidate_info = {
        "name": candidate.name,
        "skills": skills,
        "experience": candidate.experience,
        "education": candidate.education,
    }

    if use_ai:
        try:
            ai_result = analyze_with_groq(candidate.resume_text, job_description, candidate_info)
        except Exception:
            ai_result = fallback_analysis(candidate.resume_text, job_description, skills)
    else:
        ai_result = fallback_analysis(candidate.resume_text, job_description, skills)

    semantic_score = compute_semantic_similarity(candidate.resume_text, job_description)

    skill_score = float(ai_result.get("skill_match_score", ai_result.get("match_score", 50)))
    exp_score = float(ai_result.get("experience_match_score", 50))
    edu_score = float(ai_result.get("education_match_score", 50))

    ats_score = compute_ats_score(skill_score, exp_score, edu_score, semantic_score)

    matched_skills = ai_result.get("matched_skills", [])
    missing_skills = ai_result.get("missing_skills", [])

    try:
        interview_questions = generate_interview_questions(
            job_description, missing_skills, candidate.resume_text
        )
    except Exception:
        interview_questions = [
            f"Describe your experience with {skill}." for skill in missing_skills[:5]
        ]

    analysis = Analysis(
        candidate_id=candidate.id,
        job_description=job_description,
        ats_score=ats_score,
        skill_match_score=skill_score,
        experience_match_score=exp_score,
        education_match_score=edu_score,
        semantic_similarity_score=semantic_score,
        matched_skills=_to_json_list(matched_skills),
        missing_skills=_to_json_list(missing_skills),
        strengths=_to_json_list(ai_result.get("strengths", [])),
        weaknesses=_to_json_list(ai_result.get("weaknesses", [])),
        recommendations=_to_json_list(ai_result.get("recommendations", [])),
        interview_questions=_to_json_list(interview_questions),
    )
    db.add(analysis)
    db.commit()
    db.refresh(analysis)
    return analysis


def analysis_to_dict(analysis: Analysis, candidate: Candidate | None = None) -> dict[str, Any]:
    cand = candidate or analysis.candidate
    return {
        "analysis_id": analysis.id,
        "candidate_id": analysis.candidate_id,
        "name": cand.name if cand else None,
        "email": cand.email if cand else None,
        "phone": cand.phone if cand else None,
        "experience": cand.experience if cand else None,
        "education": cand.education if cand else None,
        "filename": cand.filename if cand else None,
        "skills": _from_json_list(cand.skills) if cand else [],
        "ats_score": analysis.ats_score,
        "skill_match_score": analysis.skill_match_score,
        "experience_match_score": analysis.experience_match_score,
        "education_match_score": analysis.education_match_score,
        "semantic_similarity_score": analysis.semantic_similarity_score,
        "matched_skills": _from_json_list(analysis.matched_skills),
        "missing_skills": _from_json_list(analysis.missing_skills),
        "strengths": _from_json_list(analysis.strengths),
        "weaknesses": _from_json_list(analysis.weaknesses),
        "recommendations": _from_json_list(analysis.recommendations),
        "interview_questions": _from_json_list(analysis.interview_questions),
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
    }
