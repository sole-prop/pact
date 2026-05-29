import React from "react";
import { Terminal, Layers, User, Users, History } from "lucide-react";

export type TabType = "overview" | "buyer" | "seller" | "history";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  systemHealth: { status: string; ollama: boolean; supabase: boolean };
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "overview" as TabType, label: "Core", icon: Layers },
    { id: "buyer" as TabType, label: "Buyer Agent", icon: User },
    { id: "seller" as TabType, label: "Seller Swarm", icon: Users },
    { id: "history" as TabType, label: "Audit Ledger", icon: History },
  ];

  return (
    <aside className="flex h-full w-56 flex-col bg-[#050505] p-8 text-left shrink-0 select-none">
      {/* Premium minimal header */}
      <div className="flex items-center gap-3 pb-12 pt-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.04]">
          <Terminal className="h-3.5 w-3.5 text-[#C5A880]" />
        </div>
        <span className="font-sans text-[13px] font-semibold tracking-[0.03em] text-[#F2F2F7]">PACT</span>
      </div>

      {/* Elegant minimalist navigation tabs */}
      <nav className="flex flex-col gap-1.5 flex-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-3.5 px-3.5 py-2.5 transition-all duration-200 outline-none rounded-lg text-left cursor-pointer ${
                isActive
                  ? "bg-white/[0.04] text-[#F2F2F7] font-semibold"
                  : "bg-transparent text-[#8E8E93]/70 hover:bg-white/[0.015] hover:text-[#F2F2F7]"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform duration-200 ${
                isActive ? "text-[#C5A880]" : "text-[#8E8E93]/40 group-hover:text-[#F2F2F7]"
              }`} />
              <span className="font-sans text-[12px] tracking-[0.01em]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Restrained simple footer */}
      <div className="pt-6 font-sans text-[10px] text-[#8E8E93]/40 text-left">
        <span>Sovereign OS</span>
      </div>
    </aside>
  );
}
