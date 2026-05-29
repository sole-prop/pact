"use client";

import React from "react";
import { motion } from "framer-motion";
import { DashboardPanel, ActionButton } from "@/components/ui/SovereignPrimitives";

export function DashboardHero() {
  return (
    <DashboardPanel className="relative w-full h-[240px] flex items-center overflow-hidden">
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(var(--accent-gold) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Dynamic overlapping ZOPA vector graphic */}
      <div className="absolute right-[40px] lg:right-[60px] top-1/2 -translate-y-1/2 w-[220px] h-[160px] pointer-events-none hidden md:block select-none">
        <svg className="w-full h-full" viewBox="0 0 220 160" fill="none">
          <defs>
            <radialGradient id="zopaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0.35" />
              <stop offset="35%" stopColor="var(--accent-gold)" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="verticalBeam" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-gold)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--accent-cream)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--accent-gold)" stopOpacity="0" />
            </linearGradient>
            <filter id="blurEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
            </filter>
          </defs>

          {/* Golden concentric sweeps */}
          <motion.circle 
            cx="80" 
            cy="80" 
            r="48" 
            stroke="var(--accent-gold)" 
            strokeWidth="0.8" 
            strokeOpacity="0.2"
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <circle cx="80" cy="80" r="48" stroke="var(--accent-cream)" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="4 4" />
          
          <motion.circle 
            cx="140" 
            cy="80" 
            r="48" 
            stroke="var(--accent-gold)" 
            strokeWidth="0.8" 
            strokeOpacity="0.2"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          />
          <circle cx="140" cy="80" r="48" stroke="var(--accent-cream)" strokeWidth="1" strokeOpacity="0.05" strokeDasharray="4 4" />

          {/* Overlap Zone Glow */}
          <ellipse cx="110" cy="80" rx="18" ry="42" fill="url(#zopaGlow)" />

          {/* Core Beam */}
          <line x1="110" y1="20" x2="110" y2="140" stroke="url(#verticalBeam)" strokeWidth="1.2" />
          
          {/* Target points */}
          <circle cx="110" cy="80" r="4" fill="var(--accent-cream)" filter="url(#blurEffect)" />
          <circle cx="110" cy="80" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Content panel */}
      <div className="relative z-10 max-w-[85%] md:max-w-[65%] flex flex-col justify-center gap-[var(--space-md)]">
        <div className="flex flex-col gap-[var(--space-xs)] text-[var(--text-primary)]">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-[28px] md:text-[34px] font-sans font-extralight text-[var(--accent-cream)] leading-[1.05] tracking-tight"
          >
            You describe.
          </motion.h2>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="text-[28px] md:text-[34px] font-sans font-black text-[var(--accent-gold)] uppercase tracking-widest leading-[1.05]"
          >
            We negotiate.
          </motion.h2>
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-[9px] text-[var(--text-secondary)] max-w-[390px] leading-relaxed uppercase tracking-[0.18em] font-mono font-bold"
        >
          Sourcing telemetry locked. System processes B2B negotiations in parallel. Autonomous SAO protocol locks deals at hyper-scale.
        </motion.p>

        {/* Structured Primitive Actions Row */}
        <motion.div 
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex items-center gap-[var(--space-md)] mt-[var(--space-sm)]"
        >
          <ActionButton variant="primary" href="/negotiate">
            [Buy specification]
          </ActionButton>
          <ActionButton variant="secondary" href="/demo">
            [Run simulation]
          </ActionButton>
        </motion.div>
      </div>
    </DashboardPanel>
  );
}
