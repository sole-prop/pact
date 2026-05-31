"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Shield, Award, Sparkles, Activity, Compass, Zap, Target } from "lucide-react";

export default function LandingPage() {
  const [buyerValue, setBuyerValue] = useState(60);
  const [sellerValue, setSellerValue] = useState(140);
  const [cycle, setCycle] = useState(0);

  // Animate negotiation convergence with spring-like cycle simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCycle((prev) => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cycle === 0) {
      setBuyerValue(60);
      setSellerValue(140);
    } else if (cycle === 1) {
      setBuyerValue(82);
      setSellerValue(118);
    } else if (cycle === 2) {
      setBuyerValue(96);
      setSellerValue(104);
    } else {
      setBuyerValue(100);
      setSellerValue(100);
    }
  }, [cycle]);

  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#0d0d0d] selection:bg-[#4b41e1]/10 selection:text-[#4b41e1] relative overflow-hidden font-sans select-none">
      
      {/* Structural Vertical Grid Alignment Accent */}
      <div className="absolute top-0 bottom-0 left-[6%] w-[1px] bg-[#c4c7c7]/15 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-[6%] w-[1px] bg-[#c4c7c7]/15 pointer-events-none" />

      {/* Premium Stationery Header */}
      <header className="border-b border-[#c4c7c7]/35 px-12 py-5 flex justify-between items-center bg-[#fdf8f8]/80 backdrop-blur-md sticky top-0 z-50 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center gap-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.2rem] bg-[#4b41e1]/5 border border-[#4b41e1]/25 shadow-[0_2px_8px_rgba(75,65,225,0.05)]">
            <svg className="h-4.5 w-4.5 text-[#4b41e1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="font-sans text-[12px] font-bold uppercase tracking-[0.2em] text-[#0d0d0d] leading-none">
            PACT <span className="text-[#444748] font-normal text-[9.5px] tracking-normal lowercase ml-1">v2.0</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/scale"
            className="text-[10px] tracking-[0.15em] uppercase font-bold text-[#4b41e1] hover:text-[#645efb] transition-colors"
          >
            Proof of Scale
          </Link>
          <Link
            href="/dashboard-v2?role=seller"
            className="text-[10px] tracking-[0.1em] uppercase font-semibold text-[#444748] hover:text-[#0d0d0d] transition-colors"
          >
            Seller Node
          </Link>
          <Link
            href="/dashboard-v2?role=buyer"
            className="px-4 py-2 border border-[#0d0d0d] hover:bg-[#0d0d0d] hover:text-white rounded-[0.5rem] text-[10px] tracking-[0.12em] uppercase font-bold transition-all duration-300"
          >
            Enter Operator Workspace
          </Link>
        </div>
      </header>

      {/* Main Premium Hero Section */}
      <main className="max-w-[1440px] mx-auto px-16 pt-24 pb-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero text section */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4b41e1]/5 border border-[#4b41e1]/10 rounded-[0.25rem]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4b41e1] animate-pulse" />
              <span className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#4b41e1]">
                Autonomous B2B Market Engine
              </span>
            </div>

            <h1 className="text-[48px] sm:text-[60px] lg:text-[68px] font-extrabold leading-[1.05] tracking-[-0.04em] text-[#0d0d0d] font-sans">
              Commercial decisions, <br />
              <span className="text-[#4b41e1]">
                made with confidence.
              </span>
            </h1>

            <p className="body-xl text-[#444748] max-w-[480px] font-normal leading-relaxed">
              An autonomous market coordination layer processing thousands of negotiations per second. Rule-based, zero LLM cost per round, engineered for institutional gravity.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto pt-2">
              <Link
                href="/dashboard-v2?role=buyer"
                className="px-8 py-4 bg-[#4b41e1] hover:bg-[#645efb] text-white rounded-[0.5rem] text-[11px] tracking-[0.15em] uppercase font-extrabold transition-all duration-300 flex items-center justify-center gap-3 group shadow-[0_4px_16px_rgba(75,65,225,0.15)]"
              >
                Launch Sourcing Node
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/dashboard-v2?role=seller"
                className="px-8 py-4 bg-transparent border border-[#c4c7c7] hover:border-[#0d0d0d] text-[#444748] hover:text-[#0d0d0d] hover:bg-white rounded-[0.5rem] text-[11px] tracking-[0.15em] uppercase font-bold transition-all duration-300 flex items-center justify-center"
              >
                Access Opportunities
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-[#c4c7c7]/35 w-full max-w-[480px]">
              <div>
                <span className="block text-[24px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter">28,530/s</span>
                <span className="text-[9px] uppercase tracking-wider text-[#444748] font-bold">Throughput Limit</span>
              </div>
              <div>
                <span className="block text-[24px] font-extrabold text-[#4b41e1] font-mono tracking-tighter">₹0.00</span>
                <span className="text-[9px] uppercase tracking-wider text-[#444748] font-bold">Cost Per Round</span>
              </div>
              <div>
                <span className="block text-[24px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter">100%</span>
                <span className="text-[9px] uppercase tracking-wider text-[#444748] font-bold">Deterministic</span>
              </div>
            </div>
          </div>

          {/* Luxury Interactive Visual Area */}
          <div className="lg:col-span-6 flex flex-col gap-6 justify-center relative py-12">
            
            {/* Interactive Convergence Visual */}
            <div className="w-full bg-[#ffffff] border border-[#c4c7c7]/30 rounded-[0.5rem] p-8 relative overflow-hidden flex flex-col justify-between aspect-[4/3] shadow-[0_8px_24px_rgba(0,0,0,0.015)]">
              <div className="flex justify-between items-center pb-4 border-b border-[#c4c7c7]/20">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-[#4b41e1]" />
                  <span className="text-[10px] tracking-[0.15em] uppercase font-bold text-[#0d0d0d]">SAO Real-time Convergence</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-[#4b41e1]/10 rounded-sm border border-[#4b41e1]/20">
                  <span className="text-[9px] font-mono text-[#4b41e1] font-bold">ROUND {cycle + 1}</span>
                </div>
              </div>

              {/* The visual convergence space */}
              <div className="flex-1 flex flex-col justify-center items-center py-6 relative">
                {/* Horizontal scale line */}
                <div className="w-full h-[1px] bg-[#c4c7c7]/40 relative">
                  {/* Agreement zone marker */}
                  <div className="absolute top-1/2 left-[42%] right-[42%] -translate-y-1/2 h-2.5 bg-gradient-to-r from-[#4b41e1]/10 to-[#4b41e1]/15 border border-[#4b41e1]/30 rounded-sm flex items-center justify-center">
                    <span className="text-[7px] text-[#4b41e1] font-bold tracking-[0.1em] uppercase opacity-80">ZONE</span>
                  </div>
                </div>

                {/* Buyer Node */}
                <motion.div
                  animate={{ left: `${buyerValue}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  className="absolute top-[25%] -translate-x-1/2 flex flex-col items-center gap-1 cursor-default"
                >
                  <span className="text-[8px] uppercase tracking-widest text-[#444748] font-bold">BUYER BID</span>
                  <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#4b41e1]/35">
                    <Target className="h-2.5 w-2.5 text-[#4b41e1]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#0d0d0d] tabular-nums">₹{(buyerValue * 1200).toLocaleString()}</span>
                </motion.div>

                {/* Seller Node */}
                <motion.div
                  animate={{ left: `${sellerValue - 40}%` }}
                  transition={{ type: "spring", stiffness: 80, damping: 15 }}
                  className="absolute bottom-[25%] -translate-x-1/2 flex flex-col items-center gap-1 cursor-default"
                >
                  <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-[#0d0d0d]/35">
                    <Zap className="h-2.5 w-2.5 text-[#0d0d0d]" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#4b41e1] tabular-nums">₹{((sellerValue - 40) * 1250).toLocaleString()}</span>
                  <span className="text-[8px] uppercase tracking-widest text-[#444748] font-bold mt-1">SELLER OFFER</span>
                </motion.div>

                {/* Convergence link lines */}
                {cycle === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-[35%] bottom-[35%] w-[1px] bg-dashed border-[#4b41e1]/40"
                  />
                )}
              </div>

              {/* Showcase deal state */}
              <div className="flex justify-between items-center pt-4 border-t border-[#c4c7c7]/20 text-left">
                <div>
                  <span className="block text-[8px] uppercase tracking-[0.1em] text-[#444748] font-bold">Probability Vector</span>
                  <span className="text-[12px] font-mono text-[#0d0d0d] font-bold">
                    {cycle === 0 ? "24%" : cycle === 1 ? "68%" : cycle === 2 ? "89%" : "99.8% Perfect Fit"}
                  </span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase tracking-[0.1em] text-[#444748] font-bold">MCDA Evaluation Score</span>
                  <span className="text-[12px] font-mono text-[#4b41e1] font-bold">
                    {cycle === 0 ? "72.4%" : cycle === 1 ? "84.8%" : cycle === 2 ? "93.1%" : "98.7% Optimal"}
                  </span>
                </div>
              </div>
            </div>

            {/* Float Recommended Outcome Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="absolute -bottom-6 -right-4 w-[280px] bg-white border border-[#4b41e1]/20 hover:border-[#4b41e1]/40 p-5 rounded-[0.5rem] shadow-[0_12px_36px_rgba(0,0,0,0.03)] transition-all duration-300 text-left z-20"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="text-[8px] uppercase tracking-[0.15em] font-extrabold text-[#4b41e1]">MCDA Top Choice</span>
                  <h4 className="text-[12px] font-bold text-[#0d0d0d] tracking-tight mt-0.5">Summit AI Partners</h4>
                </div>
                <div className="p-1.5 bg-[#4b41e1]/5 border border-[#4b41e1]/10 rounded-sm">
                  <Award className="h-3.5 w-3.5 text-[#4b41e1]" />
                </div>
              </div>

              <div className="space-y-2 mb-4 text-left">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#444748] font-medium">Strategic Match</span>
                  <span className="font-mono font-bold text-[#0d0d0d]">98.2%</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#444748] font-medium">Agreement Price</span>
                  <span className="font-mono font-bold text-emerald-600">₹1,05,600</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#444748] font-medium">Delivery Vector</span>
                  <span className="font-mono font-bold text-[#0d0d0d]">2.4 Days</span>
                </div>
              </div>

              <Link
                href="/dashboard-v2?role=buyer"
                className="w-full block py-2.5 bg-[#4b41e1] hover:bg-[#645efb] text-white text-center rounded-[0.25rem] text-[9.5px] tracking-[0.12em] uppercase font-bold transition-all duration-200"
              >
                Sign Off Recommendation
              </Link>
            </motion.div>
          </div>

        </div>

        {/* 4-Step Narrative Section */}
        <section className="mt-44 border-t border-[#c4c7c7]/35 pt-20">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-[#4b41e1]">DOCTRINAL WORKFLOW</span>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[#0d0d0d] mt-3">
              Direct. Autonomous. Decisive.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Requirements",
                desc: "Express high-dimensional commercial terms in pure natural language. Our system maps constraints instantly.",
                icon: Target,
              },
              {
                step: "02",
                title: "Negotiation Center",
                desc: "Sellers auto-negotiate using 6 mathematical algorithms. Game theory secures maximum surplus.",
                icon: Activity,
              },
              {
                step: "03",
                title: "Results Evaluation",
                desc: "Analyse trade-offs across 5 operational dimensions. No spreadsheets or dense tables.",
                icon: Compass,
              },
              {
                step: "04",
                title: "Agreement Room",
                desc: "Consolidate final commercial terms with sovereign cryptographic validity. Sign and execute.",
                icon: Shield,
              },
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="bg-white border border-[#c4c7c7]/35 p-6 rounded-[0.5rem] text-left relative overflow-hidden group hover:border-[#4b41e1]/30 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                  <div className="absolute top-4 right-4 text-[24px] font-mono font-extrabold text-[#c4c7c7]/30 group-hover:text-[#4b41e1]/10 transition-colors">
                    {item.step}
                  </div>
                  <div className="h-8 w-8 rounded bg-[#4b41e1]/5 flex items-center justify-center border border-[#4b41e1]/15 text-[#4b41e1] mb-6">
                    <IconComp className="h-4 w-4" />
                  </div>
                  <h3 className="text-[14px] font-bold text-[#0d0d0d] tracking-tight mb-3 uppercase">{item.title}</h3>
                  <p className="text-[11px] leading-[1.6] text-[#444748]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Final Premium CTA Surface */}
        <section className="mt-36 bg-white border border-[#c4c7c7]/35 rounded-[0.5rem] p-16 text-center relative overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.008)]">
          <div className="absolute inset-0 bg-[#4b41e1]/[0.01] pointer-events-none" />
          <Sparkles className="h-8 w-8 text-[#4b41e1] mx-auto mb-6 opacity-80" />
          
          <h2 className="text-[32px] font-extrabold tracking-tight text-[#0d0d0d] mb-4">
            Re-architect your procurement engine.
          </h2>
          <p className="text-[13px] text-[#444748] max-w-[480px] mx-auto mb-8 leading-[1.6]">
            Unlock lightning-fast commercial negotiations with mathematical strategy nodes. Join the sovereign marketplace today.
          </p>

          <Link
            href="/dashboard-v2?role=buyer"
            className="inline-flex px-8 py-4 bg-[#4b41e1] hover:bg-[#645efb] text-white rounded-[0.5rem] text-[11px] tracking-[0.18em] uppercase font-extrabold transition-all duration-300 items-center gap-3 shadow-[0_4px_16px_rgba(75,65,225,0.15)]"
          >
            Start First Sourcing Deal
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>

      <footer className="border-t border-[#c4c7c7]/30 px-12 py-8 flex flex-col sm:flex-row justify-between items-center relative z-20 text-[#444748] text-[9.5px] tracking-[0.18em] uppercase font-bold">
        <span>© {new Date().getFullYear()} PACT Sovereign OS. All rights reserved.</span>
        <div className="flex gap-6 mt-4 sm:mt-0">
          <span>Engine: SAO Protocol</span>
          <span>Sovereign marketplace</span>
        </div>
      </footer>
    </div>
  );
}
