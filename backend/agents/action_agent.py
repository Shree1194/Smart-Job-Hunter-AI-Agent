"""
Action Agent
Generates personalized job application emails using AI (or mock templates).
Also provides resume improvement suggestions.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def generate_application_email(profile: dict, job: dict) -> dict:
    """
    Generate a personalized job application email.
    
    Args:
        profile: User profile dict from profile_analyzer
        job: Job dict (with match score data) from matching_agent
    
    Returns:
        dict with 'subject' and 'body' keys
    """
    if OPENAI_API_KEY and OPENAI_API_KEY != "mock":
        return _generate_email_with_openai(profile, job)
    else:
        return _generate_email_mock(profile, job)


def generate_resume_suggestions(profile: dict, top_jobs: list[dict]) -> list[str]:
    """
    Generate improvement suggestions for the resume based on job market gaps.
    
    Args:
        profile: User profile
        top_jobs: Top matched jobs (to identify skill gaps)
    
    Returns:
        List of improvement suggestion strings
    """
    if OPENAI_API_KEY and OPENAI_API_KEY != "mock":
        return _generate_suggestions_with_openai(profile, top_jobs)
    else:
        return _generate_suggestions_mock(profile, top_jobs)


def _generate_email_with_openai(profile: dict, job: dict) -> dict:
    """Use OpenAI to generate a professional application email."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    skills_str = ", ".join(profile.get("skills", [])[:8])
    matching_skills = ", ".join(job.get("matching_skills", [])[:5])
    
    prompt = f"""Generate a professional job application email for this position.

Job Details:
- Title: {job['title']}
- Company: {job['company']}
- Location: {job['location']}

Applicant Profile:
- Experience Level: {profile.get('experience_level', 'Experienced')}
- Years of Experience: {profile.get('experience_years', 'several')} years
- Key Skills: {skills_str}
- Matching Skills for this job: {matching_skills}
- Education: {profile.get('education', 'Relevant degree')}
- Summary: {profile.get('summary', '')}

Write a compelling, personalized email that:
1. Expresses genuine interest in the specific role
2. Highlights the most relevant skills
3. Mentions specific match to job requirements
4. Has a professional tone
5. Is concise (3-4 paragraphs)

Return JSON with:
{{
  "subject": "email subject line",
  "body": "full email body"
}}

Return ONLY valid JSON."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1000
    )

    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _generate_email_mock(profile: dict, job: dict) -> dict:
    """Generate a template-based application email."""
    skills = profile.get("skills", [])
    matching_skills = job.get("matching_skills", skills[:3])
    exp_level = profile.get("experience_level", "Experienced")
    exp_years = profile.get("experience_years", 3)
    education = profile.get("education", "relevant degree")
    
    top_skills = ", ".join(matching_skills[:3]) if matching_skills else ", ".join(skills[:3])
    all_skills = ", ".join(skills[:6]) if skills else "multiple relevant technologies"
    
    subject = f"Application for {job['title']} Position – {exp_level} Developer with {exp_years}+ Years Experience"
    
    body = f"""Dear Hiring Manager,

I am writing to express my strong interest in the {job['title']} position at {job['company']}. Having reviewed the job description, I am confident that my background in {top_skills} makes me an excellent fit for this role.

As a {exp_level} professional with {exp_years}+ years of hands-on experience, I have developed deep expertise in {all_skills}. Throughout my career, I have successfully delivered high-quality solutions that align closely with the technical requirements outlined in your posting, particularly in {", ".join(matching_skills[:4]) if matching_skills else top_skills}.

What excites me most about {job['company']} is the opportunity to contribute to a forward-thinking team while continuing to grow my skills. I am particularly drawn to this {job['location']} role and the challenges it presents, which align perfectly with my career trajectory.

I hold a {education} and have a consistent track record of delivering results in fast-paced environments. I am eager to bring my technical expertise, collaborative mindset, and passion for innovation to your team.

I would welcome the opportunity to discuss how my background can contribute to {job['company']}'s success. Please find my resume attached for your review.

Thank you for your time and consideration. I look forward to hearing from you.

Best regards,
[Your Name]
[Your Email]
[Your Phone Number]
[LinkedIn Profile]"""
    
    return {"subject": subject, "body": body}


def _generate_suggestions_with_openai(profile: dict, top_jobs: list[dict]) -> list[str]:
    """Use OpenAI to generate personalized resume suggestions."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    # Collect missing skills across top jobs
    all_missing = []
    for job in top_jobs[:5]:
        all_missing.extend(job.get("missing_skills", []))
    
    missing_counter = {}
    for skill in all_missing:
        missing_counter[skill] = missing_counter.get(skill, 0) + 1
    
    top_missing = sorted(missing_counter.items(), key=lambda x: x[1], reverse=True)[:8]
    missing_skills_str = ", ".join([s[0] for s in top_missing])
    
    prompt = f"""Based on this candidate profile and job market analysis, provide 6 actionable resume improvement suggestions.

Candidate Profile:
- Skills: {", ".join(profile.get("skills", []))}
- Experience: {profile.get("experience_years", 0)} years, {profile.get("experience_level", "Mid")} level
- Roles targeting: {", ".join(profile.get("roles", []))}

Skills commonly required in target jobs but missing from profile: {missing_skills_str}

Provide exactly 6 specific, actionable suggestions as a JSON array of strings.
Each suggestion should be practical and specific.
Return ONLY a JSON array."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.5,
        max_tokens=600
    )
    
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _generate_suggestions_mock(profile: dict, top_jobs: list[dict]) -> list[str]:
    """Generate template-based improvement suggestions."""
    # Collect most common missing skills
    all_missing = []
    for job in top_jobs[:5]:
        all_missing.extend(job.get("missing_skills", []))
    
    missing_counter = {}
    for skill in all_missing:
        missing_counter[skill] = missing_counter.get(skill, 0) + 1
    
    top_missing = [s for s, _ in sorted(missing_counter.items(), key=lambda x: x[1], reverse=True)[:4]]
    
    suggestions = []
    
    if top_missing:
        suggestions.append(
            f"🎯 Learn high-demand missing skills: {', '.join(top_missing[:3])} appear frequently in your target roles"
        )
    
    current_skills = profile.get("skills", [])
    if "Docker" not in current_skills:
        suggestions.append("🐳 Add Docker containerization skills — required in 80%+ of backend/DevOps roles")
    
    if "AWS" not in current_skills and "GCP" not in current_skills and "Azure" not in current_skills:
        suggestions.append("☁️ Get cloud certified (AWS/GCP/Azure) — cloud literacy is expected in most senior tech roles")
    
    exp_level = profile.get("experience_level", "Junior")
    if exp_level in ["Junior", "Entry Level"]:
        suggestions.append("📂 Build 2–3 portfolio projects on GitHub demonstrating real-world use of your core skills")
    else:
        suggestions.append("📝 Quantify your achievements with metrics (e.g., 'Reduced API latency by 40%') to strengthen impact")
    
    suggestions.append("🔗 Update your LinkedIn profile to mirror your resume and enable 'Open to Work' setting")
    suggestions.append("📊 Add a skills summary section at the top of your resume to pass ATS filters quickly")
    
    if "Machine Learning" in current_skills or "Python" in current_skills:
        suggestions.append("🤖 Include a dedicated AI/ML projects section showcasing end-to-end pipelines")
    else:
        suggestions.append("✍️ Tailor your resume keywords to match each job description's specific terminology")
    
    return suggestions[:6]
