import { useState, useMemo } from "react";

// Category display order & accent colors
const CATEGORY_META = {
  Language:         { label: "Languages",          color: "#a78bfa" },
  Frontend:         { label: "Frontend",            color: "#60a5fa" },
  Backend:          { label: "Backend / Runtime",   color: "#34d399" },
  Mobile:           { label: "Mobile",              color: "#fb923c" },
  Database:         { label: "Databases",           color: "#f59e0b" },
  Cloud:            { label: "Cloud",               color: "#38bdf8" },
  DevOps:           { label: "DevOps",              color: "#a3e635" },
  "AI/ML":          { label: "AI / ML",             color: "#f472b6" },
  "CS Fundamentals":{ label: "CS Fundamentals",     color: "#c084fc" },
  Tools:            { label: "Tools",               color: "#94a3b8" },
  Stack:            { label: "Full-Stack Bundles",  color: "#22d3ee" },
};

const CATEGORY_ORDER = [
  "Language","Frontend","Backend","Mobile","Database",
  "Cloud","DevOps","AI/ML","CS Fundamentals","Tools","Stack",
];

function ConfidenceBar({ value }) {
  const pct = Math.round((value || 0) * 100);
  const color =
    pct >= 70 ? "var(--green)" :
    pct >= 40 ? "var(--amber)" : "var(--text-3)";

  return (
    <div title={`Confidence: ${pct}%`} style={{
      display: "flex", alignItems: "center", gap: 5, flexShrink: 0
    }}>
      <div style={{
        width: 40, height: 4, borderRadius: 2,
        background: "var(--border)", overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color,
          borderRadius: 2,
          transition: "width 0.4s ease",
        }} />
      </div>
      <span style={{
        fontSize: "0.65rem", fontFamily: "var(--font-mono)",
        color: "var(--text-3)", minWidth: 24, textAlign: "right"
      }}>{pct}%</span>
    </div>
  );
}

