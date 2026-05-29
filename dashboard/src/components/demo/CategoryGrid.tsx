"use client";

import React from "react";
import { StreamUpdate } from "@/types/pact";
import { formatNumber } from "@/lib/format";

interface CategoryGridProps {
  data: StreamUpdate | null;
  categoryDetails?: Record<string, { done: number; success: number; rate: number }>;
}

const STANDARD_CATEGORIES = [
  { key: "software_dev", label: "Software Development" },
  { key: "creative_design", label: "Creative Design & UX" },
  { key: "digital_marketing", label: "Digital Marketing & SEO" },
  { key: "customer_support", label: "Customer Support & BPO" },
  { key: "hr_recruitment", label: "HR Recruitment & Placement" },
  { key: "legal_compliance", label: "Legal & Compliance" },
  { key: "financial_audit", label: "Financial Audit & Accounting" },
  { key: "business_consulting", label: "Business Consulting & Strategy" },
  { key: "logistics_fleet", label: "Logistics & Fleet Ops" },
  { key: "corporate_training", label: "Corporate Training & Upskilling" },
];

const ENTERPRISE_CATEGORIES = [
  { key: "custom_software", label: "Custom Software" },
  { key: "it_infrastructure", label: "IT Infrastructure" },
  { key: "data_analytics", label: "Data Analytics" },
  { key: "bpo_customer_care", label: "BPO & Call Center" },
  { key: "technical_support", label: "Technical Support" },
  { key: "digital_product_design", label: "UX/UI Product Design" },
  { key: "backoffice_ops", label: "Backoffice Ops" },
  { key: "qa_testing", label: "QA & Software Testing" },
  { key: "cybersecurity", label: "Cybersecurity Audit" },
  { key: "hr_payroll", label: "HR & Payroll Outsourcing" },
];

export function CategoryGrid({ data, categoryDetails }: CategoryGridProps) {
  const isEnterprise = categoryDetails && Object.keys(categoryDetails).some(k => k === "custom_software" || k === "it_infrastructure");
  const categoriesList = isEnterprise ? ENTERPRISE_CATEGORIES : STANDARD_CATEGORIES;
  const isLoading = !data;

  const getBarColor = (rate: number) => {
    if (rate >= 90) return "bg-[#C5A880]";
    if (rate >= 60) return "bg-[#E5D3B3]";
    return "bg-[#807E78]";
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 select-none">
      {categoriesList.map((cat) => {
        const details = categoryDetails?.[cat.key];
        const dealsClosed = details ? details.done : 0;
        const successRate = details ? details.rate : 0;

        if (isLoading) {
          return (
            <div
              key={cat.key}
              className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none h-[130px] flex flex-col justify-between animate-pulse"
            >
              <div className="h-2.5 bg-[#1E1E1E] w-2/3" />
              <div className="h-6 bg-[#1E1E1E] w-1/3" />
              <div className="h-[3px] bg-[#1E1E1E] w-full" />
            </div>
          );
        }

        return (
          <div
            key={cat.key}
            className="p-6 bg-[#0D0D0E] border border-[#1E1E1E] rounded-none h-[130px] flex flex-col justify-between hover:border-[#C5A880]/30 transition-all duration-300 relative group"
          >
            {/* Fine ticks */}
            <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-[#C5A880]/10 group-hover:border-[#C5A880]/30 transition-colors" />
            
            {/* Category Name */}
            <div className="text-[9px] font-sans font-bold uppercase tracking-[0.12em] text-[#807E78] truncate">
              {cat.label}
            </div>

            {/* Main Deals Stats */}
            <div className="my-2 flex items-baseline justify-between select-none">
              <span className="font-mono text-2xl font-light text-[#E5D3B3] tabular-nums" suppressHydrationWarning>
                {formatNumber(dealsClosed)}
              </span>
              <span className="font-mono text-[8.5px] uppercase tracking-widest text-[#C5A880] font-bold tabular-nums ml-2">
                {successRate.toFixed(1)}% ok
              </span>
            </div>

            {/* Flat Progress Bar */}
            <div className="w-full h-[3px] bg-[#070708] border border-[#1E1E1E] rounded-none overflow-hidden p-[0.5px]">
              <div
                className={`h-full rounded-none transition-all duration-300 ease-out ${getBarColor(
                  successRate
                )}`}
                style={{ width: `${successRate}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
