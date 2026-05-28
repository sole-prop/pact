"use client";

import React from "react";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { formatNumber } from "@/lib/format";

interface LiveCounterProps {
  total: number;
  throughput: number;
  elapsed: number;
  isRunning: boolean;
  isComplete: boolean;
}

export function LiveCounter({
  total,
  throughput,
  elapsed,
  isRunning,
  isComplete,
}: LiveCounterProps) {
  const animatedTotal = useAnimatedNumber(total, 400);

  // Format throughput nicely: e.g., 27000 -> 27.0K/s
  const formatThroughput = (val: number) => {
    if (val >= 1000) {
      return `${(val / 1000).toFixed(1)}K/s`;
    }
    return `${val}/s`;
  };

  // Format elapsed time nicely: e.g., 62 -> 1m 2s or 42.3 -> 42.3s
  const formatElapsed = (val: number) => {
    if (val >= 60) {
      const minutes = Math.floor(val / 60);
      const seconds = (val % 60).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
    return `${val.toFixed(1)}s`;
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8 bg-[#0C0C0C] border border-[#1C1812] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.4)] animate-fadeIn select-none">
      {/* Status Dot */}
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isRunning
              ? "bg-[#C5A880] animate-pulse"
              : isComplete
              ? "bg-[#8E8675]/40"
              : "bg-[#8E8675]/10"
          }`}
        />
        <span className="text-[10px] uppercase font-sans tracking-widest font-bold text-[#8E8675]">
          {isRunning ? "Running" : isComplete ? "Complete" : "Idle"}
        </span>
      </div>

      {/* Main Counter */}
      <div className="text-center select-none py-4">
        <span className="font-mono text-[90px] font-bold text-[#E5D3B3] tracking-tight tabular-nums leading-none" suppressHydrationWarning>
          {formatNumber(animatedTotal)}
        </span>
        <div className="mt-2 text-[10px] uppercase font-sans tracking-[0.08em] text-[#8E8675] font-bold">
          negotiations completed
        </div>
      </div>

      {/* Throughput and Time Row */}
      <div className="w-full max-w-sm mt-4 border-t border-[#1C1812] pt-4 flex justify-around text-center">
        <div>
          <div className="font-mono text-lg font-bold text-[#C5A880] tabular-nums">
            {formatThroughput(throughput)}
          </div>
          <div className="text-[9px] uppercase font-sans tracking-[0.08em] text-[#4A4339] mt-0.5 font-bold">
            Throughput
          </div>
        </div>
        <div className="w-px bg-[#1C1812] self-stretch" />
        <div>
          <div className="font-mono text-lg font-bold text-[#E5D3B3] tabular-nums">
            {formatElapsed(elapsed)}
          </div>
          <div className="text-[9px] uppercase font-sans tracking-[0.08em] text-[#4A4339] mt-0.5 font-bold">
            Elapsed Time
          </div>
        </div>
      </div>
    </div>
  );
}
