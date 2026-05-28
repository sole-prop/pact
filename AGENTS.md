# PACT — AGENTS.md
## AI Engineering Operating System — May 2026

### Mission
Build the frontend dashboard for PACT — an autonomous 
B2B negotiation marketplace. The SAO engine processes 
28,530 negotiations per second. Zero LLM cost per round.
The interface must make that scale feel inevitable 
and operational, not impressive or startup-y.

### What PACT Is
An execution engine. A market coordination layer.
An operational intelligence system.
Every interface decision reinforces this.

### What PACT Is Not
A SaaS dashboard. A startup template. A chatbot.
A Notion clone. A generic AI wrapper. A toy demo.

### System Architecture — Read Before Every Session
The backend is COMPLETE. Do not rebuild it.

Backend runs at localhost:8000.
All frontend API calls use RELATIVE URLS ONLY.
next.config.ts proxies /api/backend/* to backend.
Never write http://localhost:8000 anywhere in frontend.

Key backend endpoints:
  GET  /api/backend/health
  GET  /api/backend/api/stats/latest-report
  GET  /api/backend/api/stats/stream-progress  ← SSE
  POST /api/backend/api/stats/run-stress-test
  POST /api/backend/api/negotiate
  POST /api/backend/api/negotiate/select

The negotiation engine:
  Pure SAO protocol — rule-based, no LLM per round
  6 seller strategies: boulware, conceder, tit_for_tat,
    hardball, aspirational, realistic
  Two-pass BATNA pre-screening on all negotiations
  Sentinel agent — 8 security checks per deal
  MCDA ranking — 5 dimensions (price 40%, delivery 30%,
    quality 20%, reputation 5%, payment 5%)
  Mock data: 1000 sellers, 10 categories
  Demo config: 3300 buyers/category, seed 42,
    no-llm, infinite-stock → ~62 seconds, 1.69M negs

GPT-5.5 used ONLY for:
  Constraint extraction (natural language → JSON schema)
  Use Responses API with structured outputs
  Use reasoning_effort: "low" (schema following only)
  Never call GPT-5.5 inside the negotiation loop

### Engineering Doctrine
Priority order — non-negotiable:
1. Demo reliability — nothing breaks during the demo
2. Visual clarity — numbers read instantly
3. Code simplicity — no clever abstractions
4. Nothing else matters at this stage

Do NOT build: auth, real payments, WebSockets
(SSE only), external DB (MockDB works), user 
management, microservices.

### Design Doctrine
Reference: Bloomberg Terminal meets Linear.app.
Feel: operational intelligence, institutional gravity.

Color system — five values only, no exceptions:
  Base:           #0A0A0A
  Surface:        #111111
  Border:         #1E1E1E
  Text primary:   #F2F2F7
  Text secondary: #8E8E93
  Text tertiary:  #48484A

No accent colors. No gradients. No glassmorphism.
No decorative motion. Motion means: opacity 0.2s ease.
Card shadow only: box-shadow 0 1px 3px rgba(0,0,0,0.4)

Typography rules — no exceptions:
  All labels: Geist Sans, 10-11px, uppercase,
              letter-spacing 0.08em
  All numbers: Geist Mono, tabular-nums,
               font-variant-numeric tabular-nums,
               font-feature-settings "tnum"
  Body text:   Geist Sans

Spacing: 8px base unit — every value is a multiple.
Cards: 6px radius, 24px padding.
Pills: 4px radius, 3px-8px padding.
Progress bars: 3px height, 2px radius.

Shared tokens live ONLY in src/lib/theme.ts.
Never hardcode color values in components.

### Technical Rules — Non-Negotiable
All API calls: relative URLs starting /api/backend/
Python commands: always py not python (Windows)
Asyncio fix: top of every Python file that uses async
Geist: npm install geist (not Google Fonts)
Build must pass: npm run build with zero errors
SSE: EventSource pointing to relative URL
No hardcoded ports anywhere in frontend
Proxy in next.config.ts handles all backend routing

### Execution Modes
Declare at start of every Codex session:

MODE: ARCHITECT   analyze and plan only, zero code
MODE: IMPLEMENTER execute the one scoped task only
MODE: REVIEWER    audit, detect drift, fix violations
MODE: DEMO        optimize demo path and perception

### Anti-Drift Protocol — Run After Every Session
1. Any color outside approved system? Fix immediately.
2. Any hardcoded localhost URL? Fix immediately.
3. Any number without tabular-nums? Fix immediately.
4. Any generic SaaS pattern (rounded buttons, blue 
   accents, card shadows everywhere)? Remove.
5. npm run build — must pass before session closes.
6. Demo path works end to end? Verify manually.

### Token Budget — One Session, One Job
Each Codex session has exactly one deliverable.
Stop and start fresh rather than continuing drift.
If a session exceeds 30K tokens without completing
its job, start a new session with a focused prompt.

### Test Commands
npm run build                              ← must pass
py simulation/stress_test.py --buyers 5 
   --seed 42 --no-llm                     ← under 5s
curl localhost:8000/health                 ← returns ok
curl localhost:3000/api/backend/health     ← via proxy

### Non-Negotiables
Works on Windows
No paid services  
Relative URLs everywhere
Cold-starts cleanly
Graceful offline fallback on every page
