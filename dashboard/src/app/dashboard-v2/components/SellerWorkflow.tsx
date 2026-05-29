import React from "react";
import { Search, Sliders } from "lucide-react";
import { LatestReport } from "@/types/pact";

interface SellerWorkflowProps {
  report: LatestReport | null;
}

export function SellerWorkflow({ report }: SellerWorkflowProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedStrategy, setSelectedStrategy] = React.useState<string>("all");

  // Global Config Stub States
  const [markupMultiplier, setMarkupMultiplier] = React.useState(1.0);
  const [moqLeniency, setMoqLeniency] = React.useState(10); // in percent
  const [isConfigSaving, setIsConfigSaving] = React.useState(false);
  const [configSuccess, setConfigSuccess] = React.useState(false);

  const leaderboard = report?.agent_leaderboard || [];

  const strategies = [
    { value: "all", label: "All Strategies" },
    { value: "realistic", label: "Realistic Balance" },
    { value: "conceder", label: "Conceder Swarm" },
    { value: "boulware", label: "Boulware Rigid" },
    { value: "hardball", label: "Hardball Escalator" },
    { value: "tit_for_tat", label: "Tit-For-Tat" },
  ];

  const defaultSellers = [
    { seller_id: "S-001", name: "Tata Steel Agents", strategy: "boulware", category: "Metals", success_pct: 77.1 },
    { seller_id: "S-002", name: "Reliance Chem Bot", strategy: "realistic", category: "Chemicals", success_pct: 84.8 },
    { seller_id: "S-003", name: "Infosys Hardware Core", strategy: "conceder", category: "Electronics", success_pct: 94.6 },
    { seller_id: "S-004", name: "Adani Logistics Swarm", strategy: "tit_for_tat", category: "Logistics", success_pct: 79.9 },
  ];

  const displaySellers = leaderboard.length > 0 ? leaderboard : defaultSellers;

  const filteredSellers = displaySellers.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStrategy = selectedStrategy === "all" || s.strategy.toLowerCase() === selectedStrategy.toLowerCase();
    return matchesSearch && matchesStrategy;
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfigSaving(true);
    setConfigSuccess(false);

    setTimeout(() => {
      setIsConfigSaving(false);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    }, 1200);
  };

  const getStrategyBadge = (strat: string) => {
    const styleMap: Record<string, string> = {
      realistic: "text-cyan-400 bg-cyan-950/20 border-cyan-800/10",
      conceder: "text-emerald-400 bg-emerald-950/20 border-emerald-800/10",
      boulware: "text-rose-400 bg-rose-950/20 border-rose-800/10",
      hardball: "text-amber-400 bg-amber-950/20 border-amber-800/10",
      tit_for_tat: "text-purple-400 bg-purple-950/20 border-purple-800/10",
    };
    return (
      <span className={`px-2.5 py-0.5 border font-sans text-[10px] font-semibold rounded-full ${styleMap[strat.toLowerCase()] || "text-[#8E8E93] bg-[#070708]"}`}>
        {strat.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="space-y-10 w-full max-w-[1100px] mx-auto select-none text-left pt-2">
      {/* Title */}
      <div className="space-y-2">
        <h2 className="font-sans text-3xl font-extrabold text-[#F2F2F7] tracking-tight">Sellers Directory</h2>
        <p className="font-sans text-sm text-[#8E8E93] max-w-xl">
          Direct active swarms and adjust global bidding parameters in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* Column 1 & 2: Directory */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters */}
          <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-4 flex flex-col sm:flex-row gap-3 items-center justify-between" style={{ borderRadius: "12px" }}>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-[#8E8E93]/40" />
              <input
                type="text"
                placeholder="Search sellers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-10 pr-3 bg-[#070708]/60 border border-white/[0.04] font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] placeholder-[#8E8E93]/35 rounded-lg"
              />
            </div>

            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full sm:w-auto h-8 px-2 bg-[#070708]/60 border border-white/[0.04] font-sans text-xs text-[#F2F2F7] focus:outline-none focus:border-[#C5A880] cursor-pointer rounded-lg"
            >
              {strategies.map((strat) => (
                <option key={strat.value} value={strat.value} className="bg-[#111112]">
                  {strat.label}
                </option>
              ))}
            </select>
          </div>

          {/* List display */}
          <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-6 space-y-6 shadow-sm" style={{ borderRadius: "12px" }}>
            <span className="font-sans text-xs font-semibold text-[#8E8E93]/80 block border-b border-white/[0.04] pb-3">
              Active Agents Registry
            </span>

            <div className="space-y-4 pt-1">
              {filteredSellers.length > 0 ? (
                filteredSellers.map((seller) => (
                  <div key={seller.seller_id} className="flex items-center justify-between p-3 hover:bg-white/[0.015] rounded-xl transition-colors">
                    <div className="space-y-1">
                      <span className="font-sans text-sm font-bold text-[#F2F2F7] block">
                        {seller.name}
                      </span>
                      <span className="font-sans text-xs text-[#8E8E93] block">
                        Category: {seller.category} • ID: {seller.seller_id}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {getStrategyBadge(seller.strategy)}
                      <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                        {seller.success_pct.toFixed(0)}% Win
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center font-sans text-xs text-[#8E8E93]/30 py-12">
                  No active seller agents found matches
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Column 3: Slider overrides */}
        <div className="space-y-6">
          <div className="bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-6 space-y-6 shadow-sm" style={{ borderRadius: "12px" }}>
            <div className="flex items-center gap-2 border-b border-white/[0.04] pb-3">
              <Sliders className="h-4 w-4 text-[#C5A880]" />
              <span className="font-sans text-xs font-semibold text-[#F2F2F7]">
                Core Configuration
              </span>
            </div>

            <p className="font-sans text-xs text-[#8E8E93] leading-relaxed text-left">
              Inject instruction sets into all swarms globally in real-time.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-5 pt-2">
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between font-sans text-xs font-medium text-[#8E8E93]">
                  <span>Starting markup</span>
                  <span className="text-[#C5A880] font-bold font-mono tabular-nums">
                    {markupMultiplier >= 1.0 ? "+" : ""}{(markupMultiplier - 1.0).toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.9"
                  max="1.1"
                  step="0.005"
                  value={markupMultiplier}
                  onChange={(e) => setMarkupMultiplier(Number(e.target.value))}
                  className="w-full h-1 bg-[#070708] rounded-full appearance-none cursor-pointer accent-[#C5A880]"
                />
              </div>

              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between font-sans text-xs font-medium text-[#8E8E93]">
                  <span>MOQ Waiver leniency</span>
                  <span className="text-[#C5A880] font-bold font-mono tabular-nums">
                    {moqLeniency}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={moqLeniency}
                  onChange={(e) => setMoqLeniency(Number(e.target.value))}
                  className="w-full h-1 bg-[#070708] rounded-full appearance-none cursor-pointer accent-[#C5A880]"
                />
              </div>

              <button
                type="submit"
                disabled={isConfigSaving}
                className="w-full h-9 flex items-center justify-center gap-2 font-sans text-xs font-bold text-black bg-[#C5A880] hover:bg-[#E5D3B3] transition-all cursor-pointer rounded-lg disabled:opacity-40"
              >
                {isConfigSaving ? "Notifying swarms..." : "Override Policies"}
              </button>
            </form>

            {configSuccess && (
              <div className="border border-emerald-500/10 bg-emerald-500/5 p-3 rounded-lg flex items-center gap-2 text-emerald-400 font-sans text-xs justify-center">
                Policies Overridden OK
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
