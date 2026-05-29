import React from "react";
import { Play, Loader2, Sparkles } from "lucide-react";
import { StreamUpdate } from "@/types/pact";

interface HeroPanelProps {
  streamState: StreamUpdate | null;
  onTriggerStressTest: (buyersCount: number, useLLM: boolean) => void;
  isTriggering: boolean;
}

export function HeroPanel({ streamState, onTriggerStressTest, isTriggering }: HeroPanelProps) {
  const [buyersCount, setBuyersCount] = React.useState<number>(10);
  const [useLLM, setUseLLM] = React.useState<boolean>(false);

  const isRunning = streamState?.running || false;
  const progressPct = streamState?.pct ?? 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning || isTriggering) return;
    onTriggerStressTest(buyersCount, useLLM);
  };

  return (
    <div className="relative overflow-hidden bg-transparent py-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20 text-left">
      
      {/* Massive Glowing Golden Aura (Emotional focal visual) */}
      <div className="relative w-72 h-72 md:w-96 md:h-96 shrink-0 flex items-center justify-center select-none z-10 lg:order-last">
        
        {/* Soft breathing golden halo blur */}
        <div 
          className="absolute inset-0 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none animate-breath"
          style={{
            background: "radial-gradient(circle, rgba(197, 168, 128, 0.4) 0%, rgba(197, 168, 128, 0) 70%)"
          }}
        />

        {/* Outer glowing concentric orbital lines */}
        <div className="absolute w-[80%] h-[80%] rounded-full border border-[#C5A880]/10 scale-95 animate-pulse" />
        <div className="absolute w-[60%] h-[60%] rounded-full border border-[#C5A880]/5 animate-ping opacity-20" style={{ animationDuration: "12s" }} />

        {/* Central luxury golden core SVG */}
        <svg className="w-[60%] h-[60%] overflow-visible filter drop-shadow-[0_0_30px_rgba(197,168,128,0.35)]" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="auraglow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E5D3B3" stopOpacity="0.8" />
              <stop offset="35%" stopColor="#C5A880" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#C5A880" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="32" fill="url(#auraglow)" className="animate-breath" />
          <circle cx="50" cy="50" r="14" fill="#C5A880" />
        </svg>

        {/* Custom inline Keyframes for ultimate luxury animations */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes luxury-breath {
            0% { transform: scale(0.96); opacity: 0.35; }
            50% { transform: scale(1.04); opacity: 0.5; }
            100% { transform: scale(0.96); opacity: 0.35; }
          }
          .animate-breath {
            animation: luxury-breath 8s ease-in-out infinite;
          }
        `}} />
      </div>

      {/* Left: Headline statement area (breathing room) */}
      <div className="flex-1 space-y-8 z-10">
        
        {/* Soft tag */}
        <div className="inline-flex items-center gap-2">
          <span className="h-1 w-1 rounded-full bg-[#C5A880]" />
          <span className="font-sans text-[10px] font-bold tracking-[0.15em] uppercase text-[#8E8E93]/80">
            Sovereign Sourcing Core
          </span>
        </div>

        {/* Dominant Headline */}
        <div className="space-y-4">
          <h1 className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#F2F2F7] leading-[1.05]">
            Autonomous <br /> Commerce OS
          </h1>
          <p className="font-sans text-base text-[#8E8E93] leading-relaxed max-w-xl">
            A calm, intelligent market coordination layer. Orchestrate thousands of micro-negotiators 
            acting under rule-based models with premium algorithmic restraint.
          </p>
        </div>

        {/* Tucked-away inputs and Solid Gold CTA */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full max-w-md"
        >
          {/* Subtle controls */}
          <div className="flex-1 grid grid-cols-2 gap-2 bg-[#111112]/40 backdrop-blur-md border border-white/[0.04] p-1 rounded-xl shadow-inner">
            <div className="flex items-center px-3.5 gap-2">
              <span className="font-sans text-[10px] text-[#8E8E93]/50 uppercase font-semibold">BUYERS:</span>
              <input
                type="number"
                min={1}
                max={500}
                value={buyersCount}
                disabled={isRunning || isTriggering}
                onChange={(e) => setBuyersCount(Number(e.target.value))}
                className="w-full h-8 bg-transparent text-left font-mono text-sm text-[#F2F2F7] focus:outline-none font-bold"
              />
            </div>
            
            <button
              type="button"
              disabled={isRunning || isTriggering}
              onClick={() => setUseLLM(!useLLM)}
              className="h-8 rounded-lg px-3.5 font-sans text-[10px] font-semibold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer bg-white/[0.03] text-[#8E8E93] hover:text-white border border-white/[0.04]"
            >
              <span>{useLLM ? "GPT" : "Rule Swarm"}</span>
              {useLLM && <Sparkles className="h-3.5 w-3.5 text-[#C5A880]" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isRunning || isTriggering}
            className="h-10 px-8 flex items-center justify-center gap-2 font-sans text-xs font-bold text-black bg-[#C5A880] hover:bg-[#E5D3B3] hover:shadow-[0_0_25px_rgba(197,168,128,0.25)] transition-all cursor-pointer rounded-xl active:scale-95 disabled:opacity-40 disabled:scale-100"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Coordinating Swarm...
              </>
            ) : isTriggering ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Booting Core...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-black text-black" />
                Initialize Loop
              </>
            )}
          </button>
        </form>

        {/* Refined loop bar (if active) */}
        {(isRunning || progressPct > 0) && (
          <div className="space-y-2.5 max-w-md pt-2">
            <div className="flex items-center justify-between text-xs text-[#8E8E93] font-sans font-medium">
              <span>Sourcing Convergence Loop</span>
              <span className="font-mono font-bold text-[#F2F2F7]">
                {progressPct}% ({streamState?.done} / {streamState?.total})
              </span>
            </div>
            <div className="w-full bg-white/[0.03] h-1 rounded-full overflow-hidden border border-white/[0.04]">
              <div
                className="bg-gradient-to-r from-[#C5A880] to-[#E5D3B3] h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(197,168,128,0.4)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
