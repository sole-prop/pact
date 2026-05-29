"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

// ────────────────────────────────────────────────────────
// 1. SURFACE PRIMITIVE
// ────────────────────────────────────────────────────────
interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
}

export function Surface({ children, className = "", active = false, ...props }: SurfaceProps) {
  return (
    <div
      className={`border border-[var(--border-thin)] bg-[var(--background-surface)] transition-all duration-300 rounded-none relative ${
        active ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/[0.015]" : "hover:border-[var(--accent-gold)]/20 hover:bg-[var(--accent-gold)]/[0.005]"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────
// 2. DASHBOARD PANEL PRIMITIVE (With Built-in Ticks)
// ────────────────────────────────────────────────────────
interface DashboardPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  title?: string;
  headerRight?: React.ReactNode;
}

export function DashboardPanel({ children, className = "", title, headerRight, ...props }: DashboardPanelProps) {
  return (
    <Surface className={`p-[var(--space-lg)] flex flex-col gap-[var(--space-lg)] ${className}`} {...props}>
      {/* Structural Corner Ticks */}
      <div className="corner-tick-tl" />
      <div className="corner-tick-br" />

      {/* Header bar if title exists */}
      {title && (
        <div className="flex justify-between items-center border-b border-[var(--border-thin)] pb-[var(--space-md)]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {title}
          </span>
          {headerRight}
        </div>
      )}

      {children}
    </Surface>
  );
}

// ────────────────────────────────────────────────────────
// 3. METRIC CARD PRIMITIVE (Tabular numbers + micro telemetry)
// ────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel: string;
  icon: LucideIcon;
  isLoading?: boolean;
}

export function MetricCard({ label, value, sublabel, icon: Icon, isLoading = false }: MetricCardProps) {
  if (isLoading) {
    return (
      <div className="telemetry-card flex flex-col justify-between animate-pulse min-h-[140px]">
        <div className="flex gap-[var(--space-sm)] items-center">
          <div className="w-3.5 h-3.5 bg-[var(--border-thin)]" />
          <div className="w-24 h-3 bg-[var(--border-thin)]" />
        </div>
        <div className="h-8 bg-[var(--border-thin)] w-2/3 mt-[var(--space-md)]" />
        <div className="h-2.5 bg-[var(--border-thin)] w-1/2 mt-[var(--space-sm)]" />
      </div>
    );
  }

  return (
    <DashboardPanel className="group select-none">
      {/* Top Row: Telemetry Icon + uppercase Label */}
      <div className="flex items-center gap-[var(--space-sm)]">
        <Icon className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-[var(--accent-gold)] transition-colors duration-300" />
        <span className="text-[9px] font-mono font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)] group-hover:text-white transition-colors duration-300">
          {label}
        </span>
      </div>

      {/* Center Row: High-density Telemetry tabular-number */}
      <div className="telemetry-num" suppressHydrationWarning>
        {value}
      </div>

      {/* Bottom Row: Clay sublabel description */}
      <div className="text-[8.5px] font-sans text-[var(--text-secondary)] tracking-widest uppercase font-semibold leading-tight truncate">
        {sublabel}
      </div>
    </DashboardPanel>
  );
}

// ────────────────────────────────────────────────────────
// 4. ACTION BUTTON PRIMITIVE
// ────────────────────────────────────────────────────────
interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
}

export function ActionButton({ children, variant = "secondary", href, className = "", ...props }: ActionButtonProps) {
  const baseClass = "px-[var(--space-lg)] py-[var(--space-md)] text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all active:scale-[0.98] cursor-pointer rounded-none text-center select-none";
  const variantClass =
    variant === "primary"
      ? "text-[var(--background-base)] bg-[var(--accent-gold)] border border-[var(--accent-gold)] hover:bg-[var(--accent-cream)] hover:border-[var(--accent-cream)]"
      : "text-[var(--accent-cream)] border border-[var(--border-thin)] hover:border-[var(--accent-gold)]/30 bg-[var(--background-base)]/40";

  const buttonClass = `${baseClass} ${variantClass} ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        {children}
      </Link>
    );
  }

  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────
// 5. SECTION HEADING PRIMITIVE
// ────────────────────────────────────────────────────────
interface SectionHeadingProps {
  title: string;
  subtitle: string;
  badgeText?: string;
}

export function SectionHeading({ title, subtitle, badgeText }: SectionHeadingProps) {
  return (
    <div className="flex justify-between items-center border-b border-[var(--border-thin)] pb-[var(--space-lg)] select-none">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <h2 className="text-[11px] font-sans font-bold tracking-[0.2em] uppercase text-[var(--accent-gold)]">
          {title}
        </h2>
        <p className="text-[9px] font-sans text-[var(--text-secondary)] uppercase tracking-widest font-bold">
          {subtitle}
        </p>
      </div>
      
      {badgeText && (
        <div className="flex items-center gap-[var(--space-sm)] font-mono text-[8px] font-bold text-[var(--accent-gold)] bg-[var(--background-surface)] border border-[var(--accent-gold)]/20 rounded-none px-[var(--space-sm)] py-[var(--space-xs)]">
          <span className="w-1.5 h-1.5 bg-[var(--accent-gold)] animate-pulse" />
          <span>{badgeText}</span>
        </div>
      )}
    </div>
  );
}
