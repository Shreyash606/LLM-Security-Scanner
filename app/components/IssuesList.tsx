"use client";
import { Finding } from "@/lib/types";
import Link from "next/link";
import { Bug, FileCode2, ExternalLink } from "lucide-react";

function sevBadge(sev: string) {
  switch (sev) {
    case "low": return "badge-low";
    case "medium": return "badge-medium";
    case "high": return "badge-high";
    case "critical": return "badge-critical";
    default: return "";
  }
}

export default function IssuesList({ findings, onSelect, repo, commit }:{
  findings: Finding[];
  onSelect: (f: Finding)=>void;
  repo: string;
  commit: string;
}) {
  const [owner, name] = repo.split("/");
  return (
    <div className="gh-card">
      <div className="px-3 py-2 border-b" style={{borderColor:"var(--gh-border)"}}>
        <div className="flex items-center gap-2 font-medium"><Bug size={16}/> Issues</div>
      </div>
      <div>
        {findings.length === 0 && (
          <div className="p-3 text-sm text-gray-600">No issues detected for current rules/model.</div>
        )}
        {findings.map(f => (
          <div key={f.id} className="row">
            <div>
              <div className="flex items-center gap-2">
                <span className={`gh-badge ${sevBadge(f.severity)}`}>{f.severity}</span>
                <button className="text-left font-medium hover:underline" onClick={()=>onSelect(f)}>{f.title}</button>
              </div>
              <div className="mt-1 text-sm text-gray-600 flex items-center gap-2">
                <FileCode2 size={14}/> <span>{f.filePath}:{f.startLine}-{f.endLine}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="gh-btn" onClick={()=>onSelect(f)}>View code</button>
              <Link className="gh-btn flex items-center gap-1" href={`https://github.com/${owner}/${name}/blob/${commit}/${f.filePath}#L${f.startLine}`} target="_blank">
                Open <ExternalLink size={14}/>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
