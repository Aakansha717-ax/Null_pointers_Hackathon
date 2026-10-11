import json
from datetime import datetime, timezone

import pymupdf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import analyses, judgments, check_database
from ai_service import analyze_legal_text

app = FastAPI(title="NyayaLens Legal AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok", "backend": "running"}


@app.get("/api/db-health")
def database_health():
    try:
        check_database()
        return {"status": "connected", "database": "MongoDB"}
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="MongoDB connection failed. Check your URI and Atlas network access.",
        )


class JudgmentRequest(BaseModel):
    title: str
    text: str
    source_url: str | None = None


@app.post("/api/judgments")
def save_judgment(request: JudgmentRequest):
    if not request.title.strip() or not request.text.strip():
        raise HTTPException(status_code=400, detail="Title and text are required.")
    document = {
        "title": request.title.strip(),
        "text": request.text,
        "source_url": request.source_url,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        saved = judgments.insert_one(document)
        return {"message": "Judgment saved", "id": str(saved.inserted_id)}
    except Exception:
        raise HTTPException(status_code=503, detail="Could not save judgment to MongoDB.")


def _fallback_analysis(filename, pages, full_text, ai_error=None):
    preview = full_text[:1800].strip()
    warning = (
        "AI analysis could not be completed. The extracted text is shown for review."
        if ai_error
        else "This is an extraction-only fallback, not an AI-generated legal summary."
    )
    return {
        "document": {
            "filename": filename,
            "page_count": len(pages),
            "analysis_mode": "extraction_fallback",
            "pages": [
                {
                    "page": p["page"],
                    "character_count": len(p["text"]),
                    "text_preview": p["text"][:300].strip(),
                    "text": p["text"],
                }
                for p in pages
            ],
        },
        "warnings": [warning],
        "evidence": [],
        "timeline": [],
        "case_type": "Not identified",
        "court": "Not identified",
        "petitioner": "Not identified",
        "respondent": "Not identified",
        "laws_and_sections": [],
        "main_issues": [],
        "final_outcome": "Not identified from the extracted text.",
        "court_reasoning": "AI analysis unavailable. Please review the original judgment.",
        "summary": preview or "No selectable text was found in this PDF. It may be scanned and require OCR.",
        "verification": {
            "note": "Page numbers refer to PDF page positions, starting at 1. Verify every legal point against the original document."
        },
    }


@app.post("/api/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    filename = file.filename or "uploaded.pdf"
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")
    if len(raw) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="PDF is too large. Maximum size is 20 MB.")

    try:
        pdf = pymupdf.open(stream=raw, filetype="pdf")
        pages = []
        ocr_used = False
        for index, page in enumerate(pdf):
            page_text = page.get_text("text").strip()
            if not page_text:
                try:
                    textpage = page.get_textpage_ocr(language="eng", dpi=200, full=True)
                    page_text = page.get_text("text", textpage=textpage).strip()
                    if page_text:
                        ocr_used = True
                except Exception:
                    page_text = ""
            pages.append({"page": index + 1, "text": page_text})
        pdf.close()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read this PDF. Please try another file.")

    full_text = "\n\n".join(
        f"[PDF PAGE {p['page']}]\n{p['text']}" for p in pages if p["text"]
    )
    if not full_text.strip():
        result = _fallback_analysis(filename, pages, full_text)
        result["warnings"] = [
            "No selectable text was extracted and OCR could not recover text. Install Tesseract OCR and ensure it is on PATH, then restart the backend."
        ]
        return result

    try:
        analysis = analyze_legal_text(full_text[:45000])
        if isinstance(analysis, str):
            analysis = json.loads(analysis)
        if not isinstance(analysis, dict):
            raise ValueError("AI response was not a JSON object.")
    except Exception as exc:
        result = _fallback_analysis(filename, pages, full_text, ai_error=str(exc))
        result["warnings"].append("AI service error: " + str(exc)[:240])
        return result

    # Add full extracted page text so the Document tab can display each page.
    result = {
        "document": {
            "filename": filename,
            "page_count": len(pages),
            "analysis_mode": "gemini_ai",
            "pages": [
                {
                    "page": p["page"],
                    "character_count": len(p["text"]),
                    "text_preview": p["text"][:300].strip(),
                    "text": p["text"],
                }
                for p in pages
            ],
        },
        "warnings": analysis.get("warnings") if isinstance(analysis.get("warnings"), list) else [],
        "evidence": analysis.get("evidence") if isinstance(analysis.get("evidence"), list) else [],
        "timeline": analysis.get("timeline") if isinstance(analysis.get("timeline"), list) else [],
        "case_type": analysis.get("case_type", "Not identified"),
        "court": analysis.get("court", "Not identified"),
        "petitioner": analysis.get("petitioner", "Not identified"),
        "respondent": analysis.get("respondent", "Not identified"),
        "laws_and_sections": analysis.get("laws_and_sections", analysis.get("laws_sections_cited", [])),
        "main_issues": analysis.get("main_issues", analysis.get("main_legal_issues", [])),
        "final_outcome": analysis.get("final_outcome", analysis.get("outcome", "Not identified")),
        "court_reasoning": analysis.get("court_reasoning", "Not identified"),
        "summary": analysis.get("summary", analysis.get("case_summary", "")),
        "verification": analysis.get(
            "verification",
            {"note": "Page references mean PDF page positions starting at 1. Verify against the source PDF."},
        ),
    }

    if ocr_used:
        result["warnings"].append(
            "OCR was used on one or more pages. Verify extracted names, amounts, quotations, and page references against the original PDF."
        )

    try:
        stored = dict(result)
        stored["created_at"] = datetime.now(timezone.utc)
        stored["filename"] = filename
        saved = analyses.insert_one(stored)
        result["analysis_id"] = str(saved.inserted_id)
    except Exception as exc:
        result["warnings"].append("Analysis completed, but it could not be saved to MongoDB.")

    return result
