import React from "react";
import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#030303] text-[#F2F2F7]">
      {/* Fixed Sidebar navigation */}
      <Sidebar />

      {/* Main page scrolling body */}
      <main className="my-6 mr-6 ml-3 h-[calc(100vh-48px)] rounded-[6px] bg-[#0A0A0A] border border-[#1E1E1E] flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

