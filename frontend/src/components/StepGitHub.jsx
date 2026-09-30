import { useState, useEffect } from "react";
import { redirectToGitHubLogin } from "../api.js";

export default function StepGitHub({ onNext, onBack }) {
  const [token, setToken]     = useState("");
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Pick up token from OAuth callback query string if present
  const oauthToken = new URLSearchParams(window.location.search).get("accessToken") || "";

  // Auto-verify immediately when an OAuth token arrives
  useEffect(() => {
    if (oauthToken) {
      // Small delay so the UI renders first, giving user visual feedback
      const t = setTimeout(() => verify(oauthToken), 400);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line

  async function verify(forcedToken) {
    const t = (forcedToken || oauthToken || token).trim();
    if (!t) { setError("Please enter a Personal Access Token."); return; }
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" }
      });
      if (!resp.ok) throw new Error("Invalid token — check it has repo + read:user scopes.");
      const user = await resp.json();
      onNext({ accessToken: t, githubUser: user });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-up">
      <p className="eyebrow">Step 03 — GitHub</p>
      <h1 className="page-title">Connect <em>GitHub</em></h1>
      <p className="page-subtitle">
        We need read access to your repositories and commit history to run verification.
      </p>

      <div className="connect-panel">
        {/* OAuth — recommended */}
        <div className="connect-method connect-method--primary">
          <div className="method-label">
            <span>OAuth — Recommended</span>
            <span className="method-badge">SECURE</span>
          </div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>
            Sign in with GitHub directly. No token handling required — we handle everything.
          </p>
          <button id="github-oauth-btn" className="btn btn-github"
            onClick={redirectToGitHubLogin}>
            <svg height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--text-3)", fontSize: "0.75rem" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontFamily: "var(--font-mono)" }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        {/* PAT */}
        <div className="connect-method">
          <div className="method-label">Personal Access Token</div>
          <p style={{ fontSize: "0.875rem", color: "var(--text-2)", lineHeight: 1.6 }}>
            Generate a token at{" "}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer"
              style={{ color: "var(--cyan)", textDecoration: "none" }}>
              github.com/settings/tokens
            </a>{" "}
            — needs <code style={{ fontFamily: "var(--font-mono)", color: "var(--amber)", fontSize: "0.85em" }}>repo</code> + <code style={{ fontFamily: "var(--font-mono)", color: "var(--amber)", fontSize: "0.85em" }}>read:user</code> scopes.
          </p>

          <div className="field">
            <input
              id="pat-input"
              type="password"
              className="input"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={oauthToken || token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              readOnly={!!oauthToken}
            />
            <button id="pat-submit-btn" className="btn btn-amber"
              onClick={verify} disabled={loading || (!token.trim() && !oauthToken)}>
              {loading ? <><div className="spinner" />Verifying…</> : "Verify Token →"}
            </button>
          </div>
        </div>

        {error && <div className="error-block">{error}</div>}
      </div>

      <div className="nav-row">
        <button id="step3-back-btn" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}
