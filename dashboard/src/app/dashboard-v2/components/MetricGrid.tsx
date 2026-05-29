import React from "react";
import { LatestReport } from "@/types/pact";

interface MetricGridProps {
  report: LatestReport | null;
}

export function MetricGrid({ report }: MetricGridProps) {
  const summary = report?.summary;

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined) return "₹0.00";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${new Intl.NumberFormat("en-IN").format(val)}`;
  };

  const metrics = [
    {
      label: "Autonomous Swarms",
      value: summary ? new Intl.NumberFormat("en-US").format(summary.deals_closed) : "0",
      desc: "Closed transactions",
    },
    {
      label: "Swarm Conversion Win",
      value: summary ? `${summary.success_rate_pct.toFixed(1)}%` : "0.0%",
      desc: "Contract success rate",
    },
    {
      label: "Gross Yield Value",
      value: formatCurrency(summary?.total_deal_value_inr),
      desc: "Secured transactions",
    },
    {
      label: "Average Cost Saved",
      value: summary ? `${summary.avg_buyer_savings_pct.toFixed(1)}%` : "0.0%",
      desc: "Price margin savings",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 w-full select-none pt-4 pb-8">
      {metrics.map((m, idx) => (
        <div
          key={idx}
          className="flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300 text-left p-2"
          style={{ height: "115px" }}
        >
          <div className="space-y-1">
            <span className="font-sans text-[11px] font-medium tracking-[0.05em] uppercase text-[#8E8E93]/65">
              {m.label}
            </span>
            <div className="font-sans text-4xl font-extrabold tracking-tight text-[#F2F2F7]">
              {m.value}
            </div>
          </div>

          <span className="font-sans text-[11.5px] text-[#8E8E93]/50">
            {m.desc}
          </span>
        </div>
      ))}
    </div>
  );
}
