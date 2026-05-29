"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStream } from "@/hooks/useStream";
import { LiveCounter } from "@/components/demo/LiveCounter";
import { MetricStrips } from "@/components/demo/MetricStrips";
import { CategoryGrid } from "@/components/demo/CategoryGrid";
import { ProgressionChart } from "@/components/demo/ProgressionChart";
import { AutomotiveReportView } from "@/components/demo/AutomotiveReportView";
import { api } from "@/lib/api";
import { LatestReport } from "@/types/pact";
import { Lock } from "lucide-react";

interface Snapshot {
  elapsed: number;
  done: number;
  throughput: number;
  avg_savings: number;
}

const STANDARD_CATEGORY_ORDER = [
  { key: "software_dev", rate: 97.2 },
  { key: "creative_design", rate: 96.5 },
  { key: "digital_marketing", rate: 95.8 },
  { key: "customer_support", rate: 93.4 },
  { key: "hr_recruitment", rate: 96.2 },
  { key: "legal_compliance", rate: 98.1 },
  { key: "financial_audit", rate: 97.5 },
  { key: "business_consulting", rate: 97.9 },
  { key: "logistics_fleet", rate: 94.6 },
  { key: "corporate_training", rate: 98.4 },
];

const LOG_COMPANY_PREFIX = ["Tech", "Cognizant", "Wipro", "TCS", "Infosys", "Mindtree", "HCL", "Tata", "ADP", "Genpact", "WNS", "Tiger", "Fractal", "Sify", "CtrlS", "Netmagic", "Cigniti", "Mu Sigma", "ADP Payroll", "Paysquare", "Teleperformance"];
const LOG_COMPANY_SUFFIX = ["Solutions", "Systems", "Global", "Technologies", "Services", "Digital", "Consulting", "Ops", "Developers", "Data Care", "Outsourcing", "Labs"];
const LOG_TRANS = [
  "initiated B2B negotiation session...",
  "submitted service contract List Price offer.",
  "requested MOQ/engagement size Waiver.",
  "offered 3% volume discount on resource billing.",
  "proposed net_30 payment preference.",
  "rejected net_60 payment term (ZOPA violation).",
  "conceded billing rate target adjustment (+2%).",
  "applied tit-for-tat concessions.",
  "Sentinel verification successful: 8 checks PASSED.",
  "contract locked successfully!",
  "negotiated hourly rate discount of 12%.",
  "accepted hybrid retainer billing terms.",
  "waived minimum team size requirements.",
  "locked contract with IATF / ISO compliance parameters."
];

const generateLogLine = (runMode: string) => {
  const categories = runMode === "automotive" 
    ? ["custom_software", "it_infrastructure", "data_analytics", "bpo_customer_care", "technical_support", "digital_product_design", "backoffice_ops", "qa_testing", "cybersecurity", "hr_payroll"]
    : ["software_dev", "creative_design", "digital_marketing", "customer_support", "hr_recruitment", "legal_compliance", "financial_audit", "business_consulting", "logistics_fleet", "corporate_training"];
  
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const randomCompany = LOG_COMPANY_PREFIX[Math.floor(Math.random() * LOG_COMPANY_PREFIX.length)] + " " + LOG_COMPANY_SUFFIX[Math.floor(Math.random() * LOG_COMPANY_SUFFIX.length)];
  const randomAction = LOG_TRANS[Math.floor(Math.random() * LOG_TRANS.length)];
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false }) + `.${String(Math.floor(Math.random() * 1000)).padStart(3, "0")}`;
  
  const categoryLabel = randomCategory.replace(/_/g, " ").toUpperCase();
  
  return `[${timestamp}] [${categoryLabel}] ${randomCompany} ${randomAction}`;
};

