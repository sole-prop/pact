import React from "react";

interface AppShellProps {
  sidebar: React.ReactNode;
  topbar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, topbar, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#fdf8f8] text-[#1c1b1b] flex justify-center w-full selection:bg-[#4b41e1]/10 selection:text-[#4b41e1]">
      {/* Editorial Fixed-Fluid 1440px Container Grid */}
      <div className="w-full max-w-[1440px] min-h-screen flex border-l border-r border-[#c4c7c7]/30 bg-[#fdf8f8] relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.015)]">
        
        {/* Column 1: Left Architectural Sidebar Navigation */}
        {sidebar}

        {/* Column 2: Main Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top Header Section */}
          {topbar}

          {/* Spacious scroll container with premium macro-spacing */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent px-16 py-12">
            {children}
          </main>
        </div>

      </div>
    </div>
  );
}
