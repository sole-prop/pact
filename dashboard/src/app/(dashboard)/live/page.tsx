"use client";

import React from "react";
import Link from "next/link";
import { useStream } from "@/hooks/useStream";
import { Lock } from "lucide-react";
import { formatNumber } from "@/lib/format";

export default function LivePage() {
  const { isRunning, data } = useStream();

  return (
    <div className="max-w-5xl mx-auto w-full px-10 py-12 flex flex-col gap-10 select-none">
      {/* Top Title & Sentry Row */}
      <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-6 select-none">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[12px] font-sans font-bold tracking-[0.2em] uppercase text-[#C5A880]">
            Active Sourcing Threads
          </h2>
          <p className="text-[9px] font-sans text-[#807E78] uppercase tracking-widest font-bold">
            Monitor real-time agent sourcing runs, negotiation latency, and throughput speeds.
          </p>
        </div>
        <div className="text-[8.5px] font-mono text-[#C5A880] uppercase tracking-widest font-extrabold bg-[#0D0D0E] border border-[#1E1E1E] rounded-none px-3 py-1 shadow-sm">
          Scan: <span className="text-white">SECURE_RUN</span>
        </div>
      </div>

      {/* Grid: Main Panel (Left 8 cols) & Live Metrics (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Main Status Panel */}
        <div className="lg:col-span-8 w-full">
          {isRunning && data ? (
            <div className="p-8 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col gap-6 relative overflow-hidden">
              {/* Fine corner highlight lines */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-[#C5A880]/15" />

              <div className="flex justify-between items-center border-b border-[#1E1E1E]/50 pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-mono tracking-widest text-[#807E78] uppercase font-bold">
                    Active Session ID
                  </span>
                  <div className="font-mono text-[12px] font-bold text-[#E5D3B3] tracking-wider select-all">
                    STRESS_RUN_ACTIVE_{data.total}_NEGS
                  </div>
                </div>

                <div className="px-3 py-1 rounded-none border border-[#1E1E1E] bg-[#070708] flex items-center gap-2 select-none">
                  <span className="w-1.5 h-1.5 bg-[#C5A880] animate-pulse" />
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#C5A880] font-bold">
                    {data.pct.toFixed(1)}% Completed
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 font-mono text-[11px] tabular-nums pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[#807E78] uppercase text-[8.5px] block font-sans font-bold tracking-widest">Negotiated</span>
                  <span className="text-[28px] font-light text-[#E5D3B3] tracking-tight" suppressHydrationWarning>
                    {formatNumber(data.done)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#807E78] uppercase text-[8.5px] block font-sans font-bold tracking-widest">Estimated Total</span>
                  <span className="text-[28px] font-light text-[#807E78] tracking-tight" suppressHydrationWarning>
                    {formatNumber(data.total)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#807E78] uppercase text-[8.5px] block font-sans font-bold tracking-widest">Status</span>
                  <span className="text-[24px] font-extrabold text-[#C5A880] uppercase tracking-widest">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Square industrial progress bar */}
              <div className="w-full h-[6px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-4 p-[0.5px]">
                <div
                  className="h-full bg-[#C5A880] rounded-none transition-all duration-300 ease-out"
                  style={{ width: `${data.pct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col items-center justify-center text-center py-16 gap-8 min-h-[440px] relative overflow-hidden">
              {/* Decorative corners */}
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
              <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-[#C5A880]/15" />

              {/* Concentric rings and lock visual */}
              <div className="relative w-28 h-28 rounded-none border border-[#1E1E1E] flex items-center justify-center select-none bg-[#070708]/40 shadow-xl">
                {/* CSS rotation */}
                <style>{`
                  @keyframes spin-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <svg className="absolute inset-0 w-full h-full text-[#C5A880]" viewBox="0 0 112 112" fill="none">
                  <circle cx="56" cy="56" r="48" stroke="#C5A880" strokeOpacity="0.04" strokeWidth="1" />
                  <circle cx="56" cy="56" r="38" stroke="#C5A880" strokeOpacity="0.08" strokeDasharray="3 3" strokeWidth="1" />
                  <circle cx="56" cy="56" r="28" stroke="#C5A880" strokeOpacity="0.12" strokeWidth="1" />
                  <g className="origin-[56px_56px]" style={{ animation: "spin-slow 12s linear infinite" }}>
                    <line x1="56" y1="56" x2="56" y2="8" stroke="#C5A880" strokeOpacity="0.2" strokeWidth="1" />
                  </g>
                </svg>

                <div className="w-10 h-10 bg-[#0D0D0E] border border-[#1E1E1E] flex items-center justify-center z-10 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                  <Lock className="w-3.5 h-3.5 text-[#C5A880]" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2.5">
                <h3 className="text-[11px] font-sans font-bold uppercase tracking-[0.18em] text-[#E5D3B3]">
                  No Active Sourcing Runs
                </h3>
                <p className="text-[9px] font-sans text-[#807E78] max-w-[320px] mx-auto leading-relaxed font-bold uppercase tracking-widest">
                  There are currently no active negotiations processing. Launch a new request or trigger Demo Mode.
                </p>
              </div>

              <Link
                href="/negotiate"
                className="px-6 py-3.5 text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#070708] bg-[#C5A880] hover:bg-[#E5D3B3] rounded-none transition-all active:scale-[0.98] mt-2 cursor-pointer"
              >
                START NEW REQUEST
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: Larger stats cards */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Panel 1: Network Throughput */}
          <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col gap-4 select-none group relative">
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/10" />
            <div className="flex justify-between items-baseline border-b border-[#1E1E1E]/50 pb-2">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
                Network Throughput
              </span>
              <span className="text-[8px] font-mono text-[#C5A880] font-bold tracking-wider bg-[#070708] border border-[#C5A880]/15 px-2 py-0.5">LIVE</span>
            </div>
            
            <div className="flex justify-between items-center pt-1.5">
              <div className="font-mono text-[22px] font-light text-[#E5D3B3] tracking-tight tabular-nums">
                28,530 <span className="text-[9px] text-[#807E78] font-sans uppercase font-bold tracking-widest block mt-1">negs/sec peak</span>
              </div>
              <svg className="w-16 h-8 text-[#C5A880]" viewBox="0 0 100 30" fill="none">
                <path d="M0 25 Q15 5, 30 20 T60 10 T90 22 L100 15" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 25 Q15 5, 30 20 T60 10 T90 22 L100 15" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Panel 2: All Sourcing Nodes */}
          <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col gap-4 select-none group relative">
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/10" />
            <div className="flex justify-between items-baseline border-b border-[#1E1E1E]/50 pb-2">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
                All Sourcing Nodes
              </span>
              <span className="text-[8px] font-mono text-emerald-400 font-bold tracking-wider bg-[#070708] border border-emerald-500/15 px-2 py-0.5">ONLINE</span>
            </div>
            
            <div className="flex justify-between items-center pt-1.5">
              <div className="font-mono text-[22px] font-light text-[#E5D3B3] tracking-tight tabular-nums">
                128 <span className="text-[9px] text-[#807E78] font-sans uppercase font-bold tracking-widest block mt-1">/ 528 sourcing nodes</span>
              </div>
              
              {/* Concentric SVG gauge */}
              <div className="relative w-9 h-9 flex items-center justify-center mr-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/[0.02]"
                    strokeWidth="2.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#C5A880]"
                    strokeWidth="2.8"
                    strokeDasharray="24, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute w-1.5 h-1.5 bg-[#C5A880] rounded-none blur-[1px] opacity-75 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Panel 3: Success Rate */}
          <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col gap-4 select-none group relative">
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/10" />
            <div className="flex justify-between items-baseline border-b border-[#1E1E1E]/50 pb-2">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
                Success Rate
              </span>
              <span className="text-[8px] font-mono text-[#C5A880] font-bold tracking-wider bg-[#070708] border border-[#C5A880]/15 px-2 py-0.5">OPTIMAL</span>
            </div>
            
            <div className="flex justify-between items-end pt-1.5">
              <div className="font-mono text-[22px] font-light text-[#C5A880] tracking-tight tabular-nums">
                77.4% <span className="text-[9px] text-[#807E78] font-sans uppercase font-bold tracking-widest block mt-1">Last 30 days lock</span>
              </div>
              
              {/* Geometric bar indicator */}
              <div className="flex items-end gap-[2px] h-[32px] pr-1 select-none pointer-events-none">
                <div className="w-[3px] h-[30%] bg-[#C5A880]/20" />
                <div className="w-[3px] h-[45%] bg-[#C5A880]/30" />
                <div className="w-[3px] h-[60%] bg-[#C5A880]/40" />
                <div className="w-[3px] h-[40%] bg-[#C5A880]/35" />
                <div className="w-[3px] h-[75%] bg-[#C5A880]/60" />
                <div className="w-[3px] h-[90%] bg-[#C5A880]" />
                <div className="w-[3px] h-[55%] bg-[#C5A880]/50" />
                <div className="w-[3px] h-[70%] bg-[#C5A880]/75" />
                <div className="w-[3px] h-[85%] bg-[#E5D3B3]" />
                <div className="w-[3px] h-[95%] bg-[#FFFFFF]" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
