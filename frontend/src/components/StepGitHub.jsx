import { useState, useEffect, useRef } from "react";
import { getGitHubUserProfile, redirectToGitHubLogin } from "../api.js";

function extractUsername(val) {
  if (!val) return "";
  let clean = val.trim();
  clean = clean.replace(/\/+$/, "");
  const match = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  if (match) return match[1];
  clean = clean.replace(/^@/, "");
  return clean;
}

export default function StepGitHub({ detectedGithub, initialOauthToken, oauthError, onNext, onBack }) {
  const [inputUrl, setInputUrl]         = useState(detectedGithub?.url || detectedGithub?.username || "");
  const [githubUser, setGithubUser]     = useState(null);
  const [loading, setLoading]           = useState(false);
  const [oauthLoading, setOauthLoading] = useState(!!initialOauthToken);
  const [error, setError]               = useState(oauthError ? decodeURIComponent(oauthError) : null);
  const [showPrivateAuth, setShowPrivateAuth] = useState(false);
  const [patToken, setPatToken]         = useState("");
  const [patLoading, setPatLoading]     = useState(false);
  const [patError, setPatError]         = useState(null);

  const oauthVerifiedRef = useRef(false);

  // If returning from OAuth redirect with an access token, verify and load account
  useEffect(() => {
    if (initialOauthToken && !oauthVerifiedRef.current) {
      oauthVerifiedRef.current = true;
      verifyOAuth(initialOauthToken);
    }
  }, [initialOauthToken]); // eslint-disable-line

  // Automatically pre-fill and fetch profile when candidate GitHub is detected from resume
  useEffect(() => {
    if (detectedGithub?.username || detectedGithub?.url) {
      const val = detectedGithub.url || detectedGithub.username;
      setInputUrl(val);
      if (!githubUser && !initialOauthToken) {
        fetchProfile(detectedGithub.username);
      }
    }
  }, [detectedGithub?.username, detectedGithub?.url]); // eslint-disable-line

  async function verifyOAuth(token) {
    setOauthLoading(true);
    setError(null);
    try {
      const resp = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (!resp.ok) {
        throw new Error("GitHub OAuth session expired or invalid. Please sign in again.");
      }
      const user = await resp.json();
      setGithubUser(user);
      // Advance to Step 4 (Repository selection) with the authenticated session
      onNext({ accessToken: token, githubUser: user });
    } catch (err) {
      setError(err.message || "Failed to authenticate with GitHub");
    } finally {
      setOauthLoading(false);
    }
  }

  async function fetchProfile(forcedName) {
    const raw = forcedName || extractUsername(inputUrl);
    if (!raw) {
      setError("Please enter a GitHub profile URL or username.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await getGitHubUserProfile(raw);
      setGithubUser(user);
    } catch (err) {
      setError(err.message || `Failed to fetch GitHub profile for '${raw}'`);
      setGithubUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function verifyPAT() {
    const t = patToken.trim();
    if (!t) { setPatError("Please enter a Personal Access Token."); return; }
    setPatLoading(true);
    setPatError(null);
    try {
      const resp = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json" }
      });
      if (!resp.ok) throw new Error("Invalid token — check it has repo + read:user scopes.");
      const user = await resp.json();
      setGithubUser(user);
      onNext({ accessToken: t, githubUser: user });
    } catch (err) {
      setPatError(err.message);
    } finally {
      setPatLoading(false);
    }
  }

  function handleProceed() {
    if (!githubUser) return;
    onNext({
      githubUser,
      accessToken: null // Public repository verification mode
    });
  }

  // Visual loading screen while OAuth token is being confirmed
  if (oauthLoading) {
    return (
      <div className="fade-up">
        <p className="eyebrow">Step 03 — GitHub</p>
        <div className="loading-block" style={{ padding: "60px 0" }}>
          <div className="spinner spinner--lg" />
          <p className="loading-title">Connecting GitHub account…</p>
          <p style={{ color: "var(--text-3)", fontSize: "0.85rem", marginTop: 8 }}>
            Verifying your OAuth session with GitHub
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <p className="eyebrow">Step 03 — GitHub Profile</p>
      <h1 className="page-title">Candidate <em>GitHub</em></h1>
      <p className="page-subtitle">
        Verify claims against public repositories without requiring login.
        Just confirm the developer's GitHub profile.
      </p>

      {/* ── Auto-detected resume pill ── */}
      {detectedGithub && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 18px",
          background: "linear-gradient(90deg, rgba(0, 212, 255, 0.1) 0%, rgba(13, 22, 40, 0.8) 100%)",
          border: "1px solid var(--border-2)",
          borderRadius: "var(--r-md)",
          marginBottom: 20,
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: "1.1rem" }}>⚡</span>
            <div>
              <div style={{ fontSize: "0.825rem", color: "var(--cyan)", fontWeight: 600, letterSpacing: "0.03em" }}>
                AUTO-DETECTED FROM RESUME
              </div>
              <div style={{ fontSize: "0.775rem", color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                Found link: <span style={{ color: "var(--text)" }}>{detectedGithub.url}</span>
              </div>
            </div>
          </div>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.75rem", padding: "6px 12px", height: "auto" }}
            onClick={() => {
              setInputUrl(detectedGithub.url);
              fetchProfile(detectedGithub.username);
            }}
          >
            Use This Profile
          </button>
        </div>
      )}

      {/* ── URL Input Box ── */}
      <div className="card card--glow" style={{ padding: "24px", marginBottom: 24 }}>
        <label className="field-label" style={{ marginBottom: 10, display: "block" }}>
          GitHub Profile URL or Username
        </label>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <span style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-3)",
              display: "flex",
              alignItems: "center"
            }}>
              <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </span>
            <input
              id="github-url-input"
              type="text"
              className="input"
              placeholder="e.g. https://github.com/Maaz-shaikh20 or Maaz-shaikh20"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchProfile()}
              style={{ paddingLeft: 42 }}
            />
          </div>
          <button
            id="github-fetch-btn"
            className="btn btn-primary"
            onClick={() => fetchProfile()}
            disabled={loading || !inputUrl.trim()}
          >
            {loading ? <><div className="spinner" /> Fetching…</> : "Fetch Profile →"}
          </button>
        </div>

        {error && <div className="error-block" style={{ marginTop: 16 }}>{error}</div>}
      </div>

      {/* ── Candidate Profile Preview Card ── */}
      {githubUser && (
        <div
          className="fade-up"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-3)",
            borderRadius: "var(--r-lg)",
            padding: "24px",
            marginBottom: 24,
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 212, 255, 0.08)"
          }}
        >
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
            <img
              src={githubUser.avatar_url}
              alt={githubUser.login}
              style={{
                width: 72,
                height: 72,
                borderRadius: "var(--r-md)",
                border: "2px solid var(--cyan)",
                background: "var(--surface)",
                flexShrink: 0
              }}
            />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text)" }}>
                  {githubUser.name || githubUser.login}
                </h3>
                <a
                  href={githubUser.html_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.825rem",
                    color: "var(--cyan)",
                    textDecoration: "none"
                  }}
                >
                  @{githubUser.login} ↗
                </a>
                <span className="method-badge" style={{ background: "var(--green-dim)", color: "var(--green)", borderColor: "rgba(0,232,122,0.3)" }}>
                  ✓ Profile Ready
                </span>
              </div>

              {githubUser.bio && (
                <p style={{ fontSize: "0.875rem", color: "var(--text-2)", marginBottom: 14, fontStyle: "italic" }}>
                  "{githubUser.bio}"
                </p>
              )}

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: "0.8125rem", color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                <span>📦 <strong style={{ color: "var(--text)" }}>{githubUser.public_repos}</strong> public repos</span>
                <span>👥 <strong style={{ color: "var(--text)" }}>{githubUser.followers}</strong> followers</span>
                {githubUser.location && <span>📍 {githubUser.location}</span>}
                {githubUser.company && <span>🏢 {githubUser.company}</span>}
              </div>
            </div>
          </div>

          <div style={{
            marginTop: 20,
            paddingTop: 18,
            borderTop: "1px solid var(--border)",
            display: "flex",
            justifyContent: "flex-end"
          }}>
            <button
              id="confirm-github-user-btn"
              className="btn btn-primary btn-lg"
              onClick={handleProceed}
            >
              Verify Claims with @{githubUser.login} →
            </button>
          </div>
        </div>
      )}

      {/* ── Optional: Private Repositories Section ── */}
      <div style={{ marginTop: 28, borderTop: "1px solid var(--border)", paddingTop: 20 }}>
        <button
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "space-between", fontSize: "0.8125rem", padding: "10px 16px" }}
          onClick={() => setShowPrivateAuth(!showPrivateAuth)}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔒</span>
            <span>Need to verify <strong>private</strong> repositories? (Optional OAuth / Token)</span>
          </span>
          <span>{showPrivateAuth ? "▲ Hide" : "▼ Expand"}</span>
        </button>

        {showPrivateAuth && (
          <div className="fade-up" style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* OAuth */}
            <div className="connect-method connect-method--primary">
              <div className="method-label">
                <span>OAuth Login</span>
                <span className="method-badge">PRIVATE REPOS ACCESS</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: 12 }}>
                Sign in with GitHub to allow SkillForge to scan your private code.
              </p>
              <button id="github-oauth-btn" className="btn btn-github" onClick={redirectToGitHubLogin}>
                <svg height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Sign in with GitHub OAuth
              </button>
            </div>

            {/* PAT */}
            <div className="connect-method">
              <div className="method-label">Personal Access Token</div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-2)", marginBottom: 12 }}>
                Or use a Personal Access Token with <code style={{ color: "var(--amber)", fontFamily: "var(--font-mono)" }}>repo</code> scope.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <input
                  type="password"
                  className="input"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={patToken}
                  onChange={(e) => setPatToken(e.target.value)}
                />
                <button
                  className="btn btn-amber"
                  onClick={verifyPAT}
                  disabled={patLoading || !patToken.trim()}
                >
                  {patLoading ? <><div className="spinner" /> Verifying…</> : "Verify Token →"}
                </button>
              </div>
              {patError && <div className="error-block" style={{ marginTop: 12 }}>{patError}</div>}
            </div>
          </div>
        )}
      </div>

      <div className="nav-row" style={{ marginTop: 32 }}>
        <button id="step3-back-btn" className="btn btn-ghost" onClick={onBack}>← Back</button>
      </div>
    </div>
  );
}
