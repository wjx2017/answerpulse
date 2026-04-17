"use client";

import { useState } from "react";
import { DimensionResult } from "@/lib/aeo-analyzer";

interface BreakdownListProps {
  dimensions: DimensionResult[];
}

const statusConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  good: { bg: "bg-green-50", text: "text-green-700", label: "Good", icon: "✓" },
  warning: { bg: "bg-yellow-50", text: "text-yellow-700", label: "Warning", icon: "!" },
  error: { bg: "bg-red-50", text: "text-red-700", label: "Needs Work", icon: "✗" },
};

export default function BreakdownList({ dimensions }: BreakdownListProps) {
  // Sort by weight descending
  const sorted = [...dimensions].sort((a, b) => b.weight - a.weight);

  return (
    <div className="space-y-4">
      {sorted.map((dim, i) => {
        const cfg = statusConfig[dim.status];
        const barColor =
          dim.status === "good"
            ? "bg-green-500"
            : dim.status === "warning"
              ? "bg-yellow-500"
              : "bg-red-500";

        return <DimensionCard key={dim.name} dim={dim} cfg={cfg} barColor={barColor} />;
      })}
    </div>
  );
}

function DimensionCard({
  dim,
  cfg,
  barColor,
}: {
  dim: DimensionResult;
  cfg: { bg: string; text: string; label: string; icon: string };
  barColor: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{dim.name}</h3>
              <span className="text-xs text-gray-400 font-medium">
                Weight: {dim.weight}%
              </span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-2">{dim.details}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-2xl font-bold text-gray-900 w-12 text-right">
              {dim.score}
            </span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${dim.score}%` }}
          />
        </div>
      </div>
      {/* Expandable recommendation */}
      {dim.recommendation && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-sm text-pulse-600 font-medium transition-colors border-t border-gray-100 text-left"
          >
            {expanded ? "Hide suggestion ▲" : "View suggestion ▼"}
          </button>
          {expanded && (
            <div className="px-5 py-4 bg-pulse-50 border-t border-pulse-100">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-pulse-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-sm text-pulse-800">{dim.recommendation}</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
