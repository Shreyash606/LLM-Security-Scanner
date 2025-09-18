"use client";
import { GitBranch, GitCommitVertical } from "lucide-react";

export default function RepoHeader({ repo, commit }: { repo?: string; commit?: string }) {
  if (!repo) return null;
  const short = commit ? commit.slice(0, 7) : undefined;
  return (
    <div className="gh-card p-3 mb-3">
      <div className="flex items-center gap-3 text-sm">
        <GitBranch size={16} className="text-gray-500" />
        <span className="font-medium">{repo}</span>
        {short && (
          <span className="flex items-center gap-1 text-gray-600">
            <GitCommitVertical size={16} /> {short}
          </span>
        )}
      </div>
    </div>
  );
}
