"use client";

import React, { useState } from "react";
import { LatestReport } from "@/types/pact";
import { formatNumber } from "@/lib/format";

interface AutomotiveReportViewProps {
  report: LatestReport;
}

const CATEGORY_LABELS: Record<string, string> = {
  // Standard B2B Services
  software_dev: "Software Development",
  creative_design: "Creative Design & UX",
  digital_marketing: "Digital Marketing & SEO",
  customer_support: "Customer Support & BPO",
  hr_recruitment: "HR Recruitment & Placement",
  legal_compliance: "Legal & Compliance",
  financial_audit: "Financial Audit & Accounting",
  business_consulting: "Business Consulting & Strategy",
  logistics_fleet: "Logistics & Fleet Ops",
  corporate_training: "Corporate Training & Upskilling",

  // Enterprise Outsourced Services (Config 2)
  custom_software: "Custom Software Engineering",
  it_infrastructure: "IT Infrastructure & Cloud",
  data_analytics: "Data Analytics & BI",
  bpo_customer_care: "BPO & Call Centers",
  technical_support: "L1/L2 Tech Support Outsourcing",
  digital_product_design: "Digital Product Design",
  backoffice_ops: "Backoffice Ops & Data Entry",
  qa_testing: "QA & Software Testing",
  cybersecurity: "Cybersecurity Auditing",
  hr_payroll: "HR & Payroll Outsourcing"
};

const STRATEGY_LABELS: Record<string, string> = {
  boulware: "Boulware",
  conceder: "Conceder",
  tit_for_tat: "Tit-for-Tat",
  hardball: "Hardball",
  aspirational: "Aspirational",
  realistic: "Realistic"
};

const BUYER_PROFILE_LABELS: Record<string, string> = {
  oem_tier1: "Enterprise Client",
  tier2_assembler: "Mid-Market Corp",
  aftermarket: "Growth SME",
  fleet_buyer: "Institutional"
};

