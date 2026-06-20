import csv
import io
import json

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Analysis, Candidate
from app.schemas import (
    AnalyzeRequest,
    AnalysisResponse,
    CandidateResponse,
    RankRequest,
    RankResponse,
    RankedCandidate,
    ResultsListResponse,
    UploadResponse,
)
from app.services.analysis_service import analysis_to_dict, analyze_candidate, create_candidate
from app.services.report_service import generate_analysis_pdf
from app.utils.resume_parser import parse_resume

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _validate_file(file: UploadFile) -> None:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")
    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")


@router.post("/upload-resume", response_model=UploadResponse)
async def upload_resume(
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one resume file is required.")

    candidates: list[Candidate] = []

    for file in files:
        _validate_file(file)
        content = await file.read()

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 10MB limit.")

        try:
            parsed = parse_resume(file.filename, content)
            candidate = create_candidate(db, parsed)
            candidates.append(candidate)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to parse {file.filename}: {str(e)}")

    return UploadResponse(
        message=f"Successfully uploaded {len(candidates)} resume(s).",
        candidates=[
            CandidateResponse(
                id=c.id,
                name=c.name,
                email=c.email,
                phone=c.phone,
                filename=c.filename,
                skills=json.loads(c.skills) if c.skills else [],
                education=c.education,
                experience=c.experience,
                created_at=c.created_at,
            )
            for c in candidates
        ],
    )


@router.post("/analyze", response_model=list[AnalysisResponse])
def analyze(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
):
    if len(request.job_description.strip()) < 50:
        raise HTTPException(status_code=400, detail="Job description must be at least 50 characters.")

    results = []
    for candidate_id in request.candidate_ids:
        candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
        if not candidate:
            raise HTTPException(status_code=404, detail=f"Candidate {candidate_id} not found.")

        analysis = analyze_candidate(db, candidate, request.job_description.strip())
        results.append(AnalysisResponse(**analysis_to_dict(analysis, candidate)))

    return results


@router.post("/rank-candidates", response_model=RankResponse)
def rank_candidates(
    request: RankRequest,
    db: Session = Depends(get_db),
):
    analyses = (
        db.query(Analysis)
        .filter(Analysis.id.in_(request.analysis_ids))
        .all()
    )

    if not analyses:
        raise HTTPException(status_code=404, detail="No analyses found for the given IDs.")

    sorted_analyses = sorted(analyses, key=lambda a: a.ats_score, reverse=True)

    rankings = []
    for rank, analysis in enumerate(sorted_analyses, start=1):
        candidate = db.query(Candidate).filter(Candidate.id == analysis.candidate_id).first()
        rankings.append(
            RankedCandidate(
                rank=rank,
                candidate_id=analysis.candidate_id,
                analysis_id=analysis.id,
                name=candidate.name if candidate else None,
                email=candidate.email if candidate else None,
                ats_score=analysis.ats_score,
                matched_skills=json.loads(analysis.matched_skills) if analysis.matched_skills else [],
                missing_skills=json.loads(analysis.missing_skills) if analysis.missing_skills else [],
            )
        )

    return RankResponse(rankings=rankings)


@router.get("/results", response_model=ResultsListResponse)
def get_results(
    search: str | None = Query(None),
    min_score: float | None = Query(None, ge=0, le=100),
    max_score: float | None = Query(None, ge=0, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(Analysis).join(Candidate).order_by(Analysis.created_at.desc())

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            (Candidate.name.ilike(search_term))
            | (Candidate.email.ilike(search_term))
            | (Candidate.filename.ilike(search_term))
        )

    if min_score is not None:
        query = query.filter(Analysis.ats_score >= min_score)
    if max_score is not None:
        query = query.filter(Analysis.ats_score <= max_score)

    analyses = query.all()
    results = []
    for analysis in analyses:
        candidate = db.query(Candidate).filter(Candidate.id == analysis.candidate_id).first()
        results.append(AnalysisResponse(**analysis_to_dict(analysis, candidate)))

    return ResultsListResponse(results=results, total=len(results))


@router.get("/results/{analysis_id}", response_model=AnalysisResponse)
def get_result_by_id(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    candidate = db.query(Candidate).filter(Candidate.id == analysis.candidate_id).first()
    return AnalysisResponse(**analysis_to_dict(analysis, candidate))


@router.get("/candidates", response_model=list[CandidateResponse])
def list_candidates(db: Session = Depends(get_db)):
    candidates = db.query(Candidate).order_by(Candidate.created_at.desc()).all()
    return [
        CandidateResponse(
            id=c.id,
            name=c.name,
            email=c.email,
            phone=c.phone,
            filename=c.filename,
            skills=json.loads(c.skills) if c.skills else [],
            education=c.education,
            experience=c.experience,
            created_at=c.created_at,
        )
        for c in candidates
    ]


@router.get("/results/{analysis_id}/report")
def download_report(analysis_id: int, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found.")

    candidate = db.query(Candidate).filter(Candidate.id == analysis.candidate_id).first()
    result = analysis_to_dict(analysis, candidate)
    pdf_bytes = generate_analysis_pdf(result)

    filename = f"resume_analysis_{candidate.name or analysis_id}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/rankings/export")
def export_rankings_csv(
    analysis_ids: str = Query(..., description="Comma-separated analysis IDs"),
    db: Session = Depends(get_db),
):
    ids = [int(i.strip()) for i in analysis_ids.split(",") if i.strip().isdigit()]
    if not ids:
        raise HTTPException(status_code=400, detail="Valid analysis IDs required.")

    analyses = db.query(Analysis).filter(Analysis.id.in_(ids)).all()
    sorted_analyses = sorted(analyses, key=lambda a: a.ats_score, reverse=True)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rank", "Candidate", "Email", "ATS Score", "Matched Skills", "Missing Skills"])

    for rank, analysis in enumerate(sorted_analyses, start=1):
        candidate = db.query(Candidate).filter(Candidate.id == analysis.candidate_id).first()
        matched = json.loads(analysis.matched_skills) if analysis.matched_skills else []
        missing = json.loads(analysis.missing_skills) if analysis.missing_skills else []
        writer.writerow([
            rank,
            candidate.name if candidate else "Unknown",
            candidate.email if candidate else "",
            analysis.ats_score,
            "; ".join(matched),
            "; ".join(missing),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="candidate_rankings.csv"'},
    )
