"use client";

import React, { useState, useEffect } from "react";
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

const STRATEGIES = [
  { value: "conceder", label: "Conceder (High volume, quick close)" },
  { value: "tit_for_tat", label: "Tit for Tat (Mathematical reciprocity)" },
  { value: "boulware", label: "Boulware (Tough, premium-locking)" },
  { value: "realistic", label: "Realistic (Stable market-parity)" },
  { value: "aspirational", label: "Aspirational (High initial anchors)" },
  { value: "hardball", label: "Hardball (Low concessions)" },
];

const SOURCING_HUBS = [
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Gujarat",
  "Delhi",
];

const CERTIFICATIONS = ["ISO9001", "SOC2", "CMMI5", "GDPR", "FSSAI"];

const PAYMENT_TERMS_OPTIONS = [
  { value: "net_30", label: "Net 30" },
  { value: "net_15", label: "Net 15" },
  { value: "net_60", label: "Net 60" },
  { value: "advance_50", label: "50% Advance" },
  { value: "advance_100", label: "100% Advance" },
];

const QUALITY_GRADES = ["A", "B", "C"];

const SELL_SERVICE_UNITS: Record<string, { listLabel: string; floorLabel: string; moqLabel: string; maxLabel: string; stockLabel: string }> = {
  software_dev: {
    listLabel: "Target Hourly Developer Rate (INR/Hr)",
    floorLabel: "Minimum Acceptable Hourly Rate (INR/Hr)",
    moqLabel: "Minimum Engagement Size (Hours)",
    maxLabel: "Maximum Resource Bandwidth Cap (Hours)",
    stockLabel: "Total Available Developer Hours Pool"
  },
  creative_design: {
    listLabel: "Target Project Milestone Fee (INR)",
    floorLabel: "Minimum Acceptable Project Fee (INR)",
    moqLabel: "Minimum Sourcing Milestones",
    maxLabel: "Maximum Project Milestones Cap",
    stockLabel: "Total Available Sourcing Milestones Stock"
  },
  digital_marketing: {
    listLabel: "Target Monthly Retainer Fee (INR/Mo)",
    floorLabel: "Minimum Acceptable Retainer Fee (INR/Mo)",
    moqLabel: "Minimum Retainer Period (Months)",
    maxLabel: "Maximum Retainer Period Cap (Months)",
    stockLabel: "Total Retainer Months Bandwidth Pool"
  },
  customer_support: {
    listLabel: "Target Monthly Rate per Agent (INR/Agent)",
    floorLabel: "Minimum Acceptable Agent Rate (INR/Agent)",
    moqLabel: "Minimum Support Agents Engaged",
    maxLabel: "Maximum Agent Capacity Cap",
    stockLabel: "Total Available Support Agents Pool"
  },
  hr_recruitment: {
    listLabel: "Target Fee per Candidate Placement (INR)",
    floorLabel: "Minimum Acceptable Placement Fee (INR)",
    moqLabel: "Minimum Placements MOQ",
    maxLabel: "Maximum Placements Capacity Cap",
    stockLabel: "Total Recruiters Placement Bandwidth Pool"
  },
  legal_compliance: {
    listLabel: "Target Hourly Legal Rate (INR/Hr)",
    floorLabel: "Minimum Acceptable Legal Rate (INR/Hr)",
    moqLabel: "Minimum Advisory Hours Engaged",
    maxLabel: "Maximum Legal Hours Capacity Cap",
    stockLabel: "Total Available Legal Hours Pool"
  },
  financial_audit: {
    listLabel: "Target Flat Audit Project Fee (INR)",
    floorLabel: "Minimum Acceptable Audit Fee (INR)",
    moqLabel: "Minimum Sourcing Audits MOQ",
    maxLabel: "Maximum Audit Projects Capacity",
    stockLabel: "Total Available Audit Teams Pool"
  },
  business_consulting: {
    listLabel: "Target Fee per Consulting Phase (INR)",
    floorLabel: "Minimum Acceptable Sourcing Fee (INR)",
    moqLabel: "Minimum Consulting Phases MOQ",
    maxLabel: "Maximum Sourcing Phases Capacity",
    stockLabel: "Total Available Sourcing Phases Pool"
  },
  logistics_fleet: {
    listLabel: "Target Fee per Transport Trip (INR)",
    floorLabel: "Minimum Acceptable Trip Fee (INR)",
    moqLabel: "Minimum Transport Trips MOQ",
    maxLabel: "Maximum Fleet Trips Capacity Cap",
    stockLabel: "Total Active Cargo Fleet Vehicle Pool"
  },
  corporate_training: {
    listLabel: "Target Fee per Workshop Batch (INR)",
    floorLabel: "Minimum Acceptable Workshop Fee (INR)",
    moqLabel: "Minimum Workshop Batches MOQ",
    maxLabel: "Maximum Workshop Batches Capacity",
    stockLabel: "Total Available Workshop Batches Pool"
  }
};

