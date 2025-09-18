import { ruleScan } from "@/lib/rules";
import type { Finding } from "@/lib/types";

/**
 * Free providers:
 * - 'rule' (default): uses local static rules (no API keys, fully free)
 * - 'hf': optional Hugging Face Inference API (free-tier token). Model must return JSON with { findings: [...] }.
 *
 * Set LLM_PROVIDER=rule or hf
 */
const provider = process.env.LLM_PROVIDER ?? "rule";

type Chunk = { path: string; text: string };

export async function analyzeChunks(repo: string, commit: string, chunks: Chunk[]): Promise<Finding[]> {
  if (provider === "hf") return await hfAnalyze(repo, commit, chunks);
  // default free: rules only
  return chunks.flatMap(ch => ruleScan(repo, commit, ch.path, ch.text));
}

async function hfAnalyze(repo: string, commit: string, chunks: Chunk[]): Promise<Finding[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HF_MODEL || "Qwen/Qwen2.5-Coder-1.5B-Instruct";
  if (!apiKey) {
    // fallback to rules if no token
    return chunks.flatMap(ch => ruleScan(repo, commit, ch.path, ch.text));
  }
  const prompt = JSON.stringify({ repo, commit, files: chunks });
  const res = await fetch(`https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ inputs: `Return JSON strictly as {"findings":[...]}. ${prompt}` })
  });
  const txt = await res.text();
  try {
    const json = JSON.parse(txt);
    // Some endpoints wrap output; best effort extraction
    const content = Array.isArray(json) ? (json[0]?.generated_text || json[0]?.output_text || JSON.stringify(json)) : json;
    const parsed = typeof content === "string" ? JSON.parse(content) : content;
    return Array.isArray(parsed.findings) ? parsed.findings as Finding[] : [];
  } catch {
    return [];
  }
}