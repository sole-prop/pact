"use client";

import React from "react";
import { StreamUpdate } from "@/types/pact";

interface MetricStripsProps {
  data: StreamUpdate | null;
  successRate?: number;
  avgSavings?: number;
  gmv?: number;
  cpuTime?: number;
}

export function MetricStrips({
  data,
  successRate = 0,
  avgSavings = 0,
  gmv = 0,
  cpuTime = 0,
}: MetricStripsProps) {
  const formatGMV = (val: number) => {
    if (val === 0) return "₹0.00 Cr";
    const crores = val / 10000000;
    return `₹${crores.toFixed(2)} Cr`;
  };

  const formatCPUTime = (val: number) => {
    return `${val.toFixed(1)}s`;
  };

  const pctSuccess = data ? (data.done > 0 ? (data.done / data.total) * 100 : 0) : successRate;
  const pctSavings = avgSavings;
  const displayGMV = gmv;
  const displayCPU = data ? (data.done > 0 ? data.done * 0.0003 : 0) : cpuTime;

  const metrics = [
    {
      label: "Deals Closed",
      value: `${pctSuccess.toFixed(1)}%`,
      progress: pctSuccess,
    },
    {
      label: "Avg Savings",
      value: `${pctSavings.toFixed(1)}%`,
      progress: pctSavings,
    },
    {
      label: "Processed GMV",
      value: formatGMV(displayGMV),
      progress: Math.min((displayGMV / 3000000000) * 100, 100),
    },
    {
      label: "CPU Savings",
      value: formatCPUTime(displayCPU),
      progress: Math.min((displayCPU / 62) * 100, 100),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none shadow-none select-none relative">
      <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
      <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-[#C5A880]/15" />

      {metrics.map((item, idx) => (
        <div key={idx} className="flex flex-col justify-between h-12">
          {/* Label and Value row */}
          <div className="flex items-baseline justify-between select-none">
            <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
              {item.label}
            </span>
            <span className="font-mono text-[12.5px] font-bold text-[#E5D3B3] tabular-nums">
              {item.value}
            </span>
          </div>

          {/* Flat Progress Rail */}
          <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-2 p-[0.5px]">
            <div
              className="h-full bg-[#C5A880] rounded-none transition-all duration-300 ease-out"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
