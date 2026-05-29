import React from "react";
import { Play, Loader2, CheckCircle2, ChevronRight, User } from "lucide-react";
import { api } from "@/lib/api";
import { NegotiateResponse, TopDeal } from "@/types/pact";

export function BuyerWorkflow() {
  // Form State
  const [buyerName, setBuyerName] = React.useState("Ministry of Trade OS");
  const [category, setCategory] = React.useState("Electronics");
  const [quantity, setQuantity] = React.useState(150);
  const [targetPrice, setTargetPrice] = React.useState(12000);
  const [maxPrice, setMaxPrice] = React.useState(16000);
  const [qualityMin, setQualityMin] = React.useState("A");
  const [deadlineDays, setDeadlineDays] = React.useState(7);
  const [paymentPref, setPaymentPref] = React.useState("net_30");
  const [urgency, setUrgency] = React.useState("high");
  const [locationState, setLocationState] = React.useState("Maharashtra");

  // Workflow State
  const [isNegotiating, setIsNegotiating] = React.useState(false);
  const [negotiationResult, setNegotiationResult] = React.useState<NegotiateResponse | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<TopDeal | null>(null);
  const [whatsapp, setWhatsapp] = React.useState("+919876543210");
  const [isEscrowing, setIsEscrowing] = React.useState(false);
  const [escrowSuccess, setEscrowSuccess] = React.useState<{ message: string; payment_link?: string } | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const categories = ["Electronics", "Metals", "Chemicals", "Textiles", "Logistics", "Agriculture", "Construction", "Fuel", "Automotive", "Packaging"];
  const qualityGrades = ["A", "B", "C", "D"];
  const paymentPrefs = [
    { value: "cash", label: "Cash on Delivery" },
    { value: "net_30", label: "Net 30 Days" },
    { value: "net_60", label: "Net 60 Days" },
    { value: "net_90", label: "Net 90 Days" },
    { value: "letter_of_credit", label: "Letter of Credit" },
  ];

  const handleLaunchNegotiation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNegotiating(true);
    setNegotiationResult(null);
    setSelectedDeal(null);
    setEscrowSuccess(null);
    setErrorMessage(null);

    try {
      const res = await api.negotiate({
        buyer_name: buyerName,
        category,
        quantity,
        target_price: targetPrice,
        max_price: maxPrice,
        quality_min: qualityMin,
        deadline_days: deadlineDays,
        payment_preference: paymentPref,
        urgency_level: urgency,
        location_state: locationState,
      });
      setNegotiationResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Negotiation swarm execution aborted.");
    } finally {
      setIsNegotiating(false);
    }
  };

  const handleConfirmEscrow = async () => {
    if (!selectedDeal || !negotiationResult?.session_id) return;
    setIsEscrowing(true);
    setErrorMessage(null);

    try {
      const res = await api.confirmDeal(
        negotiationResult.session_id,
        selectedDeal.rank,
        whatsapp
      );
      if (res.success) {
        setEscrowSuccess({
          message: res.message || "Escrow pipeline loaded successfully.",
          payment_link: res.payment_link,
        });
      } else {
        setErrorMessage(res.message || "Escrow verification failed.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Escrow pipeline connection failure.");
    } finally {
      setIsEscrowing(false);
    }
  };

  return (
    <div className="space-y-10 w-full max-w-[1100px] mx-auto select-none text-left pt-2">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-extrabold text-[#F2F2F7] tracking-tight">Sourcing Engine Desk</h2>
        <p className="font-sans text-sm text-[#8E8E93] max-w-xl">
          Dispatch negotiators to lock margins. Review MCDA shortlisted yields in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Column 1: Config Form */}
        <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-6 space-y-6 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.3)]">
          <span className="font-sans text-xs font-semibold text-[#8E8E93]/80 block border-b border-white/[0.04] pb-3">
            Bidding Bounds
          </span>

          <form onSubmit={handleLaunchNegotiation} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                Account Name
              </label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-3 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors rounded-lg"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-2 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors cursor-pointer rounded-lg"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#111112]">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                  Quantity
                </label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-3 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                  Target (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(Number(e.target.value))}
                  className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-3 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors rounded-lg"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                  Max Limit (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-3 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                  Quality Min
                </label>
                <select
                  value={qualityMin}
                  onChange={(e) => setQualityMin(e.target.value)}
                  className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-2 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors cursor-pointer rounded-lg"
                >
                  {qualityGrades.map((grade) => (
                    <option key={grade} value={grade} className="bg-[#111112]">
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                  Maturity (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={deadlineDays}
                  onChange={(e) => setDeadlineDays(Number(e.target.value))}
                  className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-3 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-[10px] text-[#8E8E93]/65 uppercase font-bold tracking-[0.05em]">
                Payment Due cycle
              </label>
              <select
                value={paymentPref}
                onChange={(e) => setPaymentPref(e.target.value)}
                className="w-full h-9 bg-[#070708]/60 border border-white/[0.04] px-2 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] transition-colors cursor-pointer rounded-lg"
              >
                {paymentPrefs.map((p) => (
                  <option key={p.value} value={p.value} className="bg-[#111112]">
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isNegotiating}
              className="w-full h-10 flex items-center justify-center gap-2 font-sans text-xs font-bold text-black bg-[#C5A880] hover:bg-[#E5D3B3] transition-all cursor-pointer rounded-lg disabled:opacity-40"
            >
              {isNegotiating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Conferring swarms...
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-black text-black" />
                  Deploy Swarm
                </>
              )}
            </button>
          </form>
        </div>

        {/* Column 2 & 3: Results Display */}
        <div className="lg:col-span-2 space-y-6">
          {errorMessage && (
            <div className="border border-rose-500/10 bg-rose-500/5 p-4 rounded-xl font-sans text-xs text-rose-400">
              [CRITICAL ERROR]: {errorMessage}
            </div>
          )}

          {isNegotiating && (
            <div className="bg-[#111112]/20 border border-white/[0.04] p-16 flex flex-col items-center justify-center text-center space-y-4" style={{ borderRadius: "16px" }}>
              <Loader2 className="h-7 w-7 text-[#C5A880] animate-spin" />
              <div className="space-y-1">
                <span className="font-sans text-[11px] font-bold tracking-[0.05em] uppercase text-[#C5A880] block">
                  Loop Active
                </span>
                <span className="font-sans text-sm text-[#F2F2F7] font-semibold block">
                  Coordinating multi-attribute negotiator swarms...
                </span>
              </div>
            </div>
          )}

          {/* Result Swarms candidates card */}
          {!isNegotiating && negotiationResult && (
            <div className="bg-[#111112]/20 border border-white/[0.04] p-6 space-y-6" style={{ borderRadius: "16px" }}>
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
                <div className="flex flex-col text-left">
                  <span className="font-sans text-xs font-semibold text-[#8E8E93]/70">
                    Swarms Completed
                  </span>
                  <span className="font-sans text-lg font-extrabold text-[#F2F2F7] mt-0.5">
                    {negotiationResult.deals_found} Verified Candidates
                  </span>
                </div>
              </div>

              {/* Table list of candidates */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.04] font-sans text-[11px] text-[#8E8E93] uppercase font-semibold">
                      <th className="py-2.5">Seller</th>
                      <th className="py-2.5 text-right">Negotiated Price</th>
                      <th className="py-2.5 text-right">Margin Saved</th>
                      <th className="py-2.5 text-right pl-4">Option</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-sans text-xs">
                    {negotiationResult.top_deals.slice(0, 5).map((deal) => (
                      <tr
                        key={deal.rank}
                        className={`hover:bg-white/[0.01] transition-colors ${
                          selectedDeal?.rank === deal.rank ? "bg-[#C5A880]/5" : ""
                        }`}
                      >
                        <td className="py-3">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-[#F2F2F7] flex items-center gap-1.5">
                              {deal.seller_name}
                              {deal.rank === 1 && (
                                <span className="font-sans text-[9px] bg-[#C5A880]/10 text-[#C5A880] px-1.5 py-0.2 rounded-full font-semibold">
                                  Optimal
                                </span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-semibold text-[#F2F2F7] font-mono tabular-nums">
                          ₹{deal.final_price.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 text-right font-bold text-emerald-400 font-mono tabular-nums">
                          {deal.savings_pct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-right pl-4">
                          <button
                            onClick={() => {
                              setSelectedDeal(deal);
                              setEscrowSuccess(null);
                            }}
                            className={`px-3 py-1 font-sans text-[11px] font-medium transition-all cursor-pointer rounded-lg ${
                              selectedDeal?.rank === deal.rank
                                ? "bg-[#C5A880] text-black font-semibold"
                                : "border border-white/[0.04] bg-[#070708]/60 text-[#8E8E93] hover:text-[#F2F2F7] hover:bg-white/5"
                            }`}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Deal description & lock */}
              {selectedDeal && (
                <div className="border border-white/[0.04] bg-[#070708]/40 p-5 space-y-4 rounded-xl">
                  <p className="font-sans text-xs text-[#8E8E93] leading-relaxed italic text-left">
                    "{selectedDeal.narrative}"
                  </p>

                  {/* Deploy form */}
                  {!escrowSuccess ? (
                    <div className="border-t border-white/[0.04] pt-4 flex flex-col gap-3">
                      <span className="font-sans text-[11px] text-[#8E8E93] font-semibold block text-left">
                        Secure Smart Escrow
                      </span>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                        <div className="flex flex-col flex-1 gap-1 text-left">
                          <label className="font-sans text-[10px] text-[#8E8E93]/40 uppercase tracking-[0.02em]">
                            Recipient WhatsApp
                          </label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            className="w-full h-9 bg-[#111112]/40 border border-white/[0.04] px-3 font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] rounded-lg"
                          />
                        </div>
                        <button
                          onClick={handleConfirmEscrow}
                          disabled={isEscrowing}
                          className="h-9 px-5 font-sans text-xs font-semibold bg-[#C5A880] hover:bg-[#E5D3B3] text-black rounded-lg cursor-pointer disabled:opacity-40"
                        >
                          {isEscrowing ? "Deploying..." : "Confirm Escrow"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-emerald-500/10 bg-emerald-500/5 p-4 rounded-xl space-y-2 flex flex-col items-center justify-center text-center">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <div className="space-y-0.5">
                        <span className="font-sans text-xs font-bold text-[#F2F2F7] block">
                          Escrow Deployed OK
                        </span>
                        <span className="font-sans text-[10px] text-[#8E8E93] block">
                          {escrowSuccess.message}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* standby screen */}
          {!isNegotiating && !negotiationResult && (
            <div className="bg-[#111112]/20 border border-white/[0.04] p-24 flex flex-col items-center justify-center text-center space-y-4" style={{ borderRadius: "16px" }}>
              <User className="h-8 w-8 text-[#8E8E93]/20" />
              <div className="space-y-1">
                <span className="font-sans text-[11px] font-bold text-[#8E8E93]/50 tracking-[0.05em] block uppercase">
                  Loop Standby
                </span>
                <span className="font-sans text-sm text-[#F2F2F7] font-semibold block">
                  Procurement Swarm Ready
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
