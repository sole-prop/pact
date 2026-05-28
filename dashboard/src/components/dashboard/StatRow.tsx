import React from "react";
import { LatestReport } from "@/types/pact";
import { formatNumber, formatGMV } from "@/lib/format";
import {
  Activity,
  Coins,
  Percent,
  CheckCircle2,
} from "lucide-react";

interface StatRowProps {
  report: LatestReport | null;
}

export function StatRow({ report }: StatRowProps) {
  const isLoading = !report;

  const statItems = [
    {
      icon: Activity,
      label: "Total Negotiations",
      value: report ? formatNumber(report.summary.total_negotiations) : "165,883",
      sublabel: "All time",
    },
    {
      icon: Coins,
      label: "Total GMV",
      value: report ? formatGMV(report.summary.total_deal_value_inr) : "₹7,695.7 Cr",
      sublabel: "Deal value processed",
    },
    {
      icon: CheckCircle2,
      label: "Close Rate",
      value: report ? `${report.summary.success_rate_pct.toFixed(1)}%` : "77.4%",
      sublabel: "Deals successfully closed",
    },
    {
      icon: Percent,
      label: "Buyer Savings",
      value: report ? `${report.summary.avg_buyer_savings_pct.toFixed(1)}%` : "25.8%",
      sublabel: "vs stated budget",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 select-none">
      {statItems.map((item, idx) => {
        const Icon = item.icon;

        if (isLoading) {
          return (
            <div
              key={idx}
              className="bg-[#0A0A0C] border border-white/[0.06] rounded-xl p-6 flex flex-col justify-between animate-pulse"
            >
              <div className="flex gap-2 items-center">
                <div className="w-4 h-4 bg-[#111111] rounded-full" />
                <div className="w-24 h-3.5 bg-[#111111] rounded-[2px]" />
              </div>
              <div className="h-8 bg-[#111111] w-2/3 rounded-[2px] mt-4" />
              <div className="h-2.5 bg-[#111111] w-1/2 rounded-[2px] mt-3" />
            </div>
          );
        }

        return (
          <div
            key={idx}
            className="bg-[#0A0A0C] border border-white/[0.06] rounded-xl p-6 hover:border-[#C5A880]/20 transition-all duration-300 flex flex-col gap-4 select-none group"
          >
            {/* Top Row: Icon + uppercase label */}
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-[#8E8E93] group-hover:text-[#C5A880] transition-colors" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93] group-hover:text-[#E5D3B3] transition-colors">
                {item.label}
              </span>
            </div>

            {/* Center Row: Large metric value */}
            <div className="font-mono text-[28px] font-bold text-[#E5D3B3] leading-none tracking-tight tabular-nums" suppressHydrationWarning>
              {item.value}
            </div>

            {/* Bottom Row: Sublabel */}
            <div className="text-[9.5px] font-sans text-[#8E8E93] leading-tight truncate">
              {item.sublabel}
            </div>
          </div>
        );
      })}
    </div>
  );
}


