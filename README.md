# SkillForge — Developer Claims Verification Platform

SkillForge is an automated developer skill verification platform that validates technical claims made on resumes against real-world GitHub code contributions. By analyzing commit history, repository file trees, and AST/regex patterns in source files, SkillForge generates an evidence-backed verification report.

---

## 🌟 Key Features

- **Resume Skill Extraction**: Parses resumes (PDF, DOCX, TXT) with OCR fallback, weighted section scanning (Skills, Projects, Experience, Certifications), and deduplication.
- **Categorized Claims Review**: Review and customize extracted skills across 11 structured categories:
  - Languages, Frontend, Backend, Mobile, Databases, Cloud, DevOps, AI/ML, CS Fundamentals, Tools, and Stacks.
- **Deep GitHub Code Analysis**:
  - **Commit Authorship Check**: Verifies that the claimed user actually authored the commits.
  - **Framework & Library Pattern Analysis**: Goes beyond naive file extension matching (e.g. requires imports and hooks for React, decorators/routing for Express/NestJS, `@SpringBootApplication` for Spring, etc.).
  - **CS Fundamentals & Socket Analysis**: Analyzes network calls, system threading, OS signals, socket programming, and database schema queries.
  - **Auto-Verification & Inferred Tools**: Verifies Git/GitHub from repository and commit metadata, VS Code from `.vscode` configurations, etc.
- **Interactive Verification Dashboard**: Detailed breakdown showing:
  - 🟢 **Verified**: Direct code contributions found and authored by the user.
  - 🟡 **Code Evidence**: Code patterns detected in repositories.
  - 🟠 **Repo Only**: Repository presence / dependency evidence.
  - ⚪ **Not Found**: No code evidence detected.
- **Proof & Evidence Inspection**: View the exact repository, file paths, line references, and matched evidence snippets for each verified skill.

---

## 🏗 Architecture

```
SkillForge/
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── routes/           # Express routes (auth, GitHub, resume)
│   │   ├── services/         # Code analysis, GitHub API, resume extraction, verification
│   │   ├── app.js            # Express app configuration
│   │   └── server.js         # HTTP server entrypoint
│   └── package.json
├── frontend/                 # Vite + React single-page app
│   ├── src/
│   │   ├── components/       # Step-by-step workflow components
│   │   ├── App.jsx           # App state and flow controller
│   │   └── index.css         # Modern dark-mode design system
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- GitHub Personal Access Token (or GitHub OAuth App credentials)

### 1. Clone the Repository

```bash
git clone https://github.com/Maaz-shaikh20/SkillForge.git
cd SkillForge
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
SESSION_SECRET=your_session_secret
```

Start the backend development server:

```bash
npm run dev
```

The backend server runs on `http://localhost:5000`.

### 3. Frontend Setup

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🛠 Technology Stack

- **Frontend**: React 19, Vite, Vanilla CSS with custom design tokens, modern dark-mode aesthetic.
- **Backend**: Node.js, Express, Axios, Multer, PDF-Parse, Mammoth.
- **Integrations**: GitHub REST API & Octokit, GitHub OAuth.

---

## 📄 License

This project is licensed under the MIT License.
