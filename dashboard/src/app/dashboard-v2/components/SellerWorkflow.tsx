"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sliders, ArrowUpRight, Check, Activity, Target, Shield, Clock, Compass, Sparkles, Plus, Award } from "lucide-react";
import { LatestReport } from "@/types/pact";

interface SellerWorkflowProps {
  report: LatestReport | null;
}

export function SellerWorkflow({ report }: SellerWorkflowProps) {
  // Concession parameters
  const [markupMultiplier, setMarkupMultiplier] = useState(1.02);
  const [concessionPace, setConcessionPace] = useState(12);

  // Core view state
  const [sellerView, setSellerView] = useState<"overview" | "negotiate" | "detail" | "add-service">("overview");
  const [selectedOpportunity, setSelectedOpportunity] = useState<any>(null);
  const [chosenStrategy, setChosenStrategy] = useState("realistic");

  // Listing creation form state
  const [newServiceName, setNewServiceName] = useState("Scale Design Node");
  const [newServiceCategory, setNewServiceCategory] = useState("Design & Branding");
  const [newServiceRate, setNewServiceRate] = useState(125000);
  const [newServiceDuration, setNewServiceDuration] = useState("4 Weeks");

  // Local state for listings
  const [myListings, setMyListings] = useState([
    { id: "LST-001", name: "Premium SaaS Consulting", category: "SaaS Consulting", rate: 85000, duration: "6 Weeks" },
    { id: "LST-002", name: "Next.js Core Architecture", category: "AI Development", rate: 140000, duration: "8 Weeks" }
  ]);

  // Recommended opportunities
  const [opportunities, setOpportunities] = useState([
    {
      id: "OPP-3904",
      buyer: "Vercel Partner Node",
      category: "AI Development",
      duration: "4 Weeks",
      targetPrice: 110000,
      confidence: "98.4%",
      urgency: "critical",
    },
    {
      id: "OPP-1102",
      buyer: "Supabase Corp Services",
      category: "SaaS Consulting",
      duration: "8 Weeks",
      targetPrice: 75000,
      confidence: "92.1%",
      urgency: "high",
    },
    {
      id: "OPP-0822",
      buyer: "Framer Labs Node",
      category: "Design & Branding",
      duration: "6 Weeks",
      targetPrice: 42000,
      confidence: "87.5%",
      urgency: "medium",
    },
  ]);

  // Active negotiations
  const activeNegotiations = [
    {
      id: "NEG-9840",
      buyer: "Linear App OS",
      category: "Cloud Engineering",
      duration: "12 Weeks",
      currentOffer: 88500,
      buyerBid: 82000,
      convergence: "89.2%",
      strategy: "Tit-For-Tat",
    },
    {
      id: "NEG-1830",
      buyer: "Attio CRM Services",
      category: "HR Advisory",
      duration: "4 Weeks",
      currentOffer: 15400,
      buyerBid: 14200,
      convergence: "78.4%",
      strategy: "Realistic Balance",
    },
  ];

  // Signed contracts
  const signedAgreements = [
    {
      id: "AGR-1002",
      buyer: "Stripe Payment Node",
      category: "Legal Advisory",
      duration: "2 Weeks",
      settledPrice: 12400,
      date: "2026-05-31",
    },
  ];

  const categories = [
    "AI Development",
    "Design & Branding",
    "SaaS Consulting",
    "Cloud Engineering",
    "Content Marketing",
    "Financial Audit",
    "HR Advisory",
    "Legal Advisory"
  ];

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = "LST-" + Math.floor(Math.random() * 900 + 100);
    const newService = {
      id: newId,
      name: newServiceName,
      category: newServiceCategory,
      rate: newServiceRate,
      duration: newServiceDuration
    };

    setMyListings([newService, ...myListings]);

    // Intelligently auto-generate a matching buyer opportunity based on listed service to demonstrate autonomous matching
    const newOpp = {
      id: "OPP-" + Math.floor(Math.random() * 9000 + 1000),
      buyer: "Mercury Capital Node",
      category: newServiceCategory,
      duration: newServiceDuration,
      targetPrice: newServiceRate * 0.92,
      confidence: "99.1%",
      urgency: "critical"
    };
    setOpportunities([newOpp, ...opportunities]);

    setSellerView("overview");
  };

  const handleLaunchOpportunity = (opp: any) => {
    setSelectedOpportunity(opp);
    setSellerView("detail");
  };

  return (
    <div className="space-y-12 w-full max-w-[1200px] mx-auto select-none text-left pt-2 pb-24 relative z-10 font-sans">
      
      {/* Title Header */}
      <div className="flex justify-between items-end border-b border-[#c4c7c7]/30 pb-6">
        <div>
          <span className="label-caps text-[#444748] block">FLEET CONTROL</span>
          <h2 className="section-header text-[#0d0d0d] mt-2 font-sans">Seller Workspace</h2>
        </div>

        {sellerView !== "overview" && (
          <button 
            onClick={() => setSellerView("overview")}
            className="px-4 py-2 border border-[#c4c7c7] hover:border-[#4b41e1] text-[#0d0d0d] text-[10px] tracking-wider uppercase font-bold rounded-[0.5rem] transition-colors cursor-pointer"
          >
            ← Back to Fleet Summary
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {sellerView === "overview" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start"
          >
            
            {/* Left 8 Columns */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* SECTION: MY LISTED SERVICES */}
              <div className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex justify-between items-center border-b border-[#c4c7c7]/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-[#4b41e1]" />
                    <span className="label-caps text-[#0d0d0d]">My Listed Services Node</span>
                  </div>
                  <button 
                    onClick={() => setSellerView("add-service")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#0d0d0d] hover:bg-[#232323] text-white text-[9px] tracking-wider uppercase font-extrabold rounded-[0.5rem] transition-all duration-300 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" /> List Service
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {myListings.map((lst) => (
                    <motion.div 
                      key={lst.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-5 bg-[#fdf8f8] border border-[#c4c7c7]/30 rounded-[0.5rem] text-left flex flex-col justify-between min-h-[140px] transition-all duration-300"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="label-caps text-[#444748] block">{lst.category}</span>
                          <h4 className="text-[13px] font-bold text-[#0d0d0d] tracking-tight mt-1">{lst.name}</h4>
                        </div>
                        <span className="font-mono text-[9px] text-[#444748]">{lst.id}</span>
                      </div>

                      <div className="flex justify-between items-end border-t border-[#c4c7c7]/20 pt-4 mt-4">
                        <div>
                          <span className="block text-[8px] uppercase tracking-wider text-[#444748]">Contract Rate</span>
                          <span className="text-[14px] font-bold font-mono text-[#4b41e1]">${lst.rate.toLocaleString()}</span>
                        </div>
                        <span className="text-[9px] font-semibold text-[#444748] uppercase">{lst.duration}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* RECOMMENDED OPPORTUNITIES */}
              <div className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 border-b border-[#c4c7c7]/20 pb-4">
                  <Target className="h-4.5 w-4.5 text-[#4b41e1]" />
                  <span className="label-caps text-[#0d0d0d]">Matching Buyer RFP Opportunities</span>
                </div>

                <div className="space-y-4">
                  {opportunities.map((opp) => (
                    <motion.div 
                      key={opp.id}
                      whileHover={{ x: 4 }}
                      onClick={() => handleLaunchOpportunity(opp)}
                      className="flex items-center justify-between p-4 hover:bg-[#fdf8f8] border border-transparent hover:border-[#c4c7c7]/30 rounded-sm transition-all duration-300 cursor-pointer"
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-[13px] font-bold text-[#0d0d0d] block">{opp.buyer}</span>
                        <span className="text-[11px] text-[#444748] block font-sans">
                          Service Needed: {opp.category} • Target Budget: ${opp.targetPrice.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="block text-[8px] uppercase tracking-wider text-[#444748]">Matching Score</span>
                          <span className="text-[12px] font-mono font-bold text-[#4b41e1]">{opp.confidence}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#444748]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* ACTIVE NEGOTIATIONS */}
              <div className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 border-b border-[#c4c7c7]/20 pb-4">
                  <Activity className="h-4.5 w-4.5 text-[#4b41e1]" />
                  <span className="label-caps text-[#0d0d0d]">Active Bidding Loops</span>
                </div>

                <div className="space-y-4">
                  {activeNegotiations.map((neg) => (
                    <motion.div 
                      key={neg.id}
                      whileHover={{ x: 4 }}
                      onClick={() => {
                        setSelectedOpportunity(neg);
                        setSellerView("negotiate");
                      }}
                      className="flex items-center justify-between p-4 hover:bg-[#fdf8f8] border border-transparent hover:border-[#c4c7c7]/30 rounded-sm transition-all duration-300 cursor-pointer"
                    >
                      <div className="space-y-1 text-left">
                        <span className="text-[13px] font-bold text-[#0d0d0d] block">{neg.buyer}</span>
                        <span className="text-[11px] text-[#444748] block">
                          Duration: {neg.duration} • Method: {neg.strategy}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="block text-[8px] uppercase tracking-wider text-[#444748]">Convergence Vector</span>
                          <span className="text-[12px] font-mono font-bold text-emerald-600">{neg.convergence}</span>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#444748]" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right 4 Columns */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-8">
              <div className="bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 border-b border-[#c4c7c7]/20 pb-4">
                  <Sliders className="h-4 w-4 text-[#4b41e1]" />
                  <span className="label-caps text-[#0d0d0d]">Bidding Directives</span>
                </div>

                <p className="text-[11px] leading-[1.6] text-[#444748] text-left font-sans">
                  Apply global algorithmic parameters to active loops in parallel.
                </p>

                <div className="space-y-5 pt-2">
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-[11px] font-bold text-[#444748] uppercase">
                      <span>Reserve Markup</span>
                      <span className="text-[#4b41e1] font-mono">
                        {(markupMultiplier >= 1.0 ? "+" : "") + ((markupMultiplier - 1.0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.95"
                      max="1.15"
                      step="0.005"
                      value={markupMultiplier}
                      onChange={(e) => setMarkupMultiplier(Number(e.target.value))}
                      className="w-full h-1 bg-[#fdf8f8] rounded-full appearance-none cursor-pointer accent-[#4b41e1]"
                    />
                  </div>

                  <div className="space-y-2 text-left">
                    <div className="flex justify-between text-[11px] font-bold text-[#444748] uppercase">
                      <span>Concession Slope</span>
                      <span className="text-[#4b41e1] font-mono">{concessionPace}% / round</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="30"
                      step="1"
                      value={concessionPace}
                      onChange={(e) => setConcessionPace(Number(e.target.value))}
                      className="w-full h-1 bg-[#fdf8f8] rounded-full appearance-none cursor-pointer accent-[#4b41e1]"
                    />
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* LIST SERVICE VIEW */}
        {sellerView === "add-service" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-[640px] mx-auto bg-[#ffffff] border border-[#c4c7c7]/30 p-8 rounded-[0.5rem] space-y-8 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="border-b border-[#c4c7c7]/20 pb-4">
              <span className="label-caps text-[#4b41e1]">Create Listing</span>
              <h3 className="section-header text-[#0d0d0d] mt-1.5">List New Service Node</h3>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="label-caps text-[#444748]">Service Name</label>
                <input
                  type="text"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  className="w-full bg-[#fdf8f8] border-b border-[#c4c7c7] px-4 py-3 font-sans text-xs text-[#0d0d0d] focus:outline-none focus:border-[#4b41e1] rounded-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="label-caps text-[#444748]">Classification</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full bg-[#fdf8f8] border-b border-[#c4c7c7] px-3 py-3 font-sans text-xs text-[#0d0d0d] focus:outline-none focus:border-[#4b41e1] rounded-sm cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="label-caps text-[#444748]">Target Valuation ($)</label>
                  <input
                    type="number"
                    value={newServiceRate}
                    onChange={(e) => setNewServiceRate(Number(e.target.value))}
                    className="w-full bg-[#fdf8f8] border-b border-[#c4c7c7] px-4 py-3 font-sans text-xs text-[#0d0d0d] focus:outline-none focus:border-[#4b41e1] rounded-sm"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="label-caps text-[#444748]">Duration Target</label>
                <input
                  type="text"
                  value={newServiceDuration}
                  onChange={(e) => setNewServiceDuration(e.target.value)}
                  placeholder="e.g. 6 Weeks"
                  className="w-full bg-[#fdf8f8] border-b border-[#c4c7c7] px-4 py-3 font-sans text-xs text-[#0d0d0d] focus:outline-none focus:border-[#4b41e1] rounded-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#0d0d0d] hover:bg-[#232323] text-white text-[11px] tracking-[0.15em] uppercase font-bold rounded-[0.5rem] transition-all duration-300 cursor-pointer"
              >
                Publish Service Listing
              </button>
            </form>
          </motion.div>
        )}

        {/* Opportunity Detail View */}
        {sellerView === "detail" && selectedOpportunity && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-[760px] mx-auto bg-[#ffffff] border border-[#c4c7c7]/30 p-10 rounded-[0.5rem] space-y-8"
          >
            <div className="border-b border-[#c4c7c7]/20 pb-6 flex justify-between items-start text-left">
              <div>
                <span className="label-caps text-[#4b41e1]">Active RFP Match</span>
                <h3 className="section-header text-[#0d0d0d] mt-1">{selectedOpportunity.buyer}</h3>
              </div>
              <span className="px-2.5 py-1 bg-red-500/10 text-red-600 text-[8px] font-extrabold uppercase tracking-wider rounded-sm">
                {selectedOpportunity.urgency} URGENCY
              </span>
            </div>

            <div className="grid grid-cols-2 gap-8 text-left py-4 border-b border-[#c4c7c7]/20">
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#444748] font-bold">Category</span>
                <span className="text-[14px] font-bold text-[#0d0d0d] mt-1 block">{selectedOpportunity.category}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#444748] font-bold">Project Duration</span>
                <span className="text-[14px] font-bold font-mono text-[#0d0d0d] mt-1 block">{selectedOpportunity.duration}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#444748] font-bold">Target Budget</span>
                <span className="text-[14px] font-bold font-mono text-[#4b41e1] mt-1 block">${selectedOpportunity.targetPrice.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-[8px] uppercase tracking-wider text-[#444748] font-bold">MCDA Confidence Rating</span>
                <span className="text-[14px] font-bold font-mono text-emerald-600 mt-1 block">{selectedOpportunity.confidence} Fit</span>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <span className="label-caps text-[#444748] block">Concessional Game Strategy</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    value: "realistic",
                    label: "Realistic Concession",
                    desc: "Optimal balanced path ensuring high probability match.",
                  },
                  {
                    value: "boulware",
                    label: "Boulware Rigid",
                    desc: "Sustains high starting price, slow concessions.",
                  },
                  {
                    value: "tit_for_tat",
                    label: "Tit-For-Tat Swarm",
                    desc: "Mirrors buyer adjustments mathematically.",
                  },
                ].map((strat) => (
                  <div
                    key={strat.value}
                    onClick={() => setChosenStrategy(strat.value)}
                    className={`bg-[#fdf8f8] border p-4 rounded-sm transition-all duration-300 cursor-pointer text-left ${
                      chosenStrategy === strat.value ? "border-[#4b41e1] bg-[#4b41e1]/[0.01]" : "border-[#c4c7c7]/30 hover:border-[#4b41e1]"
                    }`}
                  >
                    <span className="text-[11px] font-bold text-[#0d0d0d] uppercase tracking-tight block">{strat.label}</span>
                    <p className="text-[9px] leading-[1.4] text-[#444748] mt-2">{strat.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSellerView("overview");
              }}
              className="w-full py-4 bg-[#0d0d0d] hover:bg-[#232323] text-white text-[10px] tracking-[0.15em] uppercase font-bold rounded-[0.5rem] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              Deploy Bidding Node Swarm
            </button>
          </motion.div>
        )}

        {/* Bidding Negotiation Workspace */}
        {sellerView === "negotiate" && selectedOpportunity && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-[800px] mx-auto bg-[#ffffff] border border-[#c4c7c7]/30 p-10 rounded-sm space-y-8 text-left shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <div className="border-b border-[#c4c7c7]/20 pb-6 flex justify-between items-start">
              <div>
                <span className="label-caps text-[#4b41e1]">Algorithmic Concessions</span>
                <h3 className="section-header text-[#0d0d0d] mt-1">{selectedOpportunity.buyer}</h3>
              </div>
              <span className="px-3 py-1 bg-[#4b41e1]/10 text-[#4b41e1] border border-[#4b41e1]/20 text-[9px] uppercase font-bold tracking-wider rounded-sm">
                ROUND 4 CONVERGENCE
              </span>
            </div>

            <div className="p-6 bg-[#fdf8f8] border border-[#c4c7c7]/30 rounded-sm space-y-6">
              <span className="label-caps text-[#444748] block">Live Convergence Chart</span>
              
              <div className="h-20 flex items-center relative">
                <div className="w-full h-[1px] bg-[#c4c7c7]/60 relative">
                  <div className="absolute top-1/2 left-[30%] -translate-y-1/2 h-3 w-[1px] bg-red-400" />
                  <div className="absolute top-1/2 left-[75%] -translate-y-1/2 h-3 w-[1px] bg-[#4b41e1]" />
                  <div className="absolute top-1/2 left-[30%] right-[25%] -translate-y-1/2 h-2 bg-gradient-to-r from-red-500/20 to-[#4b41e1]/20 rounded-sm" />
                </div>
                
                <span className="absolute left-[30%] -top-4 -translate-x-1/2 text-[9px] font-mono text-red-500 font-bold">Buyer Bid: ${selectedOpportunity.buyerBid.toLocaleString()}</span>
                <span className="absolute left-[75%] -bottom-4 -translate-x-1/2 text-[9px] font-mono text-[#4b41e1] font-bold">Your Offer: ${selectedOpportunity.currentOffer.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4">
              <button
                onClick={() => setSellerView("overview")}
                className="py-3 border border-[#4b41e1] hover:bg-[#4b41e1] hover:text-white text-[#4b41e1] text-[9px] tracking-wider uppercase font-bold text-center rounded-[0.5rem] transition-all duration-300 cursor-pointer"
              >
                Concede Term & Sign Agreement
              </button>
              <button
                onClick={() => setSellerView("overview")}
                className="py-3 border border-[#c4c7c7] hover:border-[#ba1a1a] text-[#444748] hover:text-[#ba1a1a] text-[9px] tracking-wider uppercase font-bold text-center rounded-[0.5rem] transition-all duration-300 cursor-pointer"
              >
                Reject & Close Loop
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
