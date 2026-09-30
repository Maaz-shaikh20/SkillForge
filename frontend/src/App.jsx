import { useState } from "react";
import StepUpload      from "./components/StepUpload.jsx";
import StepSkillClaims from "./components/StepSkillClaims.jsx";
import StepGitHub      from "./components/StepGitHub.jsx";
import StepRepository  from "./components/StepRepository.jsx";
import StepResults     from "./components/StepResults.jsx";

const STEPS = [
  { num: "01", name: "Resume",     desc: "Upload PDF" },
  { num: "02", name: "Skills",     desc: "Review claims" },
  { num: "03", name: "GitHub",     desc: "Connect account" },
  { num: "04", name: "Scope",      desc: "Verify mode" },
  { num: "05", name: "Results",    desc: "Verification" },
];

const BREADCRUMBS = [
  "resume / upload",
  "resume / skills",
  "github / connect",
  "github / scope",
  "verification / results",
];

export default function App() {
  // When GitHub OAuth redirects back, the URL contains ?accessToken=...
  // Restore whatever state was saved before the OAuth redirect so skills
  // (and resumeData) survive the full-page reload.
  const oauthToken = new URLSearchParams(window.location.search).get("accessToken") || "";

  const [step, setStep] = useState(() => {
    if (oauthToken) {
      // Coming back from OAuth — jump to Step 2 (GitHub), state will be restored below
      return 2;
    }
    return 0;
  });

  const [appState, setAppState] = useState(() => {
    if (oauthToken) {
      // Restore pre-OAuth state (skills, resumeData) from sessionStorage
      try {
        const saved = sessionStorage.getItem("sf_pre_oauth_state");
        if (saved) return JSON.parse(saved);
      } catch { /* ignore parse errors */ }
    }
    return {};
  });

  function advance(newData = {}) {
    setAppState(prev => {
      const next = { ...prev, ...newData };
      // Persist to sessionStorage so skills survive the OAuth redirect
      try { sessionStorage.setItem("sf_pre_oauth_state", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setStep(s => s + 1);
  }

  function back() { setStep(s => Math.max(0, s - 1)); }

  function restart() {
    // Clear the accessToken from the URL and wipe saved state
    window.history.replaceState({}, "", window.location.pathname);
    sessionStorage.removeItem("sf_pre_oauth_state");
    setAppState({});
    setStep(0);
  }

  function renderStep() {
    switch (step) {
      case 0: return <StepUpload onNext={advance} />;
      case 1: return <StepSkillClaims resumeData={appState.resumeData} onNext={advance} onBack={back} />;
      case 2: return <StepGitHub onNext={advance} onBack={back} />;
      case 3: return <StepRepository githubUser={appState.githubUser} accessToken={appState.accessToken} onNext={advance} onBack={back} />;
      case 4: return <StepResults
                        githubUser={appState.githubUser}
                        accessToken={appState.accessToken}
                        repo={appState.repo}
                        skills={appState.skills}
                        verificationMode={appState.verificationMode || "single"}
                        onRestart={restart}
                      />;
      default: return null;
    }
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar__brand">
          <div className="sidebar__logo">
            <svg viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 5V13L9 17L2 13V5L9 1Z" stroke="#060c1a" strokeWidth="1.5" fill="#060c1a"/>
              <path d="M9 4L13 6.5V11.5L9 14L5 11.5V6.5L9 4Z" stroke="#060c1a" strokeWidth="1" fill="none"/>
              <circle cx="9" cy="9" r="2" fill="#060c1a"/>
            </svg>
          </div>
          <span className="sidebar__wordmark">SkillForge</span>
        </div>

        <nav className="step-track">
          <p className="step-track__label">Verification Flow</p>

          {STEPS.map((s, i) => (
            <div
              key={s.name}
              className={[
                "step-item",
                i === step ? "step-item--active" : "",
                i < step   ? "step-item--done"   : ""
              ].join(" ")}
            >
              <div className={[
                "step-dot",
                i === step ? "step-dot--active" : "",
                i < step   ? "step-dot--done"   : ""
              ].join(" ")}>
                {i < step && (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7L8 3" stroke="#060c1a" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </div>
              <div className="step-info">
                <div className="step-num">Step {s.num}</div>
                <div className="step-name">{s.name}</div>
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar__footer">
          <p className="sidebar__footer-text">
            Skills are verified against real GitHub commit history — not just file presence.
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-content">
        {/* Top bar */}
        <div className="main-topbar">
          <div className="topbar-breadcrumb">
            skillforge / <span>{BREADCRUMBS[step]}</span>
          </div>
          <div className="topbar-status">
            <div className="status-dot" />
            <span>Verification Engine Active</span>
          </div>
        </div>

        {/* Page body */}
        <div className="page-body">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