export default function StepSkillClaims({ resumeData, onNext, onBack }) {
  // Deduplicate by name (canonical)
  const unique = useMemo(() => [
    ...new Map((resumeData?.skillClaims || []).map(s => [s.name, s])).values()
  ], [resumeData]);

  const [selected, setSelected] = useState(() => new Set(unique.map(s => s.name)));
  const [viewMode, setViewMode] = useState("grouped"); // "grouped" | "flat"

  function toggle(name) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  function selectAll()   { setSelected(new Set(unique.map(s => s.name))); }
  function deselectAll() { setSelected(new Set()); }

  const chosen = unique.filter(s => selected.has(s.name)).map(s => s.name);

  // Group skills by category
  const grouped = useMemo(() => {
    const map = new Map();
    for (const skill of unique) {
      const cat = skill.category || "Tools";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(skill);
    }
    return map;
  }, [unique]);

  const orderedCategories = CATEGORY_ORDER.filter(c => grouped.has(c));
  // Any unrecognised categories at the end
  for (const cat of grouped.keys()) {
    if (!orderedCategories.includes(cat)) orderedCategories.push(cat);
  }

  if (unique.length === 0) {
    return (
      <div className="fade-up">
        <p className="eyebrow">Step 02 — Skills</p>
        <h1 className="page-title">Review <em>Skill Claims</em></h1>
        <div className="error-block" style={{ marginTop: 16 }}>
          No recognisable skills were found in your resume.
          Make sure your PDF has a clear "Technical Skills" or "Skills" section.
        </div>
        <div className="nav-row">
          <button id="step2-back-btn" className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up">
      <p className="eyebrow">Step 02 — Skills</p>
      <h1 className="page-title">Review <em>Skill Claims</em></h1>
      <p className="page-subtitle">
        Extracted from your resume. Deselect any skills you don&apos;t want verified.
      </p>

      {resumeData?.detectedGithub && (
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          background: "var(--cyan-dim)",
          border: "1px solid var(--border-2)",
          borderRadius: "999px",
          fontSize: "0.8rem",
          fontFamily: "var(--font-mono)",
          color: "var(--cyan)",
          marginBottom: 16
        }}>
          <span>⚡ Candidate GitHub:</span>
          <strong style={{ color: "var(--text)" }}>{resumeData.detectedGithub.url}</strong>
        </div>
      )}

      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16, flexWrap: "wrap", gap: 10
      }}>
        <span style={{
          fontSize: "0.8125rem", color: "var(--text-3)",
          fontFamily: "var(--font-mono)"
        }}>
          {selected.size} / {unique.length} selected
        </span>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* View toggle */}
          <div style={{
            display: "flex", border: "1px solid var(--border)",
            borderRadius: "var(--r-sm)", overflow: "hidden"
          }}>
            {["grouped","flat"].map(mode => (
              <button key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: "4px 12px",
                  fontSize: "0.75rem",
                  fontFamily: "var(--font-mono)",
                  border: "none",
                  cursor: "pointer",
                  background: viewMode === mode ? "var(--cyan-dim)" : "transparent",
                  color: viewMode === mode ? "var(--cyan)" : "var(--text-3)",
                  transition: "all 0.15s",
                }}
              >{mode}</button>
            ))}
          </div>

          <button
            style={{ fontSize: "0.8rem", background: "none", border: "none", color: "var(--cyan)", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            onClick={selectAll}>select all</button>
          <button
            style={{ fontSize: "0.8rem", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontFamily: "var(--font-mono)" }}
            onClick={deselectAll}>deselect all</button>
        </div>
      </div>

      {/* ── Grouped view ── */}
      {viewMode === "grouped" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {orderedCategories.map(cat => {
            const skills    = grouped.get(cat) || [];
            const meta      = CATEGORY_META[cat] || { label: cat, color: "#94a3b8" };
            const selCount  = skills.filter(s => selected.has(s.name)).length;

            return (
              <div key={cat}>
                {/* Category header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginBottom: 10
                }}>
                  <div style={{
                    width: 3, height: 16, borderRadius: 2,
                    background: meta.color, flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: "0.7rem", fontFamily: "var(--font-mono)",
                    letterSpacing: "0.07em", color: meta.color,
                    fontWeight: 600, textTransform: "uppercase"
                  }}>{meta.label}</span>
                  <span style={{
                    fontSize: "0.65rem", fontFamily: "var(--font-mono)",
                    color: "var(--text-3)",
                  }}>{selCount}/{skills.length}</span>
                </div>

                {/* Skill chips */}
                <div className="skill-tags stagger">
                  {skills.map(skill => {
                    const isSel = selected.has(skill.name);
                    return (
                      <button
                        key={skill.name}
                        id={`skill-${skill.name.replace(/\W/g, "-").toLowerCase()}`}
                        className={`skill-tag ${isSel ? "skill-tag--selected" : ""}`}
                        onClick={() => toggle(skill.name)}
                        title={skill.source || skill.name}
                        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                      >
                        <span>{skill.name}</span>
                        {skill.confidence !== undefined && (
                          <ConfidenceBar value={skill.confidence} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Flat view ── */
        <div className="skill-tags stagger">
          {unique.map(skill => {
            const isSel = selected.has(skill.name);
            const meta  = CATEGORY_META[skill.category] || { color: "#94a3b8" };
            return (
              <button
                key={skill.name}
                id={`skill-${skill.name.replace(/\W/g, "-").toLowerCase()}`}
                className={`skill-tag ${isSel ? "skill-tag--selected" : ""}`}
                onClick={() => toggle(skill.name)}
                title={skill.source || skill.name}
                style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: meta.color, flexShrink: 0
                }} />
                <span>{skill.name}</span>
                {skill.confidence !== undefined && (
                  <ConfidenceBar value={skill.confidence} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Source context for selected skills ── */}
      {chosen.length > 0 && (
        <>
          <div className="divider" style={{ margin: "24px 0 16px" }} />
          <p style={{
            fontSize: "0.75rem", fontFamily: "var(--font-mono)",
            color: "var(--text-3)", marginBottom: 12, letterSpacing: "0.05em"
          }}>SOURCE LINES FROM RESUME</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unique.filter(s => selected.has(s.name)).map(skill => (
              <div key={skill.name} style={{
                display: "flex", gap: 12, fontSize: "0.8rem", alignItems: "flex-start"
              }}>
                <span style={{
                  color: (CATEGORY_META[skill.category] || {}).color || "var(--cyan)",
                  fontFamily: "var(--font-mono)", flexShrink: 0, minWidth: 110,
                  fontSize: "0.75rem"
                }}>{skill.name}</span>
                <span style={{
                  color: "var(--text-3)", fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem", fontStyle: "italic",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{skill.source || "—"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="nav-row">
        <button id="step2-back-btn" className="btn btn-ghost" onClick={onBack}>← Back</button>
        <button id="step2-next-btn" className="btn btn-primary btn-lg"
          onClick={() => onNext({ skills: chosen })}
          disabled={selected.size === 0}>
          Continue to GitHub →
        </button>
      </div>
    </div>
  );
}
