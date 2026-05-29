import React from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { StatRow } from "@/components/dashboard/StatRow";
import { StrategyLeaderboard } from "@/components/dashboard/StrategyLeaderboard";
import { LatestReport } from "@/types/pact";
import { DashboardPanel, SectionHeading } from "@/components/ui/SovereignPrimitives";

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
    <div className="max-w-5xl mx-auto w-full p-[var(--space-xxl)] flex flex-col gap-[var(--space-xl)] select-none">
      {/* Top Welcome Title Row */}
      <SectionHeading
        title="OPERATIONAL INTELLIGENCE DESK"
        subtitle="Real-time telemetry and strategy audits for autonomous sourcing agents."
        badgeText="SYSTEM: ACTIVE"
      />

      {/* Asymmetric Sourcing Command Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--space-xl)] items-start">
        
        {/* Left Column (8/12): Main Execution & Live Metrics Area */}
        <div className="lg:col-span-8 flex flex-col gap-[var(--space-xl)]">
          
          {/* Dashboard Hero Block */}
          <DashboardHero />

          {/* Title bar for Live Dials */}
          <div className="flex justify-between items-baseline border-b border-[var(--border-thin)] pb-[var(--space-sm)] select-none">
            <span className="text-[9px] font-sans font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              LIVE TELEMETRY DIALS
            </span>
            <span className="text-[8px] font-mono text-[var(--text-tertiary)] font-bold">[ UPDATE_FREQ: 1.0s ]</span>
          </div>

          {/* Stats Row Block */}
          <StatRow report={report} />
          
        </div>

        {/* Right Column (4/12): Diagnostic Telemetry Control Deck */}
        <div className="lg:col-span-4 flex flex-col gap-[var(--space-xl)]">
          
          {/* Strategy Leaderboard Performance Matrix */}
          <StrategyLeaderboard report={report} />

          {/* Node Sourcing Engine Diagnostics Console */}
          <DashboardPanel title="SOURCING MODE: STATUS">
            <div className="flex flex-col gap-[var(--space-xs)] font-mono text-[9px] text-[var(--text-secondary)]">
              <div className="flex justify-between py-[var(--space-sm)] border-b border-[var(--border-thin)] hover:text-[var(--accent-cream)] transition-colors items-center">
                <span className="uppercase tracking-wider font-semibold">Node Status</span>
                <span className="text-[var(--accent-cream)] font-bold flex items-center gap-[var(--space-sm)]">
                  Active / <span className="text-[var(--accent-gold)]">Online</span>
                  <span className="w-1.5 h-1.5 bg-[var(--accent-gold)] animate-pulse" />
                </span>
              </div>
              <div className="flex justify-between py-[var(--space-sm)] border-b border-[var(--border-thin)] hover:text-[var(--accent-cream)] transition-colors">
                <span className="uppercase tracking-wider font-semibold">Engine Throughput</span>
                <span className="text-[var(--accent-gold)] font-bold">28,530 negs/sec peak</span>
              </div>
              <div className="flex justify-between py-[var(--space-sm)] border-b border-[var(--border-thin)] hover:text-[var(--accent-cream)] transition-colors">
                <span className="uppercase tracking-wider font-semibold">Sentinel Guard</span>
                <span className="text-[var(--accent-cream)] font-bold">8 Security Pipelines Active</span>
              </div>
              <div className="flex justify-between py-[var(--space-sm)] hover:text-[var(--accent-cream)] transition-colors">
                <span className="uppercase tracking-wider font-semibold">Cognitive Model</span>
                <span className="text-[var(--text-secondary)] uppercase font-bold">SAO Pure Logic (Zero LLM Costs)</span>
              </div>
            </div>

            {/* Diagnostic telemetry subtext */}
            <div className="text-[8px] font-sans text-[var(--text-tertiary)] leading-relaxed uppercase border-t border-[var(--border-thin)] pt-[var(--space-sm)] font-bold tracking-wider">
              [NOTE] Zero LLM cost per rounds negotiated. GPT-5.5 is utilized solely for initial constraint parsing.
            </div>
          </DashboardPanel>
          
        </div>

      </div>
    </div>
  );
}
