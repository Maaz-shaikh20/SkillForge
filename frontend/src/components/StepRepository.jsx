import { useState, useEffect } from "react";
import { getUserRepositories } from "../api.js";

const LANG_COLORS = {
  JavaScript:"#f1e05a", TypeScript:"#3178c6", Python:   "#3572A5",
  Java:      "#b07219", "C++":     "#f34b7d", C:         "#555",
  "C#":      "#178600", Go:        "#00ADD8", Rust:      "#dea584",
  Ruby:      "#701516", PHP:       "#4F5D95", HTML:      "#e34c26",
  CSS:       "#563d7c", Kotlin:    "#A97BFF"
};

export default function StepRepository({ githubUser, accessToken, onNext, onBack }) {
  // mode: "all" | "single"
  const [mode,     setMode]     = useState("all");
  const [repos,    setRepos]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState("");

  // Lazy-load repo list only when user switches to "single" mode
  useEffect(() => {
    if (mode !== "single" || repos.length > 0) return;
    setLoading(true);
    getUserRepositories(githubUser.login, accessToken)
      .then(data => setRepos([...data].sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [mode]); // eslint-disable-line

  const filtered = repos.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.description || "").toLowerCase().includes(search.toLowerCase())
  );

  function proceed() {
    if (mode === "all") {
      onNext({ verificationMode: "all", repo: null });
    } else {
      if (selected) onNext({ verificationMode: "single", repo: selected });
    }
  }

  const canProceed = mode === "all" || (mode === "single" && !!selected);

  return (
    <div className="fade-up">
      <p className="eyebrow">Step 04 — Repository</p>
      <h1 className="page-title">Choose <em>Scope</em></h1>
      <p className="page-subtitle">
        Verify across all your repositories for the most complete picture,
        or focus on a specific one.
      </p>

      {/* ── Mode cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>

        {/* All Repos card */}
        <button
          id="mode-all-btn"
          className={`mode-card ${mode === "all" ? "mode-card--active" : ""}`}
          onClick={() => setMode("all")}
        >
          <div className="mode-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="4" rx="1"/>
              <rect x="2" y="10" width="20" height="4" rx="1"/>
              <rect x="2" y="17" width="20" height="4" rx="1"/>
            </svg>
          </div>
          <div className="mode-card__body">
            <div className="mode-card__title">
              All Repositories
              <span className="method-badge" style={{ marginLeft: 8 }}>RECOMMENDED</span>
            </div>
            <p className="mode-card__desc">
              Scan every repo you own. We auto-select the ones with relevant
              files and aggregate the strongest evidence across all of them.
            </p>
            <div className="mode-card__tag">Most accurate · Finds evidence in any repo</div>
          </div>
        </button>

        {/* Single Repo card */}
        <button
          id="mode-single-btn"
          className={`mode-card ${mode === "single" ? "mode-card--active" : ""}`}
          onClick={() => setMode("single")}
        >
          <div className="mode-card__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h18v13H3z" rx="1"/>
              <path d="M8 21h8M12 17v4"/>
            </svg>
          </div>
          <div className="mode-card__body">
            <div className="mode-card__title">Single Repository</div>
            <p className="mode-card__desc">
              Pick a specific repository. Useful when a candidate worked
              on a dedicated project that showcases their skills.
            </p>
            <div className="mode-card__tag">Targeted · Faster for focused repos</div>
          </div>
        </button>
      </div>

      {/* ── Single-repo picker (only shown in single mode) ── */}
      {mode === "single" && (
        <div className="fade-up">
          {loading ? (
            <div className="loading-block" style={{ padding: "40px 0" }}>
              <div className="spinner spinner--lg" />
              <p className="loading-title">Fetching repositories…</p>
            </div>
          ) : (
            <>
              <input
                id="repo-search-input"
                type="text"
                className="input"
                placeholder="Search repositories…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 14 }}
              />
              {error && <div className="error-block" style={{ marginBottom: 14 }}>{error}</div>}
              <div className="repo-list stagger">
                {filtered.length === 0 ? (
                  <p style={{ color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: "0.875rem", padding: "32px 0", textAlign: "center" }}>
                    No repositories found.
                  </p>
                ) : filtered.map(repo => {
                  const isSel = selected?.name === repo.name;
                  const lc = LANG_COLORS[repo.language] || "#5a6a8a";
                  return (
                    <div
                      key={repo.id}
                      id={`repo-${repo.name}`}
                      className={`repo-item ${isSel ? "repo-item--selected" : ""}`}
                      onClick={() => setSelected(repo)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={e => e.key === "Enter" && setSelected(repo)}
                    >
                      <div className="repo-item__name">
                        {repo.private ? "🔒 " : ""}{repo.name}
                      </div>
                      {repo.description && (
                        <div className="repo-item__desc">{repo.description}</div>
                      )}
                      <div className="repo-item__meta">
                        {repo.language && (
                          <div className="lang-dot">
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: lc, display: "inline-block", flexShrink: 0 }} />
                            {repo.language}
                          </div>
                        )}
                        {repo.stargazers_count > 0 && <span>⭐ {repo.stargazers_count}</span>}
                      </div>
                      <div className="repo-check">
                        {isSel && (
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5L4 7L8 3" stroke="var(--bg)" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      <div className="nav-row">
        <button id="step4-back-btn" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button
          id="step4-next-btn"
          className="btn btn-primary btn-lg"
          onClick={proceed}
          disabled={!canProceed}
        >
          {mode === "all" ? "Verify Across All Repos →" : (selected ? `Verify ${selected.name} →` : "Select a Repo")}
        </button>
      </div>
    </div>
  );
}
