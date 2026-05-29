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

  return (
    <div className="max-w-5xl mx-auto w-full px-10 py-12 flex flex-col gap-10 select-none">
      {/* Top Title Row */}
      <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[12px] font-sans font-bold tracking-[0.2em] uppercase text-[#C5A880]">
            Sourcing Ledger History
          </h2>
          <p className="text-[9px] font-sans text-[#807E78] uppercase tracking-widest font-bold">
            Historical archive of completed parallel sourcing operations, success ratios, and platform metrics.
          </p>
        </div>
        <div className="text-[8.5px] font-mono text-[#C5A880] uppercase tracking-widest font-extrabold bg-[#0D0D0E] border border-[#1E1E1E] rounded-none px-3 py-1 shadow-sm">
          Archive: <span className="text-white">LEDGER_ACTIVE</span>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[320px] flex items-center justify-center font-mono text-[10px] text-[#C5A880] uppercase tracking-[0.25em] animate-pulse">
          INITIALIZING HISTORY LEDGER ARCHIVE...
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          
          {/* Flat Wide Historical summaries row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none font-mono text-[11px] tabular-nums select-none relative group">
            {/* Fine architectural corners */}
            <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-[#C5A880]/15" />

            <div className="flex flex-col gap-2 md:border-r border-[#1E1E1E]/60 md:pr-4">
              <span className="text-[#807E78] uppercase tracking-widest font-sans font-bold text-[9px]">Total Sourcing Sessions</span>
              <span className="text-[28px] font-light text-[#E5D3B3] font-mono tracking-tight" suppressHydrationWarning>
                {report ? formatNumber(report.summary.total_negotiations) : "165,883"}
              </span>
            </div>
            
            <div className="flex flex-col gap-2 md:border-r border-[#1E1E1E]/60 md:px-4">
              <span className="text-[#807E78] uppercase tracking-widest font-sans font-bold text-[9px]">Total Closed Deals</span>
              <span className="text-[28px] font-light text-[#E5D3B3] font-mono tracking-tight" suppressHydrationWarning>
                {report ? formatNumber(report.summary.deals_closed) : "128,383"}{" "}
                <span className="text-xs font-sans font-bold text-[#807E78] tracking-widest uppercase">
                  ({report ? report.summary.success_rate_pct.toFixed(1) : "77.4"}%)
                </span>
              </span>
            </div>

            <div className="flex flex-col gap-2 md:pl-4">
              <span className="text-[#807E78] uppercase tracking-widest font-sans font-bold text-[9px]">Platform Revenue (1%)</span>
              <span className="text-[28px] font-light text-[#C5A880] font-mono tracking-tight" suppressHydrationWarning>
                ₹{report ? (report.summary.platform_fee_inr / 10000000).toFixed(2) : "76.96"} Cr
              </span>
            </div>
          </div>

          {/* Leaderboards of Top Performing Seller Agents */}
          <div className="flex flex-col gap-5">
            <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] px-1">
              Top Performing Provider Node Rankings
            </div>
            
            {/* Structured Table Overhaul */}
            <div className="premium-table-container">
              <table className="premium-table">
                <thead>
                  <tr className="border-b border-[#1E1E1E] bg-[#1E1E1E]/20">
                    <th className="w-[100px]">Rank</th>
                    <th>Company & Category</th>
                    <th>Strategy Deck</th>
                    <th className="text-right">Closed Deals</th>
                    <th className="text-right">Success Rate</th>
                    <th className="text-right">Avg Savings Yield</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E1E1E]/30 font-sans">
                  {(report ? report.agent_leaderboard : getMockRows()).slice(0, 15).map((agent, idx) => (
                    <tr 
                      key={idx}
                      className="hover:bg-white/[0.015] transition-colors select-none group"
                    >
                      {/* Rank */}
                      <td className="font-mono text-[#C5A880] font-bold tabular-nums text-[10.5px]">
                        #{idx + 1}
                      </td>
                      
                      {/* Company & Category */}
                      <td>
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-sans font-bold text-[#E5D3B3] tracking-wide">
                            {agent.name}
                          </span>
                          <span className="text-[8px] font-mono tracking-widest text-[#807E78] uppercase max-w-max px-2 py-0.5 border border-[#1E1E1E] rounded-none bg-[#070708]/60 font-bold">
                            {agent.category.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Strategy */}
                      <td>
                        <span className="font-mono text-[9.5px] text-[#807E78] group-hover:text-[#E5D3B3] transition-colors font-bold uppercase tracking-widest">
                          {agent.strategy.replace(/_/g, " ")}
                        </span>
                      </td>

                      {/* Closed */}
                      <td className="text-right font-mono text-[11px] text-white/90 tabular-nums">
                        {agent.closed}
                      </td>

                      {/* Success Rate */}
                      <td className="text-right font-mono text-[11.5px] text-[#C5A880] font-bold tabular-nums">
                        {agent.success_pct.toFixed(0)}%
                      </td>

                      {/* Avg Savings */}
                      <td className="text-right font-mono text-[11.5px] text-[#E5D3B3] font-bold tabular-nums">
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
