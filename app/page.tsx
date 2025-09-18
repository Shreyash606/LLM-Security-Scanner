"use client";
import { useEffect, useMemo, useState } from "react";
import type { Finding, ScanResult } from "@/lib/types";
import Header from "./components/Header";
import RepoHeader from "./components/RepoHeader";
import FiltersBar from "./components/FilterBar";
import SummaryCard from "./components/SecurityCard";
import IssuesList from "./components/IssuesList";
import CodeViewer from "./components/CodeViewer";

export default function HomePage() {
  const [scanId, setScanId] = useState<string | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Finding | null>(null);
  const [selectedCode, setSelectedCode] = useState<string>("");
  const [severity, setSeverity] = useState("all");
  const [query, setQuery] = useState("");

  async function startScan(repo: string) {
    setLoading(true);
    setScan(null);
    setSelected(null);
    setSelectedCode("");
    setScanId(null);
    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ repo, ref: "HEAD" })
    });
    const data = await res.json();
    setScanId(data.id);
    setLoading(false);
  }

  useEffect(() => {
    if (!scanId) return;
    const iv = setInterval(async () => {
      const res = await fetch(`/api/scan?id=${encodeURIComponent(scanId)}`);
      const j = await res.json();
      if (j.status === "done" && j.data) {
        setScan(j.data);
        clearInterval(iv);
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [scanId]);

  useEffect(() => {
    async function loadCode() {
      if (!scan || !selected) return;
      try {
        const res = await fetch(`/api/file?repo=${encodeURIComponent(scan.repo)}&commit=${scan.commit}&path=${encodeURIComponent(selected.filePath)}`);
        if (!res.ok) {
          setSelectedCode("// Failed to load file");
          return;
        }
        const full = await res.text();
        const lines = full.split(/\r?\n/);
        // 10-line window around finding
        const WINDOW = 10;
        const rangeStart = Math.max(1, selected.startLine);
        const rangeEnd = Math.max(rangeStart, selected.endLine);
        const rangeLen = rangeEnd - rangeStart + 1;
        let startIdx: number, endIdx: number;
        if (rangeLen >= WINDOW) { startIdx = rangeStart - 1; endIdx = startIdx + WINDOW; }
        else {
          const extra = WINDOW - rangeLen;
          const pre = Math.floor(extra / 2);
          const post = extra - pre;
          startIdx = Math.max(0, rangeStart - 1 - pre);
          endIdx   = Math.min(lines.length, rangeEnd + post);
          const need = WINDOW - (endIdx - startIdx);
          if (need > 0) {
            if (startIdx === 0) endIdx = Math.min(lines.length, endIdx + need);
            else if (endIdx === lines.length) startIdx = Math.max(0, startIdx - need);
          }
        }
        const slice = lines.slice(startIdx, endIdx).join("\n");
        setSelectedCode(JSON.stringify({ slice, offset: startIdx + 1 }));
      } catch {
        setSelectedCode("// Failed to load file");
      }
    }
    loadCode();
  }, [scan, selected]);

  const filtered = useMemo(() => {
    if (!scan) return [];
    return scan.findings.filter(f => {
      const sevOK = severity === "all" ? true : f.severity === severity;
      const q = query.trim().toLowerCase();
      const qOK = !q || f.title.toLowerCase().includes(q) || f.filePath.toLowerCase().includes(q);
      return sevOK && qOK;
    });
  }, [scan, severity, query]);

  return (
    <div>
      <Header onScan={startScan} />
      <div className="container grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div>
          <RepoHeader repo={scan?.repo} commit={scan?.commit} />
          <SummaryCard summary={scan?.summary} />
          <FiltersBar severity={severity} setSeverity={setSeverity} query={query} setQuery={setQuery} count={filtered.length} />
          <IssuesList findings={filtered} onSelect={setSelected} repo={scan?.repo || ""} commit={scan?.commit || ""} />
        </div>
        <div>
          {selected ? (
            <CodeViewer code={selectedCode} path={selected.filePath} highlight={{ start: selected.startLine, end: selected.endLine }} />
          ) : (
            <div className="gh-card sticky-pane p-4 text-sm text-gray-600">Select an issue to preview code.</div>
          )}
        </div>
      </div>
      {loading && (
        <div className="container mt-3 text-sm text-gray-600">Scanning…</div>
      )}
    </div>
  );
}
