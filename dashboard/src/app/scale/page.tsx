"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  Shield, Target, Compass, Clock, Activity, ArrowRight, 
  ArrowDown, Award, Zap, Sparkles, Check, TrendingUp, Layers, Cpu 
} from "lucide-react";

// Count-up helper component for premium feel
function CountUp({ end, duration = 2, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const endVal = end;
    const totalTicks = 60 * duration;
    const increment = Math.ceil(endVal / totalTicks);
    let currentTick = 0;

    const timer = setInterval(() => {
      currentTick++;
      start += increment;
      if (start >= endVal || currentTick >= totalTicks) {
        setCount(endVal);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [end, duration]);

  return (
    <span className="font-mono tabular-nums tracking-tighter">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

// Interactive particle flow for Section 2 (thousands of transactions)
function TransactionFlowVisual() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{
      x: number;
      y: number;
      speed: number;
      size: number;
      alpha: number;
      color: string;
      curve: number;
    }> = [];

    // Initialize particles
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 1.5 + Math.random() * 2,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.4,
        color: Math.random() > 0.5 ? "#4b41e1" : "#0d0d0d",
        curve: Math.random() * 2 - 1,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    window.addEventListener("resize", handleResize);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background grid lines (elegant, low opacity)
      ctx.strokeStyle = "rgba(196, 199, 199, 0.15)";
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw elegant center protocol layer representation
      const centerY = height / 2;
      ctx.fillStyle = "rgba(75, 65, 225, 0.03)";
      ctx.fillRect(0, centerY - 30, width, 60);
      ctx.strokeStyle = "rgba(75, 65, 225, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, centerY - 30);
      ctx.lineTo(width, centerY - 30);
      ctx.moveTo(0, centerY + 30);
      ctx.lineTo(width, centerY + 30);
      ctx.stroke();

      // Label core protocol layer
      ctx.font = "700 9px Geist Sans, system-ui, sans-serif";
      ctx.fillStyle = "rgba(75, 65, 225, 0.4)";
      ctx.fillText("PACT SECURE SENTINEL ROUTER", 20, centerY + 4);

      // Draw transaction particles flowing left to right
      particles.forEach((p) => {
        p.x += p.speed;
        p.y += Math.sin(p.x / 40) * p.curve * 0.5;

        // Pull toward central protocol lane
        const targetY = centerY + (Math.sin(p.x / 100) * 15);
        p.y += (targetY - p.y) * 0.05;

        if (p.x > width) {
          p.x = 0;
          p.y = Math.random() * height;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// Live interactive simulation grid of hundreds of simultaneous negotiations (Section 7)
function SwarmNegotiationGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [swarms, setSwarms] = useState<Array<{ id: number; buyer: number; seller: number; status: string; progress: number }>>([]);

  useEffect(() => {
    // Generate 60 parallel negotiations for immersive visual effect
    const initialSwarms = Array.from({ length: 48 }, (_, i) => {
      const initialSeller = 100 + Math.random() * 50;
      const initialBuyer = 60 + Math.random() * 30;
      return {
        id: i,
        seller: initialSeller,
        buyer: initialBuyer,
        status: "NEGOTIATING",
        progress: 0,
      };
    });
    setSwarms(initialSwarms);

    const interval = setInterval(() => {
      setSwarms((prev) =>
        prev.map((s) => {
          if (s.status === "SETTLED") {
            // Restart deal
            return {
              ...s,
              seller: 100 + Math.random() * 50,
              buyer: 60 + Math.random() * 30,
              status: "NEGOTIATING",
              progress: 0,
            };
          }

          // Dynamic game theoretic concession step
          const concession = (s.seller - s.buyer) * 0.15;
          const nextSeller = s.seller - concession * (0.4 + Math.random() * 0.4);
          const nextBuyer = s.buyer + concession * (0.4 + Math.random() * 0.4);
          const gap = nextSeller - nextBuyer;

          const isSettled = gap < 2.0;

          return {
            ...s,
            seller: isSettled ? (nextSeller + nextBuyer) / 2 : nextSeller,
            buyer: isSettled ? (nextSeller + nextBuyer) / 2 : nextBuyer,
            status: isSettled ? "SETTLED" : "NEGOTIATING",
            progress: s.progress + 1,
          };
        })
      );
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3 w-full">
      {swarms.map((s) => (
        <div 
          key={s.id} 
          className={`p-3 border rounded-[0.25rem] transition-all duration-300 flex flex-col justify-between h-[72px] ${
            s.status === "SETTLED" 
              ? "bg-[#4b41e1]/5 border-[#4b41e1]/30 shadow-[0_0_10px_rgba(75,65,225,0.05)]" 
              : "bg-white border-[#c4c7c7]/30"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[7.5px] font-mono tracking-wider text-[#444748]">DEAL #{1000 + s.id}</span>
            <span className={`h-1.5 w-1.5 rounded-full ${s.status === "SETTLED" ? "bg-[#4b41e1] animate-pulse" : "bg-[#c4c7c7]"}`} />
          </div>
          <div className="flex justify-between items-end mt-2">
            <div className="text-left">
              <span className="text-[7px] block uppercase text-[#444748] tracking-widest leading-none">Spread</span>
              <span className="text-[10px] font-mono font-bold text-[#0d0d0d] tabular-nums mt-0.5 block">
                {s.status === "SETTLED" ? "0.0%" : `${((s.seller - s.buyer) / s.seller * 100).toFixed(1)}%`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[7px] block uppercase text-[#444748] tracking-widest leading-none">Value</span>
              <span className="text-[10px] font-mono font-bold text-[#4b41e1] tabular-nums mt-0.5 block">
                ₹{((s.seller + s.buyer) * 10).toFixed(0)}k
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProofOfScalePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-[#fdf8f8] text-[#0d0d0d] selection:bg-[#4b41e1]/10 selection:text-[#4b41e1] relative overflow-hidden font-sans select-none pb-24">
      
      {/* Premium Minimal Header */}
      <header className="border-b border-[#c4c7c7]/30 px-12 py-5 flex justify-between items-center bg-[#fdf8f8]/80 backdrop-blur-md sticky top-0 z-50 max-w-[1440px] mx-auto w-full">
        <div className="flex items-center gap-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[0.2rem] bg-[#4b41e1]/5 border border-[#4b41e1]/25 shadow-[0_2px_8px_rgba(75,65,225,0.05)]">
            <svg className="h-4.5 w-4.5 text-[#4b41e1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <span className="font-sans text-[13px] font-extrabold tracking-[0.2em] text-[#0d0d0d] block leading-none">PACT</span>
            <span className="text-[7px] uppercase tracking-[0.25em] text-[#444748] mt-1 block">Sovereign Protocol Ledger</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/dashboard-v2?role=buyer"
            className="text-[9.5px] tracking-[0.15em] uppercase font-bold text-[#444748] hover:text-[#0d0d0d] transition-colors"
          >
            Buyer Console
          </Link>
          <Link
            href="/dashboard-v2?role=seller"
            className="px-4 py-2 border border-[#0d0d0d] hover:bg-[#0d0d0d] hover:text-white rounded-[0.5rem] text-[9.5px] tracking-[0.15em] uppercase font-bold transition-all duration-300"
          >
            Seller Console
          </Link>
        </div>
      </header>

      {/* SECTION 1: HERO */}
      <section className="min-h-[95vh] flex flex-col justify-center items-start text-left px-16 max-w-[1440px] mx-auto w-full relative">
        <div className="space-y-6 max-w-4xl pt-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#4b41e1]/5 border border-[#4b41e1]/10 rounded-[0.25rem]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4b41e1] animate-pulse" />
            <span className="label-caps text-[9px] text-[#4b41e1] font-bold">Empirical Performance Benchmark</span>
          </div>
          
          <h1 className="display-hero text-[#0d0d0d] tracking-[-0.04em] leading-[1.02] font-sans">
            <span className="block font-mono text-[#4b41e1] text-[130px] leading-none mb-4">
              <CountUp end={302526} duration={2} />
            </span>
            Negotiations Executed <br />
            in just <span className="font-mono font-semibold text-[#4b41e1]">15</span> Seconds
          </h1>

          <p className="body-xl text-[#444748] max-w-xl font-normal pt-4">
            A high-performance technical validation proving the speed, intelligence, and commercial viability of the PACT sovereign B2B negotiation marketplace.
          </p>

          <div className="flex gap-16 pt-16 border-t border-[#c4c7c7]/30 w-full mt-12">
            <div>
              <span className="block text-[32px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter">95.8%</span>
              <span className="label-caps text-[#444748] mt-1 block">Agreement Rate</span>
            </div>
            <div>
              <span className="block text-[32px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter">20,147/s</span>
              <span className="label-caps text-[#444748] mt-1 block">Throughput limit</span>
            </div>
            <div>
              <span className="block text-[32px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter">₹191.3B</span>
              <span className="label-caps text-[#444748] mt-1 block">Commercial Value Negotiated</span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-16 animate-bounce">
          <ArrowDown className="h-4 w-4 text-[#444748]/50" />
        </div>
      </section>

      {/* SECTION 2: COMMERCIAL VALUE CREATED */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full border-t border-[#c4c7c7]/30 bg-[#ffffff] relative z-10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 text-left space-y-6">
            <span className="label-caps text-[#4b41e1] font-bold">Throughput Volume</span>
            <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em] font-sans">
              ₹191.3 Billion Commercial Value Negotiated
            </h2>
            <p className="body-xl text-[#444748]">
              Flowing visualization of B2B transactions simulated and dynamically converged across thousands of commercial endpoints within the PACT sovereign protocol layer.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center items-center relative py-16 bg-[#fdf8f8] border border-[#c4c7c7]/30 rounded-[0.5rem] min-h-[380px] overflow-hidden">
            <TransactionFlowVisual />
            
            <div className="absolute top-6 left-6 z-20 flex gap-2">
              <span className="px-2 py-1 bg-white border border-[#c4c7c7]/40 rounded-[0.25rem] font-mono text-[8px] text-[#444748] tracking-widest uppercase">
                20,147 TX / SEC
              </span>
              <span className="px-2 py-1 bg-[#4b41e1]/10 border border-[#4b41e1]/20 rounded-[0.25rem] font-mono text-[8px] text-[#4b41e1] tracking-widest uppercase font-bold">
                100% FAULT TOLERANT
              </span>
            </div>

            <motion.div 
              animate={{ x: [-20, 20, -20] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="flex gap-4 items-center z-10"
            >
              {[1, 2, 3].map((i) => (
                <div key={i} className="px-5 py-4 bg-white border border-[#c4c7c7]/45 rounded-[0.5rem] flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
                  <Activity className="h-4 w-4 text-[#4b41e1]" />
                  <div className="text-left">
                    <span className="font-mono text-[9px] font-bold text-[#0d0d0d] block">B2B DEED #{4000 + i * 219}</span>
                    <span className="text-[8px] font-mono text-emerald-600 block mt-0.5">₹{(i * 4.8).toFixed(1)}M CONVERGED</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: NEGOTIATION OUTCOMES */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full text-left space-y-16">
        <div className="space-y-3">
          <span className="label-caps text-[#4b41e1] font-bold">Commercial Outcomes at Scale</span>
          <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em]">Absolute Procurement Optimization</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { metric: "289,882", label: "Agreements Reached" },
            { metric: "95.8%", label: "Negotiation Success Rate" },
            { metric: "22.1%", label: "Average Buyer Savings" },
            { metric: "5.3%", label: "Average Discount vs List Price" }
          ].map((item, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="p-8 bg-white border border-[#c4c7c7]/30 rounded-[0.5rem] space-y-3 text-left hover:border-[#4b41e1]/20 transition-all duration-300"
            >
              <span className="block text-[44px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter leading-none">
                {item.metric}
              </span>
              <span className="label-caps text-[#444748] font-bold mt-2 block">{item.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: BUYER IMPACT */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full border-t border-[#c4c7c7]/30 bg-[#ffffff] relative z-10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 text-left space-y-6">
            <span className="label-caps text-[#4b41e1] font-bold">Value Captured for Buyers</span>
            <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em] font-sans">
              22.1% Average Buyer Savings
            </h2>
            <p className="body-xl text-[#444748]">
              Automated negotiation consistently improved commercial outcomes while preserving agreement quality and protecting seller floor boundaries.
            </p>
          </div>

          <div className="lg:col-span-7 p-10 bg-[#fdf8f8] border border-[#c4c7c7]/30 rounded-[0.5rem] space-y-8 text-left">
            <div className="flex justify-between items-center">
              <span className="label-caps text-[#444748]">Buyer Target Budget</span>
              <span className="font-mono font-bold text-[#0d0d0d] text-lg">₹100.00</span>
            </div>
            
            <div className="h-[3px] bg-[#c4c7c7]/40 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ width: "100%" }}
                whileInView={{ width: "77.9%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute left-0 top-0 bottom-0 bg-[#4b41e1]" 
              />
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <span className="label-caps text-[#4b41e1] font-bold">Negotiated Outcome</span>
              <span className="font-mono font-bold text-emerald-600 text-3xl">₹77.90</span>
            </div>

            <div className="border-t border-[#c4c7c7]/20 pt-8 mt-6">
              <span className="text-[10px] label-caps text-[#444748] tracking-widest block mb-1">Approximate Buyer Value Created</span>
              <span className="block text-[44px] font-extrabold text-[#4b41e1] font-mono tracking-tighter leading-none">
                ₹42+ Billion
              </span>
              <span className="text-[11px] text-[#444748] mt-2 block">in absolute negotiated savings across simulation space.</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: NEGOTIATION STRATEGY INTELLIGENCE */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full text-left space-y-16">
        <div className="space-y-3">
          <span className="label-caps text-[#4b41e1] font-bold">Autonomous Tactics</span>
          <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em]">Negotiation Strategy Intelligence</h2>
          <p className="body-xl text-[#444748] max-w-2xl mt-4">
            PACT executes multi-agent dynamic concession patterns. Not basic lead routing, not price matching—this is true game-theoretic commercial negotiation.
          </p>
        </div>

        {/* Dynamic Concession Visual Graph */}
        <div className="p-10 bg-white border border-[#c4c7c7]/30 rounded-[0.5rem] space-y-6">
          <div className="flex justify-between items-center border-b border-[#c4c7c7]/20 pb-4">
            <span className="label-caps text-[#0d0d0d] font-bold">Multi-Agent Strategy Concessions Over Time</span>
            <span className="font-mono text-xs text-[#444748]">CONVERGENCE IN 6 ROUNDS</span>
          </div>

          <div className="h-[240px] w-full relative flex items-center justify-center">
            {/* Elegant SVG grid representation of concession lines */}
            <svg className="w-full h-full" viewBox="0 0 800 240" fill="none">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="800" y2="40" stroke="rgba(196, 199, 199, 0.2)" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="800" y2="120" stroke="rgba(196, 199, 199, 0.2)" strokeDasharray="4 4" />
              <line x1="0" y1="200" x2="800" y2="200" stroke="rgba(196, 199, 199, 0.2)" strokeDasharray="4 4" />
              
              {/* Seller Concession Path (Realistic Strategy) */}
              <motion.path 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M 50 40 Q 250 50, 450 110 T 750 120" 
                stroke="#4b41e1" 
                strokeWidth="2.5" 
              />

              {/* Buyer Concession Path (Adaptive Strategy) */}
              <motion.path 
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 2, ease: "easeInOut" }}
                d="M 50 200 Q 250 190, 450 130 T 750 120" 
                stroke="#0d0d0d" 
                strokeWidth="2.5" 
              />

              {/* Convergence Zone Highlight */}
              <circle cx="750" cy="120" r="6" fill="#4b41e1" className="animate-ping" />
              <circle cx="750" cy="120" r="4" fill="#4b41e1" />
            </svg>

            <div className="absolute left-8 top-6">
              <span className="text-[9px] label-caps text-[#4b41e1] font-bold">Seller Starting Ask (₹15,000)</span>
            </div>
            <div className="absolute left-8 bottom-6">
              <span className="text-[9px] label-caps text-[#0d0d0d] font-bold">Buyer Target (₹10,500)</span>
            </div>
            <div className="absolute right-12 top-[44%]">
              <span className="text-[9px] label-caps text-emerald-600 font-extrabold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                AGREEMENT AREA ACHIEVED (₹12,420)
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pt-8">
          {[
            { name: "Conceder", role: "Dynamic Concession Slide" },
            { name: "Tit-for-Tat", role: "Reciprocal Mirroring" },
            { name: "Balanced", role: "Optimal Mutual Surplus" },
            { name: "Relationship Driven", role: "Long-term Value Guard" },
            { name: "Adaptive", role: "Dynamic Floor Adjustment" }
          ].map((strat, idx) => (
            <div key={idx} className="p-6 bg-white border border-[#c4c7c7]/30 rounded-[0.5rem] text-left">
              <span className="h-6 w-6 rounded-full bg-[#4b41e1]/5 flex items-center justify-center text-[#4b41e1] font-bold text-xs mb-4">
                {idx + 1}
              </span>
              <span className="block text-[14px] font-bold text-[#0d0d0d] tracking-tight uppercase">{strat.name}</span>
              <span className="text-[10px] text-[#444748] mt-1 block">{strat.role}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 6: RECOVERED COMMERCIAL OPPORTUNITIES */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full border-t border-[#c4c7c7]/30 bg-[#ffffff] relative z-10 shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <div className="lg:col-span-5 text-left space-y-6">
            <span className="label-caps text-[#4b41e1] font-bold">Recovered Commercial Opportunities</span>
            <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em] font-sans">
              37,893 MOQ Waivers Granted
            </h2>
            <p className="body-xl text-[#444748]">
              Automated pooling, partial fulfillment, and intelligent negotiation logic enabled thousands of transactions that would traditionally fail under rigid procurement workflows.
            </p>
          </div>

          <div className="lg:col-span-7 flex flex-col justify-center items-center py-16 bg-[#fdf8f8] border border-[#c4c7c7]/30 rounded-[0.5rem] min-h-[300px] relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
              backgroundImage: "radial-gradient(circle, #4b41e1 15%, transparent 15.5%)",
              backgroundSize: "20px 20px"
            }} />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="p-8 bg-white border border-emerald-500/25 rounded-[0.5rem] flex items-center gap-5 shadow-[0_6px_20px_rgba(16,185,129,0.04)] max-w-md z-10"
            >
              <div className="h-12 w-12 bg-emerald-50/80 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600">
                <Check className="h-6 w-6" />
              </div>
              <div className="text-left">
                <span className="label-caps text-emerald-600 font-bold text-[10px] tracking-widest block">DEADLOCK WAIVED</span>
                <span className="text-[13px] font-bold text-[#0d0d0d] mt-1 block">Minimum Order Quantity Waived</span>
                <span className="text-[11px] text-[#444748] mt-1 block">Dynamic multi-seller bundle matching completed successfully.</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 7: NEGOTIATION REPLAY VISUALIZATION */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full text-left space-y-16">
        <div className="space-y-4">
          <span className="label-caps text-[#4b41e1] font-bold">Immersive Trajectory Stream</span>
          <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em]">Negotiation Replay Simulation</h2>
          <p className="body-xl text-[#444748] max-w-2xl">
            Watch hundreds of distinct procurement negotiations converge simultaneously in real time. Dynamic concessions auto-align according to custom seller margins.
          </p>
        </div>

        {/* Live Swarm Negotiation Grid */}
        <SwarmNegotiationGrid />
      </section>

      {/* SECTION 8: SCALABILITY VALIDATION */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full border-t border-[#c4c7c7]/30 bg-[#ffffff] relative z-10 shadow-[0_1px_3px_rgba(0,0,0,0.01)] text-left space-y-16">
        <div className="space-y-3">
          <span className="label-caps text-[#4b41e1] font-bold">Stress Test Parameters</span>
          <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em]">Scalability Validation</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { value: "500,000", label: "Simulated Buyers" },
            { value: "100", label: "Sellers Per Category" },
            { value: "50 Million", label: "Potential Negotiation Paths" },
            { value: "10", label: "Commercial Categories" },
            { value: "302,526", label: "Negotiations Completed" },
            { value: "15-Second", label: "Execution Window" }
          ].map((item, idx) => (
            <div key={idx} className="p-8 bg-[#fdf8f8] border border-[#c4c7c7]/30 rounded-[0.5rem] text-left hover:border-[#4b41e1]/20 transition-all duration-300">
              <span className="block text-[36px] font-extrabold text-[#0d0d0d] font-mono tracking-tighter leading-none">
                {item.value}
              </span>
              <span className="label-caps text-[#444748] mt-2 block">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: ENGINE PERFORMANCE */}
      <section className="py-36 px-16 max-w-[1440px] mx-auto w-full text-left space-y-16">
        <div className="space-y-3">
          <span className="label-caps text-[#444748] block">Technical Validation Layer</span>
          <h2 className="headline-md text-[#0d0d0d] tracking-[-0.02em]">Execution Performance</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {[
            { val: "20,147/s", label: "Throughput Limit" },
            { val: "302,526", label: "Negotiations Completed" },
            { val: "15.02s", label: "Execution Runtime" },
            { val: "Zero", label: "Transaction Corruption" },
            { val: "Safe", label: "Dispatcher Shutdown" },
            { val: "Consistent", label: "State Integrity" }
          ].map((item, idx) => (
            <div key={idx} className="border-l border-[#c4c7c7]/30 pl-6">
              <span className="block text-[28px] font-extrabold text-[#0d0d0d] font-mono tracking-tight">{item.val}</span>
              <span className="label-caps text-[#444748] mt-1.5 block">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10: FINAL VERDICT */}
      <section className="py-32 px-16 max-w-[1440px] mx-auto w-full border-t border-[#c4c7c7]/30 bg-[#0d0d0d] text-white rounded-[0.5rem] text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#4b41e1]/5 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-12 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4b41e1]/10 border border-[#4b41e1]/30 mx-auto text-[#4b41e1] shadow-[0_0_20px_rgba(75,65,225,0.15)]">
            <Sparkles className="h-6 w-6" />
          </div>
          
          <h2 className="text-[48px] font-extrabold tracking-[-0.03em] leading-[1.1] text-white font-sans">
            Validated at Scale
          </h2>

          <p className="text-[15px] text-[#8e8e93] max-w-xl mx-auto leading-relaxed">
            All system processes completed successfully. PACT successfully executed 302,526 negotiations in 15 seconds, securing ₹191.3B commercial value without data loss or downtime.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 py-12 border-y border-white/10 w-full text-left">
            <div>
              <span className="text-[20px] font-bold font-mono text-[#4b41e1]">302,526</span>
              <span className="text-[9px] label-caps text-white/50 mt-1 block">Negotiations</span>
            </div>
            <div>
              <span className="text-[20px] font-bold font-mono text-[#4b41e1]">289,882</span>
              <span className="text-[9px] label-caps text-white/50 mt-1 block">Agreements</span>
            </div>
            <div>
              <span className="text-[20px] font-bold font-mono text-emerald-400">₹191.3B</span>
              <span className="text-[9px] label-caps text-white/50 mt-1 block">Value Negotiated</span>
            </div>
            <div>
              <span className="text-[20px] font-bold font-mono text-emerald-400">22.1%</span>
              <span className="text-[9px] label-caps text-white/50 mt-1 block">Buyer Savings</span>
            </div>
            <div>
              <span className="text-[20px] font-bold font-mono text-white">37,893</span>
              <span className="text-[9px] label-caps text-white/50 mt-1 block">MOQ Recoveries</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-12 pt-8 w-full">
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <span className="text-[8px] label-caps text-[#8e8e93] tracking-widest block mb-2">PROTOCOL INTEGRITY DECREE</span>
              <div className="flex gap-4">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8e8e93] block">SCALABILITY</span>
                  <span className="text-[12px] font-mono font-extrabold text-emerald-400 mt-0.5 block">PASS</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8e8e93] block">QUALITY</span>
                  <span className="text-[12px] font-mono font-extrabold text-emerald-400 mt-0.5 block">PASS</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8e8e93] block">IMPACT</span>
                  <span className="text-[12px] font-mono font-extrabold text-emerald-400 mt-0.5 block">PASS</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#8e8e93] block">INTEGRITY</span>
                  <span className="text-[12px] font-mono font-extrabold text-emerald-400 mt-0.5 block">PASS</span>
                </div>
              </div>
            </div>

            {/* Premium Animated Seal */}
            <div className="px-6 py-4 border border-[#4b41e1]/30 rounded-[0.5rem] bg-[#4b41e1]/5 flex flex-col items-center">
              <Award className="h-6 w-6 text-[#4b41e1] mb-2" />
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-white font-sans">PACT NEGOTIATION ENGINE</span>
              <span className="text-[7.5px] tracking-[0.25em] uppercase text-[#8e8e93] mt-1 font-sans">EMPIRICALLY VALIDATED AT SCALE</span>
            </div>
          </div>

          <div className="pt-12">
            <Link
              href="/dashboard-v2?role=buyer"
              className="inline-flex px-8 py-4 bg-white text-[#0d0d0d] hover:bg-[#4b41e1] hover:text-white rounded-[0.5rem] text-[10px] tracking-[0.18em] uppercase font-bold transition-all duration-300 items-center gap-3 cursor-pointer"
            >
              Enter Sourcing Workspace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
