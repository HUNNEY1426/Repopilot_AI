# 🚀 RepoPilot AI — Autonomous GitHub Repository Reviewer & Remediation Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-24.x-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-cyan.svg)](https://react.dev/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange.svg)](https://ai.google.dev/)

**RepoPilot AI** is an AI-powered developer tool that automatically analyzes GitHub repositories and provides a detailed, multi-dimensional assessment of **code quality, security, architecture, test coverage, documentation, maintainability, and dependency health**.

Unlike passive linters, RepoPilot features a complete **AI-assisted remediation workflow**: it converts selected findings into validated **Git patches and diffs**, provides an interactive **Split & Unified Diff Viewer**, and automates the creation of **Git branches and Pull Requests** upon developer approval.

---

## 🌟 Key Highlights & Features

- 🔍 **Automated Repository Scanner & Tree Filter**:
  Recursively maps repository file trees while strictly filtering noise (`node_modules/`, lock files, binaries, build directories) and safeguarding sensitive files (`.env`, `.pem`, secret keys).
- 🛡️ **Multi-Dimension Static Analysis Engine**:
  Executes calibrated heuristics for:
  - **Security Risks**: Stripe API keys (`sk_test_...` / `sk_live_...`), database URIs with plaintext credentials, hardcoded JWT secrets, SQL injection string concatenations, unsafe shell command executions (`child_process.exec`), insecure CORS, leaked credentials in logs.
  - **Code Quality**: Deep nesting (>4 levels), large monolithic files (>300 lines), missing controller validation, and empty catch blocks suppressing errors.
  - **Architecture Analysis**: Detects coupling anti-patterns (such as `server.js` directly querying databases) and renders an interactive **Architecture Topology Diagram**.
  - **Testing Coverage**: Detects test frameworks (Jest, Vitest, Mocha, PyTest), computes estimated test coverage %, and flags untested critical business paths (`Authentication`, `Payments`, `Controllers`).
  - **Documentation**: Scores README completeness, setup guides, API reference, and environment variable samples.
  - **Dependencies**: Identifies deprecated libraries (e.g. `request`), supply-chain risks, and wildcard versions (`*`, `latest`).
- 🤖 **Multi-Provider AI Review Engine**:
  - Official **Google Gemini SDK** (`@google/genai`) with `gemini-2.5-flash` and `gemini-2.5-pro`.
  - **OpenAI / OpenAI-compatible** endpoints (Groq, DeepSeek, LocalAI).
  - **Built-in Smart Rule Engine**: Zero-configuration, offline fallback engine that generates deep assessments and verified patches immediately without an external API key.
- 🛡️ **AI Hallucination Protection (Section 35)**:
  Validates every AI finding against the actual repository tree and file lines. Hallucinated files and non-existent line numbers are rejected before persistence.
- ⚡ **AI Fix & Diff Generator (Section 20-21)**:
  One-click patch generation with interactive **Unified and Split Diff Viewer**, context matching verification, and in-memory syntax validation.
- 🤝 **Human-in-the-Loop Approval Workflow (Section 23)**:
  `Detect` → `Explain` → `Suggest` → `Generate Diff` → `User Reviews` → `Approve / Reject` → `Branch & Pull Request`.
- 🚀 **GitHub Pull Request Integration (Section 22)**:
  Automatically creates a dedicated git branch (`repopilot/fix-...`), commits the approved file patch, and opens a GitHub Pull Request with rich Markdown documentation.
