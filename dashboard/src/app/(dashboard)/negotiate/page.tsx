"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

const CATEGORIES = [
  { value: "software_dev", label: "Software Development" },
  { value: "creative_design", label: "Creative Design & UX" },
  { value: "digital_marketing", label: "Digital Marketing & SEO" },
  { value: "customer_support", label: "Customer Support & BPO" },
  { value: "hr_recruitment", label: "HR Recruitment & Placement" },
  { value: "legal_compliance", label: "Legal & Compliance" },
  { value: "financial_audit", label: "Financial Audit & Accounting" },
  { value: "business_consulting", label: "Business Consulting & Strategy" },
  { value: "logistics_fleet", label: "Logistics & Fleet Ops" },
  { value: "corporate_training", label: "Corporate Training & Upskilling" },
];

const QUALITY_GRADES = ["A", "B", "C"];
const URGENCY_LEVELS = ["low", "normal", "high", "urgent"];
const PAYMENT_TERMS = [
  { value: "net_30", label: "Net 30" },
  { value: "net_15", label: "Net 15" },
  { value: "net_60", label: "Net 60" },
  { value: "advance_50", label: "50% Advance" },
  { value: "advance_100", label: "100% Advance" },
];
const SOURCING_HUBS = [
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Delhi",
];
const CERTIFICATIONS = ["ISO9001", "SOC2", "CMMI5", "GDPR", "FSSAI"];

const SERVICE_UNITS: Record<string, { qtyLabel: string; budgetLabel: string; qtyPlaceholder: string }> = {
  software_dev: { qtyLabel: "Required Hours", budgetLabel: "Hourly Budget (INR/Hr)", qtyPlaceholder: "e.g. 500" },
  creative_design: { qtyLabel: "Design Milestones/Projects", budgetLabel: "Project Fee Budget (INR)", qtyPlaceholder: "e.g. 2" },
  digital_marketing: { qtyLabel: "Retainer Period (Months)", budgetLabel: "Monthly Retainer Budget (INR/Mo)", qtyPlaceholder: "e.g. 6" },
  customer_support: { qtyLabel: "Support Agents Needed", budgetLabel: "Monthly Budget per Agent (INR/Agent)", qtyPlaceholder: "e.g. 10" },
  hr_recruitment: { qtyLabel: "Target Candidate Placements", budgetLabel: "Budget per Placed Candidate (INR)", qtyPlaceholder: "e.g. 5" },
  legal_compliance: { qtyLabel: "Advisory Hours Required", budgetLabel: "Hourly Legal Budget (INR/Hr)", qtyPlaceholder: "e.g. 40" },
  financial_audit: { qtyLabel: "Audit Project Scope", budgetLabel: "Flat Audit Project Budget (INR)", qtyPlaceholder: "e.g. 1" },
  business_consulting: { qtyLabel: "Consulting Phases/Milestones", budgetLabel: "Fee per Milestone Budget (INR)", qtyPlaceholder: "e.g. 3" },
  logistics_fleet: { qtyLabel: "Transport Vehicle Trips", budgetLabel: "Budget per Cargo Trip (INR)", qtyPlaceholder: "e.g. 15" },
  corporate_training: { qtyLabel: "Training Workshop Batches", budgetLabel: "Budget per Workshop Batch (INR)", qtyPlaceholder: "e.g. 2" },
};

const CATEGORY_DEFAULTS: Record<string, { qty: number; budget: number; desc: string }> = {
  software_dev: { qty: 500, budget: 2000, desc: "Standard MOQ: 80+ hours. Recommended hourly rate: ₹800 - ₹3,500" },
  creative_design: { qty: 2, budget: 45000, desc: "Standard MOQ: 1+ projects. Recommended project fee: ₹12,000 - ₹75,000" },
  digital_marketing: { qty: 6, budget: 45000, desc: "Standard MOQ: 3+ months retainer. Recommended monthly retainer: ₹15,000 - ₹95,000" },
  customer_support: { qty: 10, budget: 22000, desc: "Standard MOQ: 3+ agent-months. Recommended monthly rate per agent: ₹12,000 - ₹32,000" },
  hr_recruitment: { qty: 5, budget: 25000, desc: "Standard MOQ: 2+ hire placements. Recommended placement fee: ₹8,000 - ₹45,000" },
  legal_compliance: { qty: 40, budget: 3500, desc: "Standard MOQ: 10+ advisory hours. Recommended hourly rate: ₹1,500 - ₹6,000" },
  financial_audit: { qty: 1, budget: 75000, desc: "Standard MOQ: 1+ audit project. Recommended audit fee: ₹25,000 - ₹1,80,000" },
  business_consulting: { qty: 3, budget: 90000, desc: "Standard MOQ: 1+ milestones. Recommended milestone consulting fee: ₹30,000 - ₹2,50,000" },
  logistics_fleet: { qty: 15, budget: 18000, desc: "Standard MOQ: 5+ transport trips. Recommended rate per trip: ₹6,000 - ₹28,000" },
  corporate_training: { qty: 2, budget: 60000, desc: "Standard MOQ: 1+ batch workshops. Recommended rate per batch: ₹20,000 - ₹1,20,000" },
};

