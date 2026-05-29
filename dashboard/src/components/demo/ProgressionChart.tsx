"use client";

import React, { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Snapshot {
  elapsed: number;
  done: number;
  throughput: number;
  avg_savings: number;
}

interface ProgressionChartProps {
  snapshots: Snapshot[];
}

export function ProgressionChart({ snapshots }: ProgressionChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[320px] bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex items-center justify-center select-none">
        <span className="text-[9px] font-sans uppercase tracking-[0.18em] text-[#C5A880] font-bold animate-pulse">
          Loading chart engine...
        </span>
      </div>
    );
  }

  if (snapshots.length < 2) {
    return (
      <div className="h-[320px] bg-[#0D0D0E] border border-[#1E1E1E] rounded-none flex items-center justify-center flex-col p-6 text-center select-none relative group">
        <div className="absolute top-2 left-2 w-1 h-1 border-t border-l border-[#C5A880]/15" />
        <span className="text-[9px] font-sans uppercase tracking-[0.15em] text-[#48484A] font-bold">
          Waiting for live telemetry...
        </span>
        <span className="text-[8px] font-mono text-[#48484A] mt-2 font-bold uppercase tracking-widest">
          TELEMETRY SNAPSHOTS TRIGGER EVERY 5S
        </span>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as Snapshot;
      return (
        <div className="bg-[#0D0D0E] border border-[#1E1E1E] p-3 rounded-none shadow-2xl text-left select-none font-mono">
          <p className="text-[8px] uppercase tracking-widest text-[#807E78] mb-1 font-bold">
            Time: {data.elapsed.toFixed(1)}s
          </p>
          {payload.map((item: any, idx: number) => (
            <p
              key={idx}
              className="text-[10px] font-bold"
              style={{ color: item.color || "#E5D3B3" }}
              suppressHydrationWarning
            >
              {item.name}: {formatNumber(item.value)}
              {item.name.includes("Savings") ? "%" : "/s"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none shadow-none select-none relative group">
      <div className="absolute top-2 left-2 w-1.5 h-1.5 border-t border-l border-[#C5A880]/15 animate-pulse" />
      
      <div>
        <div className="text-[9px] font-sans font-bold uppercase tracking-[0.18em] text-[#807E78] mb-3">
          Throughput Velocity (K/sec)
        </div>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={snapshots}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            >
              <XAxis
                dataKey="elapsed"
                tickFormatter={(val) => `${val}s`}
                stroke="#48484A"
                fontSize={8}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#48484A"
                fontSize={8}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${(val / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="throughput"
                name="Throughput"
                stroke="#C5A880"
                strokeWidth={1.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-[#1E1E1E]/60 pt-4">
        <div className="text-[9px] font-sans font-bold uppercase tracking-[0.18em] text-[#807E78] mb-3">
          Average Negotiated Savings (%)
        </div>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={snapshots}
              margin={{ top: 5, right: 5, left: -25, bottom: 5 }}
            >
              <XAxis
                dataKey="elapsed"
                tickFormatter={(val) => `${val}s`}
                stroke="#48484A"
                fontSize={8}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#48484A"
                fontSize={8}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="avg_savings"
                name="Savings Rate"
                stroke="#E5D3B3"
                strokeWidth={1.2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