- 📊 **Historical Scans & Report Export**:
  Tracks score evolution across scans (Scan #1, Scan #2, etc.) and provides 1-click Markdown / JSON audit report exports.
- 🧪 **Bundled Test Fixtures (Section 57)**:
  Includes ready-to-test scenarios:
  - 🚨 `vulnerable-ecommerce-api`: Deliberate Node.js API with hardcoded secrets, SQL injection, and architecture flaws.
  - ✨ `typescript-microservice-template`: Clean layered TypeScript service with Jest tests and Zod.

---

## 🏗️ Architecture Overview

```text
                         DEVELOPER
                             │
                             ▼
                     ┌───────────────┐
                     │   React UI    │
                     │  (Vite + CSS) │
                     └───────┬───────┘
                             │
                             ▼
                     ┌───────────────┐
                     │  Express API  │
                     └───────┬───────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
       GitHub API       Repository       SQLite DB
       / Octokit         Scanner       (Native Node 24)
            │                │
            │                ▼
            │          Static Analyzer
            │                │
            └───────────┬────┘
                        ▼
                  AI Service
            ┌───────────┼───────────┐
            ▼           ▼           ▼
         Gemini       OpenAI     Fallback
      (@google/genai)          (Offline Engine)
            │           │           │
            └───────────┼───────────┘
                        ▼
                 Review Engine
                        │
                        ▼
                 Issue Database
                        │
                        ▼
                AI Fix Generator
                        │
                        ▼
             Diff Viewer & Validation
                        │
                        ▼
              Human-in-the-Loop
                  [Approve]
                        │
                        ▼
               Branch & PR Creator
```

---

## 🚦 Quickstart

### Prerequisites

- Node.js `v22+` or `v24+` (Native SQLite `node:sqlite` enabled)
- npm `10+`

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/repopilot-ai.git
cd repopilot-ai

# Install backend and frontend dependencies
npm run install:all
```

### 2. Start Development Services

```bash
npm run dev
```

- **Frontend Application:** `http://localhost:5173`
- **Backend API Server:** `http://localhost:5000`

---

## 🧪 1-Click Verification

1. Open `http://localhost:5173` in your browser.
2. Under **Instant 1-Click Test Scenarios**, click **`vulnerable-ecommerce-api`**.
3. Watch the scan run in milliseconds:
   - Overall health score gauge (e.g. `47 / 100`)
   - 7 quality dimension breakdown meters
   - Interactive Architecture Topology diagram
   - Detected issues list with severity badges (Critical, High, Medium, Low)
4. Filter by **Critical** or **Security**.
5. Click **"Fix with AI"** on `Hardcoded live Stripe secret key detected`.
6. Inspect the code diff in the **Diff Modal** (toggle between **Unified** and **Split** view).
7. Click **"Approve Patch"** and then **"Create Pull Request"**.
8. Click **"Publish Pull Request"** to see the generated branch, commit, and PR URL!

---

## ⚙️ Configuration & AI Providers

Open the **Settings** modal in the top navbar to configure:

| Setting | Description | Default |
| :--- | :--- | :--- |
| **Preferred Review Engine** | `Google Gemini`, `OpenAI / Groq`, or `Smart Rules` | `gemini` |
| **Google Gemini API Key** | API Key from [Google AI Studio](https://aistudio.google.com/) | Auto-reads `process.env.GEMINI_API_KEY` |
| **Gemini Model** | Recommended model: `gemini-2.5-flash` or `gemini-2.5-pro` | `gemini-2.5-flash` |
| **OpenAI API Key** | Optional OpenAI or compatible API key | Optional |
| **GitHub Token** | Personal Access Token (`ghp_...`) for higher rate limits & live PRs | Optional |

---

## 📡 REST API Reference

### Repositories
- `GET /api/demo-repos` — List bundled test repositories
- `GET /api/repositories` — List connected repositories
- `POST /api/repositories/connect` — Connect by GitHub URL or demo ID
- `GET /api/repositories/:id` — Get repository details
- `DELETE /api/repositories/:id` — Remove repository

### Analysis & Metrics
- `POST /api/repositories/:id/analyze` — Trigger full scan & AI review
- `GET /api/analyses/:id` — Retrieve analysis results
- `GET /api/analyses/:id/issues` — Query issues with `category`, `severity`, `q` filters
- `GET /api/analyses/:id/metrics` — Retrieve dimension scores and health metrics
- `GET /api/repositories/:id/history` — List scan history for repository

### Remediation & Pull Requests
- `GET /api/issues/:id` — Get issue details with suggestion
- `POST /api/issues/:id/fix` — Generate AI patch & validate AST
- `POST /api/issues/:id/approve` — Mark fix as approved
- `POST /api/issues/:id/reject` — Mark fix as rejected
- `POST /api/analyses/:id/pull-request` — Create branch & open Pull Request

---

## 🧪 Running Automated Tests

```bash
npm test --prefix backend
```

All 7 unit tests covering file filtering, AST analysis, security rules, scoring, and patch validation will run with Node's native test runner.

---

## 📄 License

MIT License. Designed & Developed for automated software quality & security auditing.
