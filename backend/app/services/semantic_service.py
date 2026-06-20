from functools import lru_cache

import numpy as np
from sentence_transformers import SentenceTransformer


@lru_cache
def _get_model() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


def compute_semantic_similarity(resume_text: str, job_description: str) -> float:
    """Return cosine similarity score scaled to 0-100."""
    model = _get_model()

    resume_embedding = model.encode(resume_text[:5000], convert_to_numpy=True)
    jd_embedding = model.encode(job_description[:5000], convert_to_numpy=True)

    dot = np.dot(resume_embedding, jd_embedding)
    norm = np.linalg.norm(resume_embedding) * np.linalg.norm(jd_embedding)

    if norm == 0:
        return 0.0

    similarity = float(dot / norm)
    return round(max(0.0, min(1.0, similarity)) * 100, 2)


def compute_ats_score(
    skill_match_score: float,
    experience_match_score: float,
    education_match_score: float,
    semantic_similarity_score: float,
) -> float:
    """
    ATS scoring weights:
    - Skill Match: 40%
    - Experience Match: 25%
    - Education Match: 15%
    - Semantic Similarity: 20%
    """
    score = (
        skill_match_score * 0.40
        + experience_match_score * 0.25
        + education_match_score * 0.15
        + semantic_similarity_score * 0.20
    )
    return round(min(100.0, max(0.0, score)), 2)
