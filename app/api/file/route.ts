import { NextRequest, NextResponse } from "next/server";
import { getFile } from "@/lib/github";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const repo = url.searchParams.get("repo");
    const commit = url.searchParams.get("commit");
    const path = url.searchParams.get("path");
    if (!repo || !commit || !path) return NextResponse.json({ error: "missing repo/commit/path" }, { status: 400 });
    const [owner, name] = (repo as string).split("/");
    const code = await getFile(owner, name, path!, commit!);
    return new NextResponse(code, { headers: { "content-type": "text/plain; charset=utf-8" } });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}