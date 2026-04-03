"""
Profile Analyzer Agent
Extracts skills, experience level, and role preferences from resume text using AI.
"""

import os
import json
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


def analyze_profile(resume_text: str) -> dict:
    """
    Analyzes a resume and extracts structured profile information.
    
    Returns:
        dict with keys: skills, experience_years, experience_level, 
                        roles, summary, education
    """
    if OPENAI_API_KEY and OPENAI_API_KEY != "mock":
        return _analyze_with_openai(resume_text)
    else:
        return _analyze_mock(resume_text)


def _analyze_with_openai(resume_text: str) -> dict:
    """Use OpenAI GPT to analyze the resume."""
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = """You are an expert resume analyzer AI agent. 
    Analyze the provided resume and extract key information in JSON format.
    Be thorough and accurate."""

    user_prompt = f"""Analyze this resume and return a JSON object with:
{{
  "skills": ["list of technical and soft skills mentioned"],
  "experience_years": "estimated years of experience as a number",
  "experience_level": "Junior/Mid/Senior/Lead/Principal",
  "roles": ["list of job roles/titles this person is suited for"],
  "summary": "2-3 sentence professional summary",
  "education": "highest education qualification",
  "industries": ["industries the candidate has worked in"]
}}

Resume:
{resume_text}

Return ONLY valid JSON, no markdown."""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.3,
        max_tokens=1000
    )

    raw = response.choices[0].message.content.strip()
    # Remove code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def _analyze_mock(resume_text: str) -> dict:
    """
    Mock analysis using keyword extraction when no API key is set.
    Demonstrates agent behavior without API costs.
    """
    text_lower = resume_text.lower()

    # Keyword-based skill extraction
    skill_keywords = {
        "Python": ["python"],
        "JavaScript": ["javascript", "js"],
        "TypeScript": ["typescript", "ts"],
        "React": ["react", "reactjs", "react.js"],
        "Next.js": ["next.js", "nextjs"],
        "Node.js": ["node.js", "nodejs"],
        "FastAPI": ["fastapi"],
        "Django": ["django"],
        "Flask": ["flask"],
        "SQL": ["sql", "mysql", "postgresql", "sqlite"],
        "PostgreSQL": ["postgresql", "postgres"],
        "MongoDB": ["mongodb", "mongo"],
        "Docker": ["docker"],
        "Kubernetes": ["kubernetes", "k8s"],
        "AWS": ["aws", "amazon web services"],
        "GCP": ["gcp", "google cloud"],
        "Azure": ["azure", "microsoft azure"],
        "Machine Learning": ["machine learning", "ml"],
        "Deep Learning": ["deep learning", "neural network"],
        "NLP": ["nlp", "natural language processing"],
        "TensorFlow": ["tensorflow"],
        "PyTorch": ["pytorch"],
        "Scikit-learn": ["scikit-learn", "sklearn"],
        "Git": ["git", "github", "gitlab"],
        "REST API": ["rest api", "restful", "rest"],
        "GraphQL": ["graphql"],
        "Redis": ["redis"],
        "Linux": ["linux", "ubuntu", "unix"],
        "HTML": ["html"],
        "CSS": ["css", "scss", "sass"],
        "Agile": ["agile", "scrum", "kanban"],
        "CI/CD": ["ci/cd", "jenkins", "github actions"],
        "Terraform": ["terraform"],
        "OpenAI API": ["openai", "gpt", "chatgpt"],
        "LangChain": ["langchain"],
        "Data Analysis": ["data analysis", "pandas", "numpy"],
        "DevOps": ["devops"],
        "Microservices": ["microservices", "microservice"],
        "Pandas": ["pandas"],
        "NumPy": ["numpy"],
    }

    detected_skills = []
    for skill, keywords in skill_keywords.items():
        if any(kw in text_lower for kw in keywords):
            detected_skills.append(skill)

    # Estimate experience
    experience_years = 0
    if "10+" in resume_text or "10 years" in text_lower:
        experience_years = 10
    elif "8+" in resume_text or "8 years" in text_lower:
        experience_years = 8
    elif "7+" in resume_text or "7 years" in text_lower:
        experience_years = 7
    elif "5+" in resume_text or "5 years" in text_lower:
        experience_years = 5
    elif "3+" in resume_text or "3 years" in text_lower:
        experience_years = 3
    elif "2+" in resume_text or "2 years" in text_lower:
        experience_years = 2
    elif "1 year" in text_lower or "fresher" in text_lower:
        experience_years = 1
    else:
        # Estimate based on skill count
        experience_years = min(len(detected_skills) // 3, 8)

    if experience_years >= 7:
        level = "Senior"
    elif experience_years >= 4:
        level = "Mid"
    elif experience_years >= 2:
        level = "Junior"
    else:
        level = "Entry Level"

    # Role inference
    roles = []
    if any(s in detected_skills for s in ["Python", "FastAPI", "Django"]):
        roles.append("Backend Python Developer")
    if any(s in detected_skills for s in ["React", "Next.js", "HTML", "CSS"]):
        roles.append("Frontend Developer")
    if all(s in detected_skills for s in ["React", "Python"]):
        roles.append("Full Stack Developer")
    if any(s in detected_skills for s in ["Machine Learning", "Deep Learning", "TensorFlow", "PyTorch"]):
        roles.append("Machine Learning Engineer")
    if any(s in detected_skills for s in ["Docker", "Kubernetes", "Terraform", "CI/CD"]):
        roles.append("DevOps Engineer")
    if any(s in detected_skills for s in ["OpenAI API", "LangChain", "NLP"]):
        roles.append("AI/LLM Engineer")
    if any(s in detected_skills for s in ["Data Analysis", "Pandas"]):
        roles.append("Data Scientist")
    if any(s in detected_skills for s in ["AWS", "GCP", "Azure"]):
        roles.append("Cloud Engineer")
    if not roles:
        roles = ["Software Developer"]

    # Education extraction
    education = "Not specified"
    if "phd" in text_lower or "ph.d" in text_lower:
        education = "PhD"
    elif "master" in text_lower or "m.tech" in text_lower or "m.e." in text_lower:
        education = "Master's Degree"
    elif "bachelor" in text_lower or "b.tech" in text_lower or "b.e." in text_lower or "b.sc" in text_lower:
        education = "Bachelor's Degree"
    elif "diploma" in text_lower:
        education = "Diploma"

    skills_str = ", ".join(detected_skills[:5]) if detected_skills else "various technologies"
    summary = (
        f"A {level} professional with approximately {experience_years} years of experience. "
        f"Key skills include {skills_str}. "
        f"Best suited for roles in {', '.join(roles[:2])}."
    )

    return {
        "skills": detected_skills,
        "experience_years": experience_years,
        "experience_level": level,
        "roles": roles,
        "summary": summary,
        "education": education,
        "industries": ["Technology", "Software Development"]
    }