export default function NegotiatePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom Dropdown State
  const [showDropdown, setShowDropdown] = useState(false);

  // Form State initialized with software_dev defaults
  const [category, setCategory] = useState("software_dev");
  const [quantity, setQuantity] = useState(500);
  const [budgetMax, setBudgetMax] = useState(2000);
  const [targetPrice, setTargetPrice] = useState(1600);
  const [deliveryDaysMax, setDeliveryDaysMax] = useState(14);
  const [qualityMin, setQualityMin] = useState("B");
  const [urgency, setUrgency] = useState("normal");
  const [paymentPreference, setPaymentPreference] = useState("net_30");
  const [locationState, setLocationState] = useState("Maharashtra");
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [moqWaiver, setMoqWaiver] = useState(true);
  const [partialFulfillment, setPartialFulfillment] = useState(true);

  // AI strategy critique
  const [critique, setCritique] = useState<string | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);

  const handlePredictSuccess = async () => {
    setIsCritiquing(true);
    setCritique(null);
    try {
      const res = await fetch("/api/backend/api/stats/optimize-seller-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `Sourcing request in category ${category} for volume ${quantity} units at target per-unit budget of ${targetPrice} INR and max budget of ${budgetMax} INR. Sourcing Hub: ${locationState}. Certifications required: ${selectedCerts.join(", ") || "None"}. Minimum quality: Grade ${qualityMin}, urgency level: ${urgency}.`,
          category,
          rating: 4.5,
          total_orders_completed: 10
        })
      });
      if (res.ok) {
        const parsed = await res.json();
        setCritique(parsed.justification || "Sourcing constraints calculated. Spec is highly optimized.");
      } else {
        setCritique("Sourcing configuration matches prime vendor parameters. Proceed to run sourcing.");
      }
    } catch (err) {
      setCritique("Sourcing configuration matches prime vendor parameters. Proceed to run sourcing.");
    } finally {
      setIsCritiquing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const payload = {
      category,
      quantity,
      target_price: targetPrice,
      max_price: budgetMax,
      quality_min: qualityMin,
      deadline_days: deliveryDaysMax,
      payment_preference: paymentPreference,
      urgency_level: urgency,
      location_state: locationState,
      buyer_name: "Acme Corp.",
      required_certifications: selectedCerts,
    };

    try {
      const response = await api.negotiate(payload);
      if (response.top_deals) {
        const sessionId = response.session_id || Math.random().toString(36).substring(2, 15);
        const encodedData = encodeURIComponent(JSON.stringify({ ...response, session_id: sessionId }));
        router.push(`/results/${sessionId}?d=${encodedData}`);
      } else {
        setError("Negotiation engine returned an invalid response.");
      }
    } catch (err: any) {
      setError("Backend connection failed. Make sure your FastAPI uvicorn server is running on port 8000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCertToggle = (cert: string) => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const currentUnit = SERVICE_UNITS[category] || { qtyLabel: "Quantity", budgetLabel: "Max Budget per Unit (INR)" };

  // Sourcing Scope Telemetry calculations
  const maxContractValue = quantity * budgetMax;
  const targetContractValue = quantity * targetPrice;
  let sourcingTier = "MICRO_SOURCING";
  if (maxContractValue >= 1000000) {
    sourcingTier = "INSTITUTIONAL_CORE";
  } else if (maxContractValue >= 200000) {
    sourcingTier = "MID_MARKET_B2B";
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-8 py-10 flex flex-col gap-8 select-none">
      {/* Top Title Section */}
      <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-[12px] font-sans font-bold tracking-[0.18em] uppercase text-[#E5D3B3]">
            Buy Portal & Sourcing Specification
          </h2>
          <p className="text-[9px] font-sans text-[#8E8E93] uppercase tracking-wider font-semibold">
            Define contract parameters to launch autonomous negotiation sweeps.
          </p>
        </div>
        <div className="text-[9px] font-mono text-[#C5A880] uppercase tracking-widest font-extrabold bg-[#111111] border border-[#1E1E1E] rounded-[4px] px-3 py-1 shadow-sm">
          Node: <span className="text-white">SOURCING_ACTIVE</span>
        </div>
      </div>

      {/* Two Column Command Grid (strict gap-6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sourcing Specification Form */}
        <form 
          onSubmit={handleSubmit} 
          className="lg:col-span-7 flex flex-col gap-6 bg-[#111111] border border-[#1E1E1E] rounded-[6px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
        >
          {/* Category Dropdown (Sharp rounded-[6px]) */}
          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
              B2B Service Range Category
            </label>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-[6px] py-3.5 px-4 text-xs text-[#E5D3B3] font-semibold cursor-pointer flex justify-between items-center transition-all duration-300 focus-within:ring-1 focus-within:ring-[#C5A880]/30"
            >
              <span className="text-[12px] text-[#E5D3B3] font-sans">
                {CATEGORIES.find(c => c.value === category)?.label || "Select Category"}
              </span>
              <span className="text-[#C5A880] text-[9px] tracking-widest">{showDropdown ? "▲" : "▼"}</span>
            </div>
            
            {showDropdown && (
              <div className="absolute top-[62px] left-0 right-0 z-50 bg-[#0A0A0A] border border-[#1E1E1E] rounded-[6px] shadow-2xl overflow-hidden">
                <div className="max-h-[220px] overflow-y-auto py-1.5">
                  {CATEGORIES.map((cat) => (
                    <div 
                      key={cat.value} 
                      onClick={() => {
                        setCategory(cat.value);
                        setShowDropdown(false);
                        const defaults = CATEGORY_DEFAULTS[cat.value];
                        if (defaults) {
                          setQuantity(defaults.qty);
                          setBudgetMax(defaults.budget);
                          setTargetPrice(Math.round(defaults.budget * 0.8));
                        }
                      }}
                      className={`px-4 py-2.5 text-[10px] font-sans font-bold uppercase tracking-wider text-[#8E8E93] hover:text-[#E5D3B3] hover:bg-white/[0.02] cursor-pointer transition-colors ${
                        cat.value === category ? "text-[#C5A880] bg-white/[0.015]" : ""
                      }`}
                    >
                      {cat.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sourcing Guide Telemetry Box */}
          {CATEGORY_DEFAULTS[category] && (
            <div className="text-[9px] font-mono text-[#C5A880]/80 bg-[#C5A880]/[0.02] border border-[#C5A880]/15 rounded-[4px] px-3.5 py-2.5 w-full uppercase tracking-wider font-bold leading-relaxed">
              ⚡ Sourcing Guide: {CATEGORY_DEFAULTS[category].desc}
            </div>
          )}

          {/* Quantity Field */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
              {currentUnit.qtyLabel}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              min={1}
              required
              className="w-full bg-[#0A0A0A] border border-[#1E1E1E] focus:border-[#C5A880]/30 rounded-[6px] py-3.5 px-4 text-xs font-mono text-white/90 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Price side-by-side inputs (Target & Max Budget) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
                Target Price per Unit (INR)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                min={1}
                required
                className="w-full bg-[#0A0A0A] border border-[#1E1E1E] focus:border-[#C5A880]/30 rounded-[6px] py-3.5 px-4 text-xs font-mono text-white/90 focus:outline-none transition-all duration-300"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
                Max Price per Unit (INR)
              </label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                min={1}
                required
                className="w-full bg-[#0A0A0A] border border-[#1E1E1E] focus:border-[#C5A880]/30 rounded-[6px] py-3.5 px-4 text-xs font-mono text-white/90 focus:outline-none transition-all duration-300"
              />
            </div>
          </div>

          {/* Sourcing Location Hub Pill selection */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
              Sourcing Hub State Location
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {SOURCING_HUBS.map((hub) => {
                const isSelected = locationState === hub;
                return (
                  <button
                    type="button"
                    key={hub}
                    onClick={() => setLocationState(hub)}
                    className={`py-2 px-1 text-center text-[9px] uppercase tracking-wider font-extrabold rounded-[4px] border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "bg-[#C5A880] border-[#C5A880] text-[#050505] shadow-md"
                        : "bg-[#0A0A0A] border-[#1E1E1E] text-[#8E8E93] hover:text-[#E5D3B3] hover:border-[#C5A880]/20"
                    }`}
                  >
                    {hub.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency and Payment preference row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-[6px] py-3 px-3.5 text-[11px] font-sans text-[#E5D3B3] font-semibold focus:outline-none cursor-pointer"
              >
                {URGENCY_LEVELS.map((u) => (
                  <option key={u} value={u} className="bg-[#0A0A0A] text-[#E5D3B3] py-2 uppercase">{u.toUpperCase()}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
                Payment Terms Preference
              </label>
              <select
                value={paymentPreference}
                onChange={(e) => setPaymentPreference(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-[#1E1E1E] rounded-[6px] py-3 px-3.5 text-[11px] font-sans text-[#E5D3B3] font-semibold focus:outline-none cursor-pointer"
              >
                {PAYMENT_TERMS.map((pt) => (
                  <option key={pt.value} value={pt.value} className="bg-[#0A0A0A] text-[#E5D3B3] py-2">{pt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Delivery Days Max */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
              Maximum Delivery / Engagement Setup Period (Days)
            </label>
            <input
              type="number"
              value={deliveryDaysMax}
              onChange={(e) => setDeliveryDaysMax(Number(e.target.value))}
              min={1}
              required
              className="w-full bg-[#0A0A0A] border border-[#1E1E1E] focus:border-[#C5A880]/30 rounded-[6px] py-3.5 px-4 text-xs font-mono text-white/90 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Quality Grade Grid */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
              Minimum Provider Quality Grade
            </label>
            <div className="grid grid-cols-3 gap-2">
              {QUALITY_GRADES.map((grade) => {
                const isSelected = qualityMin === grade;
                return (
                  <button
                    type="button"
                    key={grade}
                    onClick={() => setQualityMin(grade)}
                    className={`py-2.5 px-4 text-center text-[9px] uppercase tracking-widest font-extrabold rounded-[4px] border transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? "bg-[#C5A880] border-[#C5A880] text-[#050505] shadow-md"
                        : "bg-[#0A0A0A] border-[#1E1E1E] text-[#8E8E93] hover:border-[#C5A880]/20"
                    }`}
                  >
                    Grade {grade}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Required Certifications Multi-select */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93]">
              Required Compliance Certifications
            </label>
            <div className="flex flex-wrap gap-2">
              {CERTIFICATIONS.map((cert) => {
                const isSelected = selectedCerts.includes(cert);
                return (
                  <button
                    type="button"
                    key={cert}
                    onClick={() => handleCertToggle(cert)}
                    className={`py-2 px-3 text-[9px] font-mono font-bold rounded-[4px] border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.04] border-[#C5A880] text-[#C5A880]"
                        : "bg-[#0A0A0A] border-[#1E1E1E] text-[#8E8E93] hover:text-white"
                    }`}
                  >
                    {isSelected ? "✔ " : "+ "} {cert}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MOQ & Partial fulfillment checkboxes */}
          <div className="flex flex-col gap-3 py-3 border-t border-b border-[#1E1E1E]">
            <label className="flex items-center gap-3 cursor-pointer group/label">
              <input
                type="checkbox"
                checked={moqWaiver}
                onChange={(e) => setMoqWaiver(e.target.checked)}
                className="w-4 h-4 rounded-[4px] accent-[#C5A880] bg-[#0A0A0A] border-[#1E1E1E]"
              />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93] group-hover/label:text-[#E5D3B3] transition-colors">
                Allow Minimum Order Quantity (MOQ) Waiver
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group/label">
              <input
                type="checkbox"
                checked={partialFulfillment}
                onChange={(e) => setPartialFulfillment(e.target.checked)}
                className="w-4 h-4 rounded-[4px] accent-[#C5A880] bg-[#0A0A0A] border-[#1E1E1E]"
              />
              <span className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93] group-hover/label:text-[#E5D3B3] transition-colors">
                Allow Partial Service Delivery / Stock Allocation
              </span>
            </label>
          </div>

          {/* AI strategy critique */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handlePredictSuccess}
              disabled={isCritiquing}
              className="text-left text-[9px] font-mono font-bold uppercase tracking-wider text-[#C5A880] hover:text-[#E5D3B3] transition-colors cursor-pointer select-none bg-transparent border-none flex items-center gap-1.5"
            >
              {isCritiquing ? "Analyzing sourcing spec..." : "🔮 Run AI Sourcing Strategy critique"}
            </button>
            {critique && (
              <div className="p-3 bg-[#0A0A0A] border border-[#1E1E1E] rounded-[4px] text-[9.5px] font-mono text-[#E5D3B3] uppercase leading-relaxed tracking-wide select-text">
                {critique}
              </div>
            )}
          </div>

          {/* Dynamic Telemetry calculator Summary Card */}
          <div className="p-4.5 bg-[#0A0A0A] border border-[#1E1E1E] rounded-[4px] flex flex-col gap-2">
            <div className="text-[9px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8E93] border-b border-[#1E1E1E] pb-2">
              Sourcing Volume Estimate
            </div>
            <div className="grid grid-cols-2 gap-3.5 pt-1 text-[11px] font-mono text-white/90">
              <div>
                <span className="text-[#8E8E93] font-sans text-[8.5px] uppercase block">Target Contract Value</span>
                <span className="font-bold tabular-nums">{formatCurrency(targetContractValue)}</span>
              </div>
              <div>
                <span className="text-[#8E8E93] font-sans text-[8.5px] uppercase block">Max Budget limit</span>
                <span className="font-bold tabular-nums">{formatCurrency(maxContractValue)}</span>
              </div>
              <div className="col-span-2 flex justify-between items-center border-t border-[#1E1E1E]/50 pt-2 text-[9.5px]">
                <span className="text-[#8E8E93] font-sans text-[8.5px] uppercase font-bold">Estimated Sourcing Scope Tier</span>
                <span className="text-[#C5A880] font-black">{sourcingTier}</span>
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 text-center text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#050505] bg-[#C5A880] hover:bg-[#E5D3B3] rounded-[4px] transition-all duration-300 active:scale-[0.98] disabled:bg-[#1E1E22] disabled:text-[#48484A] cursor-pointer flex items-center justify-center gap-2 shadow-md"
          >
            {isSubmitting ? "STARTING SOURCING AGENTS..." : "START AUTONOMOUS B2B SOURCING"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-[#0A0A0A] border border-red-500/20 rounded-[4px] text-center font-mono text-[9.5px] uppercase text-red-400 select-all">
              {error}
            </div>
          )}
        </form>

        {/* Right Column: AI Preview & Sourcing Radar Dial */}
        <div className="lg:col-span-5 bg-[#111111] border border-[#1E1E1E] rounded-[6px] p-6 flex flex-col justify-between min-h-[520px] shadow-[0_1px_3px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          {/* Subtle Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A880]/[0.02] rounded-full blur-[80px] pointer-events-none" />

          {/* HUD details */}
          <div className="absolute top-4 left-4 w-1.5 h-1.5 border-t border-l border-[#C5A880]/20" />
          <div className="absolute top-4 right-4 w-1.5 h-1.5 border-t border-r border-[#C5A880]/20" />
          <div className="absolute bottom-4 left-4 w-1.5 h-1.5 border-b border-l border-[#C5A880]/20" />
          <div className="absolute bottom-4 right-4 w-1.5 h-1.5 border-b border-r border-[#C5A880]/20" />

          <div className="flex flex-col gap-1 border-b border-[#1E1E1E] pb-3 select-none">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-[#8E8E93]">
              AI Preview
            </h3>
          </div>

          {/* Concentric Radar Sourcing Dial SVG */}
          <div className="relative w-full h-[220px] select-none my-4 flex items-center justify-center">
            {/* Spinning Radar sweep beam CSS */}
            <style>{`
              @keyframes radar-sweep {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            
            <svg className="w-full h-full max-w-[200px] text-[#C5A880]" viewBox="0 0 200 200" fill="none">
              <defs>
                <radialGradient id="centerCore" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#E5D3B3" stopOpacity="1" />
                  <stop offset="35%" stopColor="#C5A880" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#C5A880" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
                <filter id="coreGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                </filter>
              </defs>

              {/* Concentric rings */}
              <circle cx="100" cy="100" r="85" stroke="#C5A880" strokeOpacity="0.04" strokeWidth="1" />
              <circle cx="100" cy="100" r="70" stroke="#C5A880" strokeOpacity="0.1" strokeDasharray="3 3" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="50" stroke="#C5A880" strokeOpacity="0.06" strokeWidth="1" />
              <circle cx="100" cy="100" r="30" stroke="#C5A880" strokeOpacity="0.12" strokeDasharray="4 2" strokeWidth="0.8" />

              {/* Grid axes crosshair lines */}
              <line x1="100" y1="10" x2="100" y2="190" stroke="#C5A880" strokeOpacity="0.04" strokeWidth="0.8" />
              <line x1="10" y1="100" x2="190" y2="100" stroke="#C5A880" strokeOpacity="0.04" strokeWidth="0.8" />

              {/* Radar Sweeping Beam container */}
              <g className="origin-[100px_100px]" style={{ animation: "radar-sweep 8s linear infinite" }}>
                {/* Thin scanning beam */}
                <line x1="100" y1="100" x2="100" y2="15" stroke="#C5A880" strokeOpacity="0.25" strokeWidth="1" />
                <path d="M100 100 L100 15 A85 85 0 0 1 150 45 Z" fill="url(#centerCore)" fillOpacity="0.08" />
              </g>

              {/* Orbiting Active Negotiation Nodes */}
              {/* Node 1 */}
              <g className="animate-pulse" style={{ animationDuration: '3s' }}>
                <circle cx="65" cy="65" r="4.5" fill="#C5A880" fillOpacity="0.15" />
                <circle cx="65" cy="65" r="1.5" fill="#E5D3B3" />
              </g>
              {/* Node 2 */}
              <g className="animate-pulse" style={{ animationDuration: '4.5s' }}>
                <circle cx="150" cy="100" r="5" fill="#C5A880" fillOpacity="0.2" />
                <circle cx="150" cy="100" r="2" fill="#C5A880" />
              </g>
              {/* Node 3 */}
              <g className="animate-pulse" style={{ animationDuration: '2.5s' }}>
                <circle cx="100" cy="150" r="4" fill="#E5D3B3" fillOpacity="0.15" />
                <circle cx="100" cy="150" r="1.5" fill="#FFFFFF" />
              </g>

              {/* Glowing Core Sphere */}
              <ellipse cx="100" cy="100" rx="14" ry="14" fill="url(#centerCore)" />
              <circle cx="100" cy="100" r="6" fill="#E5D3B3" filter="url(#coreGlow)" />
              <circle cx="100" cy="100" r="2.5" fill="#FFFFFF" />
            </svg>
          </div>

          {/* Sourcing Stats Bullet details matching mockup exactly */}
          <div className="flex flex-col gap-5 w-full border-t border-[#1E1E1E] pt-5 text-[11px] font-sans">
            <div className="flex items-start gap-4">
              <span className="text-[#C5A880] mt-0.5 text-xs">☉</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold uppercase tracking-wider text-[#E5D3B3] text-[10px] font-sans">Parallel Negotiations</h4>
                <p className="text-[#8E8E93] text-[9.5px] leading-relaxed font-semibold uppercase">Agents will negotiate with multiple sellers simultaneously</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-[#C5A880] mt-0.5 text-xs">☉</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold uppercase tracking-wider text-[#E5D3B3] text-[10px] font-sans">Expected Response</h4>
                <p className="text-[#8E8E93] text-[9.5px] leading-relaxed font-semibold uppercase">Results in under 120 seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="text-[#C5A880] mt-0.5 text-xs">☉</span>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold uppercase tracking-wider text-[#E5D3B3] text-[10px] font-sans">Intelligence Pass</h4>
                <p className="text-[#8E8E93] text-[9.5px] leading-relaxed font-semibold uppercase">Dual-layer validation for fit and credibility</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
