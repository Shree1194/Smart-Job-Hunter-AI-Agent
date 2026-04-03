# 🤖 Smart Job Hunter AI Agent

> An autonomous multi-agent AI system that analyzes your resume, finds matching jobs, scores them, and drafts personalized application emails — all in one click.

![Smart Job Hunter](https://img.shields.io/badge/AI-Multi--Agent-7c3aed?style=for-the-badge&logo=robot)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-009688?style=for-the-badge&logo=fastapi)
![Next.js](https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python)

---

## 🧠 Multi-Agent Architecture

The system is built around **4 specialized AI agents** that collaborate autonomously:

```
📄 Resume Input
      ↓
🧠 Profile Analyzer Agent   → Extracts skills, experience, roles from resume
      ↓
🔍 Job Finder Agent         → Fetches job listings from local dataset
      ↓
⚖️  Matching Agent          → Scores each job (0–100) against your profile
      ↓
✉️  Action Agent            → Generates personalized application emails + resume tips
      ↓
📊 Results Dashboard
```

---

## ✨ Features

- **Resume Upload** — Paste text or upload a PDF
- **AI Profile Analysis** — Extracts skills, experience level, years of experience, suitable roles
- **Smart Job Matching** — Scores jobs using a multi-factor algorithm (skills 60pts + experience 20pts + role fit 20pts)
- **Top 5 Match Display** — Ranked job cards with match rings, matching/missing skills
- **Email Generator** — One-click personalized application email drafts (Action Agent)
- **Resume Suggestions** — Actionable improvement tips based on market skill gaps
- **OpenAI Integration** — Real AI when API key provided; smart mock mode when not
- **Stunning Dark UI** — Glassmorphism, gradient accents, animated score rings

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/smart-job-hunter-ai.git
cd smart-job-hunter-ai
```

### 2. Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
```

Configure environment (optional — works in mock mode by default):
```bash
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=your_key_here (or leave as "mock")
```

Start the backend:
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be available at: `http://localhost:8000`  
API docs: `http://localhost:8000/docs`

### 3. Frontend Setup (Next.js)

```bash
# From project root
npm install
npm run dev
```

Frontend will be available at: `http://localhost:3000`

---

## 🗂️ Project Structure

```
smart-job-hunter-ai/
├── backend/
│   ├── agents/
│   │   ├── profile_analyzer.py   # Agent 1: Extract profile from resume
│   │   ├── job_finder.py         # Agent 2: Fetch jobs from dataset
│   │   ├── matching_agent.py     # Agent 3: Score jobs against profile
│   │   └── action_agent.py       # Agent 4: Generate emails + suggestions
│   ├── data/
│   │   └── jobs.json             # Local job listings dataset (12 jobs)
│   ├── main.py                   # FastAPI application + endpoints
│   ├── requirements.txt
│   └── .env.example
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard page
│   │   ├── layout.tsx
│   │   └── globals.css           # Complete design system
│   └── components/
│       ├── ScoreRing.tsx         # Animated SVG match score ring
│       ├── AgentFlowStatus.tsx   # Agent pipeline visualizer
│       └── EmailModal.tsx        # Email draft modal
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Check backend & agent status |
| `POST` | `/api/analyze-resume` | Full workflow (text input) |
| `POST` | `/api/upload-resume` | Full workflow (PDF upload) |
| `POST` | `/api/generate-email` | Generate application email |
| `GET` | `/api/jobs` | List all job listings |
| `GET` | `/api/jobs/{id}` | Get specific job |

---

## 🤖 Agent Details

### Profile Analyzer Agent
- Extracts: skills, years of experience, experience level (Junior/Mid/Senior), suitable roles, education
- **With OpenAI**: Uses GPT-4o-mini for deep resume understanding
- **Mock mode**: Keyword-based extraction with 40+ skill patterns

### Job Finder Agent
- Loads from `data/jobs.json` (12 diverse job listings)
- Supports filtering by skills and roles
- Easily extensible to real job APIs (LinkedIn, Indeed, etc.)

### Matching Agent
- **Scoring formula**: Skills match (60pts) + Experience match (20pts) + Role fit (20pts)
- Partial/fuzzy skill matching via substring similarity
- Returns: `match_score`, `matching_skills`, `missing_skills`, `score_breakdown`

### Action Agent
- Generates professional, personalized application emails
- Creates targeted resume improvement suggestions based on skill gaps
- **With OpenAI**: GPT-4o-mini crafts unique, tailored content
- **Mock mode**: Smart template engine with profile-aware personalization

---

## 🎨 UI Screenshots

| Hero Dashboard | Profile Analysis | Job Matches | Email Draft |
|:-:|:-:|:-:|:-:|
| 4-agent flow diagram | Skills & roles extracted | Match scores 0-100 | Personalized email |

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | `mock` | Set to real key for AI-powered responses |

---

## 🛠️ Tech Stack

**Backend**
- FastAPI 0.135 — High-performance Python web framework  
- Pydantic — Data validation
- pdfplumber — PDF text extraction
- OpenAI Python SDK — LLM integration
- uvicorn — ASGI server

**Frontend**
- Next.js 16.2 — React framework with App Router
- TypeScript — Type safety
- Vanilla CSS — Custom design system (glassmorphism, gradients)
- Google Fonts (Inter + Space Grotesk)

---

## 📄 License

MIT License — feel free to use, modify, and distribute.

---

Built with ❤️ using a real multi-agent AI architecture. Each agent is independently modular and extensible.
