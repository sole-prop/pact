import React from "react";

interface TopbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  totalNegotiations: number;
  systemHealth: { status: string; ollama: boolean; supabase: boolean };
}

export function Topbar({ onRefresh, isLoading, totalNegotiations, systemHealth }: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between bg-transparent px-12 shrink-0 select-none">
      {/* Brand title */}
      <div className="flex items-center">
        <span className="font-sans text-[11px] font-semibold tracking-[0.05em] text-[#8E8E93]/75 uppercase">
          Sourcing Network Sandbox
        </span>
      </div>

      {/* Online indicator */}
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C5A880] animate-pulse" />
        <span className="font-sans text-[10px] tracking-[0.02em] text-[#8E8E93]/80 uppercase">
          Synchronized
        </span>
      </div>
    </header>
  );
}
