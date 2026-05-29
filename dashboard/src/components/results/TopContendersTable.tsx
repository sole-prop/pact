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
  const formatPrice = (val: number) => {
    return `₹${formatNumber(val)}`;
  };

  const getAvatarLetter = (name: string) => {
    return name.trim().charAt(0).toUpperCase() || "S";
  };

  if (deals.length === 0) {
    return (
      <div className="py-16 text-center border border-[#1E1E1E] rounded-none bg-[#0D0D0E] select-none relative">
        <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/10" />
        <span className="font-mono text-[9px] text-[#807E78] uppercase tracking-widest font-bold">
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
            className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-[#0D0D0E] border cursor-pointer transition-all duration-300 gap-5 sm:gap-4 relative group overflow-hidden ${
              isSelected 
                ? "border-[#C5A880]/40 bg-[#0E0E10] -translate-y-0.5" 
                : "border-[#1E1E1E] hover:border-[#C5A880]/30 hover:bg-[#070708] hover:-translate-y-0.5"
            }`}
          >
            {/* razor-sharp vertical gold border-left highlight */}
            <div className={`absolute left-0 top-0 bottom-0 w-[2px] bg-[#C5A880] transition-transform duration-300 origin-top ${
              isSelected ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"
            }`} />

            {/* Vendor Identity Column */}
            <div className="flex items-center gap-4 min-w-[220px]">
              <div className="w-10 h-10 rounded-none bg-[#070708] border border-[#1E1E1E] flex items-center justify-center text-[12px] font-mono font-bold text-[#C5A880] group-hover:border-[#C5A880]/40 transition-colors shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                {getAvatarLetter(deal.seller_name)}
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[13px] font-sans font-bold text-[#E5D3B3] truncate tracking-wide">
                  {deal.seller_name}
                </span>
                <span className="text-[8px] font-mono tracking-widest text-[#807E78] uppercase max-w-max px-2 py-0.5 border border-[#1E1E1E] rounded-none bg-[#070708] font-bold">
                  {deal.category.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>
            </div>

            {/* Price Column */}
            <div className="flex flex-col justify-center min-w-[100px] sm:text-right font-sans">
              <span className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
                Contract Rate
              </span>
              <span className="font-mono text-[13px] text-[#E5D3B3] font-bold mt-1 tabular-nums">
                {formatPrice(deal.final_price)}
              </span>
            </div>

            {/* Delivery Days Column */}
            <div className="flex flex-col justify-center min-w-[90px] sm:text-right">
              <span className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
                Timeline
              </span>
              <span className="font-sans text-[12.5px] text-[#E5D3B3] font-bold mt-1 uppercase tracking-wider">
                {deal.delivery_days} Days
              </span>
            </div>

            {/* AI Score Column */}
            <div className="flex flex-col justify-center min-w-[80px] sm:text-center">
              <span className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-1">
                AI Rating
              </span>
              <div className="flex sm:justify-center">
                <div className="w-8 h-8 rounded-none bg-[#070708] border border-[#C5A880]/20 flex items-center justify-center font-mono text-[11px] font-bold text-[#C5A880] tabular-nums shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] group-hover:border-[#C5A880]/40 transition-colors">
                  {Math.round(deal.composite_score * 100)}
                </div>
              </div>
            </div>

            {/* Savings Column */}
            <div className="flex flex-col justify-center min-w-[100px] sm:text-right font-sans">
              <span className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
                Net Savings Yield
              </span>
              <span className="font-mono text-[13px] font-extrabold text-[#C5A880] mt-1 tabular-nums">
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
                className="w-full sm:w-auto px-5 py-2.5 text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-[#070708] bg-[#C5A880] hover:bg-[#E5D3B3] rounded-none transition-all duration-300 active:scale-[0.96] cursor-pointer"
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
