import React from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { StatRow } from "@/components/dashboard/StatRow";
import { StrategyLeaderboard } from "@/components/dashboard/StrategyLeaderboard";
import { LatestReport } from "@/types/pact";

async function getLatestReport(): Promise<LatestReport | null> {
  try {
    const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
    const res = await fetch(`${BACKEND_URL}/api/stats/latest-report`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

export default async function DashboardPage() {
  const report = await getLatestReport();

  return (
    <div className="max-w-5xl mx-auto w-full p-8 md:p-10 flex flex-col gap-8 select-none">
      {/* Top Welcome Title Row */}
      <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-5 select-none">
        <div className="flex flex-col gap-1">
          <h2 className="text-[12px] font-sans font-bold tracking-[0.18em] uppercase text-[#E5D3B3]">
            OPERATIONAL INTELLIGENCE DESK
          </h2>
          <p className="text-[9px] font-sans text-[#8E8E93] uppercase tracking-wider font-semibold">
            Real-time telemetry and strategy audits for autonomous sourcing agents.
          </p>
        </div>
        
        {/* Node status live beacon */}
        <div className="flex items-center gap-2 font-mono text-[8px] font-bold text-[#C5A880] bg-[#14120F] border border-[#C5A880]/15 rounded-[4px] px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
          <span>SYSTEM: ACTIVE</span>
        </div>
      </div>

      {/* Asymmetric Sourcing Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (8/12): Main Execution & Live Metrics Area */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Dashboard Hero Block */}
          <DashboardHero />

          {/* Title bar for Live Dials */}
          <div className="flex justify-between items-baseline border-b border-[#1E1E1E] pb-2 select-none">
            <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.12em] text-[#8E8E93]">
              LIVE TELEMETRY DIALS
            </span>
            <span className="text-[8px] font-mono text-[#48484A]">UPDATE_FREQ: 1.0s</span>
          </div>

          {/* Stats Row Block */}
          <StatRow report={report} />
          
        </div>

        {/* Right Column (4/12): Diagnostic Telemetry Control Deck */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Strategy Leaderboard Performance Matrix */}
          <StrategyLeaderboard report={report} />

          {/* Node Sourcing Engine Diagnostics Console */}
          <div className="flex flex-col bg-[#0C0C0C]/40 border border-[#1E1E1E] rounded-[6px] p-6 gap-5 relative overflow-hidden select-none group hover:border-[#C5A880]/15 transition-all">
            {/* HUD details */}
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/10" />
            <div className="absolute bottom-2 right-2 w-1 h-1 border-b border-r border-[#C5A880]/10" />
            
            <div className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#8E8E93] border-b border-[#1E1E1E] pb-3">
              SOURCING MODE: STATUS
            </div>

            <div className="flex flex-col gap-3 font-mono text-[9px] text-[#8E8E93]">
              <div className="flex justify-between py-2 border-b border-[#1E1E1E] hover:text-[#E5D3B3] transition-colors items-center">
                <span className="uppercase tracking-wider font-semibold">Node Status</span>
                <span className="text-[#E5D3B3] font-bold flex items-center gap-1.5">
                  Active / <span className="text-[#C5A880]">Online</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1E1E1E] hover:text-[#E5D3B3] transition-colors">
                <span className="uppercase tracking-wider font-semibold">Engine Throughput</span>
                <span className="text-[#C5A880] font-bold">28,530 negs/sec peak</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#1E1E1E] hover:text-[#E5D3B3] transition-colors">
                <span className="uppercase tracking-wider font-semibold">Sentinel Guard</span>
                <span className="text-[#E5D3B3] font-bold">8 Security Pipelines Active</span>
              </div>
              <div className="flex justify-between py-2 hover:text-[#E5D3B3] transition-colors">
                <span className="uppercase tracking-wider font-semibold">Cognitive Model</span>
                <span className="text-[#8E8E93] italic uppercase font-bold">SAO Pure Logic (Zero LLM Costs)</span>
              </div>
            </div>

            {/* Diagnostic telemetry subtext */}
            <div className="text-[8px] font-sans text-[#48484A] leading-relaxed uppercase border-t border-[#1E1E1E] pt-3.5 font-bold tracking-wider">
              ℹ Zero LLM cost per rounds negotiated. GPT-5.5 is utilized solely for initial constraint parsing.
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}


