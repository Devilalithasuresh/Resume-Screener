from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class CandidateResponse(BaseModel):
    id: int
    name: str | None
    email: str | None
    phone: str | None
    filename: str | None
    skills: list[str] = []
    education: str | None = None
    experience: str | None = None
    created_at: datetime | None = None


class AnalysisResponse(BaseModel):
    analysis_id: int
    candidate_id: int
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    experience: str | None = None
    education: str | None = None
    filename: str | None = None
    skills: list[str] = []
    ats_score: float
    skill_match_score: float | None = None
    experience_match_score: float | None = None
    education_match_score: float | None = None
    semantic_similarity_score: float | None = None
    matched_skills: list[str] = []
    missing_skills: list[str] = []
    strengths: list[str] = []
    weaknesses: list[str] = []
    recommendations: list[str] = []
    interview_questions: list[str] = []
    created_at: str | None = None


class UploadResponse(BaseModel):
    message: str
    candidates: list[CandidateResponse]


class AnalyzeRequest(BaseModel):
    candidate_ids: list[int] = Field(..., min_length=1)
    job_description: str = Field(..., min_length=50)


class RankRequest(BaseModel):
    analysis_ids: list[int] = Field(..., min_length=1)


class RankedCandidate(BaseModel):
    rank: int
    candidate_id: int
    analysis_id: int
    name: str | None
    email: str | None
    ats_score: float
    matched_skills: list[str] = []
    missing_skills: list[str] = []


class RankResponse(BaseModel):
    rankings: list[RankedCandidate]


class ResultsListResponse(BaseModel):
    results: list[AnalysisResponse]
    total: int