export function AutomotiveReportView({ report }: AutomotiveReportViewProps) {
  const { meta, summary, sentinel, by_category, by_strategy, by_buyer_profile, by_failure_reason, agent_leaderboard } = report;
  const [selectedFailureReason, setSelectedFailureReason] = useState<string | null>(by_failure_reason?.[0]?.reason || null);

  const loc = (n: number) => formatNumber(n);

  const formatINR = (val: number) => {
    const crores = val / 10000000;
    const formatted = crores.toFixed(2);
    const parts = formatted.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `₹${parts.join(".")} Cr`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
      case "critical":
        return "text-[#C5A880] border-[#1E1E1E] bg-[#070708]";
      case "medium":
      case "warning":
        return "text-[#E5D3B3] border-[#1E1E1E] bg-[#070708]";
      default:
        return "text-[#807E78] border-[#1E1E1E] bg-[#070708]";
    }
  };

  const activeFailureData = by_failure_reason?.find(f => f.reason === selectedFailureReason);

  const throughput = summary.throughput_negs_per_sec || 
    (meta.duration_secs > 0 ? Math.round(summary.total_negotiations / meta.duration_secs) : 0);

  return (
    <div className="flex flex-col gap-6 w-full animate-fadeIn select-none font-sans">
      
      {/* SECTION 1: HIGH-DENSITY HEADLINE KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* KPI 1: THROUGHPUT VELOCITY */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between select-none relative group">
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[#C5A880]/15 group-hover:border-[#C5A880]/30 transition-colors" />
          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
            Throughput Velocity
          </span>
          <div className="my-2">
            <span className="font-mono text-2xl font-light text-[#E5D3B3] tabular-nums" suppressHydrationWarning>
              {loc(throughput)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#807E78] block mt-1 font-bold">
              negotiations / sec
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-1 p-[0.5px]">
            <div className="h-full bg-[#C5A880] w-full" />
          </div>
        </div>

        {/* KPI 2: TOTAL NEGOTIATIONS */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between select-none relative group">
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[#C5A880]/15 group-hover:border-[#C5A880]/30 transition-colors" />
          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
            Total Negotiations
          </span>
          <div className="my-2">
            <span className="font-mono text-2xl font-light text-[#E5D3B3] tabular-nums" suppressHydrationWarning>
              {loc(summary.total_negotiations)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#807E78] block mt-1 font-bold">
              in {meta.duration_secs || 23.32} seconds
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-1 p-[0.5px]">
            <div className="h-full bg-[#C5A880] w-full" />
          </div>
        </div>

        {/* KPI 3: TRANSACTION SUCCESS RATE */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between select-none relative group">
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[#C5A880]/15 group-hover:border-[#C5A880]/30 transition-colors" />
          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
            Success Rate
          </span>
          <div className="my-2">
            <span className="font-mono text-2xl font-bold text-[#C5A880] tabular-nums" suppressHydrationWarning>
              {summary.success_rate_pct.toFixed(2)}%
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#807E78] block mt-1 font-bold" suppressHydrationWarning>
              {loc(summary.deals_closed)} closed / {loc(summary.deals_failed)} failed
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-1 p-[0.5px]">
            <div 
              className="h-full bg-[#C5A880]" 
              style={{ width: `${summary.success_rate_pct}%` }}
            />
          </div>
        </div>

        {/* KPI 4: PROCESSED GMV */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between select-none relative group">
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[#C5A880]/15 group-hover:border-[#C5A880]/30 transition-colors" />
          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
            Processed GMV
          </span>
          <div className="my-2">
            <span className="font-mono text-[16px] font-bold text-[#E5D3B3] tabular-nums block truncate">
              {formatINR(summary.total_deal_value_inr)}
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#807E78] block mt-1 font-bold">
              fees: {formatINR(summary.platform_fee_inr)}
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-1 p-[0.5px]">
            <div className="h-full bg-[#C5A880] w-2/3" />
          </div>
        </div>

        {/* KPI 5: AVERAGE SAVINGS */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between select-none relative group">
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[#C5A880]/15 group-hover:border-[#C5A880]/30 transition-colors" />
          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78]">
            Avg MSME Savings
          </span>
          <div className="my-2">
            <span className="font-mono text-2xl font-bold text-[#E5D3B3] tabular-nums">
              {summary.avg_buyer_savings_pct.toFixed(2)}%
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-[#807E78] block mt-1 font-bold">
              vs list: {summary.avg_vs_list_pct.toFixed(2)}% · rounds: {summary.avg_rounds_per_deal}
            </span>
          </div>
          <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden mt-1 p-[0.5px]">
            <div 
              className="h-full bg-[#C5A880]" 
              style={{ width: `${summary.avg_buyer_savings_pct}%` }}
            />
          </div>
        </div>

      </div>

      {/* SECTION 2: GRID FOR CATEGORIES, STRATEGIES, AND BUYER PROFILES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* CATEGORY PERFORMANCE LEDGER */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col relative">
          <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/15" />
          <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-4 border-b border-[#1E1E1E] pb-2">
            Category Performance Ledger
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-[#1E1E1E] text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] h-8 bg-[#070708]/35">
                  <th className="pb-2">Category</th>
                  <th className="pb-2 text-right">Total Deals</th>
                  <th className="pb-2 text-right">Success %</th>
                  <th className="pb-2 text-right">Avg Savings %</th>
                  <th className="pb-2 text-right">MOQ Waivers</th>
                </tr>
              </thead>
              <tbody className="font-mono text-[11px] text-[#E5D3B3] tabular-nums">
                {Object.entries(by_category).map(([key, cat]) => (
                  <tr key={key} className="border-b border-[#1E1E1E]/30 h-8 hover:bg-[#1E1E1E]/10 transition-colors">
                    <td className="py-1.5 font-sans font-bold text-[#807E78] text-[11px]">
                      {CATEGORY_LABELS[key] || key}
                    </td>
                    <td className="py-1.5 text-right" suppressHydrationWarning>{loc(cat.total)}</td>
                    <td className="py-1.5 text-right">{cat.success_pct.toFixed(1)}%</td>
                    <td className="py-1.5 text-right text-[#C5A880] font-bold">{cat.avg_savings_pct.toFixed(2)}%</td>
                    <td className="py-1.5 text-right text-[#807E78]" suppressHydrationWarning>{loc(cat.moq_waivers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT STRATEGIES & BUYER PROFILES LAYOUT */}
        <div className="flex flex-col gap-6">
          
          {/* STRATEGY PERFORMANCE MATRIX */}
          <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col flex-1 relative">
            <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/15" />
            <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-4 border-b border-[#1E1E1E] pb-2">
              Seller Strategy Performance Matrix
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse select-none">
                <thead>
                  <tr className="border-b border-[#1E1E1E] text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] h-8 bg-[#070708]/35">
                    <th className="pb-2">Strategy</th>
                    <th className="pb-2 text-right">Negotiations</th>
                    <th className="pb-2 text-right">Success Rate</th>
                    <th className="pb-2 text-right">Avg Savings %</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-[11px] text-[#E5D3B3] tabular-nums">
                  {Object.entries(by_strategy).map(([key, strat]) => (
                    <tr key={key} className="border-b border-[#1E1E1E]/30 h-8 hover:bg-[#1E1E1E]/10 transition-colors">
                      <td className="py-1.5 font-sans font-bold text-[#807E78] text-[11px]">
                        {STRATEGY_LABELS[key] || key}
                      </td>
                      <td className="py-1.5 text-right" suppressHydrationWarning>{loc(strat.total)}</td>
                      <td className="py-1.5 text-right">{strat.success_pct.toFixed(1)}%</td>
                      <td className="py-1.5 text-right text-[#C5A880] font-bold">{strat.avg_savings_pct.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* BUYER PROFILE ANALYSIS */}
          {by_buyer_profile && (
            <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col flex-1 relative">
              <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/15" />
              <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-4 border-b border-[#1E1E1E] pb-2">
                Buyer Profile Analysis
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse select-none">
                  <thead>
                    <tr className="border-b border-[#1E1E1E] text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] h-8 bg-[#070708]/35">
                      <th className="pb-2">Buyer Profile</th>
                      <th className="pb-2 text-right">Deals</th>
                      <th className="pb-2 text-right">Success %</th>
                      <th className="pb-2 text-right">Savings %</th>
                      <th className="pb-2">Spec Definition</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[11px] text-[#E5D3B3] tabular-nums">
                    {Object.entries(by_buyer_profile).map(([key, profile]) => (
                      <tr key={key} className="border-b border-[#1E1E1E]/30 h-10 hover:bg-[#1E1E1E]/10 transition-colors">
                        <td className="py-1.5 font-sans font-bold text-[#807E78] text-[11px]">
                          {BUYER_PROFILE_LABELS[key] || key}
                        </td>
                        <td className="py-1.5 text-right" suppressHydrationWarning>{loc(profile.total)}</td>
                        <td className="py-1.5 text-right">{profile.success_pct.toFixed(1)}%</td>
                        <td className="py-1.5 text-right text-[#C5A880] font-bold">{profile.avg_savings_pct.toFixed(2)}%</td>
                        <td className="py-1.5 font-sans text-[10px] text-[#807E78] pl-4 max-w-[200px] truncate" title={profile.desc}>
                          {profile.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* SECTION 3: FAILURE MODE AUDIT LOG & SENTINEL SECURITY LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* FAILURE MODE AUDIT LOG & SAMPLES */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col relative">
          <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
          <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-4 border-b border-[#1E1E1E] pb-2">
            Failure Mode & Architectural Audit Log
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Failure List */}
            <div className="flex flex-col gap-2">
              {by_failure_reason.map((fail) => (
                <div
                  key={fail.reason}
                  onClick={() => setSelectedFailureReason(fail.reason)}
                  className={`p-3 border rounded-none cursor-pointer transition-all duration-150 select-none ${
                    selectedFailureReason === fail.reason
                      ? "border-[#C5A880] bg-[#1E1E1E]/40"
                      : "border-[#1E1E1E]/40 bg-transparent hover:bg-[#1E1E1E]/20"
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-sans font-bold text-[10.5px] text-[#E5D3B3] uppercase tracking-wider">
                      {fail.label}
                    </span>
                    <span className="font-mono text-[9.5px] text-[#807E78] tabular-nums font-bold" suppressHydrationWarning>
                      {loc(fail.count)} ({fail.pct.toFixed(0)}%)
                    </span>
                  </div>
                  <span className={`text-[7.5px] font-mono uppercase tracking-widest px-1.5 py-0.5 border rounded-none font-bold ${getSeverityColor(fail.severity)}`}>
                    [ {fail.severity.toUpperCase()} RISK ]
                  </span>
                </div>
              ))}
            </div>

            {/* Failure Audit/Fix Card */}
            {activeFailureData && (
              <div className="p-4 bg-[#070708] border border-[#1E1E1E] rounded-none flex flex-col justify-between">
                <div>
                  <div className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-1">
                    Root Cause Analysis
                  </div>
                  <p className="text-[10.5px] text-[#807E78] font-sans mb-3 leading-normal font-semibold">
                    {activeFailureData.desc}
                  </p>
                </div>
                <div className="border-t border-[#1E1E1E] pt-3">
                  <div className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#E5D3B3] mb-1">
                    [FIX] Proposed Architectural Fix
                  </div>
                  <p className="text-[9.5px] text-[#807E78] font-sans leading-normal italic font-bold">
                    {activeFailureData.fix}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Failure Samples Subledger */}
          {activeFailureData?.samples && activeFailureData.samples.length > 0 && (
            <div className="border-t border-[#1E1E1E] pt-4 mt-2">
              <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-2">
                Live Negotiating Failure Samples ({activeFailureData.label})
              </div>
              <div className="overflow-x-auto max-h-[160px] overflow-y-auto pr-1">
                <table className="w-full text-left border-collapse select-none">
                  <thead>
                    <tr className="border-b border-[#1E1E1E] text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] h-6 bg-[#070708]/35">
                      <th className="pl-1">Seller Entity</th>
                      <th>Category</th>
                      <th className="text-right">Price Gap %</th>
                      <th className="text-right">Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-[10px] text-[#E5D3B3] tabular-nums">
                    {activeFailureData.samples.map((sample, index) => (
                      <tr key={index} className="border-b border-[#1E1E1E]/20 h-6 hover:bg-[#1E1E1E]/10 transition-colors">
                        <td className="py-1 pl-1 font-sans text-[#807E78] font-bold truncate max-w-[150px]">
                          {sample.seller}
                        </td>
                        <td className="py-1 text-[#48484A] font-sans font-bold text-[8.5px] uppercase tracking-widest">
                          {CATEGORY_LABELS[sample.category] || sample.category}
                        </td>
                        <td className="py-1 text-right text-[#C5A880] font-bold">
                          +{sample.price_gap_pct.toFixed(1)}%
                        </td>
                        <td className="py-1 text-right font-sans text-[8.5px] text-[#807E78] font-bold uppercase tracking-widest">
                          {STRATEGY_LABELS[sample.strategy] || sample.strategy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* SENTINEL SECURITY AUDIT LEDGER */}
        <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col justify-between relative">
          <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
          <div>
            <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-4 border-b border-[#1E1E1E] pb-2 flex justify-between items-baseline">
              <span>Sentinel Security Audit Ledger</span>
              <span className="font-mono text-[8px] text-[#48484A] font-bold">[ 8 security checks / round ]</span>
            </div>

            {/* Sub-KPIs */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center select-none font-mono">
              <div className="p-2 border border-[#1E1E1E] bg-[#070708] rounded-none">
                <div className="text-[11.5px] font-bold text-[#E5D3B3] tabular-nums" suppressHydrationWarning>
                  {loc(sentinel.total_sessions_monitored)}
                </div>
                <div className="text-[7.5px] font-sans font-bold uppercase tracking-wider text-[#807E78] mt-0.5">
                  Monitored Deals
                </div>
              </div>
              <div className="p-2 border border-[#1E1E1E] bg-[#070708] rounded-none">
                <div className="text-[11.5px] font-bold text-[#C5A880] tabular-nums">
                  {sentinel.total_alerts}
                </div>
                <div className="text-[7.5px] font-sans font-bold uppercase tracking-wider text-[#807E78] mt-0.5">
                  Active Alerts
                </div>
              </div>
              <div className="p-2 border border-[#1E1E1E] bg-[#070708] rounded-none">
                <div className="text-[11.5px] font-bold text-[#E5D3B3] tabular-nums">
                  {sentinel.round_exhaustion_rate_pct.toFixed(2)}%
                </div>
                <div className="text-[7.5px] font-sans font-bold uppercase tracking-wider text-[#807E78] mt-0.5">
                  Exhaustion Rate
                </div>
              </div>
            </div>

            {/* Alert Logs */}
            <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
              <div className="text-[8.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-1.5">
                Real-Time Sentinel Warning Stream
              </div>
              
              {sentinel.sample_alerts && sentinel.sample_alerts.length > 0 ? (
                sentinel.sample_alerts.map((alert, index) => (
                  <div key={`${alert.alert_id}_${index}`} className="p-3 border border-[#1E1E1E] bg-[#070708] rounded-none font-mono text-[9.5px]">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-bold text-[#C5A880]">
                        [ALERT] {alert.alert_id}
                      </span>
                      <span className="text-[7.5px] uppercase px-1.5 py-0.2 border border-[#1E1E1E] bg-[#070708] rounded-none text-[#807E78] font-bold">
                        {alert.severity} / {alert.category}
                      </span>
                    </div>
                    <p className="text-[#807E78] font-sans text-[9.5px] leading-normal mt-1 font-semibold">
                      {alert.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-[#48484A] font-mono text-[9px] font-bold tracking-widest">
                  [ CHECK: ZERO THREATS DETECTED BY SENTINEL ]
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-[#1E1E1E] font-mono text-[8px] text-[#48484A] leading-normal uppercase font-bold tracking-wider">
            Sentinel checks: collusion detection, transaction outliers, bait & switch, prompt injection blocks, and MOQ evasion prevention.
          </div>
        </div>

      </div>

      {/* SECTION 4: AGENT PERFORMANCE LEADERBOARD LEDGER */}
      <div className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex flex-col select-none relative">
        <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15" />
        <div className="text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] mb-4 border-b border-[#1E1E1E] pb-2 flex justify-between items-baseline">
          <span>Top-Performing Seller Agent Leaderboard</span>
          <span className="font-sans text-[8.5px] text-[#48484A] font-bold uppercase tracking-wider">Top 10 Entities Ranked by MSME Cost-Reduction Yield</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1E1E1E] text-[9.5px] font-sans font-bold uppercase tracking-[0.15em] text-[#807E78] h-8 bg-[#070708]/35">
                <th className="pb-2 pl-2">Rank</th>
                <th className="pb-2">Seller Agent Entity</th>
                <th className="pb-2">Entity ID</th>
                <th className="pb-2">Category</th>
                <th className="pb-2 text-right">Deals Queried</th>
                <th className="pb-2 text-right">Deals Reached</th>
                <th className="pb-2 text-right">Success Rate</th>
                <th className="pb-2 text-right">Avg Savings %</th>
                <th className="pb-2 pl-4">Strategy Profile</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px] text-[#E5D3B3] tabular-nums">
              {agent_leaderboard.slice(0, 10).map((seller, index) => (
                <tr key={seller.seller_id} className="border-b border-[#1E1E1E]/30 h-9 hover:bg-[#1E1E1E]/10 transition-colors">
                  <td className="py-2 pl-2 text-[#807E78] font-bold">#{index + 1}</td>
                  <td className="py-2 font-sans font-bold text-[#E5D3B3] text-[11px]">
                    {seller.name}
                  </td>
                  <td className="py-2 text-[#807E78] font-semibold">{seller.seller_id}</td>
                  <td className="py-2 text-[#807E78] font-sans font-bold text-[9.5px] uppercase tracking-wider">
                    {CATEGORY_LABELS[seller.category] || seller.category}
                  </td>
                  <td className="py-2 text-right" suppressHydrationWarning>{loc(seller.queried)}</td>
                  <td className="py-2 text-right" suppressHydrationWarning>{loc(seller.closed)}</td>
                  <td className="py-2 text-right text-emerald-400 font-bold">{seller.success_pct.toFixed(1)}%</td>
                  <td className="py-2 text-right text-[#C5A880] font-bold">
                    {seller.avg_savings_pct.toFixed(2)}%
                  </td>
                  <td className="py-2 font-sans text-[10px] text-[#807E78] pl-4">
                    <span className="px-2 py-0.5 border border-[#1E1E1E] bg-[#070708] rounded-none text-[#807E78] uppercase tracking-widest text-[8.5px] font-bold">
                      {STRATEGY_LABELS[seller.strategy] || seller.strategy}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