const CATEGORY_DEFAULTS: Record<string, { qty: number; budget: number; moq: number; maxQty: number; stock: number }> = {
  software_dev: { qty: 500, budget: 2000, moq: 80, maxQty: 5000, stock: 10000 },
  creative_design: { qty: 2, budget: 45000, moq: 1, maxQty: 10, stock: 30 },
  digital_marketing: { qty: 6, budget: 45000, moq: 3, maxQty: 24, stock: 120 },
  customer_support: { qty: 10, budget: 22000, moq: 3, maxQty: 100, stock: 500 },
  hr_recruitment: { qty: 5, budget: 25000, moq: 2, maxQty: 50, stock: 200 },
  legal_compliance: { qty: 40, budget: 3500, moq: 10, maxQty: 300, stock: 1000 },
  financial_audit: { qty: 1, budget: 75000, moq: 1, maxQty: 5, stock: 20 },
  business_consulting: { qty: 3, budget: 90000, moq: 1, maxQty: 15, stock: 60 },
  logistics_fleet: { qty: 15, budget: 18000, moq: 5, maxQty: 200, stock: 1000 },
  corporate_training: { qty: 2, budget: 60000, moq: 1, maxQty: 10, stock: 40 },
};

export default function SellPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("Acme Engineers");
  const [category, setCategory] = useState("software_dev");
  const [description, setDescription] = useState("");
  const [listPrice, setListPrice] = useState(2500);
  const [floorPrice, setFloorPrice] = useState(1800);
  const [moq, setMoq] = useState(50);
  const [maxQty, setMaxQty] = useState(2000);
  const [currentStockUnits, setCurrentStockUnits] = useState(5000);
  const [qualityGrade, setQualityGrade] = useState("A");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [acceptedPaymentTerms, setAcceptedPaymentTerms] = useState<string[]>(["net_30"]);
  const [locationState, setLocationState] = useState("Maharashtra");
  const [maxDiscountPct, setMaxDiscountPct] = useState(15.0);
  const [deliveryMin, setDeliveryMin] = useState(7);
  const [deliveryMax, setDeliveryMax] = useState(21);
  const [strategy, setStrategy] = useState("tit_for_tat");
  const [whatsapp, setWhatsapp] = useState("+919876543210");
  const [showCatDropdown, setShowCatDropdown] = useState(false);

  // OpenAI Optimization State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optResult, setOptResult] = useState<{ justification: string; pitch: string } | null>(null);

  // Notifications (buyer deals) and active services state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"register" | "nodes">("register");

  useEffect(() => {
    fetchSellersAndNotifications();
    const interval = setInterval(fetchSellersAndNotifications, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  const fetchSellersAndNotifications = async () => {
    try {
      const notifsRes = await fetch("/api/backend/api/stats/seller-notifications");
      if (notifsRes.ok) {
        const notifs = await notifsRes.json();
        setNotifications(notifs);
      }

      const sellersRes = await fetch("/api/backend/api/stats/sellers");
      if (sellersRes.ok) {
        const allSellers = await sellersRes.json();
        const userSellers = allSellers.filter((s: any) => s.id && s.id.startsWith("S_USER_"));
        userSellers.sort((a: any, b: any) => b.id.localeCompare(a.id));
        setMyServices(userSellers);
      }
    } catch (err) {
      console.error("Failed to fetch seller dashboard data:", err);
    }
  };

  const handleOptimizeProfile = async () => {
    if (!description) {
      setError("Please input a brief description of your service competence first.");
      return;
    }
    setIsOptimizing(true);
    setError(null);
    setOptResult(null);

    try {
      const res = await fetch("/api/backend/api/stats/optimize-seller-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          category,
          rating: 4.8,
          total_orders_completed: 120
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setListPrice(data.recommended_list_price);
        setFloorPrice(data.recommended_floor_price);
        setStrategy(data.recommended_strategy);
        if (data.certifications && data.certifications.length > 0) {
          setCertifications(data.certifications);
        }
        setOptResult({
          justification: data.justification,
          pitch: data.pitch,
        });
      } else {
        setError("Failed to run premium optimization. Falling back to default rules.");
      }
    } catch (err) {
      setError("Optimisation server not online. Loaded rule-based indexing.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const payload = {
      name,
      category,
      floor_price_per_unit: floorPrice,
      list_price_per_unit: listPrice,
      moq,
      max_order_qty: maxQty,
      quality_grade: qualityGrade,
      quality_certifications: certifications,
      delivery_days_min: deliveryMin,
      delivery_days_max: deliveryMax,
      payment_terms_accepted: acceptedPaymentTerms,
      negotiation_strategy: strategy,
      whatsapp_number: whatsapp,
      rating: 4.8,
      total_orders_completed: 120,
      current_stock_units: currentStockUnits,
      max_discount_pct: maxDiscountPct,
      location_state: locationState,
    };

    try {
      const res = await fetch("/api/backend/api/stats/add-seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setSuccessMsg(`Service node "${name}" successfully registered & active in negotiations!`);
        setMyServices(prev => [result.seller, ...prev]);
        setDescription("");
        setOptResult(null);
      } else {
        setError("Failed to register service on backend marketplace engine.");
      }
    } catch (err) {
      setError("Server connection failed. Uvicorn must be running on port 8000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSellerAction = async (notifId: string, action: "accept" | "decline") => {
    try {
      const res = await fetch("/api/backend/api/negotiate/seller-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_id: notifId,
          action,
        }),
      });

      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notifId ? { ...n, status: action === "accept" ? "accepted" : "declined" } : n))
        );
      } else {
        console.error("Seller action failed.");
      }
    } catch (err) {
      console.error("Failed to post seller action:", err);
    }
  };

  const handleCertToggle = (cert: string) => {
    setCertifications(prev =>
      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
    );
  };

  const handlePaymentToggle = (term: string) => {
    setAcceptedPaymentTerms(prev =>
      prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]
    );
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const labels = SELL_SERVICE_UNITS[category] || {
    listLabel: "Target Service Rate (INR)",
    floorLabel: "Minimum Acceptable Rate (INR)",
    moqLabel: "Minimum Engagement size",
    maxLabel: "Maximum Capacity Cap",
    stockLabel: "Total Available Capacity Pool"
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-8 py-10 flex flex-col gap-8 select-none">
      {/* Top Welcome Title */}
      <div className="flex justify-between items-center border-b border-[#1E1E1E] pb-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-[12px] font-sans font-bold tracking-[0.18em] uppercase text-[#E5D3B3]">
            Sell Portal & Provider Registry
          </h2>
          <p className="text-[9px] font-sans text-[#8E8E93] uppercase tracking-wider font-semibold">
            Deploy autonomous agent services, optimize negotiation thresholds, and manage inbound buyer contracts.
          </p>
        </div>
        <div className="text-[9px] font-mono text-[#C5A880] uppercase tracking-widest font-bold bg-[#111111] border border-[#1E1E1E] rounded-[4px] px-3 py-1 shadow-sm">
          Node Status: <span className="text-emerald-400">ACTIVE</span>
        </div>
      </div>

      {/* Main Two-Column Overhaul Layout (gap-6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Sourcing Specification Form */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Subnavigation Tabs */}
          <div className="flex border-b border-[#1E1E1E] gap-6 select-none pb-0.5">
            <button
              onClick={() => setActiveTab("register")}
              className={`pb-2.5 text-[10px] font-sans font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === "register"
                  ? "border-[#C5A880] text-[#E5D3B3]"
                  : "border-transparent text-[#8E8E93] hover:text-[#E5D3B3]"
              }`}
            >
              Deploy Service Node
            </button>
            <button
              onClick={() => setActiveTab("nodes")}
              className={`pb-2.5 text-[10px] font-sans font-extrabold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
                activeTab === "nodes"
                  ? "border-[#C5A880] text-[#E5D3B3]"
                  : "border-transparent text-[#8E8E93] hover:text-[#E5D3B3]"
              }`}
            >
              My Active Services ({myServices.length})
            </button>
          </div>

          {activeTab === "register" ? (
            <form 
              onSubmit={handleRegisterService} 
              className="premium-form relative overflow-hidden"
            >
              {/* Service/Company Name */}
              <div className="form-group-spacious">
                <label>
                  Service Provider / Company Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. Apex Software Solutions"
                  className="premium-input"
                />
              </div>

              {/* Category Dropdown Selector */}
              <div className="form-group-spacious relative select-none">
                <label>
                  Service Category Range
                </label>
                <div 
                  onClick={() => setShowCatDropdown(!showCatDropdown)}
                  className="w-full bg-[#050505] border border-[#1C1812] rounded-[4px] py-4 px-5 text-xs text-[#E5D3B3] font-semibold cursor-pointer flex justify-between items-center transition-all duration-300 focus-within:ring-1 focus-within:ring-[#C5A880]/20"
                >
                  <span className="text-[12px] text-[#E5D3B3] font-sans font-bold uppercase tracking-wider">
                    {CATEGORIES.find(c => c.value === category)?.label || "Select Category"}
                  </span>
                  <span className="text-[#C5A880] text-[9px] tracking-widest">{showCatDropdown ? "▲" : "▼"}</span>
                </div>
                
                {showCatDropdown && (
                  <div className="absolute top-[72px] left-0 right-0 z-50 bg-[#050505] border border-[#1C1812] rounded-[4px] shadow-2xl overflow-hidden">
                    <div className="max-h-[220px] overflow-y-auto py-2">
                      {CATEGORIES.map((cat) => (
                        <div 
                          key={cat.value} 
                          onClick={() => {
                            setCategory(cat.value);
                            setShowCatDropdown(false);
                            const defaults = CATEGORY_DEFAULTS[cat.value];
                            if (defaults) {
                              setListPrice(defaults.budget);
                              setFloorPrice(Math.round(defaults.budget * 0.75));
                              setMoq(defaults.moq);
                              setMaxQty(defaults.maxQty);
                              setCurrentStockUnits(defaults.stock);
                            }
                          }}
                          className={`px-5 py-3 text-[10px] font-sans font-bold uppercase tracking-wider text-[#8E8E93] hover:text-[#E5D3B3] hover:bg-white/[0.02] cursor-pointer transition-colors ${
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

              {/* Service Description and OpenAI Optimizer */}
              <div className="form-group-spacious">
                <label>
                  Service Description & Core Competencies
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  placeholder="Describe your service delivery, specialized technologies, and project competencies..."
                  className="w-full bg-[#050505] border border-[#1C1812] rounded-[4px] py-4 px-5 text-xs font-sans text-white/90 focus:outline-none focus:ring-1 focus:ring-[#C5A880]/20 transition-all duration-300 resize-none leading-relaxed"
                />
                
                <button
                  type="button"
                  onClick={handleOptimizeProfile}
                  disabled={isOptimizing}
                  className="text-left text-[9px] font-mono font-bold uppercase tracking-widest text-[#C5A880] hover:text-[#E5D3B3] transition-colors cursor-pointer select-none bg-transparent border-none flex items-center gap-1.5 mt-1"
                >
                  {isOptimizing ? "Running actuary positioning audit..." : "[ACTUARY] Optimize pricing & thresholds (OpenAI)"}
                </button>

                {optResult && (
                  <div className="p-4 bg-[#C5A880]/[0.02] border border-[#C5A880]/15 rounded-[4px] flex flex-col gap-2 font-mono text-[9px] uppercase tracking-wider leading-relaxed text-[#E5D3B3] select-text">
                    <div className="text-[#C5A880] font-bold">[AI AUDIT] Sourcing Threshold Assessment:</div>
                    <div>{optResult.justification}</div>
                    <div className="pt-1.5 border-t border-[#1C1812] text-[8.5px] text-[#8E8675]">
                      Target Pitch: &quot;{optResult.pitch}&quot;
                    </div>
                  </div>
                )}
              </div>

              {/* List and Floor Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group-spacious">
                  <label>
                    {labels.listLabel}
                  </label>
                  <input
                    type="number"
                    value={listPrice}
                    onChange={(e) => setListPrice(Number(e.target.value))}
                    min={1}
                    required
                    className="premium-input"
                  />
                </div>

                <div className="form-group-spacious">
                  <label>
                    {labels.floorLabel}
                  </label>
                  <input
                    type="number"
                    value={floorPrice}
                    onChange={(e) => setFloorPrice(Number(e.target.value))}
                    min={1}
                    required
                    className="premium-input"
                  />
                </div>
              </div>

              {/* MOQ and Max Order Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group-spacious">
                  <label>
                    {labels.moqLabel}
                  </label>
                  <input
                    type="number"
                    value={moq}
                    onChange={(e) => setMoq(Number(e.target.value))}
                    min={1}
                    required
                    className="premium-input"
                  />
                </div>

                <div className="form-group-spacious">
                  <label>
                    {labels.maxLabel}
                  </label>
                  <input
                    type="number"
                    value={maxQty}
                    onChange={(e) => setMaxQty(Number(e.target.value))}
                    min={1}
                    required
                    className="premium-input"
                  />
                </div>
              </div>

              {/* Available Stock/Hours Capacity Pool */}
              <div className="form-group-spacious">
                <label>
                  {labels.stockLabel}
                </label>
                <input
                  type="number"
                  value={currentStockUnits}
                  onChange={(e) => setCurrentStockUnits(Number(e.target.value))}
                  min={1}
                  required
                  className="premium-input"
                />
              </div>

              {/* Quality Grade selection */}
              <div className="form-group-spacious">
                <label>
                  Service Quality Grade
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {QUALITY_GRADES.map(grade => {
                    const isSelected = qualityGrade === grade;
                    return (
                      <button
                        type="button"
                        key={grade}
                        onClick={() => setQualityGrade(grade)}
                        className={`py-3 px-4 text-center text-[9px] uppercase tracking-widest font-extrabold rounded-[4px] border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-[#C5A880] border-[#C5A880] text-[#050505] shadow-md"
                            : "bg-[#050505] border-[#1C1812] text-[#8E8675] hover:text-[#E5D3B3]"
                        }`}
                      >
                        Grade {grade}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Operating Location Hub selector */}
              <div className="form-group-spacious">
                <label>
                  Operating Sourcing Hub Location
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {SOURCING_HUBS.map(hub => {
                    const isSelected = locationState === hub;
                    return (
                      <button
                        type="button"
                        key={hub}
                        onClick={() => setLocationState(hub)}
                        className={`py-3 px-1 text-center text-[9px] uppercase tracking-widest font-extrabold rounded-[4px] border transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? "bg-[#C5A880] border-[#C5A880] text-[#050505]"
                            : "bg-[#050505] border-[#1C1812] text-[#8E8675] hover:text-[#E5D3B3]"
                        }`}
                      >
                        {hub.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Possessed Compliance Certifications */}
              <div className="form-group-spacious">
                <label>
                  Compliance Certifications Possessed
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {CERTIFICATIONS.map(cert => {
                    const isSelected = certifications.includes(cert);
                    return (
                      <button
                        type="button"
                        key={cert}
                        onClick={() => handleCertToggle(cert)}
                        className={`py-2 px-3 text-[9px] font-mono font-bold rounded-[4px] border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-white/[0.04] border-[#C5A880] text-[#C5A880]"
                            : "bg-[#050505] border-[#1C1812] text-[#8E8675] hover:text-white"
                        }`}
                      >
                        {isSelected ? "[SELECTED] " : "[+ ] "} {cert}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accepted Payment Terms */}
              <div className="form-group-spacious">
                <label>
                  Accepted Payment Terms
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PAYMENT_TERMS_OPTIONS.map(term => {
                    const isSelected = acceptedPaymentTerms.includes(term.value);
                    return (
                      <button
                        type="button"
                        key={term.value}
                        onClick={() => handlePaymentToggle(term.value)}
                        className={`py-2 px-3 text-[9px] font-sans font-bold rounded-[4px] border transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-white/[0.04] border-[#C5A880] text-[#C5A880]"
                            : "bg-[#050505] border-[#1C1812] text-[#8E8675] hover:text-white"
                        }`}
                      >
                        {isSelected ? "[SELECTED] " : "[+ ] "} {term.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slider for Maximum Discount percentage allowed */}
              <div className="form-group-spacious">
                <div className="flex justify-between items-baseline">
                  <label>
                    Maximum Negotiation Discount Allowed
                  </label>
                  <span className="font-mono text-xs text-[#C5A880] font-bold">{maxDiscountPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="35"
                  step="0.5"
                  value={maxDiscountPct}
                  onChange={(e) => setMaxDiscountPct(Number(e.target.value))}
                  className="w-full accent-[#C5A880] bg-[#050505] rounded-[4px] cursor-pointer h-1.5"
                />
              </div>

              {/* Delivery limits, Strategy and WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="form-group-spacious">
                  <label>
                    Lead Time setup range (Days)
                  </label>
                  <div className="flex gap-2.5 items-center">
                    <input
                      type="number"
                      value={deliveryMin}
                      onChange={(e) => setDeliveryMin(Number(e.target.value))}
                      min={1}
                      required
                      className="premium-input text-center"
                    />
                    <span className="text-[#8E8675] font-mono text-xs">-</span>
                    <input
                      type="number"
                      value={deliveryMax}
                      onChange={(e) => setDeliveryMax(Number(e.target.value))}
                      min={1}
                      required
                      className="premium-input text-center"
                    />
                  </div>
                </div>

                <div className="form-group-spacious relative">
                  <label>
                    Negotiation Strategy Deck
                  </label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full bg-[#050505] border border-[#1C1812] rounded-[4px] py-4 px-5 text-[11px] font-sans text-[#E5D3B3] font-semibold focus:outline-none cursor-pointer"
                  >
                    {STRATEGIES.map(s => (
                      <option key={s.value} value={s.value} className="bg-[#050505] text-[#E5D3B3] py-2">{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* WhatsApp notification alerts */}
              <div className="form-group-spacious">
                <label>
                  Provider alerts WhatsApp Number
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                  className="premium-input"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4.5 text-center text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-[#050505] bg-[#C5A880] rounded-[4px] transition-all duration-300 hover:bg-[#E5D3B3] active:scale-[0.98] disabled:bg-[#1C1812] disabled:text-[#48484A] cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                {isSubmitting ? "ACTIVATING AUTONOMOUS NODE..." : "DEPLOY PROVIDER NODE IN POOL"}
              </button>

              {/* Messages */}
              {successMsg && (
                <div className="p-4 bg-[#050505] border border-emerald-500/20 rounded-[4px] text-center font-mono text-[9.5px] uppercase text-emerald-400 select-text">
                  {successMsg}
                </div>
              )}
              {error && (
                <div className="p-4 bg-[#050505] border border-red-500/20 rounded-[4px] text-center font-mono text-[9.5px] uppercase text-red-400 select-all">
                  {error}
                </div>
              )}
            </form>
          ) : (
            <div className="flex flex-col gap-6 bg-[#0C0C0C] border border-[#1C1812] rounded-[6px] p-8 min-h-[500px]">
              <h3 className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#E5D3B3] border-b border-[#1E1E1E] pb-3 mb-2">
                ACTIVE PROVIDER NODES Registry
              </h3>
              
              {myServices.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center font-mono text-[9px] text-[#8E8675] uppercase tracking-widest gap-2 min-h-[300px]">
                  <span>☉ Zero active user-deployed service nodes in pool.</span>
                  <button
                    onClick={() => setActiveTab("register")}
                    className="text-[#C5A880] hover:text-[#E5D3B3] transition-colors bg-transparent border-none mt-2 cursor-pointer font-bold uppercase"
                  >
                    Deploy one now →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myServices.map((node, idx) => (
                    <div key={idx} className="p-4 bg-[#0A0A0A] border border-[#1E1E1E] rounded-[4px] flex flex-col gap-3 relative shadow-sm hover:border-[#C5A880]/30 transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-0.5">
                          <h4 className="text-[12px] font-sans font-bold text-[#E5D3B3] tracking-wide">{node.name}</h4>
                          <span className="text-[8px] font-mono text-[#C5A880] uppercase tracking-wider bg-white/[0.02] border border-[#C5A880]/15 rounded-[4px] px-2 py-0.5 w-max mt-1 font-bold">
                            {node.category.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-[#8E8E93] uppercase tracking-widest bg-white/[0.02] px-2 py-0.5 rounded-[4px] font-bold">
                          Rating {node.rating || 5.0}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.03] font-mono text-[9.5px]">
                        <div>
                          <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">List Price</span>
                          <span className="text-white/90 tabular-nums">{formatCurrency(node.list_price_per_unit)}</span>
                        </div>
                        <div>
                          <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Floor Price</span>
                          <span className="text-white/90 tabular-nums">{formatCurrency(node.floor_price_per_unit)}</span>
                        </div>
                        <div>
                          <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Location</span>
                          <span className="text-[#E5D3B3] uppercase tracking-wider font-bold">{node.location_state || "Maharashtra"}</span>
                        </div>
                        <div>
                          <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">MOQ Size</span>
                          <span className="text-white/90 tabular-nums">{node.moq} Units</span>
                        </div>
                        <div>
                          <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Max Cap Limit</span>
                          <span className="text-white/90 tabular-nums">{node.max_order_qty} Units</span>
                        </div>
                        <div>
                          <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Avail Stock Pool</span>
                          <span className="text-[#C5A880] tabular-nums font-bold">{node.current_stock_units} Units</span>
                        </div>
                      </div>

                      {/* Certs and Payment Terms summaries */}
                      <div className="border-t border-[#1E1E1E]/50 pt-2 flex flex-col gap-1.5 text-[8.5px] font-sans text-[#8E8E93]">
                        {node.quality_certifications && node.quality_certifications.length > 0 && (
                          <div className="flex gap-1 items-center">
                            <span className="font-bold uppercase tracking-wider text-[#8E8675]">Certs:</span>
                            <span className="font-mono text-[8px] text-[#E5D3B3]">{node.quality_certifications.join(", ")}</span>
                          </div>
                        )}
                        {node.payment_terms_accepted && node.payment_terms_accepted.length > 0 && (
                          <div className="flex gap-1 items-center">
                            <span className="font-bold uppercase tracking-wider text-[#8E8675]">Payment:</span>
                            <span className="font-mono text-[8px] text-[#E5D3B3] uppercase">{node.payment_terms_accepted.map((t: string) => t.replace(/_/g, " ")).join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Sourcing Notifications Console */}
        <div className="lg:col-span-5 bg-[#111111] border border-[#1E1E1E] rounded-[6px] p-6 flex flex-col justify-between min-h-[560px] shadow-[0_1px_3px_rgba(0,0,0,0.4)] relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A880]/[0.02] rounded-full blur-[80px] pointer-events-none" />

          <div className="flex flex-col gap-1 border-b border-[#1E1E1E] pb-4 mb-4 select-none">
            <h3 className="text-[10px] font-sans font-bold uppercase tracking-[0.15em] text-[#8E8E93]">
              Inbound Buyer Offers & Deal Alerts
            </h3>
            <p className="text-[9px] font-sans text-[#8E8E93] uppercase tracking-wider mt-0.5 font-bold leading-relaxed">
              Accept contracts from parallel sourcing selections or decline unfavorable buyer anchors.
            </p>
          </div>

          {/* List of inbound deals */}
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto max-h-[460px] pr-1.5 select-none">
            {notifications.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center font-mono text-[9px] text-[#8E8675] uppercase tracking-widest min-h-[300px]">
                <span className="animate-pulse">☉ Telemetry channel online...</span>
                <span className="text-[8px] font-semibold text-[#8E8E93]/70 mt-2">Awaiting buyer selection actions from results page.</span>
              </div>
            ) : (
              notifications.map((notif, index) => {
                const isPending = notif.status === "pending";
                const isAccepted = notif.status === "accepted";
                
                return (
                  <div key={index} className="p-4 bg-[#0A0A0A] border border-[#1E1E1E] hover:border-[#C5A880]/20 transition-all rounded-[4px] flex flex-col gap-3 relative overflow-hidden shadow-sm">
                    
                    <div className="absolute top-0 right-0 px-2.5 py-1 text-[7px] font-mono uppercase tracking-widest font-black rounded-bl bg-white/[0.02] border-l border-b border-[#1E1E1E]">
                      {notif.status === "pending" && <span className="text-amber-400">PENDING APPROVAL</span>}
                      {notif.status === "accepted" && <span className="text-emerald-400">CONTRACT ACCEPTED</span>}
                      {notif.status === "declined" && <span className="text-red-400">DEAL DECLINED</span>}
                    </div>

                    <div className="flex flex-col gap-0.5 select-none">
                      <h4 className="text-[11px] font-sans font-bold text-[#E5D3B3] uppercase tracking-wide">
                        Buyer: {notif.buyer_name}
                      </h4>
                      <p className="text-[8px] font-mono text-[#8E8E93] uppercase tracking-wider mt-0.5">
                        Ref: {notif.session_id.substring(0, 8).toUpperCase()} · Rank #{notif.deal_rank}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-b border-[#1E1E1E]/50 pb-2 font-mono text-[10px]">
                      <div>
                        <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Negotiated Price</span>
                        <span className="text-white font-extrabold tabular-nums">{formatCurrency(notif.final_price)}</span>
                      </div>
                      <div>
                        <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Volume Scope</span>
                        <span className="text-white font-extrabold tabular-nums">{notif.quantity} Units</span>
                      </div>
                      <div>
                        <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Total Contract Value</span>
                        <span className="text-[#C5A880] font-black tabular-nums">{formatCurrency(notif.total_value)}</span>
                      </div>
                      <div>
                        <span className="text-[#8E8E93] uppercase text-[7.5px] block font-sans font-bold">Terms Accepted</span>
                        <span className="text-white uppercase font-bold tracking-wide">{notif.payment_term.replace(/_/g, " ")}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    {isPending ? (
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleSellerAction(notif.id, "accept")}
                          className="flex-1 py-2 rounded-[4px] text-center text-[9px] font-sans font-bold uppercase tracking-widest text-[#050505] bg-[#C5A880] hover:bg-[#E5D3B3] transition-all cursor-pointer border border-[#C5A880]"
                        >
                          ✓ Accept Contract
                        </button>
                        <button
                          onClick={() => handleSellerAction(notif.id, "decline")}
                          className="flex-1 py-2 rounded-[4px] text-center text-[9px] font-sans font-bold uppercase tracking-widest text-[#8E8E93] border border-[#1E1E1E] hover:text-white hover:border-[#C5A880]/30 transition-all cursor-pointer bg-transparent"
                        >
                          ✕ Decline Request
                        </button>
                      </div>
                    ) : (
                      <div className="text-[8px] font-mono text-center font-bold tracking-widest text-[#8E8675] uppercase bg-[#0A0A0A] border border-[#1E1E1E]/50 py-2 rounded-[4px]">
                        {isAccepted ? "✔ Escrow unlocked & contract initialized." : "✘ Offer declined by provider node."}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
