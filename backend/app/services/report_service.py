import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def generate_analysis_pdf(result: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75 * inch, bottomMargin=0.75 * inch)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=22,
        textColor=colors.HexColor("#2563EB"),
        spaceAfter=12,
    )
    heading_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.HexColor("#1E40AF"),
        spaceBefore=16,
        spaceAfter=8,
    )
    body_style = styles["Normal"]

    story = []

    story.append(Paragraph("AI Resume Screening Report", title_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style))
    story.append(Spacer(1, 0.25 * inch))

    info_data = [
        ["Candidate", result.get("name", "N/A")],
        ["Email", result.get("email", "N/A")],
        ["ATS Match Score", f"{result.get('ats_score', 0)}%"],
        ["Skill Match", f"{result.get('skill_match_score', 0)}%"],
        ["Experience Match", f"{result.get('experience_match_score', 0)}%"],
        ["Education Match", f"{result.get('education_match_score', 0)}%"],
        ["Semantic Similarity", f"{result.get('semantic_similarity_score', 0)}%"],
    ]
    info_table = Table(info_data, colWidths=[2 * inch, 4 * inch])
    info_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#EFF6FF")),
            ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#1E293B")),
            ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ])
    )
    story.append(info_table)

    def add_list_section(title: str, items: list[str]):
        story.append(Paragraph(title, heading_style))
        if items:
            for item in items:
                story.append(Paragraph(f"• {item}", body_style))
        else:
            story.append(Paragraph("None identified.", body_style))

    add_list_section("Matched Skills", result.get("matched_skills", []))
    add_list_section("Missing Skills", result.get("missing_skills", []))
    add_list_section("Strengths", result.get("strengths", []))
    add_list_section("Weaknesses", result.get("weaknesses", []))
    add_list_section("Recommendations", result.get("recommendations", []))
    add_list_section("Suggested Interview Questions", result.get("interview_questions", []))

    doc.build(story)
    buffer.seek(0)
    return buffer.read()
