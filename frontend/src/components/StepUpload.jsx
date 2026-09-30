import { useState } from "react";

export default function StepUpload({ onNext }) {
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);

  function handleFile(f) {
    if (!f) return;
    if (f.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
    setError(null);
    setFile(f);
  }

  async function submit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const { uploadResume } = await import("../api.js");
      const result = await uploadResume(file);
      onNext({ resumeData: result, file });
    } catch (err) {
      setError(err.message || "Failed to parse resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-up">
      <p className="eyebrow">Step 01 — Resume</p>
      <h1 className="page-title">Upload your <em>Resume</em></h1>
      <p className="page-subtitle">
        We extract skill claims directly from your PDF.
        No forms, no manual input — just drop your file.
      </p>

      {/* Drop zone */}
      <div
        className={[
          "upload-zone",
          dragging         ? "upload-zone--dragging" : "",
          file             ? "upload-zone--has-file"  : ""
        ].join(" ")}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
      >
        <input id="resume-file-input" type="file" accept="application/pdf"
          onChange={(e) => handleFile(e.target.files[0])} />

        <div className="upload-icon">
          {file ? "✅" : "📄"}
        </div>

        {file ? (
          <>
            <div className="upload-title">File ready</div>
            <span className="file-chip">{file.name}</span>
            <p className="upload-sub" style={{ marginTop: 4 }}>Click to change</p>
          </>
        ) : (
          <>
            <div className="upload-title">
              {dragging ? "Release to upload" : "Drag & drop your resume"}
            </div>
            <p className="upload-sub">
              or <span style={{ color: "var(--cyan)", fontWeight: 600 }}>click to browse</span>
            </p>
            <p className="upload-sub" style={{ fontSize: "0.75rem", color: "var(--text-3)", marginTop: 4 }}>
              PDF only · Max 10MB
            </p>
          </>
        )}
      </div>

      {error && <div className="error-block" style={{ marginTop: 16 }}>{error}</div>}

      <div className="nav-row" style={{ justifyContent: "flex-end" }}>
        <button id="upload-submit-btn" className="btn btn-primary btn-lg"
          onClick={submit} disabled={!file || loading}>
          {loading ? <><div className="spinner" /> Extracting…</> : "Extract Skills →"}
        </button>
      </div>
    </div>
  );
}
