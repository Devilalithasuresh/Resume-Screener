from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routes.api import router

settings = get_settings()

app = FastAPI(
    title="AI Resume Screener API",
    description="ATS-style resume screening with AI-powered analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "AI Resume Screener API", "docs": "/docs", "health": "ok"}


@app.get("/health")
def health():
    return {"status": "healthy"}
