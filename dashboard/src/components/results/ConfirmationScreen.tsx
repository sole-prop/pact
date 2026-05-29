"use client";

import React from "react";
import Link from "next/link";
import { TopDeal } from "@/types/pact";
import { formatNumber } from "@/lib/format";

interface ConfirmationScreenProps {
  deal: TopDeal;
  sessionId: string;
  paymentLink?: string;
}

export function ConfirmationScreen({
  deal,
  sessionId,
  paymentLink,
}: ConfirmationScreenProps) {
  const formatPrice = (val: number) => {
    return `₹${formatNumber(val)}`;
  };

  const refCode = `PACT-${sessionId.substring(sessionId.length - 8).toUpperCase()}`;

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-[#E5E5E7] p-6 max-w-xl mx-auto text-center select-none animate-fadeIn relative font-sans">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#C5A880]/[0.015] rounded-full blur-[100px] pointer-events-none" />

      {/* PACT Top Brand Header */}
      <h1 className="font-mono text-[#C5A880] text-[18px] font-extralight leading-none tracking-[0.55em] mb-10 select-none uppercase">
        PACT
      </h1>

      {/* Double ring contract locked SVG checked emblem */}
      <div className="relative w-20 h-20 rounded-none border border-[#1E1E1E] flex items-center justify-center bg-[#0D0D0E] mb-6 shadow-2xl">
        <svg className="absolute inset-0 w-full h-full text-[#C5A880]" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="44" stroke="#C5A880" strokeOpacity="0.05" strokeWidth="1" />
          <circle cx="48" cy="48" r="38" stroke="#C5A880" strokeOpacity="0.15" strokeWidth="1.5" />
          <path
            d="M36 48 L44 56 L60 38"
            stroke="#C5A880"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-pulse"
          />
        </svg>
      </div>

      <div className="text-[9px] uppercase font-sans tracking-[0.18em] text-[#C5A880] font-bold mb-2">
        DEAL CONFIRMED
      </div>
      
      <div className="font-mono text-xl lg:text-[22px] font-bold text-[#E5E5E7] tracking-[0.08em] mb-6 select-all uppercase">
        {refCode}
      </div>

      {/* Modern Institutional Transaction Receipt */}
      <div className="w-full max-w-md bg-[#0D0D0E] border border-[#1E1E1E] rounded-none p-6 text-left mb-8 shadow-none relative overflow-hidden">
        {/* Decorative corner ticks */}
        <div className="absolute top-3 left-3 w-1.5 h-1.5 border-t border-l border-[#C5A880]/20" />
        <div className="absolute top-3 right-3 w-1.5 h-1.5 border-t border-r border-[#C5A880]/20" />
        
        <div className="text-[8.5px] font-mono uppercase tracking-widest text-[#807E78] border-b border-[#1E1E1E] pb-3 mb-4 flex justify-between font-bold">
          <span>TRANSACTION SUMMARY RECEIPT</span>
          <span className="text-[#C5A880]">SECURE PROT: SAO v4</span>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">SELLER PARTNER</span>
            <span className="text-[11px] font-sans font-bold text-[#E5E5E7] uppercase tracking-wider">{deal.seller_name}</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">CATEGORY</span>
            <span className="text-[8.5px] font-mono font-bold text-[#E5E5E7] uppercase bg-[#070708] border border-[#1E1E1E] rounded-none px-1.5 py-0.5 tracking-widest">
              {deal.category.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">TIMELINE</span>
            <span className="text-[10.5px] font-mono text-[#E5E5E7] font-bold tabular-nums uppercase">{deal.delivery_days} DAYS</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">PAYMENT TERMS</span>
            <span className="text-[11px] font-sans font-bold text-[#E5E5E7] uppercase tracking-wider">{deal.payment_term.toUpperCase()}</span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">AI RATING SCORE</span>
            <span className="text-[10.5px] font-mono font-bold text-[#C5A880] tabular-nums">{Math.round(deal.composite_score * 100)}/100</span>
          </div>

          {/* Dotted delimiter */}
          <div className="border-t border-dashed border-[#1E1E1E] my-1" />

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-extrabold text-[#C5A880] uppercase tracking-[0.15em]">FINAL AGREED RATE</span>
            <span className="text-[15px] font-mono font-extrabold text-[#C5A880] tabular-nums font-variant-numeric:tabular-nums font-feature-settings:'tnum'">{formatPrice(deal.final_price)}</span>
          </div>
        </div>
      </div>

      <p className="text-[9px] font-sans text-[#807E78] mb-8 uppercase tracking-widest max-w-sm mx-auto leading-relaxed font-bold">
        [NOTE] Escrow initiated successfully. Legal contract stub finalized. Both enterprise parties notified.
      </p>

      {/* Stacked CTA actions */}
      <div className="flex flex-col gap-3.5 w-full max-w-xs">
        {paymentLink && (
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 text-center text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#070708] bg-[#C5A880] border border-[#C5A880] rounded-none transition-all duration-300 hover:bg-[#E5D3B3] hover:border-[#E5D3B3] active:scale-[0.98] cursor-pointer"
          >
            Open Payment Link
          </a>
        )}

        <Link
          href="/dashboard"
          className="w-full py-4 text-center text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#807E78] border border-[#1E1E1E] rounded-none bg-[#0D0D0E] transition-all duration-300 hover:border-[#807E78] hover:text-white active:scale-[0.98] cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
