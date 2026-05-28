"use client";

import React from "react";
import { Bell, Shield } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center gap-4 select-none">
      {/* Golden Bell Icon */}
      <button className="p-1.5 text-[#8E8675] hover:text-[#C5A880] transition-colors cursor-pointer relative">
        <Bell className="w-4 h-4 text-[#C5A880]" />
        {/* Subtle ping dot */}
        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#C5A880] animate-pulse" />
      </button>

      {/* Red Shield Sentinel Icon */}
      <button className="p-1.5 text-[#8E8675] hover:text-red-400 transition-colors cursor-pointer">
        <Shield className="w-4 h-4 text-[#FF453A]" fill="#FF453A" fillOpacity="0.15" />
      </button>

      {/* Circle "N" Initials Avatar */}
      <div className="w-6 h-6 rounded-full bg-[#0C0C0C] border border-[#1C1812] flex items-center justify-center font-sans text-[9px] font-bold text-[#E5D3B3] cursor-pointer hover:border-[#C5A880] transition-colors">
        N
      </div>
    </div>
  );
}
