"use client";

import React, { useEffect, useState } from "react";
import { LatestReport, AgentLeaderboardItem } from "@/types/pact";
import { formatNumber } from "@/lib/format";

export default function HistoryPage() {
  const [report, setReport] = useState<LatestReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch("/api/backend/api/stats/latest-report");
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error("Failed to fetch latest report:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, []);

  const getMockRows = (): AgentLeaderboardItem[] => [
    { seller_id: "1", name: "Nexus Ventures", category: "SOFTWARE DEV", strategy: "TIT_FOR_TAT", queried: 257, closed: 257, success_pct: 100, avg_savings_pct: 50.4, top_failure: "" },
    { seller_id: "2", name: "Intellect Services", category: "SOFTWARE DEV", strategy: "CONCEDER", queried: 329, closed: 329, success_pct: 100, avg_savings_pct: 41.0, top_failure: "" },
    { seller_id: "3", name: "Vertex Pvt Ltd", category: "SOFTWARE DEV", strategy: "TIT_FOR_TAT", queried: 320, closed: 320, success_pct: 100, avg_savings_pct: 17.9, top_failure: "" },
    { seller_id: "4", name: "Vertex Co", category: "SOFTWARE DEV", strategy: "HARDBALL", queried: 229, closed: 229, success_pct: 100, avg_savings_pct: 52.6, top_failure: "" },
    { seller_id: "5", name: "Future Talent", category: "SOFTWARE DEV", strategy: "HARDBALL", queried: 329, closed: 329, success_pct: 100, avg_savings_pct: 36.2, top_failure: "" },
    { seller_id: "6", name: "Innovate Advisors", category: "SOFTWARE DEV", strategy: "TIT_FOR_TAT", queried: 316, closed: 316, success_pct: 100, avg_savings_pct: 38.2, top_failure: "" },
    { seller_id: "7", name: "Allied Partners", category: "SOFTWARE DEV", strategy: "BOULWARE", queried: 320, closed: 320, success_pct: 100, avg_savings_pct: 99.9, top_failure: "" },
    { seller_id: "8", name: "Optima Outsourcing", category: "SOFTWARE DEV", strategy: "TIT_FOR_TAT", queried: 269, closed: 269, success_pct: 100, avg_savings_pct: 45.3, top_failure: "" },
    { seller_id: "9", name: "Balaji Ventures", category: "SOFTWARE DEV", strategy: "BOULWARE", queried: 320, closed: 320, success_pct: 100, avg_savings_pct: 23.1, top_failure: "" },
    { seller_id: "10", name: "Sunrise Talent", category: "SOFTWARE DEV", strategy: "HARDBALL", queried: 257, closed: 257, success_pct: 100, avg_savings_pct: 20.7, top_failure: "" },
  ];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-10 py-12 flex flex-col gap-10 select-none">
      {/* Top Title Row */}
      <div className="flex justify-between items-center border-b border-[#1E1E1F] pb-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[14px] font-sans font-bold tracking-[0.18em] uppercase text-[#E5D3B3]">
            Sourcing Ledger History
          </h2>
          <p className="text-[11px] font-sans text-[#8E8E93] uppercase tracking-wider font-semibold">
            Historical archive of completed parallel sourcing operations, success ratios, and platform metrics.
          </p>
        </div>
        <div className="text-[9px] font-mono text-[#C5A880] uppercase tracking-widest font-extrabold bg-[#14120F] border border-[#C5A880]/15 rounded-lg px-3 py-1 shadow-sm">
          Archive: <span className="text-white">LEDGER_ACTIVE</span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[320px] flex items-center justify-center font-mono text-[11px] text-[#C5A880] uppercase tracking-[0.2em] animate-pulse">
          INITIALIZING HISTORY LEDGER ARCHIVE...
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* Flat Wide Historical summaries row (increased text size to 32px) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-[#0A0A0C] border border-white/[0.06] rounded-xl font-mono text-[12px] tabular-nums select-none shadow-2xl">
            <div className="flex flex-col gap-2 md:border-r border-white/[0.04] md:pr-4">
              <span className="text-[#8E8E93] uppercase tracking-[0.1em] font-sans font-extrabold text-[10px]">Total Sourcing Sessions</span>
              <span className="text-[32px] font-extrabold text-[#E5D3B3] font-mono tracking-tight" suppressHydrationWarning>
                {report ? formatNumber(report.summary.total_negotiations) : "165,883"}
              </span>
            </div>
            <div className="flex flex-col gap-2 md:border-r border-white/[0.04] md:px-4">
              <span className="text-[#8E8E93] uppercase tracking-[0.1em] font-sans font-extrabold text-[10px]">Total Closed Deals</span>
              <span className="text-[32px] font-extrabold text-[#E5D3B3] font-mono tracking-tight" suppressHydrationWarning>
                {report ? formatNumber(report.summary.deals_closed) : "128,383"}{" "}
                <span className="text-sm font-sans font-bold text-[#8E8E93]">({report ? report.summary.success_rate_pct.toFixed(1) : "77.4"}%)</span>
              </span>
            </div>
            <div className="flex flex-col gap-2 md:pl-4">
              <span className="text-[#8E8E93] uppercase tracking-[0.1em] font-sans font-extrabold text-[10px]">Platform Revenue (1%)</span>
              <span className="text-[32px] font-extrabold text-[#C5A880] font-mono tracking-tight" suppressHydrationWarning>
                ₹{report ? (report.summary.platform_fee_inr / 10000000).toFixed(2) : "76.96"} Cr
              </span>
            </div>
          </div>

          {/* Leaderboards of Top Performing Seller Agents (alternating rows table overhaul) */}
          <div className="flex flex-col gap-5">
            <div className="text-[12px] font-sans font-bold uppercase tracking-[0.1em] text-[#8E8E93] px-1">
              Top Performing Provider Node Rankings
            </div>
            
            {/* Structured Table Overhaul */}
            <div className="bg-[#0A0A0C] border border-white/[0.06] rounded-xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                    <th className="py-4.5 px-6 text-[9.5px] font-sans font-extrabold uppercase text-[#8E8E93] tracking-wider w-[80px]">Rank</th>
                    <th className="py-4.5 px-6 text-[9.5px] font-sans font-extrabold uppercase text-[#8E8E93] tracking-wider">Company & Category</th>
                    <th className="py-4.5 px-6 text-[9.5px] font-sans font-extrabold uppercase text-[#8E8E93] tracking-wider">Strategy Deck</th>
                    <th className="py-4.5 px-6 text-[9.5px] font-sans font-extrabold uppercase text-[#8E8E93] tracking-wider text-right">Closed Deals</th>
                    <th className="py-4.5 px-6 text-[9.5px] font-sans font-extrabold uppercase text-[#8E8E93] tracking-wider text-right">Success Rate</th>
                    <th className="py-4.5 px-6 text-[9.5px] font-sans font-extrabold uppercase text-[#8E8E93] tracking-wider text-right">Avg Savings Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04] font-sans">
                  {(report ? report.agent_leaderboard : getMockRows()).slice(0, 15).map((agent, idx) => (
                    <tr 
                      key={idx}
                      className="hover:bg-white/[0.02] transition-colors select-none group"
                    >
                      {/* Rank */}
                      <td className="py-4 px-6 text-[11px] font-mono text-[#C5A880] font-bold tabular-nums">
                        #{idx + 1}
                      </td>
                      
                      {/* Company & Category */}
                      <td className="py-4 px-6">
                        <div className="flex flex-col gap-1">
                          <span className="text-[12px] font-sans font-bold text-[#E5D3B3] tracking-wide">
                            {agent.name}
                          </span>
                          <span className="text-[8px] font-mono tracking-widest text-[#8E8E93] uppercase max-w-max px-1.5 py-0.5 border border-white/[0.04] rounded bg-[#050505]/40 font-bold">
                            {agent.category.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Strategy */}
                      <td className="py-4 px-6">
                        <span className="font-mono text-[10.5px] text-[#8E8E93] group-hover:text-[#E5D3B3] transition-colors font-semibold uppercase">
                          {agent.strategy.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Closed */}
                      <td className="py-4 px-6 text-right font-mono text-[11.5px] text-white/90 tabular-nums">
                        {agent.closed}
                      </td>

                      {/* Success Rate */}
                      <td className="py-4 px-6 text-right font-mono text-[12px] text-[#C5A880] font-bold tabular-nums">
                        {agent.success_pct.toFixed(0)}%
                      </td>

                      {/* Avg Savings */}
                      <td className="py-4 px-6 text-right font-mono text-[12px] text-[#E5D3B3] font-bold tabular-nums">
                        {agent.avg_savings_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
