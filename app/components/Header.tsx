"use client";
import { useState } from "react";
import Link from "next/link";
import { Github, Search, ScanEye } from "lucide-react";

export default function Header({ onScan }: { onScan: (repo: string) => void }) {
  const [repo, setRepo] = useState("vercel/next.js");
  return (
    <div className="gh-header">
      <div className="container flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Github size={20} /> LLM Security Scanner
          </Link>
          <span className="text-xs opacity-75 border border-gray-700 rounded px-1 py-0.5">Free</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              className="pl-8 pr-2 py-1.5 rounded-md border border-gray-700 bg-[#0d1117] text-gray-200 placeholder:text-gray-400"
              value={repo} onChange={(e)=>setRepo(e.target.value)} placeholder="owner/name"
            />
            <Search size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button className="px-3 py-1.5 rounded-md bg-[#238636] text-white hover:bg-[#2ea043] flex items-center gap-1" onClick={()=>onScan(repo)}>
            <ScanEye size={16}/> Scan
          </button>
        </div>
      </div>
    </div>
  );
}
