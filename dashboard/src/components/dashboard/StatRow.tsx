"use client";

import React from "react";
import { LatestReport } from "@/types/pact";
import { formatNumber, formatGMV } from "@/lib/format";
import {
  Activity,
  Coins,
  Percent,
  CheckCircle2,
} from "lucide-react";
import { MetricCard } from "@/components/ui/SovereignPrimitives";

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
      sublabel: "All-time throughput volume",
    },
    {
      icon: Coins,
      label: "Total GMV Processed",
      value: report ? formatGMV(report.summary.total_deal_value_inr) : "₹7,695.7 Cr",
      sublabel: "B2B contract valuations",
    },
    {
      icon: CheckCircle2,
      label: "Node Sourcing Yield",
      value: report ? `${report.summary.success_rate_pct.toFixed(1)}%` : "77.4%",
      sublabel: "Successful closures ratio",
    },
    {
      icon: Percent,
      label: "Aggregate Savings",
      value: report ? `${report.summary.avg_buyer_savings_pct.toFixed(1)}%` : "25.8%",
      sublabel: "vs client maximum reserve limit",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[var(--space-md)] select-none">
      {statItems.map((item, idx) => (
        <MetricCard
          key={idx}
          label={item.label}
          value={item.value}
          sublabel={item.sublabel}
          icon={item.icon}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
