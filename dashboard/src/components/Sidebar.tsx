"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Activity,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Surface, DashboardPanel } from "@/components/ui/SovereignPrimitives";

const OPERATOR_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, tag: "DB" },
  { href: "/negotiate", label: "New Request", icon: Plus, tag: "REQ" },
  { href: "/live", label: "Active Threads", icon: Activity, tag: "LIVE" },
  { href: "/history", label: "Sourcing Ledger", icon: Clock, tag: "HIST" },
];

const MERCHANT_ITEMS = [
  { href: "/sell", label: "Sell Portal", icon: TrendingUp, tag: "SELL" },
];

const SIMULATION_ITEMS = [
  { href: "/demo", label: "Demo Simulator", icon: Zap, tag: "SIM" },
];

export function Sidebar() {
  const pathname = usePathname();

  const renderNavItem = (item: typeof OPERATOR_ITEMS[0]) => {
    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    const Icon = item.icon;
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`group flex items-center justify-between transition-all duration-300 py-[var(--space-md)] px-[var(--space-md)] relative border-l-2 ${
          isActive
            ? "text-[var(--accent-gold)] bg-[var(--accent-gold)]/[0.015] border-l-[var(--accent-gold)]"
            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-l-transparent hover:bg-white/[0.005] hover:translate-x-[2px]"
        }`}
      >
        <div className="flex items-center gap-[var(--space-md)]">
          <Icon className={`w-3.5 h-3.5 transition-colors duration-300 ${
            isActive ? "text-[var(--accent-gold)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
          }`} />
          <span className="font-sans font-bold tracking-[0.12em] text-[10px] uppercase">{item.label}</span>
        </div>

        {/* Tactical Monospaced Right Tag */}
        <span className={`text-[8px] font-mono transition-colors duration-300 ${
          isActive ? "text-[var(--accent-gold)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"
        }`}>
          [{item.tag}]
        </span>
      </Link>
    );
  };

  return (
    <aside className="w-[260px] h-screen bg-[var(--background-base)] border-r border-[var(--border-thin)] py-[var(--space-xl)] px-[var(--space-lg)] shrink-0 flex flex-col justify-between select-none relative z-10 font-sans">
      
      {/* Decorative vertical hairline framing grids */}
      <div className="absolute top-0 bottom-0 left-[var(--space-md)] w-[1px] bg-[var(--border-thin)]/20 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-[var(--space-md)] w-[1px] bg-[var(--border-thin)]/20 pointer-events-none" />

      {/* Brand Header */}
      <div className="flex flex-col pb-[var(--space-lg)] border-b border-[var(--border-thin)]/60 relative z-20">
        <Surface className="p-[var(--space-md)] bg-[var(--background-surface)]/60 flex flex-col gap-[var(--space-xs)]">
          {/* Fine corners */}
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[var(--accent-gold)]/20" />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-[var(--accent-gold)]/20" />
          
          <h1 className="font-mono text-[var(--text-primary)] text-[18px] font-extralight tracking-[0.45em] leading-none uppercase">
            PACT
          </h1>
          <div className="flex justify-between items-center mt-[var(--space-md)] pt-[var(--space-sm)] border-t border-[var(--border-thin)]/80">
            <span className="text-[7px] font-mono text-[var(--text-secondary)] uppercase tracking-widest leading-none font-bold">
              SYS_OPERATOR // NET
            </span>
            <div className="flex items-center gap-[var(--space-xs)] font-mono text-[7px] text-[var(--accent-gold)] font-black tracking-widest leading-none">
              <span className="w-1 h-1 bg-[var(--accent-gold)] animate-pulse" />
              <span>ACTIVE</span>
            </div>
          </div>
        </Surface>
      </div>

      {/* Navigation Deck */}
      <div className="flex-1 flex flex-col gap-[var(--space-xl)] pt-[var(--space-lg)] overflow-y-auto custom-scrollbar select-none z-20">
        
        {/* Section 1: Command Deck */}
        <div className="flex flex-col gap-[var(--space-xs)]">
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[var(--text-tertiary)] px-[var(--space-md)] pb-[var(--space-sm)] select-none uppercase">
            // Command Deck
          </span>
          {OPERATOR_ITEMS.map(renderNavItem)}
        </div>

        {/* Section 2: Merchant Desk */}
        <div className="flex flex-col gap-[var(--space-xs)]">
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[var(--text-tertiary)] px-[var(--space-md)] pb-[var(--space-sm)] select-none uppercase">
            // Merchant Desk
          </span>
          {MERCHANT_ITEMS.map(renderNavItem)}
        </div>

        {/* Section 3: Simulation */}
        <div className="flex flex-col gap-[var(--space-xs)]">
          <span className="text-[9px] font-mono font-bold tracking-[0.25em] text-[var(--text-tertiary)] px-[var(--space-md)] pb-[var(--space-sm)] select-none uppercase">
            // Simulation Deck
          </span>
          {SIMULATION_ITEMS.map(renderNavItem)}
        </div>

      </div>

      {/* High-density Tactical Telemetry Widget */}
      <div className="select-none pt-[var(--space-lg)] border-t border-[var(--border-thin)]/60 mt-auto flex flex-col gap-[var(--space-md)] z-20">
        <DashboardPanel className="bg-[var(--background-surface)]/60 p-[var(--space-md)] flex flex-col gap-[var(--space-sm)]">
          <div className="flex justify-between items-baseline font-mono text-[7.5px] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            <span>OPERATIONAL TELEMETRY</span>
            <span className="text-[var(--accent-gold)]">SECURE</span>
          </div>

          <div className="grid grid-cols-2 gap-x-[var(--space-md)] gap-y-[var(--space-sm)] border-t border-[var(--border-thin)] pt-[var(--space-sm)] font-mono text-[8px] text-[var(--text-secondary)]">
            <div className="flex flex-col">
              <span className="text-[7px] text-[var(--text-tertiary)] font-sans font-bold uppercase tracking-wider">NODE ID</span>
              <span className="text-[var(--text-primary)] font-bold tracking-wide">A-102 // ACME</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-[var(--text-tertiary)] font-sans font-bold uppercase tracking-wider">ACCESS LAYER</span>
              <span className="text-[var(--text-primary)] font-bold tracking-wide text-emerald-400">OPERATOR</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-[var(--text-tertiary)] font-sans font-bold uppercase tracking-wider">TELEMETRY LINK</span>
              <span className="text-[var(--accent-gold)] font-bold tracking-wide">SECURE_SSE</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] text-[var(--text-tertiary)] font-sans font-bold uppercase tracking-wider">LATENCY</span>
              <span className="text-[var(--text-primary)] font-bold tracking-wide tabular-nums">14ms ping</span>
            </div>
          </div>
        </DashboardPanel>
      </div>
    </aside>
  );
}
