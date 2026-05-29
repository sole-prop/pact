import React from "react";
import { Award, BarChart3, Calendar } from "lucide-react";
import { LatestReport } from "@/types/pact";

interface HistoryWorkflowProps {
  report: LatestReport | null;
}

export function HistoryWorkflow({ report }: HistoryWorkflowProps) {
  const roundDist = report?.round_distribution || {};
  const savingsHist = report?.savings_histogram || {};

  const defaultHistory = [
    { id: "R-9482", timestamp: "2026-05-28 22:10:15", seed: 42, buyers: 10, success_pct: 84.6, value: 48200000, status: "SUCCESS" },
    { id: "R-9371", timestamp: "2026-05-28 18:45:00", seed: 101, buyers: 5, success_pct: 81.2, value: 23100000, status: "SUCCESS" },
    { id: "R-9120", timestamp: "2026-05-27 12:30:22", seed: 999, buyers: 20, success_pct: 79.5, value: 91400000, status: "SUCCESS" },
  ];

  const rounds = Object.entries(roundDist)
    .map(([key, val]) => ({
      round: key,
      count: val,
    }))
    .sort((a, b) => Number(a.round) - Number(b.round));

  const savings = Object.entries(savingsHist)
    .map(([key, val]) => ({
      range: key,
      count: val,
    }));

  const formatCurrency = (val: number) => {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  };

  const getMaxCount = (arr: { count: number }[]) => {
    if (arr.length === 0) return 1;
    return Math.max(...arr.map((x) => x.count));
  };

  const maxRoundCount = getMaxCount(rounds);
  const maxSavingsCount = getMaxCount(savings);

  return (
    <div className="space-y-10 w-full max-w-[1100px] mx-auto select-none text-left pt-2">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-extrabold text-[#F2F2F7] tracking-tight">Audit Archive</h2>
        <p className="font-sans text-sm text-[#8E8E93] max-w-xl">
          Evaluate historical loop convergence runs and pricing yield charts.
        </p>
      </div>

      {/* Histograms */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        {/* Convergence Rounds */}
        <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-6 space-y-5" style={{ borderRadius: "16px" }}>
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <BarChart3 className="h-4 w-4 text-[#C5A880]" />
            <span className="font-sans text-xs font-semibold text-[#F2F2F7]">
              Swarms Convergence Speed
            </span>
          </div>

          <p className="font-sans text-xs text-[#8E8E93] leading-relaxed text-left">
            Quantifies the distribution of negotiation round terminations. A higher proportion of early rounds 
            indicates prompt agent agreement.
          </p>

          <div className="space-y-3 pt-2">
            {rounds.length > 0 ? (
              rounds.map((r) => {
                const widthPct = (r.count / maxRoundCount) * 100;
                return (
                  <div key={r.round} className="flex items-center gap-4 text-xs font-sans">
                    <span className="w-16 text-[#8E8E93]/70 text-left font-medium">Round {r.round}:</span>
                    <div className="flex-1 bg-[#070708]/60 h-4 relative rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="bg-[#C5A880]/20 border-r border-[#C5A880] h-full transition-all duration-500 rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="absolute inset-y-0 right-2.5 flex items-center text-[9px] text-[#F2F2F7] font-bold font-mono tabular-nums">
                        {r.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center font-sans text-xs text-[#8E8E93]/30 py-12">
                No round distribution data logged
              </div>
            )}
          </div>
        </div>

        {/* Savings distribution */}
        <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-6 space-y-5" style={{ borderRadius: "16px" }}>
          <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
            <Award className="h-4 w-4 text-[#C5A880]" />
            <span className="font-sans text-xs font-semibold text-[#F2F2F7]">
              Price Savings Spread
            </span>
          </div>

          <p className="font-sans text-xs text-[#8E8E93] leading-relaxed text-left">
            Tracks average discounts secured off sellers' starting list prices across all active categories.
          </p>

          <div className="space-y-3 pt-2">
            {savings.length > 0 ? (
              savings.map((s) => {
                const widthPct = (s.count / maxSavingsCount) * 100;
                return (
                  <div key={s.range} className="flex items-center gap-4 text-xs font-sans">
                    <span className="w-20 text-[#8E8E93]/70 text-left truncate font-medium">{s.range}% Savings:</span>
                    <div className="flex-1 bg-[#070708]/60 h-4 relative rounded-full overflow-hidden border border-white/[0.04]">
                      <div
                        className="bg-emerald-500/10 border-r border-emerald-400 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="absolute inset-y-0 right-2.5 flex items-center text-[9px] text-[#F2F2F7] font-bold font-mono tabular-nums">
                        {s.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center font-sans text-xs text-[#8E8E93]/30 py-12">
                No savings distribution data logged
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Archives list */}
      <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-6 space-y-4 shadow-sm" style={{ borderRadius: "12px" }}>
        <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
          <Calendar className="h-4 w-4 text-[#8E8E93]" />
          <span className="font-sans text-xs font-semibold text-[#F2F2F7]">
            Historical Run Ledger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.04] font-sans text-[11px] text-[#8E8E93] uppercase font-semibold">
                <th className="py-2.5">Run</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Seed</th>
                <th className="py-2.5 text-right">Buyers</th>
                <th className="py-2.5 text-right">Win%</th>
                <th className="py-2.5 text-right">Volume</th>
                <th className="py-2.5 text-right pl-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-sans text-xs">
              {defaultHistory.map((run) => (
                <tr key={run.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="py-3 font-semibold text-[#F2F2F7]">
                    {run.id}
                  </td>
                  <td className="py-3 text-[#8E8E93]">
                    {run.timestamp}
                  </td>
                  <td className="py-3 text-right font-mono text-[10px] text-[#8E8E93] tabular-nums">
                    {run.seed}
                  </td>
                  <td className="py-3 text-right font-mono text-[10px] text-[#8E8E93] tabular-nums">
                    {run.buyers}
                  </td>
                  <td className="py-3 text-right font-mono text-[11px] font-bold text-emerald-400 tabular-nums">
                    {run.success_pct.toFixed(1)}%
                  </td>
                  <td className="py-3 text-right font-mono text-[10px] text-[#8E8E93] tabular-nums">
                    {formatCurrency(run.value)}
                  </td>
                  <td className="py-3 text-right pl-4">
                    <span className="px-2.5 py-0.5 border border-emerald-800/10 text-emerald-400 bg-emerald-950/20 font-sans text-[9px] uppercase font-bold rounded-full">
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
