"""
Matching Agent
Compares user profile (skills, experience, roles) against job requirements
and assigns a match score (0-100) to each job.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def compute_match_scores(profile: dict, jobs: list[dict]) -> list[dict]:
    """
    Score all jobs against the user profile.
    
    Args:
        profile: dict from profile_analyzer with skills, roles, experience, etc.
        jobs: list of job dicts from job_finder
    
    Returns:
        List of jobs sorted by match_score descending, with match_score and 
        matching_skills fields added.
    """
    scored_jobs = []
    for job in jobs:
        score_data = _score_job(profile, job)
        job_with_score = {**job, **score_data}
        scored_jobs.append(job_with_score)

    # Sort by match score descending
    scored_jobs.sort(key=lambda x: x["match_score"], reverse=True)
    return scored_jobs


def _score_job(profile: dict, job: dict) -> dict:
    """
    Compute a match score between a profile and a job.
    
    Scoring breakdown:
    - Skills match: 60 points max (primary factor)
    - Experience level match: 20 points max
    - Role preference match: 20 points max
    """
    user_skills = set(s.lower() for s in profile.get("skills", []))
    job_requirements = set(r.lower() for r in job.get("requirements", []))

    # 1. Skills matching (60 pts)
    if job_requirements:
        matching = user_skills & job_requirements
        skill_score = (len(matching) / len(job_requirements)) * 60
    else:
        matching = set()
        skill_score = 0

    # Bonus: fuzzy partial skill matching (for synonyms / partial names)
    partial_bonus = 0
    unmatched_requirements = job_requirements - user_skills
    for user_skill in user_skills:
        for req in unmatched_requirements:
            # Check for substring match
            if user_skill in req or req in user_skill:
                partial_bonus += 1
                break
    partial_bonus = min(partial_bonus * 2, 10)  # cap at 10 bonus points

    # 2. Experience match (20 pts)
    user_exp = profile.get("experience_years", 0)
    job_exp_str = job.get("experience", "0+ years")
    required_exp = _parse_experience(job_exp_str)
    
    if user_exp >= required_exp:
        exp_score = 20
    elif required_exp > 0:
        ratio = user_exp / required_exp
        exp_score = ratio * 20
    else:
        exp_score = 20

    # 3. Role preference match (20 pts)
    user_roles = [r.lower() for r in profile.get("roles", [])]
    job_title = job.get("title", "").lower()
    role_score = 0
    for role in user_roles:
        # Check if any word from user's preferred roles matches job title
        role_words = set(role.split())
        title_words = set(job_title.split())
        overlap = role_words & title_words
        if overlap:
            role_score = 20
            break
    
    # If no direct match, give partial role score
    if role_score == 0:
        for role in user_roles:
            for word in role.split():
                if len(word) > 3 and word in job_title:
                    role_score = 10
                    break

    # Calculate final score
    total_score = skill_score + partial_bonus + exp_score + role_score
    total_score = min(round(total_score), 100)

    # Determine match quality
    if total_score >= 80:
        match_quality = "Excellent Match"
        badge_color = "green"
    elif total_score >= 60:
        match_quality = "Good Match"
        badge_color = "blue"
    elif total_score >= 40:
        match_quality = "Fair Match"
        badge_color = "yellow"
    else:
        match_quality = "Low Match"
        badge_color = "red"

    return {
        "match_score": total_score,
        "matching_skills": [s for s in job.get("requirements", []) if s.lower() in user_skills],
        "missing_skills": [s for s in job.get("requirements", []) if s.lower() not in user_skills],
        "match_quality": match_quality,
        "badge_color": badge_color,
        "score_breakdown": {
            "skills": round(skill_score + partial_bonus),
            "experience": round(exp_score),
            "role_fit": round(role_score)
        }
    }


def _parse_experience(exp_str: str) -> int:
    """Parse '3+ years' -> 3, '5+ years' -> 5"""
    try:
        digits = ''.join(c for c in exp_str if c.isdigit())
        return int(digits) if digits else 0
    except Exception:
        return 0


def get_top_matches(profile: dict, jobs: list[dict], top_n: int = 5) -> list[dict]:
    """Return only the top N matched jobs."""
    scored = compute_match_scores(profile, jobs)
    return scored[:top_n]
