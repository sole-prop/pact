"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, BarChart3, Calendar } from "lucide-react";
import { LatestReport } from "@/types/pact";

interface HistoryWorkflowProps {
  report: LatestReport | null;
}

export function HistoryWorkflow({ report }: HistoryWorkflowProps) {
  const roundDist = report?.round_distribution || {};
  const savingsHist = report?.savings_histogram || {};

  const defaultHistory = [
    { id: "RUN-9482", timestamp: "2026-05-31 12:10:15", seed: 42, buyers: 15, success_pct: 86.4, value: 3450000, status: "SUCCESS" },
    { id: "RUN-9371", timestamp: "2026-05-30 18:45:00", seed: 101, buyers: 12, success_pct: 82.8, value: 2120000, status: "SUCCESS" },
    { id: "RUN-9120", timestamp: "2026-05-29 12:30:22", seed: 999, buyers: 8, success_pct: 79.5, value: 1040000, status: "SUCCESS" },
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
    return `₹${(val / 1000000).toFixed(2)}M`;
  };

  const getMaxCount = (arr: { count: number }[]) => {
    if (arr.length === 0) return 1;
    return Math.max(...arr.map((x) => x.count));
  };

  const maxRoundCount = getMaxCount(rounds);
  const maxSavingsCount = getMaxCount(savings);

  return (
    <div className="space-y-12 w-full max-w-[1200px] mx-auto select-none text-left pt-2 pb-24 relative z-10 font-sans">
      
      {/* Title */}
      <div className="border-b border-[#c4c7c7]/30 pb-6 text-left">
        <span className="label-caps text-[#444748] block">Run Archives</span>
        <h2 className="section-header text-[#0d0d0d] mt-2 font-sans">Audit Ledger</h2>
      </div>

      {/* Histograms Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
        
        {/* Convergence Rounds */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        >
          <div className="flex items-center gap-2.5 border-b border-[#c4c7c7]/20 pb-4">
            <BarChart3 className="h-4.5 w-4.5 text-[#4b41e1]" />
            <span className="label-caps text-[#0d0d0d]">Swarms Convergence Speed</span>
          </div>

          <p className="body-md text-[#444748] leading-relaxed text-left">
            Quantifies the distribution of negotiation round terminations. A higher proportion of early rounds 
            indicates prompt agent agreement.
          </p>

          <div className="space-y-4 pt-2">
            {rounds.length > 0 ? (
              rounds.map((r) => {
                const widthPct = (r.count / maxRoundCount) * 100;
                return (
                  <div key={r.round} className="flex items-center gap-4 text-xs font-sans">
                    <span className="w-16 text-[#444748] text-left font-medium">Round {r.round}:</span>
                    <div className="flex-1 bg-[#fdf8f8] h-5 relative rounded-sm overflow-hidden border border-[#c4c7c7]/30">
                      <div
                        className="bg-[#4b41e1]/10 border-r border-[#4b41e1]/20 h-full transition-all duration-500 rounded-sm"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="absolute inset-y-0 right-2.5 flex items-center text-[10px] text-[#0d0d0d] font-bold font-mono tabular-nums">
                        {r.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center font-sans text-xs text-[#444748]/30 py-12">
                No round distribution data logged
              </div>
            )}
          </div>
        </motion.div>

        {/* Savings distribution */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
        >
          <div className="flex items-center gap-2.5 border-b border-[#c4c7c7]/20 pb-4">
            <Award className="h-4.5 w-4.5 text-[#4b41e1]" />
            <span className="label-caps text-[#0d0d0d]">Price Savings Spread</span>
          </div>

          <p className="body-md text-[#444748] leading-relaxed text-left">
            Tracks average discounts secured off sellers' starting list prices across all active categories.
          </p>

          <div className="space-y-4 pt-2">
            {savings.length > 0 ? (
              savings.map((s) => {
                const widthPct = (s.count / maxSavingsCount) * 100;
                return (
                  <div key={s.range} className="flex items-center gap-4 text-xs font-sans">
                    <span className="w-20 text-[#444748] text-left truncate font-medium">{s.range}% Savings:</span>
                    <div className="flex-1 bg-[#fdf8f8] h-5 relative rounded-sm overflow-hidden border border-[#c4c7c7]/30">
                      <div
                        className="bg-emerald-500/5 border-r border-emerald-500/20 h-full transition-all duration-500 rounded-sm"
                        style={{ width: `${widthPct}%` }}
                      />
                      <span className="absolute inset-y-0 right-2.5 flex items-center text-[10px] text-emerald-700 font-bold font-mono tabular-nums">
                        {s.count.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center font-sans text-xs text-[#444748]/30 py-12">
                No savings distribution data logged
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Archives list */}
      <motion.div 
        whileHover={{ y: -1 }}
        className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        <div className="flex items-center gap-2.5 border-b border-[#c4c7c7]/20 pb-4">
          <Calendar className="h-4.5 w-4.5 text-[#444748]" />
          <span className="label-caps text-[#0d0d0d]">Historical Run Ledger</span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#c4c7c7]/30 label-caps text-[#444748] font-bold">
                <th className="py-3 px-4">Run Node</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Seed</th>
                <th className="py-3 px-4 text-right">Buyers</th>
                <th className="py-3 px-4 text-right">Win%</th>
                <th className="py-3 px-4 text-right">Volume</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c4c7c7]/20 font-sans text-xs">
              {defaultHistory.map((run) => (
                <tr key={run.id} className="hover:bg-[#fdf8f8] transition-colors">
                  <td className="py-4 px-4 font-bold text-[#0d0d0d]">
                    {run.id}
                  </td>
                  <td className="py-4 px-4 text-[#444748]">
                    {run.timestamp}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[10px] text-[#444748] tabular-nums">
                    {run.seed}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[10px] text-[#444748] tabular-nums">
                    {run.buyers}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[11px] font-bold text-emerald-600 tabular-nums">
                    {run.success_pct.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-[11px] font-bold text-[#0d0d0d] tabular-nums">
                    {formatCurrency(run.value)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-2.5 py-0.5 border border-emerald-500/10 text-emerald-600 bg-emerald-500/5 label-caps text-[9px] font-bold rounded-sm">
                      {run.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
