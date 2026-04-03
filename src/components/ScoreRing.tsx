"use client";

const CIRCUMFERENCE = 2 * Math.PI * 30; // r=30

interface ScoreRingProps {
  score: number;
  color: "green" | "blue" | "yellow" | "red";
}

export default function ScoreRing({ score, color }: ScoreRingProps) {
  const filled = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;

  return (
    <div className="score-ring">
      <svg viewBox="0 0 72 72" width="72" height="72">
        <circle
          className="score-ring-bg"
          cx="36"
          cy="36"
          r="30"
        />
        <circle
          className={`score-ring-fill ${color}`}
          cx="36"
          cy="36"
          r="30"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={filled}
          style={{ transform: "rotate(-90deg)", transformOrigin: "36px 36px" }}
        />
      </svg>
      <div className="score-ring-text">
        <span className={`score-value ${color}`}>{score}</span>
        <span className="score-label-text">MATCH</span>
      </div>
    </div>
  );
}
