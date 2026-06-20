import io
import json
import re
from typing import Any

from docx import Document
from PyPDF2 import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n".join(pages).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs).strip()


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if lower.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    raise ValueError("Unsupported file format. Only PDF and DOCX are allowed.")


def extract_email(text: str) -> str | None:
    match = re.search(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return match.group(0) if match else None


def extract_phone(text: str) -> str | None:
    patterns = [
        r"\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}",
        r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            return match.group(0).strip()
    return None


def extract_name(text: str, email: str | None = None) -> str | None:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if not lines:
        return None

    for line in lines[:5]:
        if email and email in line:
            continue
        if re.search(r"@|http|linkedin|github|phone|resume|curriculum", line, re.I):
            continue
        if len(line.split()) <= 5 and re.match(r"^[A-Za-z\s.'-]+$", line):
            return line.title()

    return lines[0][:80] if lines else None


def extract_section(text: str, keywords: list[str]) -> str | None:
    lines = text.split("\n")
    section_lines: list[str] = []
    capturing = False

    stop_keywords = [
        "experience",
        "education",
        "skills",
        "projects",
        "certifications",
        "summary",
        "objective",
        "contact",
        "references",
    ]

    for line in lines:
        stripped = line.strip()
        lower = stripped.lower()

        if any(kw in lower for kw in keywords) and len(stripped) < 80:
            capturing = True
            continue

        if capturing:
            if any(kw in lower for kw in stop_keywords) and len(stripped) < 80:
                if not any(kw in lower for kw in keywords):
                    break
            if stripped:
                section_lines.append(stripped)

    return "\n".join(section_lines[:15]) if section_lines else None


def extract_skills_from_text(text: str) -> list[str]:
    common_skills = [
        "python", "java", "javascript", "typescript", "react", "node.js", "nodejs",
        "sql", "mysql", "postgresql", "mongodb", "redis", "fastapi", "flask", "django",
        "docker", "kubernetes", "aws", "azure", "gcp", "git", "linux", "html", "css",
        "tailwind", "machine learning", "deep learning", "nlp", "data analysis",
        "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "langchain",
        "rest api", "graphql", "microservices", "ci/cd", "jenkins", "terraform",
        "spring boot", "c++", "c#", ".net", "go", "rust", "ruby", "php", "swift",
        "kotlin", "angular", "vue", "next.js", "express", "spring", "hibernate",
        "agile", "scrum", "jira", "tableau", "power bi", "excel", "spark", "hadoop",
        "kafka", "rabbitmq", "elasticsearch", "firebase", "supabase", "figma",
    ]
    text_lower = text.lower()
    found = [skill for skill in common_skills if skill in text_lower]

    skills_section = extract_section(text, ["skills", "technical skills", "core competencies"])
    if skills_section:
        extra = re.split(r"[,|•\n;/]", skills_section)
        for item in extra:
            cleaned = item.strip()
            if 2 <= len(cleaned) <= 40 and cleaned.lower() not in [s.lower() for s in found]:
                found.append(cleaned)

    return list(dict.fromkeys(found))[:30]


def parse_resume(filename: str, file_bytes: bytes) -> dict[str, Any]:
    text = extract_text_from_file(filename, file_bytes)
    if not text:
        raise ValueError("Could not extract text from the uploaded resume.")

    email = extract_email(text)
    phone = extract_phone(text)
    name = extract_name(text, email)
    skills = extract_skills_from_text(text)
    education = extract_section(text, ["education", "academic", "qualification"])
    experience = extract_section(text, ["experience", "work history", "employment", "professional experience"])

    return {
        "name": name or "Unknown Candidate",
        "email": email,
        "phone": phone,
        "resume_text": text,
        "skills": skills,
        "education": education or "Not specified",
        "experience": experience or "Not specified",
        "filename": filename,
    }
