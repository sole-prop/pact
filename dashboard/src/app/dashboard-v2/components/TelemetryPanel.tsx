import React from "react";
import { LatestReport } from "@/types/pact";
import { Terminal } from "lucide-react";

interface TelemetryPanelProps {
  report: LatestReport | null;
  logs: string[];
}

export function TelemetryPanel({ logs }: TelemetryPanelProps) {
  // Only display the 3 latest logs to keep it extremely minimalist
  const latestLogs = logs.slice(-3).reverse();

  return (
    <div className="bg-[#111112] border border-white/5 p-5 md:p-6" style={{ borderRadius: "12px" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Terminal className="h-4 w-4 text-[#C5A880]" />
          <span className="font-sans text-[11px] font-semibold tracking-[0.03em] uppercase text-[#F2F2F7]">
            Active Swarm Feed
          </span>
        </div>

        {/* Horizontal Status Strip */}
        <div className="flex-1 overflow-hidden">
          {latestLogs.length > 0 ? (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-8 justify-end text-[11px] font-sans">
              {latestLogs.map((log, idx) => {
                let formattedLog = log
                  .replace(/\[SECURE\]|\[SENTINEL\]|\[SYSTEM\]|\[AGENT\]|\[DEAL\]|\[CRITICAL\]/g, "")
                  .trim();
                
                // Add a simple status dot color depending on tags
                let dotColor = "bg-white/40";
                if (log.includes("[DEAL]")) dotColor = "bg-emerald-400";
                else if (log.includes("[CRITICAL]")) dotColor = "bg-rose-500 animate-ping";
                else if (log.includes("[SENTINEL]")) dotColor = "bg-[#C5A880]";
                else if (log.includes("[SECURE]")) dotColor = "bg-cyan-400";

                return (
                  <div key={idx} className="flex items-center gap-2 max-w-sm truncate text-left md:justify-end">
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotColor}`} />
                    <span className="text-[#8E8E93] truncate">{formattedLog}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <span className="font-sans text-[11px] text-[#8E8E93]/40 block text-left md:text-right">
              Swarm standing by. No active loop runs logged.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
