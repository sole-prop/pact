"use client";

import React from "react";
import { Bell, Shield } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center gap-[var(--space-md)] select-none font-sans">
      {/* Alert Sentinel Telemetry Trigger */}
      <button className="p-[var(--space-sm)] text-[var(--text-secondary)] hover:text-[var(--accent-gold)] transition-colors cursor-pointer relative bg-[var(--background-surface)] border border-[var(--border-thin)] flex items-center justify-center rounded-none">
        <Bell className="w-3.5 h-3.5 text-[var(--accent-gold)]" />
        {/* Fine rectangular telemetry tag indicator */}
        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[var(--accent-gold)] border border-[var(--background-base)] rounded-none" />
      </button>

      {/* Red Shield Security Telemetry Trigger */}
      <button className="p-[var(--space-sm)] text-[var(--text-secondary)] hover:text-red-400 transition-colors cursor-pointer bg-[var(--background-surface)] border border-[var(--border-thin)] flex items-center justify-center rounded-none">
        <Shield className="w-3.5 h-3.5 text-[#FF453A]" fill="#FF453A" fillOpacity="0.1" />
      </button>

      {/* Initials Avatar */}
      <div className="w-7 h-7 bg-[var(--background-surface)] border border-[var(--border-thin)] flex items-center justify-center font-mono text-[9px] font-bold text-[var(--accent-cream)] cursor-pointer hover:border-[var(--accent-gold)] transition-all rounded-none">
        A
      </div>
    </div>
  );
}
