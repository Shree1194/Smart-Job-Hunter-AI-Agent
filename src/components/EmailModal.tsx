"use client";

import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

interface Job {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  matching_skills?: string[];
}

interface Profile {
  skills: string[];
  experience_years: number;
  experience_level: string;
  roles: string[];
  summary: string;
  education: string;
  industries: string[];
}

interface EmailResult {
  subject: string;
  body: string;
}

interface EmailModalProps {
  job: Job;
  profile: Profile;
  onClose: () => void;
  onCopy: (text: string) => void;
  copied: boolean;
}

export default function EmailModal({ job, profile, onClose, onCopy, copied }: EmailModalProps) {
  const [email, setEmail] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/generate-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile, job_id: job.id }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to generate email");
        }
        const data = await res.json();
        setEmail(data.email);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [job.id, profile]);

  const fullEmailText = email ? `Subject: ${email.subject}\n\n${email.body}` : "";

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18 }}>
              ✉️ Application Email Draft
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              {job.title} at {job.company}
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {email && (
              <button
                id="copy-email-btn"
                className="copy-btn"
                onClick={() => onCopy(fullEmailText)}
              >
                {copied ? "✅ Copied!" : "📋 Copy All"}
              </button>
            )}
            <button
              id="close-modal-btn"
              className="btn btn-secondary btn-sm btn-icon"
              onClick={onClose}
              style={{ borderRadius: "50%" }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="flex flex-col items-center" style={{ gap: 16, padding: "32px 0" }}>
              <div className="spinner spinner-lg" />
              <div style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                Action Agent is crafting your email...
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {email && !loading && (
            <>
              <div className="email-field">
                <div className="email-field-label">Subject Line</div>
                <div className="email-subject-display">{email.subject}</div>
              </div>

              <div className="email-field">
                <div className="email-field-label">Email Body</div>
                <div className="email-body-display">{email.body}</div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onCopy(fullEmailText)}
                >
                  {copied ? "✅ Copied to Clipboard!" : "📋 Copy Email"}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={onClose}>
                  Close
                </button>
              </div>

              <div className="mt-4" style={{ background: "rgba(124, 58, 237, 0.06)", border: "1px solid rgba(124, 58, 237, 0.15)", borderRadius: "var(--radius-md)", padding: "12px 16px" }}>
                <div style={{ fontSize: 12, color: "var(--accent-purple-light)", fontWeight: 600, marginBottom: 4 }}>
                  💡 Tip from Action Agent
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                  Personalize this email further by adding 1-2 specific achievements with metrics before sending.
                  Research {job.company} and mention something unique about them to stand out.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
