"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import ScoreRing from "@/components/ScoreRing";
import AgentFlowStatus from "@/components/AgentFlowStatus";
import EmailModal from "@/components/EmailModal";

const API_BASE = "http://localhost:8000";

interface Profile {
  skills: string[];
  experience_years: number;
  experience_level: string;
  roles: string[];
  summary: string;
  education: string;
  industries: string[];
}

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  description: string;
  requirements: string[];
  experience: string;
  posted: string;
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  match_quality: string;
  badge_color: string;
  score_breakdown: {
    skills: number;
    experience: number;
    role_fit: number;
  };
}

interface AnalysisResult {
  profile: Profile;
  top_jobs: Job[];
  suggestions: string[];
  total_jobs_analyzed: number;
  workflow: Record<string, string>;
}

type LoadingStep = "idle" | "analyzing" | "finding" | "matching" | "suggesting" | "done";

const SAMPLE_RESUME = `John Smith
Senior Full Stack Developer
Email: john.smith@email.com | LinkedIn: linkedin.com/in/johnsmith

PROFESSIONAL SUMMARY
Experienced Full Stack Developer with 5+ years of building scalable web applications using Python, React, and cloud technologies. Proven track record in designing microservices architectures and delivering high-quality software solutions.

SKILLS
• Languages: Python, JavaScript, TypeScript, SQL
• Frontend: React, Next.js, HTML, CSS
• Backend: FastAPI, Django, Node.js, REST API
• Databases: PostgreSQL, MongoDB, Redis
• DevOps: Docker, AWS, Git, CI/CD
• Other: Machine Learning basics, Agile/Scrum

EXPERIENCE
Senior Software Engineer | TechStartup Inc. (2022 – Present)
• Led development of microservices backend using Python FastAPI serving 500K+ daily users
• Built React dashboard with real-time data visualization
• Reduced API response time by 40% through Redis caching

Full Stack Developer | WebAgency Co. (2020 – 2022)
• Developed Django-based web applications for enterprise clients
• Implemented PostgreSQL database optimizations

EDUCATION
B.Tech in Computer Science | State University (2019)

CERTIFICATIONS
• AWS Certified Developer Associate
• Docker Certified Associate`;

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("paste");
  const [resumeText, setResumeText] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<{ job: Job } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(3000) });
        if (res.ok) setBackendStatus("online");
        else setBackendStatus("offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    checkHealth();
  }, []);

  // Simulate step-by-step agent loading
  const runAgentWorkflow = async (text: string) => {
    setError(null);
    setResult(null);

    setLoadingStep("analyzing");
    await new Promise(r => setTimeout(r, 600));
    setLoadingStep("finding");
    await new Promise(r => setTimeout(r, 500));
    setLoadingStep("matching");
    await new Promise(r => setTimeout(r, 400));
    setLoadingStep("suggesting");

    try {
      const res = await fetch(`${API_BASE}/api/analyze-resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: text }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setLoadingStep("done");
      await new Promise(r => setTimeout(r, 300));
      setResult(data);
      setLoadingStep("idle");

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setLoadingStep("idle");
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
    }
  };

  const handleAnalyze = () => {
    const text = resumeText.trim();
    if (!text) {
      setError("Please paste or upload your resume first.");
      return;
    }
    runAgentWorkflow(text);
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files are supported. Please upload a PDF.");
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    setLoadingStep("analyzing");
    await new Promise(r => setTimeout(r, 600));
    setLoadingStep("finding");
    await new Promise(r => setTimeout(r, 500));
    setLoadingStep("matching");
    await new Promise(r => setTimeout(r, 400));
    setLoadingStep("suggesting");

    try {
      const res = await fetch(`${API_BASE}/api/upload-resume`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || `Server error: ${res.status}`);
      }

      const data: AnalysisResult = await res.json();
      setLoadingStep("done");
      await new Promise(r => setTimeout(r, 300));
      setResult(data);
      setLoadingStep("idle");

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setLoadingStep("idle");
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, []);

  const handleGenerateEmail = async (job: Job) => {
    if (!result) return;
    setEmailModal({ job });
  };

  const handleCopyEmail = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const isLoading = loadingStep !== "idle";

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-inner">
          <div className="navbar-logo">
            <div className="navbar-logo-icon">🤖</div>
            <span className="navbar-logo-text">Smart Job Hunter</span>
            <span className="navbar-badge">AI Agent</span>
          </div>
          <div className="navbar-status">
            <div className={`status-dot ${backendStatus === "offline" ? "bg-red-500" : ""}`}
              style={backendStatus === "offline" ? { background: "var(--accent-red)" } : {}} />
            <span>
              {backendStatus === "checking" ? "Connecting..." :
               backendStatus === "online" ? "Agents Online" : "Backend Offline"}
            </span>
          </div>
        </div>
      </nav>

      <main className="main-wrapper">
        {/* Hero */}
        <section className="hero-section">
          <div className="hero-glow" />
          <div className="hero-label">
            <span>⚡</span>
            <span>Autonomous Multi-Agent AI System</span>
          </div>
          <h1 className="hero-title">
            Let AI Agents Find Your<br />
            <span className="gradient-text">Perfect Job Match</span>
          </h1>
          <p className="hero-subtitle">
            Upload your resume and watch 4 specialized AI agents collaborate to analyze your profile,
            find matching jobs, score them, and draft personalized application emails.
          </p>

          {/* Agent Flow */}
          <AgentFlowStatus currentStep={loadingStep} />
        </section>

        {/* ── Resume Input ─────────────────────────────────────────────────── */}
        <section className="card section-gap">
          <div className="card-header">
            <div className="card-icon card-icon-purple">📄</div>
            <div>
              <h2 className="card-title">Upload Your Resume</h2>
              <p className="card-subtitle">PDF upload or paste resume text to get started</p>
            </div>
          </div>

          <div className="tab-group">
            <button
              id="tab-paste"
              className={`tab-btn ${activeTab === "paste" ? "active" : ""}`}
              onClick={() => setActiveTab("paste")}
            >✏️ Paste Text</button>
            <button
              id="tab-upload"
              className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => setActiveTab("upload")}
            >📤 Upload PDF</button>
          </div>

          {activeTab === "paste" && (
            <div>
              <textarea
                id="resume-textarea"
                className="textarea"
                placeholder="Paste your resume here... Include your skills, experience, education, and job history."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={10}
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  id="analyze-btn"
                  className="btn btn-primary"
                  onClick={handleAnalyze}
                  disabled={isLoading || !resumeText.trim()}
                >
                  {isLoading ? (
                    <><div className="spinner" style={{ width: 18, height: 18 }} /> Agents Working...</>
                  ) : (
                    <>🚀 Analyze Resume</>
                  )}
                </button>
                <button
                  id="sample-btn"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setResumeText(SAMPLE_RESUME)}
                >
                  📋 Load Sample
                </button>
                {resumeText && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setResumeText(""); setResult(null); setError(null); }}
                  >
                    🗑 Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "upload" && (
            <div>
              <div
                className={`upload-zone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-icon">📂</div>
                <div className="upload-text">
                  {dragging ? "Drop your PDF here!" : "Click or drag & drop your resume"}
                </div>
                <div className="upload-hint">PDF files only • Max 10MB</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="upload-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                />
              </div>
              {isLoading && (
                <div className="flex items-center gap-3 mt-3" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                  <div className="spinner" />
                  Processing your resume...
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="error-banner mt-4">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
        </section>

        {/* ── Loading Animation ─────────────────────────────────────────── */}
        {isLoading && (
          <section className="card section-gap">
            <LoadingView step={loadingStep} />
          </section>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {result && !isLoading && (
          <div ref={resultsRef}>
            {/* Profile Analysis */}
            <section className="card section-gap">
              <div className="card-header">
                <div className="card-icon card-icon-purple">🧠</div>
                <div>
                  <h2 className="card-title">Profile Analysis</h2>
                  <p className="card-subtitle">Extracted by the Profile Analyzer Agent</p>
                </div>
              </div>

              <div className="profile-grid">
                <div className="profile-stat">
                  <div className="profile-stat-value">{result.profile.experience_level}</div>
                  <div className="profile-stat-label">Experience Level</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{result.profile.experience_years}+</div>
                  <div className="profile-stat-label">Years Experience</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{result.profile.skills.length}</div>
                  <div className="profile-stat-label">Skills Detected</div>
                </div>
                <div className="profile-stat">
                  <div className="profile-stat-value">{result.total_jobs_analyzed}</div>
                  <div className="profile-stat-label">Jobs Analyzed</div>
                </div>
              </div>

              <div className="divider" />

              <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                {result.profile.summary}
              </p>

              <div className="mb-2" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Detected Skills
              </div>
              <div className="skills-grid">
                {result.profile.skills.map((skill) => (
                  <span key={skill} className="skill-tag skill-tag-purple">
                    ✓ {skill}
                  </span>
                ))}
                {result.profile.skills.length === 0 && (
                  <span style={{ color: "var(--text-muted)", fontSize: 13 }}>No skills detected</span>
                )}
              </div>

              {result.profile.roles.length > 0 && (
                <>
                  <div className="mt-4 mb-2" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Suitable Roles
                  </div>
                  <div className="skills-grid">
                    {result.profile.roles.map((role) => (
                      <span key={role} className="skill-tag skill-tag-blue">
                        🎯 {role}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </section>

            {/* Top Jobs */}
            <section className="card section-gap">
              <div className="card-header">
                <div className="card-icon card-icon-blue">💼</div>
                <div>
                  <h2 className="card-title">Top Matched Jobs</h2>
                  <p className="card-subtitle">Ranked by Matching Agent · Showing top {result.top_jobs.length} of {result.total_jobs_analyzed}</p>
                </div>
              </div>

              <div className="jobs-grid">
                {result.top_jobs.map((job, i) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    rank={i + 1}
                    expanded={expandedJob === job.id}
                    onToggle={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                    onGenerateEmail={() => handleGenerateEmail(job)}
                  />
                ))}
              </div>
            </section>

            {/* Resume Suggestions */}
            {result.suggestions.length > 0 && (
              <section className="card section-gap">
                <div className="card-header">
                  <div className="card-icon card-icon-pink">💡</div>
                  <div>
                    <h2 className="card-title">Resume Improvement Tips</h2>
                    <p className="card-subtitle">Personalized suggestions from the Action Agent</p>
                  </div>
                </div>
                <div className="suggestions-list">
                  {result.suggestions.map((s, i) => (
                    <div key={i} className="suggestion-item">
                      <div className="suggestion-dot" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Start Over */}
            <div className="flex items-center justify-center mt-6">
              <button
                id="restart-btn"
                className="btn btn-secondary"
                onClick={() => { setResult(null); setResumeText(""); setError(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              >
                🔄 Analyze Another Resume
              </button>
            </div>
          </div>
        )}

        {/* ── Email Modal ───────────────────────────────────────────────── */}
        {emailModal && result && (
          <EmailModal
            job={emailModal.job}
            profile={result.profile}
            onClose={() => setEmailModal(null)}
            onCopy={handleCopyEmail}
            copied={copiedEmail}
          />
        )}
      </main>
    </div>
  );
}

/* ─── Sub-Components ─────────────────────────────────────────────────────────── */

function LoadingView({ step }: { step: LoadingStep }) {
  const steps = [
    { id: "analyzing", label: "Profile Analyzer Agent", desc: "Extracting skills & experience", icon: "🧠" },
    { id: "finding", label: "Job Finder Agent", desc: "Scanning job database", icon: "🔍" },
    { id: "matching", label: "Matching Agent", desc: "Computing match scores", icon: "⚖️" },
    { id: "suggesting", label: "Action Agent", desc: "Generating recommendations", icon: "✉️" },
    { id: "done", label: "Complete!", desc: "Results ready", icon: "✅" },
  ];

  const currentIdx = steps.findIndex(s => s.id === step);

  return (
    <div className="loading-container">
      <div className="spinner spinner-lg" />
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600 }}>
        AI Agents Collaborating...
      </div>
      <div className="loading-agents">
        {steps.map((s, i) => {
          let status: "pending" | "running" | "done" = "pending";
          if (i < currentIdx) status = "done";
          else if (i === currentIdx) status = "running";
          return (
            <div key={s.id} className={`loading-agent-step ${status === "running" ? "running" : ""} ${status === "done" ? "done" : ""}`}>
              <span className="step-icon">{status === "done" ? "✅" : status === "running" ? "🔄" : "⏳"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{s.desc}</div>
              </div>
              {status === "running" && <div className="spinner" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JobCard({
  job, rank, expanded, onToggle, onGenerateEmail
}: {
  job: Job;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
  onGenerateEmail: () => void;
}) {
  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
          <div className="job-rank-number">{rank}</div>
          <div className="job-meta" style={{ minWidth: 0 }}>
            <div className="job-title">{job.title}</div>
            <div className="job-company">
              🏢 {job.company}
            </div>
          </div>
        </div>
        <div className="score-ring-wrapper">
          <ScoreRing score={job.match_score} color={job.badge_color} />
          <span className={`match-badge ${job.badge_color}`}>{job.match_quality}</span>
        </div>
      </div>

      <div className="job-details">
        <span className="job-detail">📍 {job.location}</span>
        <span className="job-detail">💰 {job.salary}</span>
        <span className="job-detail">⏱ {job.experience}</span>
        <span className="job-detail">📅 {job.posted}</span>
      </div>

      <p className="job-description">{job.description}</p>

      {/* Matching / Missing skills */}
      {job.matching_skills.length > 0 && (
        <div className="mb-2">
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Your Matching Skills
          </div>
          <div className="skills-grid">
            {job.matching_skills.slice(0, 5).map(s => (
              <span key={s} className="skill-tag skill-tag-green">✓ {s}</span>
            ))}
            {job.matching_skills.length > 5 && (
              <span className="skill-tag skill-tag-green">+{job.matching_skills.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Expanded: score breakdown + missing skills */}
      {expanded && (
        <div>
          <div className="divider" style={{ margin: "16px 0" }} />
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
            Score Breakdown
          </div>
          <div className="score-breakdown">
            <div className="score-bar-row">
              <span className="score-bar-label">Skills Match</span>
              <div className="score-bar-track">
                <div className="score-bar-fill purple" style={{ width: `${(job.score_breakdown.skills / 70) * 100}%` }} />
              </div>
              <span className="score-bar-value">{job.score_breakdown.skills}/70</span>
            </div>
            <div className="score-bar-row">
              <span className="score-bar-label">Experience</span>
              <div className="score-bar-track">
                <div className="score-bar-fill blue" style={{ width: `${(job.score_breakdown.experience / 20) * 100}%` }} />
              </div>
              <span className="score-bar-value">{job.score_breakdown.experience}/20</span>
            </div>
            <div className="score-bar-row">
              <span className="score-bar-label">Role Fit</span>
              <div className="score-bar-track">
                <div className="score-bar-fill pink" style={{ width: `${(job.score_breakdown.role_fit / 20) * 100}%` }} />
              </div>
              <span className="score-bar-value">{job.score_breakdown.role_fit}/20</span>
            </div>
          </div>

          {job.missing_skills.length > 0 && (
            <div className="mt-4">
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Skills to Develop
              </div>
              <div className="skills-grid">
                {job.missing_skills.slice(0, 6).map(s => (
                  <span key={s} className="skill-tag skill-tag-yellow">⚡ {s}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="job-footer mt-3">
        <div className="flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={onToggle}
            id={`expand-job-${job.id}`}
          >
            {expanded ? "▲ Less" : "▼ Details"}
          </button>
        </div>
        <button
          id={`email-btn-${job.id}`}
          className="btn btn-primary btn-sm"
          onClick={onGenerateEmail}
        >
          ✉️ Generate Email
        </button>
      </div>
    </div>
  );
}
