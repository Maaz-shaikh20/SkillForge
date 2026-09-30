import { useState, useEffect, useRef } from "react";
import { verifySkills, verifySkillsAllRepos } from "../api.js";

const STATUS = {
  SUPPORTED:           { label: "VERIFIED",       color: "var(--green)",  desc: "Real code evidence found and you contributed to it directly." },
  CODE_EVIDENCE:       { label: "CODE FOUND",     color: "var(--amber)",  desc: "Relevant patterns detected in the repo, but not in your commits specifically." },
  REPOSITORY_EVIDENCE: { label: "REPO EVIDENCE",  color: "#60a5fa",       desc: "Right file types exist, but we couldn't link them to your commits." },
  NO_EVIDENCE:         { label: "NOT FOUND",      color: "var(--text-3)", desc: "No evidence of this skill was found in the selected repository." },
};

const PROGRESS_STEPS = [
  { msg: "Fetching repository file tree…",       delay: 0    },
  { msg: "Loading commit history…",              delay: 3000 },
  { msg: "Filtering candidate commits…",         delay: 7000 },
  { msg: "Downloading modified source files…",   delay: 14000 },
  { msg: "Running code analysis…",               delay: 25000 },
  { msg: "Matching patterns to claimed skills…", delay: 40000 },
  { msg: "Building verification report…",        delay: 60000 },
];

function VerificationProgress({ skills, steps = PROGRESS_STEPS }) {
  const [visibleLines, setVisibleLines] = useState(1);
  const [elapsed, setElapsed]           = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const tick = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 500);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const timers = steps.slice(1).map((step, i) =>
      setTimeout(() => setVisibleLines(i + 2), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []); // eslint-disable-line

  return (
    <div className="fade-up">
      <div className="loading-block" style={{ alignItems: "flex-start", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
          <div className="spinner spinner--lg" />
          <div>
            <p className="loading-title" style={{ textAlign: "left" }}>Running Verification</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-3)", marginTop: 2 }}>
              {skills.length} skill{skills.length !== 1 ? "s" : ""} · {elapsed}s elapsed
            </p>
          </div>
        </div>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md)",
          padding: "16px 20px",
          width: "100%",
          fontFamily: "var(--font-mono)",
          fontSize: "0.8125rem",
          lineHeight: 1.9,
        }}>
          {steps.slice(0, visibleLines).map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{
                color: i < visibleLines - 1 ? "var(--green)" : "var(--cyan)",
                fontSize: "0.75rem",
              }}>
                {i < visibleLines - 1 ? "✓" : "›"}
              </span>
              <span style={{ color: i < visibleLines - 1 ? "var(--text-2)" : "var(--text)" }}>
                {step.msg}
              </span>
              {i === visibleLines - 1 && (
                <span style={{
                  display: "inline-block",
                  width: 8, height: 14,
                  background: "var(--cyan)",
                  animation: "dot-pulse 0.8s ease infinite",
                  marginLeft: 2,
                  borderRadius: 1,
                }} />
              )}
            </div>
          ))}
        </div>

        <p style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 12, lineHeight: 1.5, textAlign: "left" }}>
          Large repositories may take 60–90 seconds. Please keep this tab open.
        </p>
      </div>
    </div>
  );
}

const ALL_PROGRESS_STEPS = [
  { msg: "Fetching all your repositories…",            delay: 0     },
  { msg: "Scanning file trees for relevant repos…",    delay: 4000  },
  { msg: "Filtering to repositories with skill files…",delay: 10000 },
  { msg: "Fetching commit history per repository…",    delay: 18000 },
  { msg: "Downloading and analysing source files…",    delay: 35000 },
  { msg: "Matching patterns to claimed skills…",       delay: 60000 },
  { msg: "Aggregating results across all repos…",      delay: 90000 },
];

