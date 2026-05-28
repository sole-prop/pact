"use client";

import React from "react";
import { StreamUpdate } from "@/types/pact";

interface MetricStripsProps {
  data: StreamUpdate | null;
  // Fallbacks if stats are accumulated in page
  successRate?: number;
  avgSavings?: number;
  gmv?: number; // in INR
  cpuTime?: number; // in seconds
}

export function MetricStrips({
  data,
  successRate = 0,
  avgSavings = 0,
  gmv = 0,
  cpuTime = 0,
}: MetricStripsProps) {
  // Format currency in Indian Crores (₹X Cr)
  const formatGMV = (val: number) => {
    if (val === 0) return "₹0.00 Cr";
    const crores = val / 10000000;
    return `₹${crores.toFixed(2)} Cr`;
  };

  const formatCPUTime = (val: number) => {
    return `${val.toFixed(1)}s`;
  };

  // Extract from data or use explicit props
  const pctSuccess = data ? (data.done > 0 ? (data.done / data.total) * 100 : 0) : successRate;
  const pctSavings = avgSavings;
  const displayGMV = gmv;
  const displayCPU = data ? (data.done > 0 ? data.done * 0.0003 : 0) : cpuTime; // mock or calculated CPU time

  const metrics = [
    {
      label: "Deals Closed",
      value: `${pctSuccess.toFixed(1)}%`,
      progress: pctSuccess, // rate
    },
    {
      label: "Avg Savings",
      value: `${pctSavings.toFixed(1)}%`,
      progress: pctSavings, // percent savings
    },
    {
      label: "Processed GMV",
      value: formatGMV(displayGMV),
      progress: Math.min((displayGMV / 3000000000) * 100, 100), // scale to estimated 300Cr max
    },
    {
      label: "CPU Savings",
      value: formatCPUTime(displayCPU),
      progress: Math.min((displayCPU / 62) * 100, 100), // scale to ~62s demo
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-[#0C0C0C] border border-[#1C1812] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.4)] select-none">
      {metrics.map((item, idx) => (
        <div key={idx} className="flex flex-col justify-between h-12">
          {/* Label and Value row */}
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8675]">
              {item.label}
            </span>
            <span className="font-mono text-[13px] font-bold text-[#E5D3B3] tabular-nums">
              {item.value}
            </span>
          </div>

          {/* Micro Progress Bar */}
          <div className="w-full h-[3px] bg-[#1C1812] rounded-[2px] overflow-hidden mt-2">
            <div
              className="h-full bg-[#C5A880] rounded-[2px] transition-all duration-300 ease-out"
              style={{ width: `${item.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
