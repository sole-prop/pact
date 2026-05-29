import React from "react";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050505] font-sans selection:bg-[#C5A880]/20 selection:text-white">
      {/* Column 1: Ultra-Minimal Sidebar Navigation */}
      {sidebar}

      {/* Column 2: Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        {topbar}

        {/* Spacious scroll container */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-12 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
