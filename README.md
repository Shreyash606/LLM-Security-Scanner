# LLM Security Scanner

Scan any **public GitHub repository** for security issues using a free **Hugging Face Inference** model.  
Results appear in a GitHub-style UI with an **Issues view** and a **Code view**.

---

## Live Demo
_Add your URL after deploying (Vercel recommended)._

**https://your-domain.vercel.app**

---

## Features

- **Hugging Face–powered analysis** (free Inference API)
- **Commit-pinned scans** (reproducible and deep-linkable)
- **Issues View**: severity labels, filtering, search, file:line
- **Code View**: Monaco editor with **persistent line highlight** and a focused **~10-line snippet**
- **Quick Fixes**: 1–2 pragmatic suggestions per issue from the model
- **In-memory cache** keyed by `owner/repo@commit` for fast local runs

---

## How It Works (High Level)

1. You paste a public GitHub repo URL.
2. The app resolves the default branch → **commit SHA**, lists files, and chunks long files.
3. Each chunk is sent to the **LLM** (Hugging Face Inference) with a structured prompt.
4. Findings are validated and stored under `repo@sha`.
5. UI shows an Issues list; clicking an issue opens the Code view with line highlights.

---

## Quickstart (Local)

### Prerequisites
- Node.js 18+ (18/20 LTS recommended)
- npm (or pnpm/yarn)
- A Hugging Face API token (create one at https://huggingface.co/settings/tokens)

### Install
```bash
npm install
Configure Environment
Create a file named .env.local in the project root:

ini
Copy code
# Optional GitHub token to raise API rate limits (leave empty if you don't have one)
GITHUB_TOKEN=

# Required to use the LLM
LLM_PROVIDER=hf
HUGGINGFACE_API_KEY=
HF_MODEL=Qwen/Qwen2.5-Coder-1.5B-Instruct

# Scanner caps (tune as needed)
MAX_FILES=80
MAX_BYTES_PER_FILE=120000
Keep real secrets in .env.local only. Do not commit them.
.env.example should contain blanks (no token-like placeholders).

Run
bash
Copy code
npm run dev
# open http://localhost:3000
Usage
Paste a repo like vercel/next.js and click Scan.

Review Issues (filter by severity or search text).

Click View code to open Monaco with:

persistent highlight on the finding’s lines

~10 lines of context with real file line numbers

Read Quick Fixes under the code for suggested changes.

Deploy (Vercel)
bash
Copy code
# One-time setup
npm i -g vercel
vercel login

# From project root
vercel link --yes --name seclens

# Add environment variables (Production); repeat for Preview if desired
vercel env add GITHUB_TOKEN production
vercel env add LLM_PROVIDER production        # set to: hf
vercel env add HUGGINGFACE_API_KEY production
vercel env add HF_MODEL production            # e.g. Qwen/Qwen2.5-Coder-1.5B-Instruct
vercel env add MAX_FILES production           # e.g. 80
vercel env add MAX_BYTES_PER_FILE production  # e.g. 120000

# Deploy
vercel --yes --name seclens
vercel --prod --yes --name seclens
After deployment, edit the Live Demo link above.

Configuration Notes
File filters: library/vendor/minified/very large files are skipped by default.

Caps: increase MAX_FILES/MAX_BYTES_PER_FILE for bigger scans (watch timeouts).

Rate limits: add GITHUB_TOKEN if you hit 403s.

Troubleshooting
Blocked push (secrets): ensure .env.example contains blank values only; never add token-looking strings.

No findings: try a different repo, increase caps, or verify your HF token/model.

Highlight not visible: confirm you’re using the provided CodeViewer and that CSS is loaded.

API 403: set GITHUB_TOKEN and restart the server.

Roadmap / Future Tweaks
Background scans (Vercel Background Functions / queue) for large repos

Semgrep pre-pass → LLM explanation/patch

Show unified diffs (Monaco Diff / react-diff-viewer) for “Propose fix”

GitHub OAuth for private repos + Webhooks to auto re-scan on push

Persistence with a free DB (Supabase/Postgres) and scan history

Basic metrics (scan duration, files, model latency) + Sentry for errors

Tech Stack
Next.js (App Router), React 18, TypeScript, Tailwind CSS

Monaco editor (@monaco-editor/react)

Octokit (GitHub REST)

Hugging Face Inference API (LLM)

zod (validation)

License
MIT (add a LICENSE file if open-sourcing).
