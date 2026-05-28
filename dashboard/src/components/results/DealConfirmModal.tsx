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
      // POST to /api/negotiate/select via api helper
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

  // Extract last 4 characters of session ID as ref
  const refCode = `PACT-${sessionId.substring(sessionId.length - 4).toUpperCase()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 select-none">
      <div className="w-full max-w-md p-6 bg-[#111111] border border-[#1E1E1E] rounded-[6px] shadow-2xl flex flex-col gap-6 animate-fadeIn">
        <div>
          <h3 className="text-[15px] font-sans font-bold text-[#F2F2F7] uppercase tracking-[0.08em]">
            Confirm Deal Selection
          </h3>
          <p className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-[0.08em] mt-1">
            Reference: <span className="text-[#C5A880] font-bold">{refCode}</span>
          </p>
        </div>

        {/* Vendor and summary details */}
        <div className="flex flex-col gap-3 py-4 border-t border-b border-[#1E1E1E]">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-sans font-bold text-[#8E8E93] uppercase tracking-[0.08em]">
              Vendor
            </span>
            <span className="text-[11px] font-sans font-bold text-[#F2F2F7] uppercase">
              {deal.seller_name}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-sans font-bold text-[#8E8E93] uppercase tracking-[0.08em]">
              Category
            </span>
            <span className="text-[9px] uppercase font-mono tracking-[0.08em] text-[#F2F2F7] px-2 py-0.5 border border-[#1E1E1E] rounded-[4px] bg-[#0A0A0A]">
              {deal.category.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-sans font-bold text-[#8E8E93] uppercase tracking-[0.08em]">
              Price
            </span>
            <div className="text-right">
              <span className="font-mono text-[14px] font-bold text-[#F2F2F7] tabular-nums font-variant-numeric:tabular-nums font-feature-settings:'tnum'">
                {formatPrice(deal.final_price)}
              </span>
              <div className="text-[9px] font-sans text-[#C5A880] uppercase tracking-[0.08em] mt-0.5 font-bold">
                savings: {deal.savings_pct.toFixed(1)}% vs budget
              </div>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-sans font-bold text-[#8E8E93] uppercase tracking-[0.08em]">
              Delivery Period
            </span>
            <span className="text-[11px] font-mono text-[#8E8E93] font-bold tabular-nums">
              {deal.delivery_days} days
            </span>
          </div>
        </div>

        {/* Terms caveat */}
        <p className="text-[9px] font-sans text-[#48484A] leading-relaxed uppercase tracking-[0.08em] font-semibold">
          * By confirming, you agree to lock the deal terms. Escrow will be initiated and the legal contract stub generated immediately.
        </p>

        {/* Inline Error */}
        {error && (
          <div className="p-3 border border-[#C5A880]/30 bg-[#0A0A0A] text-[#C5A880] text-[9px] font-mono text-center rounded-[6px] uppercase tracking-[0.08em]">
            {error}
          </div>
        )}

        {/* Actions Stack */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#0A0A0A] bg-[#C5A880] border border-[#C5A880] rounded-[6px] transition-all hover:bg-[#E5D3B3] hover:border-[#E5D3B3] disabled:bg-[#1E1E1E] disabled:border-[#1E1E1E] disabled:text-[#48484A] cursor-pointer"
          >
            {isConfirming ? "Locking Deal & Escrow..." : "Confirm Deal"}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="w-full py-3 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-[#8E8E93] border border-[#1E1E1E] rounded-[6px] bg-transparent transition-all hover:text-[#F2F2F7] hover:border-[#8E8E93] cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
