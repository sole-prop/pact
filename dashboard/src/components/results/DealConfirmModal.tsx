"use client";

import React, { useState } from "react";
import { TopDeal } from "@/types/pact";
import { api } from "@/lib/api";

interface DealConfirmModalProps {
  deal: TopDeal;
  sessionId: string;
  onConfirm: (paymentLink?: string) => void;
  onCancel: () => void;
}

export function DealConfirmModal({
  deal,
  sessionId,
  onConfirm,
  onCancel,
}: DealConfirmModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setError(null);
    try {
      const res = await api.confirmDeal(sessionId, deal.rank);
      if (res.success) {
        onConfirm(res.payment_link);
      } else {
        setError(res.message || "Failed to confirm deal. Escrow error.");
      }
    } catch (err: any) {
      setError("Failed to confirm deal. Server offline or DB unreachable.");
    } finally {
      setIsConfirming(false);
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const refCode = `PACT-${sessionId.substring(sessionId.length - 4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 select-none">
      <div className="w-full max-w-md p-8 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none shadow-2xl flex flex-col gap-6 animate-fadeIn relative">
        {/* Fine corners */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 border-b border-r border-[#C5A880]/15" />

        <div>
          <h3 className="text-[13px] font-sans font-bold text-[#E5E5E7] uppercase tracking-[0.15em]">
            Confirm Deal Selection
          </h3>
          <p className="text-[9px] font-mono text-[#807E78] uppercase tracking-widest mt-1.5 font-bold">
            Reference: <span className="text-[#C5A880] font-bold">{refCode}</span>
          </p>
        </div>

        {/* Vendor and summary details */}
        <div className="flex flex-col gap-3.5 py-4.5 border-t border-b border-[#1E1E1E]">
          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">
              Vendor
            </span>
            <span className="text-[11px] font-sans font-bold text-[#E5E5E7] uppercase tracking-wider">
              {deal.seller_name}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">
              Category
            </span>
            <span className="text-[8.5px] uppercase font-mono tracking-widest text-[#E5E5E7] px-2 py-0.5 border border-[#1E1E1E] bg-[#070708] rounded-none font-bold">
              {deal.category.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">
              Price
            </span>
            <div className="text-right">
              <span className="font-mono text-[13.5px] font-bold text-[#E5E5E7] tabular-nums font-variant-numeric:tabular-nums font-feature-settings:'tnum'">
                {formatPrice(deal.final_price)}
              </span>
              <div className="text-[8.5px] font-sans text-[#C5A880] uppercase tracking-widest mt-1 font-bold">
                savings: {deal.savings_pct.toFixed(1)}% vs budget
              </div>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[9.5px] font-sans font-bold text-[#807E78] uppercase tracking-[0.12em]">
              Delivery Period
            </span>
            <span className="text-[10.5px] font-mono text-[#807E78] font-bold tabular-nums">
              {deal.delivery_days} days
            </span>
          </div>
        </div>

        {/* Terms caveat */}
        <p className="text-[8px] font-sans text-[#48484A] leading-relaxed uppercase tracking-widest font-bold">
          [NOTE] By confirming, you agree to lock the deal terms. Escrow will be initiated and the legal contract stub generated immediately.
        </p>

        {/* Inline Error */}
        {error && (
          <div className="p-3 border border-red-500/20 bg-[#070708] text-red-400 text-[9px] font-mono text-center rounded-none uppercase tracking-widest font-bold">
            {error}
          </div>
        )}

        {/* Actions Stack */}
        <div className="flex flex-col gap-2 pt-1.5">
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full py-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#070708] bg-[#C5A880] border border-[#C5A880] rounded-none transition-all duration-300 hover:bg-[#E5D3B3] hover:border-[#E5D3B3] disabled:bg-[#1E1E1E] disabled:text-[#48484A] cursor-pointer"
          >
            {isConfirming ? "Locking Deal & Escrow..." : "Confirm Deal"}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="w-full py-4 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-[#807E78] border border-[#1E1E1E] rounded-none bg-transparent transition-all duration-300 hover:text-white hover:border-[#807E78] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
