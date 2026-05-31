import React from "react";

interface TopbarProps {
  onRefresh: () => void;
  isLoading: boolean;
  totalNegotiations: number;
  systemHealth: { status: string; ollama: boolean; supabase: boolean };
}

export function Topbar({ onRefresh, isLoading, totalNegotiations, systemHealth }: TopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between bg-transparent px-12 shrink-0 select-none border-b border-[#c4c7c7]/20">
      {/* Brand title */}
      <div className="flex items-center">
        <span className="font-sans text-[10px] font-bold tracking-[0.15em] text-[#444748]/75 uppercase">
          Sourcing Network Sandbox
        </span>
      </div>

      {/* Online indicator */}
      <div className="flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[#4b41e1] animate-pulse" />
        <span className="font-sans text-[9px] font-bold tracking-[0.1em] text-[#444748]/85 uppercase">
          Synchronized
        </span>
      </div>
    </header>
  );
}
