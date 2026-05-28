"use client";

import React, { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { TopDeal } from "@/types/pact";

interface AIScoreBreakdownProps {
  deal: TopDeal | null;
}

export function AIScoreBreakdown({ deal }: AIScoreBreakdownProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!deal) {
    return (
      <div className="h-[480px] bg-[#111111] border border-[#1E1E1E] rounded-[6px] flex flex-col items-center justify-center p-6 text-center select-none shadow-2xl relative overflow-hidden group">
        {/* Subtle Ambient Corner Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A880]/[0.02] rounded-full blur-[80px]" />
        
        {/* HUD corners */}
        <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-[#C5A880]/15" />
        <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-[#C5A880]/15" />
        <div className="absolute bottom-4 left-4 w-2 h-2 border-b border-l border-[#C5A880]/15" />
        <div className="absolute bottom-4 right-4 w-2 h-2 border-b border-r border-[#C5A880]/15" />

        <span className="text-[10px] font-sans uppercase tracking-[0.12em] text-[#48484A] font-bold">
          SELECT A CONTENDER TO INITIALIZE SCORING ANALYZER
        </span>
      </div>
    );
  }

  // Derive dimensional scores from composite and parameters with realistic fallback variation
  const baseScore = deal.composite_score * 100;
  const priceScore = Math.min(100, Math.round(baseScore * 1.05 * (deal.savings_pct > 0 ? 1 + deal.savings_pct / 100 : 1)));
  const deliveryScore = Math.min(100, Math.max(40, Math.round(100 - (deal.delivery_days * 2))));
  const qualityScore = deal.quality_grade === "A" ? 98 : deal.quality_grade === "B" ? 85 : 70;
  const termsScore = deal.payment_term.includes("60") ? 95 : deal.payment_term.includes("30") ? 80 : 65;
  const reliabilityScore = Math.min(100, Math.max(50, Math.round(baseScore * 0.95)));

  // Setup pentagon radar data
  const chartData = [
    { subject: "Price", contender: priceScore, priority: 80 },
    { subject: "Delivery", contender: deliveryScore, priority: 70 },
    { subject: "Quality", contender: qualityScore, priority: 85 },
    { subject: "Terms", contender: termsScore, priority: 75 },
    { subject: "Reliability", contender: reliabilityScore, priority: 90 },
  ];

  const breakdownRows = [
    { label: "Price Advantage", value: priceScore, weight: 0.4 },
    { label: "Delivery Fit", value: deliveryScore, weight: 0.3 },
    { label: "Quality & Reviews", value: qualityScore, weight: 0.2 },
    { label: "Terms & Flexibility", value: termsScore, weight: 0.05 },
    { label: "Reliability score", value: reliabilityScore, weight: 0.05 },
  ];

  // Calculate composite rating deviation vs baseline priority (average priority is ~80)
  const averagePriority = 80;
  const averageContender = (priceScore + deliveryScore + qualityScore + termsScore + reliabilityScore) / 5;
  const scoreDeviation = averageContender - averagePriority;

  return (
    <div className="flex flex-col bg-[#111111] border border-[#1E1E1E] hover:border-[#C5A880]/15 rounded-[6px] shadow-2xl p-6 gap-6 relative overflow-hidden transition-all duration-300 group">
      {/* Background sweep effects */}
      <style>{`
        @keyframes radar-sweep-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes active-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-[#C5A880]/[0.02] rounded-full blur-[80px]" />
      
      {/* Tiny HUD Corners */}
      <div className="absolute top-4 left-4 w-1.5 h-1.5 border-t border-l border-[#C5A880]/20" />
      <div className="absolute top-4 right-4 w-1.5 h-1.5 border-t border-r border-[#C5A880]/20" />
      <div className="absolute bottom-4 left-4 w-1.5 h-1.5 border-b border-l border-[#C5A880]/20" />
      <div className="absolute bottom-4 right-4 w-1.5 h-1.5 border-b border-r border-[#C5A880]/20" />

      {/* Header Info Panel */}
      <div className="flex justify-between items-start z-10">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8E8E93]">
            Operational Metrics
          </span>
          <h2 className="text-[12px] font-sans font-extrabold uppercase tracking-[0.08em] text-[#E5D3B3] truncate max-w-[200px]">
            {deal.seller_name}
          </h2>
        </div>

        {/* Live HUD Status Pill */}
        <div className="flex items-center gap-1.5 font-mono text-[8px] font-bold text-[#C5A880] bg-[#14120F] border border-[#C5A880]/20 rounded-[4px] px-2 py-0.5 select-none shadow-[inset_0_1px_0_rgba(197,168,128,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
          <span>DEV: {scoreDeviation >= 0 ? "+" : ""}{scoreDeviation.toFixed(1)}%</span>
        </div>
      </div>

      {/* Glowing Radar Chart Instrument Section */}
      <div className="h-[210px] w-full flex items-center justify-center relative select-none">
        
        {/* Circular Scanning sweeps behind the Radar chart */}
        <div className="absolute w-[156px] h-[156px] rounded-full border border-[#C5A880]/5 flex items-center justify-center pointer-events-none">
          {/* Inner concentric ring */}
          <div className="w-[104px] h-[104px] rounded-full border border-[#C5A880]/5 flex items-center justify-center">
            {/* Innermost ring */}
            <div className="w-[52px] h-[52px] rounded-full border border-[#C5A880]/3" />
          </div>

          {/* Sweeper beam */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: "conic-gradient(from 0deg, transparent 50%, rgba(197, 168, 128, 0.01) 85%, rgba(197, 168, 128, 0.05) 100%)",
              animation: "radar-sweep-spin 10s linear infinite",
            }}
          />
        </div>

        {/* Central Pulse Ambient */}
        <div className="absolute w-20 h-20 bg-[#C5A880]/[0.03] rounded-full blur-xl pointer-events-none" />

        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
              {/* Custom SVG Definitions */}
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C5A880" stopOpacity="0.25" />
                  <stop offset="65%" stopColor="#C5A880" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="goldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#C5A880" />
                  <stop offset="50%" stopColor="#E5D3B3" />
                  <stop offset="100%" stopColor="#9C7F57" />
                </linearGradient>
              </defs>

              <PolarGrid 
                stroke="#C5A880" 
                strokeOpacity={0.06} 
                gridType="polygon" 
                strokeDasharray="3 3"
              />
              
              <PolarAngleAxis
                dataKey="subject"
                stroke="#8E8E93"
                fontSize={9}
                fontFamily="var(--font-geist-sans)"
                tickLine={false}
                dy={3}
                tick={({ payload, x, y, textAnchor }) => (
                  <text
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    className="font-sans font-bold uppercase tracking-[0.1em] text-[8.5px] fill-[#8E8E93]"
                  >
                    {payload.value}
                  </text>
                )}
              />
              
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={false} 
                axisLine={false} 
              />
              
              {/* Contender radar shape - Custom gradient glowing core */}
              <Radar
                name="Top Contender"
                dataKey="contender"
                stroke="url(#goldStroke)"
                strokeWidth={1.5}
                fill="url(#radarGlow)"
                fillOpacity={1}
              />
              
              {/* Buyer priority radar shape - Dotted Amber Border */}
              <Radar
                name="Your Priorities"
                dataKey="priority"
                stroke="#48484A"
                strokeDasharray="4 4"
                strokeWidth={1}
                fill="none"
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <span className="text-[10px] font-sans uppercase text-[#48484A] font-bold">
            LOADING SCORING ENGINE...
          </span>
        )}
      </div>

      {/* Instrument Legend */}
      <div className="flex justify-center gap-6 select-none border-b border-[#1E1E1E] pb-5">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#8E8E93]">
          <span className="w-3 h-0.5 bg-[#C5A880] rounded-full" />
          <span className="uppercase tracking-wider">Top Contender</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-[#8E8E93]">
          <span className="w-3 h-0.5 border-t border-dashed border-[#48484A]" />
          <span className="uppercase tracking-wider">Your Priorities</span>
        </div>
      </div>

      {/* Stacked Instrument Bar Grid (Sleek and Modern) */}
      <div className="flex flex-col gap-4">
        {breakdownRows.map((row, idx) => {
          const barWidth = row.value; // progress %
          return (
            <div key={idx} className="flex flex-col gap-1.5 group/bar">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-sans font-bold text-[#8E8E93] uppercase tracking-wider group-hover/bar:text-[#E5D3B3] transition-colors">
                  {row.label}
                </span>
                <span className="font-mono text-[10.5px] font-bold text-[#E5D3B3] tabular-nums">
                  {row.value}<span className="text-[#48484A] text-[9px] font-sans">/100</span>
                </span>
              </div>
              
              {/* Ultra-premium compound progress rail */}
              <div className="w-full h-1 bg-[#111111] border border-[#1E1E1E] rounded-full p-[0.5px] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#9C7F57] to-[#C5A880] rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

