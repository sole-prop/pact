import React from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata = {
  title: "PACT — Autonomous Enterprise Commerce",
  description: "Autonomous B2B negotiation. Luxury, minimal, cinematic operating system.",
};

export default function DashboardV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`w-full min-h-screen bg-[#050505] text-[#F2F2F7] antialiased select-none font-sans overflow-x-hidden ${GeistSans.variable} ${GeistMono.variable}`}>
      {/* Luxurious, Massive Ambient Gold Overlay centered behind the core visual */}
      <div 
        className="fixed inset-0 pointer-events-none z-0" 
        style={{
          background: "radial-gradient(circle at 50% 25%, rgba(197, 168, 128, 0.045) 0%, rgba(5, 5, 5, 0) 65%)"
        }}
      />
      <div className="relative z-10 w-full min-h-screen">
        {children}
      </div>
    </div>
  );
}
