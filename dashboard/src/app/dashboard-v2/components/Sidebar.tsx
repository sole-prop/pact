import React from "react";
import Link from "next/link";
import { CreditCard, Compass, History, Zap } from "lucide-react";

export type TabType = "buyer" | "seller" | "history";

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  systemHealth: { status: string; ollama: boolean; supabase: boolean };
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "buyer" as TabType, label: "Buy Side", icon: CreditCard },
    { id: "seller" as TabType, label: "Sell Side", icon: Compass },
    { id: "history" as TabType, label: "Audit Ledger", icon: History },
  ];

  return (
    <aside className="flex h-full w-64 flex-col bg-[#fcf8f7] p-8 text-left shrink-0 select-none border-r border-[#c4c7c7]/35 relative">
      {/* Structural Vertical Alignment Grid Line (Subtle design accent) */}
      <div className="absolute top-0 bottom-0 left-[43px] w-[1px] bg-[#c4c7c7]/20 pointer-events-none" />

      {/* Luxurious, Premium Architectural Logo Mark */}
      <div className="flex flex-col gap-3 pb-16 pt-4 text-left relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-[0.25rem] bg-[#4b41e1]/5 border border-[#4b41e1]/20 shadow-[0_4px_16px_rgba(75,65,225,0.06)] relative overflow-hidden group">
            {/* Elegant Isometric Coordinate Vector Mark */}
            <svg className="h-5 w-5 text-[#4b41e1]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
            <div className="absolute inset-0 bg-[#4b41e1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div>
            <span className="font-sans text-[15px] font-extrabold tracking-[0.2em] text-[#0d0d0d] block leading-none">PACT</span>
            <span className="text-[7.5px] uppercase tracking-[0.22em] text-[#444748] mt-1.5 block font-bold">SOVEREIGN NETWORK</span>
          </div>
        </div>
      </div>

      {/* Bespoke Institutional Navigation */}
      <nav className="flex flex-col gap-2.5 flex-1 relative z-10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group flex items-center gap-4 px-4 py-3.5 transition-all duration-300 outline-none rounded-[0.25rem] text-left cursor-pointer border ${
                isActive
                  ? "bg-white text-[#4b41e1] font-bold border-[#4b41e1]/25 shadow-[0_2px_8px_rgba(75,65,225,0.03)]"
                  : "bg-transparent text-[#444748] hover:bg-[#ebe7e7]/60 hover:text-[#0d0d0d] border-transparent"
              }`}
            >
              <div className="relative">
                <Icon className={`h-4.5 w-4.5 transition-all duration-300 ${
                  isActive ? "text-[#4b41e1] scale-110" : "text-[#444748]/55 group-hover:text-[#0d0d0d]"
                }`} />
                {isActive && (
                  <span className="absolute -left-[23px] top-1/2 -translate-y-1/2 w-[3px] h-3 bg-[#4b41e1] rounded-r-full" />
                )}
              </div>
              <span className="font-sans text-[10.5px] uppercase tracking-[0.18em] font-bold">
                {tab.label}
              </span>
            </button>
          );
        })}

        <div className="mt-8 pt-8 border-t border-[#c4c7c7]/35">
          <Link
            href="/scale"
            className="group flex items-center gap-4 px-4 py-3.5 transition-all duration-300 outline-none rounded-[0.25rem] text-left border border-dashed border-[#c4c7c7] text-[#444748] hover:border-[#4b41e1]/45 hover:text-[#4b41e1] hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.005)]"
          >
            <div className="relative">
              <Zap className="h-4.5 w-4.5 text-[#444748]/50 group-hover:text-[#4b41e1] transition-colors" />
            </div>
            <span className="font-sans text-[10.5px] uppercase tracking-[0.18em] font-bold">
              Proof of Scale
            </span>
          </Link>
        </div>
      </nav>

      {/* Restrained simple footer */}
      <div className="pt-6 font-sans text-[8.5px] uppercase tracking-[0.18em] text-[#444748]/45 text-left border-t border-[#c4c7c7]/30 relative z-10 font-bold">
        <span>Sovereign Node v2.0</span>
      </div>
    </aside>
  );
}