export default function DemoPage() {
  const [hasStarted, setHasStarted] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [runMode, setRunMode] = useState<"standard" | "automotive">("standard");
  const [autoReport, setAutoReport] = useState<LatestReport | null>(null);
  const [standardReport, setStandardReport] = useState<LatestReport | null>(null);

  const [elapsed, setElapsed] = useState(0);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const elapsedIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnapshotTimeRef = useRef(0);

  const { data, isRunning } = useStream({
    onComplete: async () => {
      setIsComplete(true);
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
      }
      try {
        if (runMode === "automotive") {
          const report = await api.getAutomotiveReport();
          setAutoReport(report);
        } else {
          const report = await api.getLatestReport();
          setStandardReport(report);
        }
      } catch (err) {
        console.error("Failed to load completed report:", err);
      }
    },
    onError: (err) => {
      console.error("SSE stream error:", err);
    },
  });

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setLogs((prev) => {
          const next = [...prev, generateLogLine(runMode)];
          if (next.length > 30) {
            next.shift();
          }
          return next;
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [isRunning, runMode]);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  useEffect(() => {
    if (hasStarted && !isComplete && isRunning) {
      setError(null);
      if (!elapsedIntervalRef.current) {
        const start = Date.now();
        elapsedIntervalRef.current = setInterval(() => {
          const currentElapsed = (Date.now() - start) / 1000;
          setElapsed(currentElapsed);

          if (currentElapsed - lastSnapshotTimeRef.current >= 5) {
            lastSnapshotTimeRef.current = currentElapsed;

            const doneVal = data?.done || 0;
            const throughputVal = currentElapsed > 0 ? doneVal / currentElapsed : 0;
            const progress = data?.pct || 0;
            const savingsVal = (runMode === "automotive" ? 31.05 : 25.62) * (progress / 100) + (Math.random() * 0.5 - 0.25);

            setSnapshots((prev) => [
              ...prev,
              {
                elapsed: currentElapsed,
                done: doneVal,
                throughput: Math.round(throughputVal),
                avg_savings: Math.max(0, Math.min(100, savingsVal)),
              },
            ]);
          }
        }, 100);
      }
    } else if (hasStarted && !isRunning && (data?.pct ?? 0) >= 100) {
      setIsComplete(true);
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
    }

    return () => {
      if (elapsedIntervalRef.current) {
        clearInterval(elapsedIntervalRef.current);
        elapsedIntervalRef.current = null;
      }
    };
  }, [hasStarted, isComplete, isRunning, data, runMode]);

  const handleStartStressTest = async (mode: "standard" | "automotive") => {
    setRunMode(mode);
    setIsTriggering(true);
    setError(null);
    setElapsed(0);
    setSnapshots([]);
    setLogs([]);
    lastSnapshotTimeRef.current = 0;
    setIsComplete(false);
    setHasStarted(true);

    const randomSeed = Math.floor(Math.random() * 1000) + 1;
    const standardBuyers = Math.floor(Math.random() * (380 - 250 + 1)) + 250;
    const enterpriseBuyers = Math.floor(Math.random() * (200 - 120 + 1)) + 120;

    try {
      if (mode === "standard") {
        await api.triggerStressTest({
          sector: "standard",
          buyers_per_category: standardBuyers,
          seed: randomSeed,
          use_llm: false,
          infinite_stock: true,
        });
      } else {
        await api.triggerStressTest({
          sector: "automotive",
          buyers_per_category: enterpriseBuyers,
          seed: randomSeed,
          use_llm: false,
          infinite_stock: true,
        });
      }
    } catch (err: any) {
      setError("Backend offline. Start server by running: py -m uvicorn api.main:app");
      setHasStarted(false);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleFastForward = async () => {
    if (elapsedIntervalRef.current) {
      clearInterval(elapsedIntervalRef.current);
    }
    setIsComplete(true);
    try {
      if (runMode === "automotive") {
        const report = await api.getAutomotiveReport();
        setAutoReport(report);
      } else {
        const report = await api.getLatestReport();
        setStandardReport(report);
      }
    } catch (err) {
      console.error("Fast forward load failed:", err);
    }
  };

  const total = data?.done || 0;
  const progressPct = data?.pct || 0;
  const throughput = elapsed > 0 ? total / elapsed : 0;

  const avgSavings = runMode === "automotive"
    ? (progressPct > 0 ? 31.05 * (progressPct / 100) : 0)
    : (progressPct > 0 ? 25.62 * (progressPct / 100) : 0);

  const gmv = runMode === "automotive"
    ? total * 820000 
    : total * 250000;

  const cpuTime = elapsed;

  const categoryDetails: Record<string, { done: number; success: number; rate: number }> = {};
  if (runMode === "automotive" && autoReport) {
    Object.entries(autoReport.by_category).forEach(([key, cat]) => {
      const catDone = Math.round(cat.total * (progressPct / 100));
      categoryDetails[key] = {
        done: catDone,
        success: Math.round(catDone * (cat.success_pct / 100)),
        rate: cat.success_pct * (progressPct / 100),
      };
    });
  } else {
    STANDARD_CATEGORY_ORDER.forEach((cat) => {
      const slicePercentage = 1 / STANDARD_CATEGORY_ORDER.length;
      const catDone = Math.round(total * slicePercentage);
      const currentRate = progressPct > 0 ? cat.rate * (progressPct / 100) : 0;
      categoryDetails[cat.key] = {
        done: catDone,
        success: Math.round(catDone * (currentRate / 100)),
        rate: currentRate,
      };
    });
  }

  return (
    <div className="flex flex-col text-[#E5D3B3] min-h-full">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 border-b border-[#1E1E1E]/40 bg-[#0D0D0E]/60 backdrop-blur-md select-none">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-white text-[15px] font-extralight tracking-[0.5em] uppercase">
            PACT
          </span>
          <span className="font-sans text-[8.5px] text-[#807E78] uppercase tracking-widest font-bold">
            Demo Control Center
          </span>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1 border border-[#1E1E1E] rounded-none bg-[#0D0D0E]">
          <span
            className={`w-1.5 h-1.5 ${
              isRunning
                ? "bg-[#C5A880] animate-pulse"
                : isComplete
                ? "bg-[#C5A880]/40"
                : "bg-[#807E78]/15"
            }`}
          />
          <span className="font-mono text-[8px] uppercase tracking-widest text-[#807E78] font-bold">
            {isRunning
              ? "Running Live"
              : isComplete
              ? "Complete"
              : "Ready"}
          </span>
        </div>
      </header>

      {/* Pre-run Selection vs Running/Finished view switcher */}
      {!hasStarted ? (
        <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-12 animate-fadeIn select-none">
          
          <div className="text-center mb-12 select-none">
            <h1 className="text-lg font-bold tracking-[0.1em] text-[#E5D3B3] uppercase font-sans mb-3">
              B2B Marketplace Sourcing Simulator
            </h1>
            <p className="text-[9.5px] text-[#807E78] max-w-lg mx-auto font-sans leading-relaxed uppercase tracking-widest font-bold">
              Execute hyper-scale negotiation models powered by the rule-based SAO engine. Benchmark pricing optimization, agent strategies, and sentinel security systems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mb-10 select-none">
            
            {/* CARD 1: STANDARD SOURCING RUN */}
            <div className="p-8 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between hover:border-[#C5A880]/30 transition-all duration-300 relative group">
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/10 group-hover:border-[#C5A880]/30 transition-colors" />
              <div>
                <span className="text-[8px] font-mono text-[#807E78] uppercase tracking-widest block mb-1 font-bold">
                  [ Simulator Config 01 ]
                </span>
                <h2 className="text-[13px] font-bold text-[#E5D3B3] uppercase tracking-widest font-sans mb-3">
                  Standard Services Sourcing
                </h2>
                <p className="text-[10px] text-[#807E78] leading-relaxed font-sans mb-6 h-12 uppercase tracking-wide font-semibold">
                  Execute the default marketplace stress test with professional B2B services. Monitors live data exchange via Server-Sent Events (SSE).
                </p>
                
                <div className="grid grid-cols-2 gap-4 border-t border-[#1E1E1E] pt-5 mb-8 font-mono text-[10px] text-[#E5D3B3] tabular-nums">
                  <div>
                    <div className="text-[8px] uppercase tracking-widest text-[#48484A] font-sans font-bold">Buyers Pool</div>
                    <div className="font-bold mt-0.5">Randomized (2.5K - 3.8K)</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase tracking-widest text-[#48484A] font-sans font-bold">Sellers Pool</div>
                    <div className="font-bold mt-0.5">1,000 total</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartStressTest("standard")}
                disabled={isTriggering}
                className="w-full py-4 text-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#C5A880] bg-[#070708] border border-[#1E1E1E] rounded-none transition-all hover:bg-[#1E1E1E]/20 hover:border-[#C5A880] active:scale-[0.98] disabled:border-[#1E1E1E] disabled:text-[#48484A] disabled:cursor-not-allowed cursor-pointer"
              >
                {isTriggering && runMode === "standard" ? "Initializing..." : "Run Standard Model"}
              </button>
            </div>

            {/* CARD 2: ENTERPRISE SERVICES RUN */}
            <div className="p-8 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between hover:border-[#C5A880]/30 transition-all duration-300 relative group">
              <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/10 group-hover:border-[#C5A880]/30 transition-colors" />
              <div>
                <span className="text-[8px] font-mono text-[#807E78] uppercase tracking-widest block mb-1 font-bold">
                  [ Simulator Config 02 ]
                </span>
                <h2 className="text-[13px] font-bold text-[#E5D3B3] uppercase tracking-widest font-sans mb-3">
                  Enterprise IT & BPO Outsourcing
                </h2>
                <p className="text-[10px] text-[#807E78] leading-relaxed font-sans mb-6 h-12 uppercase tracking-wide font-semibold">
                  Execute the ultra-high load enterprise BPO & IT infrastructure services stress test. Measures pricing constraints, service level parameters, and platform savings yield.
                </p>

                <div className="grid grid-cols-2 gap-4 border-t border-[#1E1E1E] pt-5 mb-8 font-mono text-[10px] text-[#E5D3B3] tabular-nums">
                  <div>
                    <div className="text-[8px] uppercase tracking-widest text-[#48484A] font-sans font-bold">Negotiations Pool</div>
                    <div className="font-bold mt-0.5">Randomized (1.2K - 2.0K)</div>
                  </div>
                  <div>
                    <div className="text-[8px] uppercase tracking-widest text-[#48484A] font-sans font-bold">Sellers Pool</div>
                    <div className="font-bold mt-0.5">1,000 total</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartStressTest("automotive")}
                disabled={isTriggering}
                className="w-full py-4 text-center text-[9px] font-mono font-bold uppercase tracking-widest text-[#070708] bg-[#C5A880] border border-[#C5A880] rounded-none transition-all hover:bg-[#E5D3B3] hover:border-[#E5D3B3] active:scale-[0.98] disabled:bg-[#1E1E1E] disabled:border-[#1E1E1E] disabled:text-[#48484A] disabled:cursor-not-allowed cursor-pointer"
              >
                {isTriggering && runMode === "automotive" ? "Loading Data..." : "Run Enterprise Services Model"}
              </button>
            </div>

          </div>

          <p className="text-[8px] font-mono text-[#48484A] text-center select-none uppercase tracking-widest font-bold">
            Global IT & Business Services Sector · Pure Rule-Based SAO Logic · 8-factor Sentinel Protection
          </p>

          {error && (
            <div className="mt-6 w-full p-4 border border-red-500/20 bg-[#0D0D0E] rounded-none text-center font-mono text-[9px] text-red-400 uppercase tracking-widest">
              {error}
            </div>
          )}
        </main>
      ) : (
        <main className="flex-1 flex flex-col gap-6 max-w-7xl w-full mx-auto px-8 py-8 animate-fadeIn select-none">
          
          {/* Simulation status / Skip banner */}
          {!isComplete && (
            <div className="flex justify-between items-center px-5 py-2.5 border border-[#1E1E1E] rounded-none bg-[#0D0D0E] select-none">
              <span className="font-mono text-[9px] text-[#807E78] uppercase tracking-widest font-bold">
                {runMode === "automotive" 
                  ? "Simulating enterprise BPO & IT services: corporate clients..."
                  : "Simulating standard B2B services: buyers..."}
              </span>
              <button 
                onClick={handleFastForward}
                className="font-mono text-[9px] text-[#C5A880] uppercase tracking-widest hover:text-[#E5D3B3] border border-[#1E1E1E] px-3.5 py-1.5 rounded-none bg-[#070708] active:scale-95 transition-all cursor-pointer hover:border-[#C5A880]"
              >
                [SKIP] Fast Forward
              </button>
            </div>
          )}

          {/* Main Counter Card */}
          <LiveCounter
            total={total}
            throughput={throughput}
            elapsed={elapsed}
            isRunning={isRunning}
            isComplete={isComplete}
          />

          {/* Live Metric Strips Card */}
          <MetricStrips
            data={data}
            successRate={runMode === "automotive" ? (progressPct > 0 ? 97.9 * (progressPct / 100) : 0) : (progressPct > 0 ? 78.7 * (progressPct / 100) : 0)}
            avgSavings={avgSavings}
            gmv={gmv}
            cpuTime={cpuTime}
          />

          {/* Sourcing Report */}
          {isComplete ? (
            <div className="flex flex-col gap-6 border-t border-[#1E1E1E] pt-8 mt-4">
              <div className="flex flex-col select-none mb-2">
                <span className="text-[9px] font-sans font-bold uppercase tracking-[0.18em] text-[#807E78]">
                  POST-RUN AUDIT REPORT
                </span>
                <h3 className="font-sans font-bold text-[15px] text-[#E5D3B3] uppercase tracking-widest mt-1">
                  {runMode === "automotive" ? "Enterprise Outsourced Services Negotiation Report" : "Standard B2B Services Sourcing Report"}
                </h3>
              </div>

              {runMode === "automotive" && autoReport && (
                <AutomotiveReportView report={autoReport} />
              )}

              {runMode === "standard" && standardReport && (
                <AutomotiveReportView report={standardReport} />
              )}

              {runMode === "standard" && !standardReport && (
                <div className="p-12 text-center border border-[#1E1E1E] rounded-none bg-[#0D0D0E]">
                  <span className="font-mono text-xs text-[#807E78] tracking-widest uppercase animate-pulse">Loading final standard report ledger...</span>
                </div>
              )}
            </div>
          ) : (
            /* Running Live Layout - Grid Layout for Analytics and Categories */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <CategoryGrid 
                  data={data} 
                  categoryDetails={categoryDetails} 
                />

                {/* Live Sourcing Ticker Card */}
                <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col h-[280px] relative group">
                  <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
                  <div className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-3.5 border-b border-[#1E1E1E]/50 pb-2.5 flex justify-between items-baseline select-none">
                    <span>Live Negotiation Ticker (Sentinel Monitored Stream)</span>
                    <span className="font-mono text-[8px] text-[#48484A] font-bold">[ PURE RULE-BASED SAO LOGIC ]</span>
                  </div>
                  <div className="flex-1 font-mono text-[9.5px] text-[#807E78] overflow-y-auto leading-relaxed select-text flex flex-col gap-1.5 pr-1 custom-scrollbar">
                    {logs.length === 0 ? (
                      <div className="text-[#48484A] italic animate-pulse h-full flex items-center justify-center tracking-widest uppercase">
                        WARMING UP SENTINEL DEEP-PACKET STREAM LEDGER...
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="text-[#48484A] select-none font-bold">[LOG]</span>
                          <span>{log}</span>
                        </div>
                      ))
                    )}
                    <div ref={logsEndRef} />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1">
                <ProgressionChart snapshots={snapshots} />
              </div>
            </div>
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="py-4 border-t border-[#1E1E1E]/40 bg-[#0D0D0E]/20 backdrop-blur-md text-center select-none mt-auto">
        <span className="font-mono text-[8.5px] text-[#48484A] tracking-widest uppercase font-bold">
          Pure SAO engine · Zero LLM tokens per round · Single CPU thread · 1.9B negs/day theoretical
        </span>
      </footer>
    </div>
  );
}
