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
      <div className="h-[320px] bg-[#0C0C0C] border border-[#1C1812] rounded-[6px] flex items-center justify-center select-none">
        <span className="text-[10px] font-sans uppercase tracking-widest text-[#C5A880] font-bold animate-pulse">
          Loading chart engine...
        </span>
      </div>
    );
  }

  if (snapshots.length < 2) {
    return (
      <div className="h-[320px] bg-[#0C0C0C] border border-[#1C1812] rounded-[6px] flex items-center justify-center flex-col p-6 text-center select-none shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <span className="text-[10px] font-sans uppercase tracking-[0.08em] text-[#4A4339] font-bold">
          Waiting for live telemetry...
        </span>
        <span className="text-[9px] font-mono text-[#4A4339] mt-1 font-semibold">
          TELEMETRY SNAPSHOTS TRIGGER EVERY 5S
        </span>
      </div>
    );
  }

  // Custom tooltips matching Bloomberg dark aesthetics
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as Snapshot;
      return (
        <div className="bg-[#0C0C0C] border border-[#1C1812] p-3 rounded-[4px] shadow-lg text-left select-none font-mono">
          <p className="text-[9px] uppercase tracking-wider text-[#8E8675] mb-1">
            Time: {data.elapsed.toFixed(1)}s
          </p>
          {payload.map((item: any, idx: number) => (
            <p
              key={idx}
              className="text-[11px] font-bold"
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
    <div className="flex flex-col gap-4 p-6 bg-[#0C0C0C] border border-[#1C1812] rounded-[6px] shadow-[0_1px_3px_rgba(0,0,0,0.4)] select-none">
      <div>
        <div className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8675] mb-2">
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
                stroke="#4A4339"
                fontSize={9}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4A4339"
                fontSize={9}
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
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border-t border-[#1C1812] pt-4">
        <div className="text-[10px] font-sans font-bold uppercase tracking-[0.08em] text-[#8E8675] mb-2">
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
                stroke="#4A4339"
                fontSize={9}
                fontFamily="var(--font-geist-mono)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#4A4339"
                fontSize={9}
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
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
