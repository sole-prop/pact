import React from "react";
import Link from "next/link";

export function DashboardHero() {
  return (
    <div className="relative w-full h-[190px] bg-[#0A0A0C] border border-white/[0.06] rounded-xl overflow-hidden px-8 flex items-center select-none group">
      {/* Subtle Dot Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#C5A880 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Intersecting circular ZOPA overlap graphic (Reference Mockup) */}
      <div className="absolute right-[40px] lg:right-[60px] top-1/2 -translate-y-1/2 w-[220px] h-[150px] pointer-events-none hidden md:block select-none">
        <svg className="w-full h-full" viewBox="0 0 220 150" fill="none">
          <defs>
            <radialGradient id="zopaGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C5A880" stopOpacity="0.4" />
              <stop offset="20%" stopColor="#C5A880" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="verticalBeam" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#C5A880" stopOpacity="0" />
              <stop offset="50%" stopColor="#E5D3B3" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
            </linearGradient>
            <filter id="blurEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
            </filter>
          </defs>

          {/* Large overlapping glowing arcs */}
          {/* Left Circle Arc */}
          <circle cx="80" cy="75" r="48" stroke="#C5A880" strokeWidth="0.8" strokeOpacity="0.25" />
          <circle cx="80" cy="75" r="48" stroke="#E5D3B3" strokeWidth="1.2" strokeOpacity="0.1" strokeDasharray="3 3" />
          
          {/* Right Circle Arc */}
          <circle cx="140" cy="75" r="48" stroke="#C5A880" strokeWidth="0.8" strokeOpacity="0.25" />
          <circle cx="140" cy="75" r="48" stroke="#E5D3B3" strokeWidth="1.2" strokeOpacity="0.1" strokeDasharray="3 3" />

          {/* Overlap Intersection Radial Glow */}
          <ellipse cx="110" cy="75" rx="16" ry="40" fill="url(#zopaGlow)" />

          {/* Central Intersection Beam */}
          <line x1="110" y1="25" x2="110" y2="125" stroke="url(#verticalBeam)" strokeWidth="1.5" />
          
          {/* Intensely glowing core orb at the exact agreement vertex */}
          <circle cx="110" cy="75" r="3.5" fill="#E5D3B3" filter="url(#blurEffect)" />
          <circle cx="110" cy="75" r="1.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Left content block (tightened flow) */}
      <div className="relative z-10 max-w-[85%] md:max-w-[65%] flex flex-col justify-center gap-3">
        <div className="flex flex-col gap-1 text-[#F2F2F7]">
          <h2 className="text-[28px] md:text-[34px] font-sans font-light text-[#E5D3B3] leading-[1.1] tracking-tight">
            You describe.
          </h2>
          <h2 className="text-[28px] md:text-[34px] font-sans font-black text-[#C5A880] uppercase tracking-wide leading-[1.1]">
            We negotiate.
          </h2>
        </div>

        <p className="text-[11px] text-[#8E8E93] max-w-[390px] leading-relaxed uppercase tracking-[0.06em] font-semibold">
          AI agents negotiate in parallel with thousands of B2B sellers. Fully autonomous sourcing at 28.5K transactions/sec.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 mt-2">
          <Link
            href="/negotiate"
            className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#060606] bg-[#C5A880] border border-[#C5A880] rounded-[6px] transition-all hover:bg-[#E5D3B3] hover:border-[#E5D3B3] active:scale-[0.98] cursor-pointer"
          >
            NEW REQUEST
          </Link>
          
          <Link
            href="/demo"
            className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#E5D3B3] border border-white/[0.08] hover:border-[#C5A880]/30 rounded-[6px] transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            VIEW DEMO →
          </Link>
        </div>
      </div>
    </div>
  );
}
