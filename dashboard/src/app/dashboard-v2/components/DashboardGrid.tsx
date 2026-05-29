import React from "react";

interface DashboardGridProps {
  children: React.ReactNode;
}

export function DashboardGrid({ children }: DashboardGridProps) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto animate-fadeIn select-none">
      {children}
    </div>
  );
}
