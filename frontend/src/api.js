// Relative path — goes through the Vite proxy to localhost:5000.
// Never use an absolute URL here in dev; it causes CORS issues.
const BASE_URL = "/api";

// Helper: every request that needs the GitHub token
// reads it from the call site and forwards it here.
async function request(path, options = {}, accessToken = null) {
    const headers = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(options.headers || {})
    };

    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
}

// ===================================================
// AUTH
// ===================================================

// Redirects the browser to GitHub OAuth consent screen.
// The backend handles the callback and returns the token.
export function redirectToGitHubLogin() {
    window.location.href = `${BASE_URL}/auth/github`;
}

// ===================================================
// RESUME
// ===================================================

// Upload a resume PDF and get back extracted skill claims.
// Uses FormData — no Content-Type header so the browser
// sets the correct multipart boundary automatically.
export async function uploadResume(file) {
    const formData = new FormData();
    formData.append("resume", file);

    const response = await fetch(`${BASE_URL}/resume/upload`, {
        method: "POST",
        body: formData
        // ← DO NOT set Content-Type here; multipart/form-data
        //   needs the browser to set the boundary automatically
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || "Failed to parse resume");
    }

    return response.json();
}

// ===================================================
// GITHUB
// ===================================================

export async function getUserRepositories(username, accessToken) {
    return request(`/github/repos/${username}`, {}, accessToken);
}

export async function verifySkills(owner, repo, skills, username, accessToken) {
    return request(
        `/github/repos/${owner}/${repo}/verify-skills/${username}`,
        {
            method: "POST",
            body: JSON.stringify({ skills })
        },
        accessToken
    );
}

// Verify skills across ALL of the candidate's repositories.
// Returns: { candidate, mode, reposScanned, reposAnalyzed, results }
// Each result also has a repoBreakdown[] showing per-repo evidence.
export async function verifySkillsAllRepos(username, skills, accessToken) {
    return request(
        `/github/user/${username}/verify-skills-all`,
        {
            method: "POST",
            body: JSON.stringify({ skills })
        },
        accessToken
    );
}

export async function analyzeRepository(owner, repo, username, accessToken) {
    return request(
        `/github/repos/${owner}/${repo}/analyze/${username}`,
        {},
        accessToken
    );
}
