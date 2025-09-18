import { NextRequest, NextResponse } from "next/server";
import { analyzeChunks } from "@/lib/llm";
import { getFile, listTree, resolveCommit } from "@/lib/github";
import { ScanResultSchema } from "@/lib/types";
import { get, set } from "@/lib/store";

export const runtime = "nodejs";

const MAX_FILES = parseInt(process.env.MAX_FILES || "80", 10);
const MAX_BYTES_PER_FILE = parseInt(process.env.MAX_BYTES_PER_FILE || "120000", 10);

const DENY_DIRS = /(^|\/)(node_modules|\.git|\.next|dist|build|out|coverage|vendor|target|__pycache__)(\/|$)/i;
const DENY_EXT  = /\.(png|jpe?g|gif|pdf|svg|ico|bmp|exe|dll|lock|map)$/i;
const ALLOW_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|java|cs|php|rs|scala|kt|swift|sql|c|cc|cpp|h|hpp|vue|svelte|sh|bash|yaml|yml|toml|ini|cfg)$/i;
const ALLOW_DIRS = /(^|\/)(src|app|lib|server|cli|scripts|cmd|internal|pkg|services|packages\/[^/]+\/(src|lib)|examples|\.github\/actions\/src)(\/|$)/i;
const STRICT_DIRS = (process.env.SCAN_STRICT_DIRS ?? "false").toLowerCase() === "true";

export async function POST(req: NextRequest) {
  try {
    const { repo, ref = "HEAD" } = await req.json();
    if (!repo || !repo.includes("/")) return NextResponse.json({ error: "repo must be 'owner/name'" }, { status: 400 });
    const [owner, name] = repo.split("/");
    let commit: string;
    try {
      commit = await resolveCommit(owner, name, ref);
    } catch (e: any) {
      const msg = e?.status === 403
        ? "GitHub API rate limit or missing GITHUB_TOKEN. Add a free token in .env.local."
        : `Failed to resolve commit for ${repo}@${ref}: ${e?.message || e}`;
      return NextResponse.json({ error: msg }, { status: 502 });
    }
    const key = `scan:${repo}@${commit}`;
    const cached = await get(key);
    if (cached) return NextResponse.json({ id: key, status: "done" });

    const result = await runScan({ owner, name, repo, commit });
    await set(key, result);
    return NextResponse.json({ id: key, status: "done" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "scan failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id")!;
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
  const data = await get(id);
  return NextResponse.json({ id, status: data ? "done" : "pending", data });
}

async function runScan({ owner, name, repo, commit }: { owner: string; name: string; repo: string; commit: string; }) {
  const tree = await listTree(owner, name, commit);
  const candidates = tree.map((f:any) => f.path as string)
    .filter(p => !DENY_DIRS.test(p) && !DENY_EXT.test(p) && ALLOW_EXT.test(p) && (!STRICT_DIRS || ALLOW_DIRS.test(p)));

  let bytes = 0, errors = 0;
  const chunks: { path: string; text: string }[] = [];
  for (const path of candidates.slice(0, MAX_FILES)) {
    try {
      const text = (await getFile(owner, name, path, commit)).slice(0, MAX_BYTES_PER_FILE);
      if (text.trim()) {
        chunks.push({ path, text });
        bytes += text.length;
      }
    } catch { errors += 1; }
  }

  const findings = await analyzeChunks(repo, commit, chunks);
  const uniq = Array.from(new Map(findings.map(f => [f.id, f])).values());

  const data = {
    repo, commit,
    findings: uniq,
    summary: {
      filesEnumerated: tree.length,
      filesConsidered: candidates.length,
      filesScanned: chunks.length,
      bytesScanned: bytes,
      errors
    }
  };
  return ScanResultSchema.parse(data);
}