export default function StepResults({
  githubUser, accessToken, repo, skills, verificationMode, onRestart
}) {
  const [results,       setResults]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [reposMeta,     setReposMeta]     = useState(null); // {reposScanned, reposAnalyzed}
  const [expandedSkill, setExpandedSkill] = useState(null); // which skill card is expanded

  const isAllMode = verificationMode === "all";

  // Normalize to string array; guard against undefined (OAuth-direct flow)
  const skillNames = (skills || []).map(s => (typeof s === "string" ? s : s.name));

  // Safety net: if skills are missing (e.g. sessionStorage failed) catch it early
  const hasSkills = skillNames.length > 0;

  useEffect(() => {
    if (!hasSkills) {
      setError("No skills found — please go back and select skills to verify.");
      setLoading(false);
      return;
    }
    if (!githubUser?.login) {
      setError("GitHub candidate profile is missing. Please restart and select a GitHub profile.");
      setLoading(false);
      return;
    }
    if (!isAllMode && (!repo?.owner?.login || !repo?.name)) {
      setError("Repository information is missing. Please select a repository.");
      setLoading(false);
      return;
    }
    if (isAllMode) {
      verifySkillsAllRepos(githubUser.login, skillNames, accessToken)
        .then(data => {
          setResults(data.results);
          setReposMeta({ reposScanned: data.reposScanned, reposAnalyzed: data.reposAnalyzed });
        })
        .catch(err => setError(err.message || String(err)))
        .finally(() => setLoading(false));
    } else {
      verifySkills(repo.owner.login, repo.name, skillNames, githubUser.login, accessToken)
        .then(data => setResults(data.results))
        .catch(err => setError(err.message || String(err)))
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line

  const progressSteps = isAllMode ? ALL_PROGRESS_STEPS : PROGRESS_STEPS;

  if (loading) return <VerificationProgress skills={skillNames} steps={progressSteps} />;

  if (error) return (
    <div className="fade-up">
      <p className="eyebrow">Step 05 — Results</p>
      <div className="error-block" style={{ marginBottom: 24 }}>{error}</div>
      <button id="results-restart-btn" className="btn btn-ghost" onClick={onRestart}>↺ Start Over</button>
    </div>
  );

  if (!results) {
    return (
      <div className="fade-up">
        <p className="eyebrow">Step 05 — Results</p>
        <div className="error-block" style={{ marginBottom: 24 }}>No verification results were generated.</div>
        <button id="results-restart-btn" className="btn btn-ghost" onClick={onRestart}>↺ Start Over</button>
      </div>
    );
  }

  const counts = { SUPPORTED: 0, CODE_EVIDENCE: 0, REPOSITORY_EVIDENCE: 0, NO_EVIDENCE: 0 };
  (results || []).forEach(r => { const s = r.verification?.status || "NO_EVIDENCE"; counts[s]++; });

  const candidateLogin = githubUser?.login || "candidate";
  const candidateName  = githubUser?.name || candidateLogin;

  return (
    <div className="fade-up">
      <p className="eyebrow">Step 05 — Complete</p>
      <h1 className="page-title">Verification <em>Results</em></h1>

      {/* ── Who/repo bar ── */}
      <div className="results-bar">
        <div className="results-bar__avatar">
          {githubUser?.avatar_url
            ? <img src={githubUser.avatar_url} alt="avatar" />
            : <div style={{ width: "100%", height: "100%", background: "var(--cyan-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>👤</div>
          }
        </div>
        <div style={{ flex: 1 }}>
          <div className="results-bar__name">{candidateName}</div>
          <div className="results-bar__meta">@{candidateLogin}</div>
        </div>

        {isAllMode ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="repo-tag">
              🗂 All Repos
            </span>
            {reposMeta && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-3)" }}>
                {reposMeta.reposAnalyzed} of {reposMeta.reposScanned} analysed
              </span>
            )}
          </div>
        ) : (
          <span className="repo-tag">{repo.name}</span>
        )}

        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-3)" }}>
          {results.length} skills
        </span>
      </div>

      {/* ── Summary grid ── */}
      <div className="result-summary">
        {[
          { key: "SUPPORTED",           label: "Verified" },
          { key: "CODE_EVIDENCE",       label: "Code Found" },
          { key: "REPOSITORY_EVIDENCE", label: "Repo Only" },
          { key: "NO_EVIDENCE",         label: "Not Found" },
        ].map(({ key, label }) => (
          <div key={key} className="summary-stat">
            <div className="summary-stat__n" style={{ color: STATUS[key].color }}>{counts[key]}</div>
            <div className="summary-stat__l">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Result cards ── */}
      <div className="result-list stagger">
        {results.map(result => {
          const status  = result.verification?.status || "NO_EVIDENCE";
          const meta    = STATUS[status];
          const contrib = result.contributionEvidence || {};
          const codeEv  = result.codeEvidence || [];
          const files   = contrib.modifiedSkillFiles || [];
          const breakdown = result.repoBreakdown || [];
          const isExpanded = expandedSkill === result.skill;

          const evidenceLabels = [...new Set(codeEv.flatMap(e => e.evidence))];

          return (
            <div
              key={result.skill}
              id={`result-${result.skill.replace(/\W/g, "-").toLowerCase()}`}
              className={`result-card result-card--${status}`}
            >
              {/* Top row */}
              <div className="result-top">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, boxShadow: `0 0 8px ${meta.color}`, flexShrink: 0 }} />
                  <span className="result-skill">{result.skill}</span>
                </div>
                <span className={`badge badge--${status}`}>{meta.label}</span>
              </div>

              <p className="result-desc">{meta.desc}</p>

              {/* Verification note for special skills */}
              {result.verificationNote && (
                <p style={{
                  fontSize: "0.75rem", fontFamily: "var(--font-mono)",
                  color: "var(--text-3)", lineHeight: 1.5,
                  background: "var(--bg-2)", borderRadius: "var(--r-sm)",
                  padding: "6px 10px", marginTop: 4,
                  borderLeft: `2px solid ${meta.color}`,
                }}>
                  {result.verificationNote}
                </p>
              )}
              {/* Stats */}
              <div className="result-stats">
                <div className="stat-item">
                  <span className="stat-val" style={{ color: "var(--text)" }}>
                    {contrib.candidateCommitCount ?? "—"}
                  </span>
                  <span className="stat-lbl">Your Commits</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val" style={{ color: meta.color }}>
                    {contrib.skillCommitCount ?? "—"}
                  </span>
                  <span className="stat-lbl">Skill Commits</span>
                </div>
                <div className="stat-item">
                  <span className="stat-val" style={{ color: "var(--text)" }}>
                    {result.fileEvidence?.fileCount ?? "—"}
                  </span>
                  <span className="stat-lbl">Files</span>
                </div>
                {isAllMode && breakdown.length > 0 && (
                  <div className="stat-item">
                    <span className="stat-val" style={{ color: "var(--cyan)" }}>
                      {breakdown.filter(b => b.status !== "NO_EVIDENCE").length}
                    </span>
                    <span className="stat-lbl">Repos w/ Evidence</span>
                  </div>
                )}
              </div>

              {/* Code evidence */}
              {evidenceLabels.length > 0 && (
                <div>
                  <p className="chip-label">PATTERNS DETECTED</p>
                  <div className="evidence-chips">
                    {evidenceLabels.map(e => <span key={e} className="chip">{e}</span>)}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p className="chip-label">FILES YOU MODIFIED</p>
                  <div className="evidence-chips">
                    {files.slice(0, 6).map(f => (
                      <span key={f} className="chip" style={{ fontFamily: "var(--font-mono)" }}>
                        {f.split("/").pop()}
                      </span>
                    ))}
                    {files.length > 6 && <span className="chip">+{files.length - 6} more</span>}
                  </div>
                </div>
              )}

              {/* Repo breakdown (all-repos mode only) */}
              {isAllMode && breakdown.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => setExpandedSkill(isExpanded ? null : result.skill)}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      fontFamily: "var(--font-mono)", fontSize: "0.7rem",
                      color: "var(--cyan)", letterSpacing: "0.05em",
                      display: "flex", alignItems: "center", gap: 6, padding: 0
                    }}
                  >
                    <span style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>›</span>
                    {isExpanded ? "HIDE" : "SHOW"} REPO BREAKDOWN ({breakdown.length} repos)
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                      {breakdown.map(b => {
                        const bMeta = STATUS[b.status] || STATUS.NO_EVIDENCE;
                        return (
                          <div key={b.repo} style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "7px 12px",
                            background: "var(--bg-2)", borderRadius: "var(--r-sm)",
                            border: "1px solid var(--border)",
                            fontFamily: "var(--font-mono)", fontSize: "0.78rem"
                          }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: bMeta.color, flexShrink: 0 }} />
                            <span style={{ flex: 1, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {b.repo}
                            </span>
                            <span style={{ color: bMeta.color, fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.05em" }}>
                              {bMeta.label}
                            </span>
                            {b.commits > 0 && (
                              <span style={{ color: "var(--text-3)", fontSize: "0.7rem" }}>
                                {b.commits} commit{b.commits !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40, display: "flex", justifyContent: "center" }}>
        <button id="results-restart-btn" className="btn btn-ghost btn-lg" onClick={onRestart}>
          ↺ Verify Another Developer
        </button>
      </div>
    </div>
  );
}
