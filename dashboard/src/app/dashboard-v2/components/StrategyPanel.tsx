import React from "react";
import { LatestReport } from "@/types/pact";
import { Sparkles } from "lucide-react";

interface StrategyPanelProps {
  report: LatestReport | null;
}

export function StrategyPanel({ report }: StrategyPanelProps) {
  const byStrategy = report?.by_strategy || {};

  const strategyDetails: Record<string, { name: string; desc: string }> = {
    realistic: { name: "Balanced Realistic", desc: "Optimal concessions matching target limits" },
    conceder: { name: "Conceder Swarm", desc: "Aggressive price drops to lock early volume" },
    boulware: { name: "Boulware Anchor", desc: "Hard list-price compliance, minimal iterations" },
    hardball: { name: "Hardball Escalator", desc: "Aggressive margins, protecting floor limits" },
    tit_for_tat: { name: "Tit-for-Tat Swarm", desc: "Dynamic behavioral mimicry of buyer pacing" },
    aspirational: { name: "Premium Aspirational", desc: "High premium margins, focused branding" },
  };

  const strategies = Object.entries(byStrategy)
    .map(([key, stats]) => ({
      key,
      name: strategyDetails[key]?.name || key.toUpperCase(),
      desc: strategyDetails[key]?.desc || "Agent strategy profile",
      successPct: stats.success_pct,
      avgSavings: stats.avg_savings_pct,
    }))
    .sort((a, b) => b.successPct - a.successPct);

  return (
    <div className="bg-[#111112] border border-white/5 p-6 md:p-8 flex flex-col justify-between" style={{ borderRadius: "12px" }}>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#C5A880]" />
            <span className="font-sans text-[13px] font-semibold text-[#F2F2F7]">
              Strategy Intelligence Yield
            </span>
          </div>
          <span className="font-sans text-[10px] text-[#8E8E93] uppercase tracking-[0.05em] px-2 py-0.5 rounded-md bg-white/5 border border-white/5">
            MCDA Optimized
          </span>
        </div>

        {/* Spacious, premium listing */}
        <div className="space-y-4 pt-1">
          {strategies.length > 0 ? (
            strategies.map((strat) => (
              <div key={strat.key} className="space-y-2 hover:bg-white/[0.01] p-3 rounded-lg transition-colors text-left">
                <div className="flex items-center justify-between font-sans text-xs">
                  <div className="flex flex-col text-left">
                    <span className="font-semibold text-[#F2F2F7]">{strat.name}</span>
                    <span className="text-[10px] text-[#8E8E93]">{strat.desc}</span>
                  </div>
                  <div className="flex items-end flex-col">
                    <span className="font-bold text-emerald-400 font-mono text-[11px] tabular-nums">
                      {strat.successPct.toFixed(1)}% yield
                    </span>
                    <span className="text-[10px] text-[#8E8E93] font-mono tabular-nums">
                      {strat.avgSavings.toFixed(1)}% savings
                    </span>
                  </div>
                </div>

                {/* Progress bar line */}
                <div className="w-full bg-[#070708] h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#C5A880] h-full rounded-full transition-all duration-500"
                    style={{ width: `${strat.successPct}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center font-sans text-xs text-[#8E8E93]/40 py-12">
              Waiting for active simulation yield data
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
