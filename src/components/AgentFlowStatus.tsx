"use client";

type LoadingStep = "idle" | "analyzing" | "finding" | "matching" | "suggesting" | "done";

const AGENTS = [
  { id: "analyzing", label: "Profile Analyzer", icon: "🧠" },
  { id: "finding", label: "Job Finder", icon: "🔍" },
  { id: "matching", label: "Matching Agent", icon: "⚖️" },
  { id: "suggesting", label: "Action Agent", icon: "✉️" },
];

const STEP_ORDER = ["idle", "analyzing", "finding", "matching", "suggesting", "done"];

export default function AgentFlowStatus({ currentStep }: { currentStep: LoadingStep }) {
  const currentIdx = STEP_ORDER.indexOf(currentStep);

  return (
    <div className="agent-flow">
      {AGENTS.map((agent, i) => {
        const agentStepIdx = STEP_ORDER.indexOf(agent.id);
        const isCompleted = currentIdx > agentStepIdx;
        const isActive = currentStep === agent.id;

        return (
          <>
            <div
              key={agent.id}
              className={`agent-node ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            >
              <span className="agent-icon">{isCompleted ? "✅" : agent.icon}</span>
              <span>{agent.label}</span>
            </div>
            {i < AGENTS.length - 1 && (
              <span key={`arrow-${i}`} className="agent-arrow">→</span>
            )}
          </>
        );
      })}
    </div>
  );
}
