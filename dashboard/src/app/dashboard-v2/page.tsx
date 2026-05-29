"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "./components/AppShell";
import { Sidebar, TabType } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { HeroPanel } from "./components/HeroPanel";
import { MetricGrid } from "./components/MetricGrid";

// Tabbed Workflows
import { BuyerWorkflow } from "./components/BuyerWorkflow";
import { SellerWorkflow } from "./components/SellerWorkflow";
import { HistoryWorkflow } from "./components/HistoryWorkflow";

import { api } from "@/lib/api";
import { LatestReport, StreamUpdate } from "@/types/pact";

export default function DashboardV2Page() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [report, setReport] = useState<LatestReport | null>(null);
  const [streamState, setStreamState] = useState<StreamUpdate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [systemHealth, setSystemHealth] = useState({
    status: "ok",
    ollama: false,
    supabase: false,
  });

  // Pull latest report & backend metadata
  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getLatestReport();
      setReport(res);
    } catch (err: any) {
      console.error("Error pulling report data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Ping backend check
  const checkBackendHealth = async () => {
    try {
      const health = await api.getHealth();
      setSystemHealth({
        status: health.status,
        ollama: (health as any).ollama_available || false,
        supabase: (health as any).supabase_connected || false,
      });
    } catch (err) {
      console.error("Health probe error:", err);
      setSystemHealth({ status: "error", ollama: false, supabase: false });
    }
  };

  // Launch simulation stress test
  const handleTriggerStressTest = async (buyersCount: number, useLLM: boolean) => {
    setIsLoading(true);
    try {
      await api.triggerStressTest({
        buyers_per_category: buyersCount,
        seed: 42,
        use_llm: useLLM,
        infinite_stock: true,
      });
    } catch (err: any) {
      console.error("Launch stress test error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // SSE Stream Listener for real-time progress percentage
  useEffect(() => {
    const sseUrl = "/api/backend/api/stats/stream-progress";
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as StreamUpdate;
        setStreamState(data);
      } catch (err) {
        console.error("Error parsing stream progress:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE stream pipeline lost/closed.", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Monitor stream state to reload metrics when finished
  useEffect(() => {
    if (streamState && !streamState.running && streamState.pct >= 100) {
      fetchReportData();
    }
  }, [streamState]);

  // Initial load
  useEffect(() => {
    checkBackendHealth();
    fetchReportData();
  }, []);

  // Main UI Renderer matching tabs
  const renderTabContent = () => {
    switch (activeTab) {
      case "buyer":
        return <BuyerWorkflow />;
      case "seller":
        return <SellerWorkflow report={report} />;
      case "history":
        return <HistoryWorkflow report={report} />;
      case "overview":
      default:
        return (
          <div className="flex flex-col gap-16 w-full max-w-[1200px] mx-auto animate-fadeIn select-none pt-4">
            {/* Cinematic Hero Panel (Dominates visual focus) */}
            <HeroPanel
              streamState={streamState}
              onTriggerStressTest={handleTriggerStressTest}
              isTriggering={isLoading}
            />

            {/* Restrained Secondary Metrics (Borderless) */}
            <MetricGrid report={report} />
          </div>
        );
    }
  };

  return (
    <AppShell
      sidebar={
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          systemHealth={systemHealth}
        />
      }
      topbar={
        <Topbar
          onRefresh={fetchReportData}
          isLoading={isLoading}
          totalNegotiations={report?.summary?.total_negotiations ?? 0}
          systemHealth={systemHealth}
        />
      }
    >
      {renderTabContent()}
    </AppShell>
  );
}
