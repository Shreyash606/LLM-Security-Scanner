"use client";
import { useMemo } from "react";

type Props = {
  severity: string;
  setSeverity: (s: string)=>void;
  query: string;
  setQuery: (q: string)=>void;
  count: number;
};

export default function FiltersBar({ severity, setSeverity, query, setQuery, count }: Props) {
  const options = useMemo(() => ["all","low","medium","high","critical"], []);
  return (
    <div className="gh-card p-3 mb-3 flex flex-col md:flex-row md:items-center gap-3 justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600">Filter:</span>
        <select className="gh-input py-1" value={severity} onChange={(e)=>setSeverity(e.target.value)}>
          {options.map(o => <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>)}
        </select>
        <input className="gh-input py-1" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Filter by file path or title"/>
      </div>
      <div className="text-sm text-gray-600">{count} result{count===1?"":"s"}</div>
    </div>
  );
}
