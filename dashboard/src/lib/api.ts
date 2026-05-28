import { LatestReport, NegotiateRequest, NegotiateResponse } from "@/types/pact";

/**
 * Perform a fetch request to relative paths.
 * All API routes start with /api/backend/ which Next.js proxies to localhost:8000.
 */
async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api/backend${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(
      `API error: [${response.status}] ${response.statusText} - ${errorText}`
    );
  }

  return response.json() as Promise<T>;
}

export const api = {
  /**
   * Get health status of the backend.
   */
  async getHealth(): Promise<{ status: string }> {
    return apiFetch<{ status: string }>("/health");
  },

  /**
   * Get the latest stress test report details.
   */
  async getLatestReport(): Promise<LatestReport> {
    return apiFetch<LatestReport>("/api/stats/latest-report");
  },

  /**
   * Get the automotive stress test report details.
   */
  async getAutomotiveReport(): Promise<LatestReport> {
    return apiFetch<LatestReport>("/api/stats/automotive-report");
  },

  /**
   * Trigger a full background stress test with buyers parameter.
   */
  async triggerStressTest(params: {
    sector?: string;
    buyers_per_category: number;
    seed: number;
    use_llm: boolean;
    infinite_stock?: boolean;
  }): Promise<{ message: string }> {
    const query = new URLSearchParams({
      sector: params.sector || "standard",
      buyers_per_category: String(params.buyers_per_category),
      seed: String(params.seed),
      use_llm: String(params.use_llm),
      infinite_stock: String(params.infinite_stock ?? true),
    });
    return apiFetch<{ message: string }>(`/api/stats/run-stress-test?${query.toString()}`, {
      method: "POST",
    });
  },

  /**
   * Run a single negotiation for a buyer against category sellers (form submit).
   * Note: The router POST /api/stats/run-single handles this in backend.
   */
  async negotiate(req: NegotiateRequest): Promise<NegotiateResponse> {
    // Map form fields to API fields
    const apiPayload = {
      category: req.category,
      quantity: req.quantity,
      target_price: req.target_price,
      max_price: req.max_price,
      quality_min: req.quality_min,
      deadline_days: req.deadline_days,
      payment_preference: req.payment_preference,
      urgency_level: req.urgency_level,
      location_state: req.location_state,
      buyer_name: req.buyer_name || "Dashboard User",
    };

    return apiFetch<NegotiateResponse>("/api/stats/run-single", {
      method: "POST",
      body: JSON.stringify(apiPayload),
    });
  },

  /**
   * Confirm/Select a deal from a session and initiate escrow stub.
   */
  async confirmDeal(
    sessionId: string,
    dealRank: number,
    buyerWhatsapp: string = "+919876543210"
  ): Promise<{ success: boolean; message?: string; payment_link?: string }> {
    const query = new URLSearchParams({
      session_id: sessionId,
      deal_rank: String(dealRank),
      buyer_whatsapp: buyerWhatsapp,
    });

    return apiFetch<{ success: boolean; message?: string; payment_link?: string }>(
      `/api/negotiate/select?${query.toString()}`,
      {
        method: "POST",
      }
    );
  },
};
