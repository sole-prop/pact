"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LatestReport } from "@/types/pact";
import { Surface, DashboardPanel } from "@/components/ui/SovereignPrimitives";

interface StrategyLeaderboardProps {
  report: LatestReport | null;
}

const STRATEGIES_LIST = [
  { 
    key: "tit_for_tat", 
    label: "Tit-For-Tat (Balanced)", 
    desc: "Reciprocates seller concessions. Maintains positive ZOPA momentum.", 
    aggressiveness: "MEDIUM", 
    rounds: 4.8 
  },
  { 
    key: "boulware", 
    label: "Boulware (Hard Nose)", 
    desc: "Strict adherence to price limits. Minimizes concession rates.", 
    aggressiveness: "HIGH", 
    rounds: 3.2 
  },
  { 
    key: "conceder", 
    label: "Conceder (Urgent)", 
    desc: "Prioritizes timeline speed. Rapidly narrows variance gap.", 
    aggressiveness: "MINIMAL", 
    rounds: 2.1 
  },
  { 
    key: "hardball", 
    label: "Hardball Tactics", 
    desc: "High initial demands, slow compromises. Punishes high seller margins.", 
    aggressiveness: "EXTREME", 
    rounds: 6.5 
  },
];

export function StrategyLeaderboard({ report }: StrategyLeaderboardProps) {
  const [activeKey, setActiveKey] = useState("tit_for_tat");

  const getMockStats = (key: string) => {
    switch (key) {
      case "tit_for_tat": return { success: 74.2, savings: 24.0 };
      case "boulware": return { success: 77.5, savings: 23.9 };
      case "conceder": return { success: 80.1, savings: 26.3 };
      case "hardball": return { success: 76.7, savings: 25.4 };
      default: return { success: 0.0, savings: 0.0 };
    }
  };

  const activeStrategy = STRATEGIES_LIST.find((s) => s.key === activeKey) || STRATEGIES_LIST[0];
  const activeStats = report?.by_strategy?.[activeStrategy.key];
  const activeMock = getMockStats(activeStrategy.key);
  const activeSuccess = activeStats ? activeStats.success_pct : activeMock.success;
  const activeSavings = activeStats ? activeStats.avg_savings_pct : activeMock.savings;

  const headerRight = (
    <span className="font-mono text-[8px] text-[var(--accent-gold)] uppercase tracking-widest bg-[var(--background-base)] border border-[var(--accent-gold)]/[0.15] rounded-none px-[var(--space-sm)] py-[var(--space-xs)] font-bold">
      Active Deck
    </span>
  );

  return (
    <DashboardPanel title="Strategy Performance Matrix" headerRight={headerRight}>
      {/* Main Asymmetric Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-[var(--space-md)] items-start">
        
        {/* Left Column: Strategy List */}
        <div className="md:col-span-6 flex flex-col gap-[var(--space-sm)]">
          {STRATEGIES_LIST.map((strat) => {
            const stats = report?.by_strategy?.[strat.key];
            const mock = getMockStats(strat.key);
            const successPct = stats ? stats.success_pct : mock.success;
            const isSelected = activeKey === strat.key;

            return (
              <Surface
                key={strat.key}
                onClick={() => setActiveKey(strat.key)}
                active={isSelected}
                className="p-[var(--space-md)] cursor-pointer select-none"
              >
                {isSelected && (
                  <motion.div 
                    layoutId="activeIndicator"
                    className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--accent-gold)]" 
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                  />
                )}

                <div className="flex justify-between items-baseline">
                  <span className={`text-[9.5px] font-mono font-bold uppercase tracking-widest ${
                    isSelected ? "text-[var(--accent-gold)]" : "text-[var(--accent-cream)]"
                  }`}>
                    {strat.label.split(" ")[0]}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-white tabular-nums">
                    {successPct.toFixed(1)}%
                  </span>
                </div>

                {/* Flat Square Progress bar */}
                <div className="w-full h-[3px] bg-[var(--background-base)] border border-[var(--border-thin)] mt-[var(--space-sm)] overflow-hidden p-[0.5px] rounded-none">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isSelected ? "bg-[var(--accent-gold)]" : "bg-white/[0.04]"
                    }`}
                    style={{ width: `${successPct}%` }}
                  />
                </div>
              </Surface>
            );
          })}
        </div>

        {/* Right Column: Diagnostic Telemetry with smooth opacity reveals */}
        <DashboardPanel className="md:col-span-6 bg-[var(--background-base)] min-h-[240px] justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-gold)]/[0.01] rounded-full blur-2xl pointer-events-none" />

          {/* Subpanel Header */}
          <div className="flex flex-col gap-[var(--space-xs)] border-b border-[var(--border-thin)] pb-[var(--space-sm)]">
            <span className="text-[8px] font-mono uppercase tracking-widest text-[var(--text-secondary)] font-bold">
              [Diagnostic Telemetry]
            </span>
            <span className="text-[11px] font-sans font-extrabold uppercase text-[var(--text-primary)] tracking-widest">
              {activeStrategy.label}
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeKey}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-[var(--space-lg)] flex-1 justify-between"
            >
              {/* Strategy Details Block */}
              <p className="text-[10px] font-sans text-[var(--text-secondary)] leading-relaxed uppercase tracking-wider font-semibold">
                {activeStrategy.desc}
              </p>

              {/* Metric Sub-Grid */}
              <div className="grid grid-cols-2 gap-[var(--space-md)] pt-[var(--space-sm)] font-mono text-[9px] border-t border-[var(--border-thin)]">
                <div className="flex flex-col gap-[var(--space-xs)]">
                  <span className="text-[var(--text-secondary)] uppercase tracking-wider font-bold text-[8px] font-mono">[Avg Savings]</span>
                  <span className="text-[12px] font-bold text-[var(--accent-gold)] tabular-nums">
                    {activeSavings.toFixed(1)}%
                  </span>
                </div>

                <div className="flex flex-col gap-[var(--space-xs)] pl-[var(--space-md)] border-l border-[var(--border-thin)]">
                  <span className="text-[var(--text-secondary)] uppercase tracking-wider font-bold text-[8px] font-mono">[Compromise Rounds]</span>
                  <span className="text-[12px] font-bold text-[var(--accent-cream)] tabular-nums">
                    {activeStrategy.rounds} Rounds
                  </span>
                </div>

                <div className="flex flex-col gap-[var(--space-xs)] pt-[var(--space-sm)] border-t border-[var(--border-thin)]">
                  <span className="text-[var(--text-secondary)] uppercase tracking-wider font-bold text-[8px] font-mono">[Aggression]</span>
                  <span className={`font-bold uppercase tracking-widest text-[10px] ${
                    activeStrategy.aggressiveness === "HIGH" || activeStrategy.aggressiveness === "EXTREME"
                      ? "text-red-400"
                      : activeStrategy.aggressiveness === "MEDIUM"
                      ? "text-[var(--accent-gold)]"
                      : "text-green-400"
                  }`}>
                    {activeStrategy.aggressiveness}
                  </span>
                </div>

                <div className="flex flex-col gap-[var(--space-xs)] pl-[var(--space-md)] pt-[var(--space-sm)] border-l border-[var(--border-thin)] border-t border-[var(--border-thin)]">
                  <span className="text-[var(--text-secondary)] uppercase tracking-wider font-bold text-[8px] font-mono">[Stability]</span>
                  <span className="text-green-400 font-bold tracking-widest text-[10px]">
                    OPTIMAL
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </DashboardPanel>

      </div>
    </DashboardPanel>
  );
}
