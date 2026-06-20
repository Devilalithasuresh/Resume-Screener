# AI Resume Screener

A full-stack ATS-style resume screening application that uses AI to compare candidate resumes against job descriptions, calculate compatibility scores, and rank multiple candidates.

## Features

- **Resume Upload** — Single or multiple PDF/DOCX uploads with drag-and-drop
- **AI Analysis** — Groq LLM + LangChain for skill extraction and insights
- **ATS Scoring** — Weighted scoring: Skills (40%), Experience (25%), Education (15%), Semantic Similarity (20%)
- **Semantic Matching** — Sentence Transformers for resume–JD similarity
- **Candidate Ranking** — Sort, filter, search, and export rankings to CSV
- **PDF Reports** — Downloadable analysis reports
- **Interview Questions** — AI-generated questions based on skill gaps
- **Dark Mode** — Toggle between light and dark themes

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React, Vite, Tailwind CSS, Axios, React Router |
| Backend | Python, FastAPI, SQLAlchemy, SQLite |
| AI/ML | LangChain, Groq API, Sentence Transformers |
| Parsing | PyPDF2, python-docx |

## Project Structure

```
ai-resume-screener/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Environment settings
│   │   ├── database.py          # SQLite setup
│   │   ├── schemas.py           # Pydantic models
│   │   ├── models/              # SQLAlchemy models
│   │   ├── routes/              # API endpoints
│   │   ├── services/            # Business logic
│   │   └── utils/               # Resume parsing
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom React hooks
│   │   └── services/            # API client
│   ├── package.json
│   └── .env.example
└── README.md
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Groq API Key** — Get one at [console.groq.com](https://console.groq.com)

## Setup

### 1. Clone and configure environment

```bash
cd "ai resume screener"
```

### 2. Backend setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
```

Edit `backend/.env` and add your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=sqlite:///./resume_screener.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend setup

```bash
cd frontend
npm install
copy .env.example .env   # Windows
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload-resume` | Upload PDF/DOCX resume(s) |
| POST | `/api/analyze` | Analyze candidates against job description |
| POST | `/api/rank-candidates` | Rank candidates by ATS score |
| GET | `/api/results` | List all results (search & filter) |
| GET | `/api/results/{id}` | Get single analysis result |
| GET | `/api/results/{id}/report` | Download PDF report |
| GET | `/api/rankings/export` | Export rankings as CSV |
| GET | `/api/candidates` | List uploaded candidates |

## ATS Scoring Formula

```
Final Score = (Skill Match × 0.40)
            + (Experience Match × 0.25)
            + (Education Match × 0.15)
            + (Semantic Similarity × 0.20)
```

## Usage Flow

1. Go to **Screen Resumes** and upload one or more resumes (PDF/DOCX)
2. Paste the **Job Description** (minimum 50 characters)
3. Click **Analyze Resumes** — AI processes each candidate
4. View the **Results Dashboard** with match score, skills, strengths, weaknesses, and recommendations
5. For multiple candidates, visit **Rankings** to compare and export to CSV
6. Open **Candidate Profile** for detailed view and interview questions
7. Download a **PDF Report** for any analysis

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key (required for AI analysis) | — |
| `GROQ_MODEL` | Groq model name | `llama-3.3-70b-versatile` |
| `DATABASE_URL` | SQLite connection string | `sqlite:///./resume_screener.db` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api` |

## Notes

- On first run, Sentence Transformers downloads the `all-MiniLM-L6-v2` model (~90MB)
- If Groq API is unavailable, the system falls back to rule-based analysis
- Maximum file upload size: 10 MB per resume

## License

MIT
