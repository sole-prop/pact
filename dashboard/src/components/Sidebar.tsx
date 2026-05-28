"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Briefcase,
  Activity,
  Clock,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/negotiate", label: "New Request", icon: Plus },
  { href: "/sell", label: "Sell Portal", icon: Briefcase },
  { href: "/live", label: "Active", icon: Activity },
  { href: "/history", label: "History", icon: Clock },
  { href: "/demo", label: "Demo Mode", icon: Zap },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] my-6 ml-6 mr-3 h-[calc(100vh-48px)] rounded-[6px] bg-[#111111] border border-[#1E1E1E] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.4)] shrink-0 sticky top-6 flex flex-col justify-between select-none">
      
      {/* Top Brand Section */}
      <div className="pb-6 flex flex-col gap-1.5 select-none border-b border-[#1E1E1E] mb-6">
        <h1 className="font-mono text-[#C5A880] text-[22px] font-light leading-none tracking-[0.55em] select-none">
          PACT
        </h1>
        <div className="text-[7.5px] uppercase font-sans tracking-[0.25em] text-[#8E8675] mt-1.5 font-bold select-none">
          AUTONOMOUS SOURCING
        </div>
      </div>

      {/* Navigation Deck (Spacious, balanced margins) */}
      <nav className="flex-1 flex flex-col gap-2 select-none">
        {NAV_ITEMS.map((item, index) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <React.Fragment key={item.href}>
              {index === 3 && (
                <div className="h-[1px] bg-[#1E1E1E] my-2.5 mx-1" />
              )}
              <Link
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 text-[11px] font-sans font-bold uppercase tracking-[0.08em] transition-all duration-300 ease-out rounded-[4px] ${
                  isActive
                    ? "bg-white/[0.04] text-[#C5A880] shadow-[0_1px_3px_rgba(0,0,0,0.4)] border border-[#C5A880]/15"
                    : "text-[#8E8E93] hover:text-[#E5D3B3] hover:bg-white/[0.015]"
                }`}
              >
                <Icon 
                  className={`w-4 h-4 shrink-0 transition-colors duration-300 ${
                    isActive ? "text-[#C5A880]" : "text-[#8E8E93]"
                  }`} 
                />
                <span>{item.label}</span>
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Bottom Profile Info Widget */}
      <div className="select-none pt-4 border-t border-[#1E1E1E] mt-auto">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-[4px] bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center font-mono text-[11px] font-bold text-[#E5D3B3] select-none shadow-sm">
            N
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#E5D3B3] truncate leading-tight select-none">
              Acme Corp.
            </span>
            <span className="text-[8.5px] font-mono text-[#8E8E93] mt-1 leading-none uppercase tracking-wider font-extrabold select-none">
              ENTERPRISE
            </span>
          </div>
        </div>
      </div>
      
    </aside>
  );
}


