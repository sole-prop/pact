"use client";

import React from "react";
import { TopDeal } from "@/types/pact";
import { formatNumber } from "@/lib/format";

interface TopContendersTableProps {
  deals: TopDeal[];
  onSelect: (deal: TopDeal) => void;
  onRowClick?: (deal: TopDeal) => void;
  selectedDealRank?: number;
}

export function TopContendersTable({
  deals,
  onSelect,
  onRowClick,
  selectedDealRank,
}: TopContendersTableProps) {
  // Format price in INR (e.g. 5000 -> ₹5,000)
  const formatPrice = (val: number) => {
    return `₹${formatNumber(val)}`;
  };

  const getAvatarLetter = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || "S";
  };

  if (deals.length === 0) {
    return (
      <div className="py-16 text-center border border-[#1E1E1E] rounded-[6px] bg-[#111111] select-none">
        <span className="font-mono text-[10px] text-[#8E8E93] uppercase tracking-widest font-bold">
          No contenders reached a ZOPA agreement. Relax price constraints.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 select-none w-full">
      {deals.map((deal) => {
        const isSelected = selectedDealRank === deal.rank;
        return (
          <div
            key={deal.rank}
            onClick={() => onRowClick?.(deal)}
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-[#111111] border rounded-[6px] cursor-pointer transition-all duration-300 gap-5 sm:gap-4 relative group overflow-hidden ${
              isSelected 
                ? "border-[#C5A880]/40 bg-[#14120F]/90 shadow-[0_1px_3px_rgba(0,0,0,0.4)] -translate-y-0.5" 
                : "border-[#1E1E1E] hover:border-[#C5A880]/30 hover:bg-[#0A0A0A] hover:-translate-y-0.5 hover:shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
            }`}
          >
            {/* Left slide-in gold border glow element on hover */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[#C5A880] transition-transform duration-300 ${
              isSelected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
            }`} />

            {/* Vendor Identity Column */}
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="w-11 h-11 rounded-[6px] bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center text-[13px] font-sans font-bold text-[#C5A880] group-hover:border-[#C5A880]/40 transition-colors shadow-inner">
                {getAvatarLetter(deal.seller_name)}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[14px] font-sans font-bold text-[#E5D3B3] truncate tracking-wide">
                  {deal.seller_name}
                </span>
                <span className="text-[8.5px] font-mono tracking-widest text-[#8E8E93] uppercase max-w-max px-2 py-0.5 border border-[#1E1E1E] rounded-[4px] bg-[#0A0A0A] font-bold">
                  {deal.category.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Price Column */}
            <div className="flex flex-col justify-center min-w-[100px] sm:text-right">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.1em] text-[#8E8E93]">
                Contract Rate
              </span>
              <span className="font-mono text-[14px] text-[#E5D3B3] font-bold mt-0.5 tabular-nums">
                {formatPrice(deal.final_price)}
              </span>
            </div>

            {/* Delivery Days Column */}
            <div className="flex flex-col justify-center min-w-[90px] sm:text-right">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.1em] text-[#8E8E93]">
                Timeline
              </span>
              <span className="font-sans text-[13px] text-[#E5D3B3] font-bold mt-0.5">
                {deal.delivery_days} Days
              </span>
            </div>

            {/* AI Score Column */}
            <div className="flex flex-col justify-center min-w-[80px] sm:text-center">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.1em] text-[#8E8E93] mb-1">
                AI Rating
              </span>
              <div className="flex sm:justify-center">
                <div className="w-8 h-8 rounded-full bg-[#0A0A0A] border border-[#C5A880]/20 flex items-center justify-center font-mono text-[12px] font-bold text-[#C5A880] tabular-nums shadow-inner group-hover:border-[#C5A880]/40 transition-colors">
                  {Math.round(deal.composite_score * 100)}
                </div>
              </div>
            </div>

            {/* Savings Column */}
            <div className="flex flex-col justify-center min-w-[100px] sm:text-right">
              <span className="text-[9.5px] font-sans font-bold uppercase tracking-[0.1em] text-[#8E8E93]">
                Net Savings Yield
              </span>
              <span className="font-mono text-[14px] font-extrabold text-[#C5A880] mt-0.5 tabular-nums">
                {deal.savings_pct.toFixed(1)}%
              </span>
            </div>

            {/* Accept Button CTA */}
            <div className="flex items-center min-w-[90px] sm:justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(deal);
                }}
                className="w-full sm:w-auto px-5 py-2.5 text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-[#050505] bg-[#C5A880] hover:bg-[#E5D3B3] rounded-[4px] transition-all duration-300 active:scale-[0.96] cursor-pointer shadow-sm"
              >
                Accept
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
}
