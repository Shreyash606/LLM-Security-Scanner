# 🔍 LLM Security Scanner

Find potential security issues in any **public GitHub repo** and view them in two ways:

- **Issues view** – GitHub‑style list with severity, file path, and line numbers
- **Code view** – PR‑style visualization with line‑level highlights (and optional diffs)

This README documents the **100% free path** and the optional **Hugging Face** LLM integration that satisfies the assignment’s “uses LLMs” requirement.

---

## ✨ Features

- Paste any **public GitHub URL**; we pin scans to a **commit SHA** for reproducibility
- **Two displays**:

  - Issues list with filters and deep links
  - Code visualization via Monaco with precise **line highlights**

- **LLM integration (optional, free)** using **Hugging Face Inference API**
- **Rule‑based scanner** (regex heuristics) for a deterministic, free fallback
- **Safe & capped** scanning: file type allowlist, size caps, skip vendor/minified files

> **Note:** For grading, enable **Hugging Face mode** to meet the “uses LLMs” requirement.

---

## 🧱 Architecture (Option A: 100% Serverless)

- **Next.js (App Router)** for UI + API routes
- **GitHub API (Octokit)** to list and fetch repo files by **commit SHA**
- **LLM provider** (switchable): `rule` (regex) or `hf` (Hugging Face Inference)
- **Store**: in‑memory (simple & free; resets on cold start)

```
app/
  page.tsx                      # repo input + scan launcher
  scans/[id]/page.tsx           # Issues view
  scans/[id]/code/[file]/page.tsx  # Code view with highlights
  api/scan/route.ts             # POST: run scan (caps + chunking)
  api/scans/[id]/route.ts       # GET: fetch results by scanId
components/
  IssueList.tsx, CodeViewer.tsx, DiffView.tsx
lib/
  github.ts (Octokit), llm.ts (provider switch), schema.ts (zod), store.ts
```

---

## 🚀 Quickstart (Local)

```bash
npm i
npm run dev
# open http://localhost:3000
```

### Environment (.env.local)

```ini
# Optional GitHub token to raise rate limits (still free)
GITHUB_TOKEN=

# Choose provider (free):
# - rule : regex checks only (does NOT satisfy LLM requirement)
# - hf   : Hugging Face Inference (uses an LLM)
LLM_PROVIDER=hf

# If using HF:
HUGGINGFACE_API_KEY=
HF_MODEL=Qwen/Qwen2.5-Coder-1.5B-Instruct

# Scan caps
MAX_FILES=60
MAX_BYTES_PER_FILE=100000
```

> **Tip:** Pick any compatible instruct model on Hugging Face Hub. Smaller models are faster/cheaper. The app expects **JSON** output; we validate and retry if needed.

---

## 🌐 Deployment (Vercel)

1. Push the repo to GitHub.
2. Import to **Vercel** → Add the env vars above.
3. Deploy. You’ll get a public URL you can share for grading/demo.

> On free tiers, the in‑memory store resets on cold starts. That’s fine for the assignment; use Supabase/Prisma later if you need persistence.

---

## 🧠 LLM modes

### 1) `hf` (Hugging Face) — **recommended for the assignment**

- Sends each file chunk with a prompt that requests **structured JSON** findings
- We validate with **zod**; if parsing fails, we retry once with “JSON only”
- Each finding includes: `title`, `severity`, `file`, `start_line`, `end_line`, `description`, `recommendation`, optional `rule` (CWE), `code_snippet`, optional `patch_unified`

### 2) `rule` (regex fallback)

- Deterministic checks for common risks:

  - **Command execution** (e.g., `child_process.exec`, `os.system`)
  - **Eval/code injection** (`eval`, `Function`, `pickle.loads`)
  - **Weak crypto** (MD5/SHA1)
  - **Hardcoded secrets** (basic patterns)
  - **JWT alg=none** / insecure config

- Useful for demos when LLM quota is limited, but **does not** fulfill the LLM requirement by itself.

---

## 🔗 How scanning works

1. Parse the GitHub URL → resolve **default branch** → get **commit SHA**
2. List repo tree, filter by extension/size, chunk long files by lines
3. For each chunk: run the chosen provider → collect findings
4. Save a `Scan` object keyed by `owner/repo@sha`
5. Render issues; deep link into the code view with **line‑level highlights**

---

## 🧾 Output schema (simplified)

```ts
{
  scanId: string,
  repo: string,
  ref: string,
  commit_sha: string,
  issues: Array<{
    id: string,
    title: string,
    severity: 'low'|'medium'|'high'|'critical',
    file: string,
    start_line: number,
    end_line: number,
    description: string,
    recommendation?: string,
    rule?: string,
    code_snippet?: string,
    patch_unified?: string
  }>,
  stats: { files: number, bytes: number, duration_ms: number }
}
```

---

## 🖥️ UI

- **Issues view**: card list (title, severity badge, `file:start-end`, description excerpt)
- **Code view**: Monaco editor, read‑only, with **whole‑line decorations** for each finding; focuses on the range with optional “show more context”
- **(Optional)** PR‑style diff render if `patch_unified` is returned

---

## 🛡️ Security & Privacy

- Read‑only access to **public** repositories
- We skip large/minified/vendor files; caps are configurable via env vars
- No code is stored permanently in the free path; results live in memory only

---

## 🧩 Troubleshooting

- **Empty findings in HF mode** → The model returned non‑JSON. Check logs; we retry once with a strict “JSON only” instruction.
- **Rate limits** → Add `GITHUB_TOKEN`.
- **Time limits** → Lower `MAX_FILES`/`MAX_BYTES_PER_FILE` or scan smaller repos.
- **Bad line numbers** → Ensure the file wasn’t changed mid‑scan; scans are pinned to a commit SHA.

---

## 🗺️ Roadmap (nice‑to‑haves)

- Background jobs/queue for large repos (Vercel Background/QStash)
- Semgrep pre‑pass → LLM explanation/patch
- GitHub OAuth (private repos) & Webhooks (auto re‑scan on push)
- Persistence (Supabase/Postgres) + history view
- Embeddings for dedupe/triage
- Apply‑patch preview / downloadable diff

---

## 🧰 Tech Stack

- **Next.js (App Router)**, **TypeScript**, **Tailwind**
- **@monaco-editor/react**, `react-diff-viewer-continued`
- **Octokit** (GitHub API)
- **zod** (validation)
- **Hugging Face Inference API** (optional LLM)

---

## 📜 License

MIT – see `LICENSE`.

---

## ✅ Submission checklist

- [ ] Live Vercel URL added to the top of the README
- [ ] `LLM_PROVIDER=hf` with a valid `HUGGINGFACE_API_KEY` for the demo
- [ ] Screenshot/GIF of **Issues view** and **Code view** in the README
- [ ] Note of size caps and commit pinning
- [ ] Brief explanation of JSON validation + retries
