"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { TopDeal, NegotiateResponse } from "@/types/pact";
import { TopContendersTable } from "@/components/results/TopContendersTable";
import { AIScoreBreakdown } from "@/components/results/AIScoreBreakdown";
import { DealConfirmModal } from "@/components/results/DealConfirmModal";
import { ConfirmationScreen } from "@/components/results/ConfirmationScreen";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const { session_id } = useParams();

  const [data, setData] = useState<NegotiateResponse | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<TopDeal | null>(null);
  
  // Modal & Confirmation screens state
  const [dealToConfirm, setDealToConfirm] = useState<TopDeal | null>(null);
  const [confirmedDeal, setConfirmedDeal] = useState<TopDeal | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | undefined>(undefined);

  useEffect(() => {
    const rawData = searchParams.get("d");
    if (rawData) {
      try {
        // Parse rawData directly
        const parsed: NegotiateResponse = JSON.parse(rawData);
        setData(parsed);
        if (parsed.top_deals && parsed.top_deals.length > 0) {
          setSelectedDeal(parsed.top_deals[0]); // default select rank 1
        }
      } catch (err) {
        console.error("Failed to parse negotiation data from URL:", err);
        try {
          const fallbackParsed: NegotiateResponse = JSON.parse(decodeURIComponent(rawData));
          setData(fallbackParsed);
          if (fallbackParsed.top_deals && fallbackParsed.top_deals.length > 0) {
            setSelectedDeal(fallbackParsed.top_deals[0]);
          }
        } catch (fallbackErr) {
          console.error("Critical: Failed both parsing attempts for URL data:", fallbackErr);
        }
      }
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px] font-mono text-[10px] text-[#C5A880] uppercase tracking-[0.2em] animate-pulse">
        FETCHING SHORTLIST RESULTS...
      </div>
    );
  }

  // If deal is completely confirmed, swap the screen entirely
  if (confirmedDeal) {
    return (
      <ConfirmationScreen
        deal={confirmedDeal}
        sessionId={String(session_id)}
        paymentLink={paymentLink}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full p-8 md:p-10 flex flex-col gap-8 select-none font-sans">
      
      {/* Header telemetry row (Spacious separation) */}
      <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-6 mb-2 select-none">
        <Link
          href="/negotiate"
          className="text-[9.5px] font-sans font-bold uppercase tracking-[0.2em] text-[#807E78] hover:text-[#C5A880] transition-colors"
        >
          ← NEW REQUEST
        </Link>
        <div className="font-mono text-[8px] text-[#807E78] uppercase tracking-widest bg-[#0D0D0E] border border-[#1E1E1E] rounded-none px-3 py-1 select-none hidden md:block shadow-sm font-bold">
          {data.deals_found} DEALS FOUND · {data.sellers_queried} SELLERS QUERIED · <span className="text-[#C5A880]">{(data.duration_seconds * 1000).toFixed(0)}MS LATENCY</span>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Shortlist Table Column (58% / 7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] px-1 select-none">
            TOP SHORTLIST CONTENDERS
          </div>
          <TopContendersTable
            deals={data.top_deals}
            onSelect={(deal) => {
              setDealToConfirm(deal);
            }}
            onRowClick={(deal) => {
              setSelectedDeal(deal);
            }}
            selectedDealRank={selectedDeal?.rank}
          />
        </div>

        {/* AI scoring deviation Radar Column (42% / 5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AIScoreBreakdown deal={selectedDeal} />
          {selectedDeal && (
            <button
              onClick={() => setDealToConfirm(selectedDeal)}
              className="w-full py-4 text-center text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#070708] bg-[#C5A880] hover:bg-[#E5D3B3] rounded-none transition-all duration-300 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 select-none font-bold"
            >
              🔒 Accept Selection & Initiate Escrow
            </button>
          )}
        </div>
      </div>

      {/* Confirm Modal overlay */}
      {dealToConfirm && (
        <DealConfirmModal
          deal={dealToConfirm}
          sessionId={String(session_id)}
          onConfirm={(pLink) => {
            setPaymentLink(pLink);
            setConfirmedDeal(dealToConfirm);
            setDealToConfirm(null);
          }}
          onCancel={() => setDealToConfirm(null)}
        />
      )}
    </div>
  );
}
