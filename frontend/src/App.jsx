import { useState, useEffect, Component } from "react";
import StepUpload      from "./components/StepUpload.jsx";
import StepSkillClaims from "./components/StepSkillClaims.jsx";
import StepGitHub      from "./components/StepGitHub.jsx";
import StepRepository  from "./components/StepRepository.jsx";
import StepResults     from "./components/StepResults.jsx";

// ── Error Boundary to prevent any unhandled error from causing a blank screen ──
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("SkillForge ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          color: "var(--text)",
          padding: 24,
          fontFamily: "var(--font-body)"
        }}>
          <div style={{
            maxWidth: 500,
            padding: 32,
            background: "var(--surface)",
            border: "1px solid var(--border-2)",
            borderRadius: "var(--r-lg)",
            textAlign: "center",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ color: "var(--red)", marginBottom: 12, fontSize: "1.25rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "var(--text-2)", marginBottom: 20, fontSize: "0.875rem", lineHeight: 1.6 }}>
              {this.state.error?.message || "An unexpected error occurred while rendering the page."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                sessionStorage.removeItem("sf_pre_oauth_state");
                window.location.href = window.location.pathname;
              }}
            >
              ↺ Restart SkillForge
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STEPS = [
  { num: "01", name: "Resume",     desc: "Upload PDF" },
  { num: "02", name: "Skills",     desc: "Review claims" },
  { num: "03", name: "GitHub",     desc: "Profile / URL" },
  { num: "04", name: "Scope",      desc: "Verify mode" },
  { num: "05", name: "Results",    desc: "Verification" },
];

const BREADCRUMBS = [
  "resume / upload",
  "resume / skills",
  "github / profile",
  "github / scope",
  "verification / results",
];

function MainApp() {
  // Read any query parameters from OAuth redirect
  const searchParams = new URLSearchParams(window.location.search);
  const rawToken     = searchParams.get("accessToken");
  const rawError     = searchParams.get("oauthError");

  const oauthToken = (rawToken && rawToken !== "undefined" && rawToken !== "null") ? rawToken : "";
  const oauthError = (rawError && rawError !== "undefined" && rawError !== "null") ? rawError : "";

  // Initial step: If coming back from OAuth, land on Step 2 (GitHub)
  const [step, setStep] = useState(() => {
    if (oauthToken || oauthError) {
      return 2;
    }
    return 0;
  });

  // Restore pre-OAuth state from sessionStorage
  const [appState, setAppState] = useState(() => {
    let base = {};
    if (oauthToken || oauthError) {
      try {
        const saved = sessionStorage.getItem("sf_pre_oauth_state");
        if (saved) base = JSON.parse(saved);
      } catch { /* ignore */ }
    }
    if (oauthToken) {
      base.accessToken = oauthToken;
    }
    return base;
  });

  // Clean query params from the browser address bar immediately so they don't linger
  useEffect(() => {
    if (rawToken || rawError) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []); // eslint-disable-line

  function advance(newData = {}) {
    setAppState(prev => {
      const next = { ...prev, ...newData };
      try { sessionStorage.setItem("sf_pre_oauth_state", JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    setStep(s => Math.min(4, s + 1));
  }

  function back() { setStep(s => Math.max(0, s - 1)); }

  function restart() {
    window.history.replaceState({}, "", window.location.pathname);
    sessionStorage.removeItem("sf_pre_oauth_state");
    setAppState({});
    setStep(0);
  }

  function renderStep() {
    switch (step) {
      case 0: return <StepUpload onNext={advance} />;
      case 1: return <StepSkillClaims resumeData={appState.resumeData} onNext={advance} onBack={back} />;
      case 2: return <StepGitHub
                        detectedGithub={appState.resumeData?.detectedGithub}
                        initialOauthToken={oauthToken}
                        oauthError={oauthError}
                        onNext={advance}
                        onBack={back}
                      />;
      case 3: return <StepRepository
                        githubUser={appState.githubUser}
                        accessToken={appState.accessToken}
                        onNext={advance}
                        onBack={back}
                      />;
      case 4: return <StepResults
                        githubUser={appState.githubUser}
                        accessToken={appState.accessToken}
                        repo={appState.repo}
                        skills={appState.skills}
                        verificationMode={appState.verificationMode || "all"}
                        onRestart={restart}
                      />;
      default: return <StepUpload onNext={advance} />;
    }
  }

  const safeStep = Math.min(Math.max(0, step), STEPS.length - 1);

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
                i === safeStep ? "step-item--active" : "",
                i < safeStep   ? "step-item--done"   : ""
              ].join(" ")}
            >
              <div className={[
                "step-dot",
                i === safeStep ? "step-dot--active" : "",
                i < safeStep   ? "step-dot--done"   : ""
              ].join(" ")}>
                {i < safeStep && (
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
            skillforge / <span>{BREADCRUMBS[safeStep] || "verification"}</span>
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

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
