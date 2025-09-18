import { Octokit } from "@octokit/rest";
const octo = new Octokit({ auth: process.env.GITHUB_TOKEN });

const DENY_DIRS = /(^|\/)(node_modules|\.git|\.next|dist|build|out|coverage|vendor|target|__pycache__)(\/|$)/i;
const DENY_EXT  = /\.(png|jpe?g|gif|pdf|svg|ico|bmp|exe|dll|lock|map)$/i;
const ALLOW_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|java|cs|php|rs|scala|kt|swift|sql|c|cc|cpp|h|hpp|vue|svelte|sh|bash|yaml|yml|toml|ini|cfg)$/i;
const ALLOW_DIRS = /(^|\/)(src|app|lib|server|cli|scripts|cmd|internal|pkg|services|packages\/[^/]+\/(src|lib)|examples|\.github\/actions\/src)(\/|$)/i;
const STRICT_DIRS = (process.env.SCAN_STRICT_DIRS ?? "false").toLowerCase() === "true";

export async function resolveCommit(owner: string, repo: string, ref = "HEAD") {
  const { data } = await octo.repos.getCommit({ owner, repo, ref });
  return data.sha;
}

export async function listTree(owner: string, repo: string, sha: string) {
  const { data } = await octo.git.getTree({ owner, repo, tree_sha: sha, recursive: "true" as any });
  return (data.tree ?? []).filter(t => {
    if (t.type !== "blob" || !t.path) return false;
    const p = t.path;
    if (DENY_DIRS.test(p) || DENY_EXT.test(p)) return false;
    if (!ALLOW_EXT.test(p)) return false;
    if (STRICT_DIRS && !ALLOW_DIRS.test(p)) return false;
    return true;
  });
}

export async function getFile(owner: string, repo: string, path: string, ref: string) {
  const { data } = await octo.repos.getContent({ owner, repo, path, ref });
  if (Array.isArray(data)) return "";
  if (!("content" in data) || !data.content) return "";
  return Buffer.from(data.content, "base64").toString("utf8");
}
