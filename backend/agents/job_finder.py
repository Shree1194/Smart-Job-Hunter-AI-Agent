"""
Job Finder Agent
Fetches and filters job listings from the local JSON dataset.
"""

import json
import os
from pathlib import Path


# Path to the jobs database
JOBS_FILE = Path(__file__).parent.parent / "data" / "jobs.json"


def load_jobs() -> list[dict]:
    """Load all jobs from the JSON file."""
    with open(JOBS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def find_jobs(
    skills: list[str] | None = None,
    roles: list[str] | None = None,
    limit: int = None
) -> list[dict]:
    """
    Find job listings from the dataset.
    
    Args:
        skills: Optional list of skills to filter by relevance
        roles: Optional list of desired roles to prioritize
        limit: Maximum number of jobs to return (None = all)
    
    Returns:
        List of job objects with metadata
    """
    jobs = load_jobs()

    if limit:
        return jobs[:limit]

    return jobs


def get_job_by_id(job_id: str) -> dict | None:
    """Retrieve a specific job by its ID."""
    jobs = load_jobs()
    for job in jobs:
        if job["id"] == job_id:
            return job
    return None


def get_all_required_skills() -> list[str]:
    """Get a flat list of all unique required skills across all jobs."""
    jobs = load_jobs()
    all_skills = set()
    for job in jobs:
        all_skills.update(job.get("requirements", []))
    return sorted(list(all_skills))
