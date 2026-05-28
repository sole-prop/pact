export interface ReportMeta {
  timestamp: string;
  duration_secs: number;
  engine: string;
  llm_model: string;
  seed: number;
  buyers_per_category: number;
  max_rounds: number;
}

export interface ReportSummary {
  total_negotiations: number;
  deals_closed: number;
  deals_failed: number;
  success_rate_pct: number;
  total_deal_value_inr: number;
  platform_fee_inr: number;
  avg_buyer_savings_pct: number;
  avg_vs_list_pct: number;
  avg_rounds_per_deal: number;
  total_llm_tokens: number;
  moq_waivers_granted: number;
  volume_discounts_applied: number;
  partial_fulfillment_deals: number;
  llm_assisted_deals: number;
  batna_rejections: number;
  delivery_trades: number;
  payment_trades: number;
  injection_blocks_total: number;
  sentinel_critical_alerts: number;
  throughput_negs_per_sec: number;
}

export interface SentinelAlert {
  alert_id: string;
  severity: string;
  category: string;
  message: string;
}

export interface SentinelReport {
  total_alerts: number;
  critical: number;
  warnings: number;
  info: number;
  by_category: Record<string, number>;
  round_exhaustion_rate_pct: number;
  total_sessions_monitored: number;
  sample_alerts: SentinelAlert[];
}

export interface FailureSample {
  seller: string;
  category: string;
  price_gap_pct: number;
  strategy: string;
}

export interface FailureReason {
  reason: string;
  label: string;
  count: number;
  pct: number;
  desc: string;
  fix: string;
  severity: string;
  samples: FailureSample[];
}

export interface CategoryStats {
  total: number;
  success: number;
  failed: number;
  success_pct: number;
  avg_savings_pct: number;
  avg_vs_list_pct: number;
  avg_rounds: number;
  moq_waivers: number;
  llm_tokens: number;
}

export interface StrategyStats {
  total: number;
  success: number;
  success_pct: number;
  avg_savings_pct: number;
}

export interface MOQAnalysis {
  total_moq_failures: number;
  moq_waivers_granted: number;
  partial_fulfillment_deals: number;
}

export interface LLMUsage {
  total_tokens: number;
  llm_assisted_deals: number;
  pct_sessions_with_llm: number;
}

export interface AgentLeaderboardItem {
  seller_id: string;
  name: string;
  strategy: string;
  category: string;
  queried: number;
  closed: number;
  success_pct: number;
  avg_savings_pct: number;
  top_failure: string;
}

export interface BuyerProfileStats {
  total: number;
  success: number;
  success_pct: number;
  avg_savings_pct: number;
  avg_vs_list_pct: number;
  desc: string;
}

export interface LatestReport {
  meta: ReportMeta;
  summary: ReportSummary;
  sentinel: SentinelReport;
  round_distribution: Record<string, number>;
  savings_histogram: Record<string, number>;
  by_failure_reason: FailureReason[];
  by_category: Record<string, CategoryStats>;
  by_strategy: Record<string, StrategyStats>;
  by_buyer_profile?: Record<string, BuyerProfileStats>;
  moq_analysis: MOQAnalysis;
  llm_usage: LLMUsage;
  agent_leaderboard: AgentLeaderboardItem[];
}

// Live negotiation form & response types (Session 3)
export interface NegotiateRequest {
  category: string;
  quantity: number;
  target_price: number;
  max_price: number;
  quality_min: string;
  deadline_days: number;
  payment_preference: string;
  urgency_level: string;
  location_state: string;
  buyer_name?: string;
}

export interface TopDeal {
  rank: number;
  seller_id: string;
  seller_name: string;
  category: string;
  final_price: number;
  quantity: number;
  quality_grade: string;
  delivery_days: number;
  payment_term: string;
  composite_score: number;
  savings_pct: number;
  vs_list_pct: number;
  narrative: string;
  close_reason: string;
  moq_waiver: boolean;
  volume_discount: number;
  partial_fulfillment: boolean;
  llm_tokens: number;
  batna_used: boolean;
  multi_dim_trade: string;
}

export interface NegotiateResponse {
  session_id?: string;
  buyer_name: string;
  category: string;
  sellers_queried: number;
  deals_found: number;
  top_deals: TopDeal[];
  duration_seconds: number;
  sentinel_alerts: number;
}

// SSE real-time stream status (Session 2)
export interface StreamUpdate {
  pct: number;
  running: boolean;
  done: number;
  total: number;
}
