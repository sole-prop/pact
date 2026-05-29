import React from "react";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-[var(--background-base)] text-[var(--text-primary)] font-sans">
      {/* Fixed Sidebar navigation flush with left edge */}
      <Sidebar />

      {/* Main content area with top header bar */}
      <div className="h-screen flex-1 flex flex-col overflow-hidden">
        {/* Persistent top bar: right-aligned header icons */}
        <div className="flex items-center justify-end px-[var(--space-xl)] py-[var(--space-md)] border-b border-[var(--border-thin)] bg-[var(--background-surface)] shrink-0 z-20">
          <Header />
        </div>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto bg-[var(--background-base)] relative scroll-smooth z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
