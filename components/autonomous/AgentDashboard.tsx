"use client";

import type { Agent } from "@/lib/types";
import { AgentCard } from "./AgentCard";

export function AgentDashboard({ agents }: { agents: Agent[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-white">Agent Network</h3>
        <span className="text-[11px] text-white/40">{agents.length} agents</span>
      </div>

      {/* Connection diagram showing data flow between agents */}
      <div className="glass-card relative overflow-hidden p-3">
        <svg viewBox="0 0 300 60" className="w-full" style={{ height: 52 }}>
          <defs>
            <linearGradient id="flow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#FFD700" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FFD700" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          {[30, 90, 150, 210, 270].map((x, i, arr) => (
            <g key={x}>
              {i < arr.length - 1 && (
                <line x1={x + 6} y1="30" x2={arr[i + 1] - 6} y2="30" stroke="url(#flow)" strokeWidth="1.5">
                  <animate attributeName="stroke-opacity" values="0.2;1;0.2" dur="2s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
                </line>
              )}
              <circle cx={x} cy="30" r="6" fill="#0a0a0f" stroke="#FFD700" strokeWidth="1.5" />
              <circle cx={x} cy="30" r="2.5" fill="#FFD700">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
        <div className="mt-1 flex justify-between px-1 text-[8px] uppercase tracking-wide text-white/40">
          <span>Scan</span>
          <span>Analyse</span>
          <span>Decide</span>
          <span>Risk</span>
          <span>Execute</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>
    </div>
  );
}
