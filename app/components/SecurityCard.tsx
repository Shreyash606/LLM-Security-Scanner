"use client";
export default function SummaryCard({ summary }:{ summary?: { filesEnumerated:number; filesConsidered:number; filesScanned:number; bytesScanned:number; errors:number } }){
  if (!summary) return null;
  return (
    <div className="gh-card p-3 mb-3 text-sm">
      <div className="font-medium mb-2">Scan summary</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div><div className="text-gray-600">Enumerated</div><div>{summary.filesEnumerated}</div></div>
        <div><div className="text-gray-600">Considered</div><div>{summary.filesConsidered}</div></div>
        <div><div className="text-gray-600">Scanned</div><div>{summary.filesScanned}</div></div>
        <div><div className="text-gray-600">Bytes</div><div>{summary.bytesScanned}</div></div>
        <div><div className="text-gray-600">Errors</div><div>{summary.errors}</div></div>
      </div>
    </div>
  );
}
