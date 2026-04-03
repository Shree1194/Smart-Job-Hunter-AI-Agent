"""
Smart Job Hunter AI Agent - FastAPI Backend
Main application entry point with all API endpoints.
"""

import os
import io
import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Agent imports
from agents.profile_analyzer import analyze_profile
from agents.job_finder import find_jobs, get_job_by_id
from agents.matching_agent import get_top_matches, compute_match_scores
from agents.action_agent import generate_application_email, generate_resume_suggestions

app = FastAPI(
    title="Smart Job Hunter AI Agent",
    description="Multi-agent system for intelligent job matching and application automation",
    version="1.0.0"
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request / Response Models ─────────────────────────────────────────────────

class ResumeTextRequest(BaseModel):
    resume_text: str


class EmailRequest(BaseModel):
    profile: dict
    job_id: str


class SuggestionsRequest(BaseModel):
    profile: dict
    top_jobs: list[dict]


# ─── Utility ───────────────────────────────────────────────────────────────────

def extract_pdf_text(file_content: bytes) -> str:
    """Extract text from PDF using pdfplumber."""
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
            return "\n".join(pages)
    except ImportError:
        raise HTTPException(status_code=500, detail="pdfplumber not installed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")


# ─── Health Check ──────────────────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    """Check if the backend is running and agents are ready."""
    api_key = os.getenv("OPENAI_API_KEY")
    mode = "openai" if (api_key and api_key != "mock") else "mock"
    return {
        "status": "healthy",
        "mode": mode,
        "agents": [
            "profile_analyzer",
            "job_finder", 
            "matching_agent",
            "action_agent"
        ]
    }


# ─── Agent Workflow Endpoint ────────────────────────────────────────────────────

@app.post("/api/analyze-resume")
async def analyze_resume_text(request: ResumeTextRequest):
    """
    Full workflow: 
    1. Profile Analyzer → extract skills & profile
    2. Job Finder → get all jobs
    3. Matching Agent → score and rank jobs
    4. Action Agent → generate resume suggestions
    """
    resume_text = request.resume_text.strip()
    if not resume_text:
        raise HTTPException(status_code=400, detail="Resume text cannot be empty")

    # Step 1: Profile Analyzer Agent
    profile = analyze_profile(resume_text)

    # Step 2: Job Finder Agent  
    jobs = find_jobs()

    # Step 3: Matching Agent
    top_jobs = get_top_matches(profile, jobs, top_n=5)

    # Step 4: Action Agent - resume suggestions
    suggestions = generate_resume_suggestions(profile, top_jobs)

    return {
        "success": True,
        "workflow": {
            "step1": "Profile Analyzer Agent ✓",
            "step2": "Job Finder Agent ✓",
            "step3": "Matching Agent ✓",
            "step4": "Action Agent (suggestions) ✓"
        },
        "profile": profile,
        "top_jobs": top_jobs,
        "suggestions": suggestions,
        "total_jobs_analyzed": len(jobs)
    }


@app.post("/api/upload-resume")
async def upload_resume_pdf(file: UploadFile = File(...)):
    """
    Upload a PDF resume, extract text, and run the full workflow.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    resume_text = extract_pdf_text(content)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF")

    # Run the same workflow as text analysis
    profile = analyze_profile(resume_text)
    jobs = find_jobs()
    top_jobs = get_top_matches(profile, jobs, top_n=5)
    suggestions = generate_resume_suggestions(profile, top_jobs)

    return {
        "success": True,
        "extracted_text_preview": resume_text[:500] + "..." if len(resume_text) > 500 else resume_text,
        "workflow": {
            "step1": "Profile Analyzer Agent ✓",
            "step2": "Job Finder Agent ✓",
            "step3": "Matching Agent ✓",
            "step4": "Action Agent (suggestions) ✓"
        },
        "profile": profile,
        "top_jobs": top_jobs,
        "suggestions": suggestions,
        "total_jobs_analyzed": len(jobs)
    }


@app.post("/api/generate-email")
async def generate_email(request: EmailRequest):
    """
    Action Agent: Generate a personalized application email for a specific job.
    """
    job = get_job_by_id(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {request.job_id} not found")

    # Merge job with any match data from profile analysis
    email = generate_application_email(request.profile, job)
    
    return {
        "success": True,
        "job_title": job["title"],
        "company": job["company"],
        "email": email
    }


@app.get("/api/jobs")
async def get_all_jobs():
    """Get all job listings from the dataset."""
    jobs = find_jobs()
    return {"jobs": jobs, "total": len(jobs)}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a specific job by ID."""
    job = get_job_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
