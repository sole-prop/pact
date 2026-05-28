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
      <div className="flex justify-between items-center border-b border-[#1E1E1F] pb-6 select-none">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[14px] font-sans font-bold tracking-[0.18em] uppercase text-[#E5D3B3]">
            Active Sourcing Threads
          </h2>
          <p className="text-[11px] font-sans text-[#8E8E93] uppercase tracking-wider font-semibold">
            Monitor real-time agent sourcing runs, negotiation latency, and throughput speeds.
          </p>
        </div>
        <div className="text-[9px] font-mono text-[#C5A880] uppercase tracking-widest font-extrabold bg-[#14120F] border border-[#C5A880]/15 rounded-lg px-3 py-1 shadow-sm">
          Scan: <span className="text-white">SECURE_RUN</span>
        </div>
      </div>

      {/* Grid: Main Panel (Left 8 cols) & Live Metrics (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Main Status Panel */}
        <div className="lg:col-span-8 w-full">
          {isRunning && data ? (
            <div className="p-8 bg-[#0A0A0C] border border-white/[0.06] rounded-xl flex flex-col gap-6 relative overflow-hidden">
              
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono tracking-widest text-[#8E8E93] uppercase font-bold">
                    Active Session ID
                  </span>
                  <div className="font-mono text-[13px] font-bold text-[#E5D3B3] tracking-wide select-all">
                    STRESS_RUN_ACTIVE_{data.total}_NEGS
                  </div>
                </div>

                <div className="px-3 py-1 rounded-lg border border-white/[0.06] bg-[#0E0E10] flex items-center gap-2 select-none shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#C5A880] font-black">
                    {data.pct.toFixed(1)}% Completed
                  </span>
                </div>
              </div>

              {/* Increased Text Sizing (32px tab-nums) */}
              <div className="grid grid-cols-3 gap-6 font-mono text-[12px] tabular-nums pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[#8E8E93] uppercase text-[9.5px] block font-sans font-bold tracking-wider">Negotiated</span>
                  <span className="text-[32px] font-extrabold text-[#E5D3B3] tracking-tight" suppressHydrationWarning>
                    {formatNumber(data.done)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#8E8E93] uppercase text-[9.5px] block font-sans font-bold tracking-wider">Estimated Total</span>
                  <span className="text-[32px] font-extrabold text-[#8E8E93] tracking-tight" suppressHydrationWarning>
                    {formatNumber(data.total)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#8E8E93] uppercase text-[9.5px] block font-sans font-bold tracking-wider">Status</span>
                  <span className="text-[28px] font-extrabold text-[#C5A880] uppercase tracking-wider">
                    LIVE
                  </span>
                </div>
              </div>

              {/* Thicker structural progress bar */}
              <div className="w-full h-[8px] bg-[#111111] border border-white/[0.04] rounded-full overflow-hidden mt-4">
                <div
                  className="h-full bg-[#C5A880] rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${data.pct}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#111111] border border-[#1E1E1E] rounded-[6px] flex flex-col items-center justify-center text-center py-16 gap-7 min-h-[440px] relative overflow-hidden shadow-2xl">
              {/* Subtle Ambient Corner Glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A880]/[0.02] rounded-full blur-[80px] pointer-events-none" />

              {/* Glowing lock icon inside double concentric ring SVGs with a rotating sweep */}
              <div className="relative w-28 h-28 rounded-full border border-[#1E1E1E] flex items-center justify-center select-none bg-[#050505]/40 shadow-xl">
                <svg className="absolute inset-0 w-full h-full text-[#C5A880]" viewBox="0 0 112 112" fill="none">
                  <circle cx="56" cy="56" r="48" stroke="#C5A880" strokeOpacity="0.04" strokeWidth="1" />
                  <circle cx="56" cy="56" r="38" stroke="#C5A880" strokeOpacity="0.08" strokeDasharray="3 3" strokeWidth="1" />
                  <circle cx="56" cy="56" r="28" stroke="#C5A880" strokeOpacity="0.12" strokeWidth="1" />
                  <g className="animate-spin" style={{ transformOrigin: '56px 56px', animationDuration: '12s' }}>
                    <line x1="56" y1="56" x2="56" y2="8" stroke="#C5A880" strokeOpacity="0.2" strokeWidth="1.2" />
                  </g>
                </svg>

                <div className="w-11 h-11 bg-[#111111] border border-[#1E1E1E] rounded-full flex items-center justify-center shadow-lg z-10">
                  <Lock className="w-4 h-4 text-[#C5A880] animate-pulse" />
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <h3 className="text-[12px] font-sans font-bold uppercase tracking-widest text-[#E5D3B3]">
                  No Active Sourcing Runs
                </h3>
                <p className="text-[10px] font-sans text-[#8E8E93] max-w-[320px] mx-auto leading-relaxed font-semibold uppercase tracking-wider">
                  There are currently no active negotiations processing. Launch a new request or trigger Demo Mode.
                </p>
              </div>

              <Link
                href="/negotiate"
                className="px-6 py-3.5 text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-[#050505] bg-[#C5A880] hover:bg-[#E5D3B3] rounded-[6px] transition-all active:scale-[0.98] mt-2 cursor-pointer shadow-md"
              >
                START NEW REQUEST
              </Link>
            </div>
          )}
        </div>

        {/* Right Side: Larger stats cards */}
        <div className="lg:col-span-4 flex flex-col gap-6 w-full">
          
          {/* Panel 1: Network Throughput */}
          <div className="p-6 bg-[#111111] border border-[#1E1E1E] rounded-[6px] shadow-2xl hover:border-[#C5A880]/20 transition-all duration-300 flex flex-col gap-4 select-none">
            <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#8E8E93]">
                Network Throughput
              </span>
              <span className="text-[9px] font-mono text-[#C5A880] font-black tracking-widest bg-[#14120F] border border-[#C5A880]/15 rounded-lg px-2.5 py-0.5">LIVE</span>
            </div>
            
            <div className="flex justify-between items-center pt-1.5">
              <div className="font-mono text-[24px] font-bold text-[#E5D3B3] tracking-tight tabular-nums">
                28,530 <span className="text-[10px] text-[#8E8E93] font-sans uppercase font-extrabold tracking-wider block mt-1">negs/sec peak</span>
              </div>
              <svg className="w-16 h-8 text-[#C5A880]" viewBox="0 0 100 30" fill="none">
                <path d="M0 25 Q15 5, 30 20 T60 10 T90 22 L100 15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M0 25 Q15 5, 30 20 T60 10 T90 22 L100 15" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Panel 2: All Agents Online */}
          <div className="p-6 bg-[#111111] border border-[#1E1E1E] rounded-[6px] shadow-2xl hover:border-[#C5A880]/20 transition-all duration-300 flex flex-col gap-4 select-none">
            <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#8E8E93]">
                All Agents Online
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-black tracking-widest bg-[#14120F] border border-emerald-500/15 rounded-lg px-2.5 py-0.5">ONLINE</span>
            </div>
            
            <div className="flex justify-between items-center pt-1.5">
              <div className="font-mono text-[24px] font-bold text-[#E5D3B3] tracking-tight tabular-nums">
                128 <span className="text-[10px] text-[#8E8E93] font-sans uppercase font-extrabold tracking-wider block mt-1">/ 528 sourcing nodes</span>
              </div>
              
              {/* Circular progress gauge SVG */}
              <div className="relative w-11 h-11 flex items-center justify-center mr-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-white/[0.04]"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-[#C5A880]"
                    strokeWidth="3.2"
                    strokeDasharray="24, 100"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute w-2 h-2 bg-[#C5A880] rounded-full blur-[2px] opacity-75 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Panel 3: Success Rate */}
          <div className="p-6 bg-[#111111] border border-[#1E1E1E] rounded-[6px] shadow-2xl hover:border-[#C5A880]/20 transition-all duration-300 flex flex-col gap-4 select-none">
            <div className="flex justify-between items-baseline border-b border-white/[0.04] pb-2">
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-[#8E8E93]">
                Success Rate
              </span>
              <span className="text-[9px] font-mono text-[#C5A880] font-black tracking-widest bg-[#14120F] border border-[#C5A880]/15 rounded-lg px-2.5 py-0.5">OPTIMAL</span>
            </div>
            
            <div className="flex justify-between items-end pt-1.5">
              <div className="font-mono text-[24px] font-bold text-[#C5A880] tracking-tight tabular-nums">
                77.4% <span className="text-[9px] text-[#8E8E93] font-sans uppercase font-extrabold tracking-wider block mt-1">Last 30 days lock</span>
              </div>
              
              {/* 10-bar golden bar chart */}
              <div className="flex items-end gap-[2px] h-[36px] pr-1 select-none pointer-events-none">
                <div className="w-1 h-[30%] bg-[#C5A880]/20 rounded-[1px]" />
                <div className="w-1 h-[45%] bg-[#C5A880]/30 rounded-[1px]" />
                <div className="w-1 h-[60%] bg-[#C5A880]/40 rounded-[1px]" />
                <div className="w-1 h-[40%] bg-[#C5A880]/35 rounded-[1px]" />
                <div className="w-1 h-[75%] bg-[#C5A880]/60 rounded-[1px]" />
                <div className="w-1 h-[90%] bg-[#C5A880] rounded-[1px]" />
                <div className="w-1 h-[55%] bg-[#C5A880]/50 rounded-[1px]" />
                <div className="w-1 h-[70%] bg-[#C5A880]/75 rounded-[1px]" />
                <div className="w-1 h-[85%] bg-[#E5D3B3] rounded-[1px]" />
                <div className="w-1 h-[95%] bg-[#FFFFFF] rounded-[1px]" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
