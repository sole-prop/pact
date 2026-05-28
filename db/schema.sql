-- ============================================================
-- A2A B2B MARKETPLACE — SUPABASE SCHEMA
-- VERITUS VENTURES (OPC) PRIVATE LIMITED
--
-- HOW TO USE:
--   1. Open your Supabase project → SQL Editor
--   2. Paste this entire file and click RUN
--   3. All tables, indexes, and RLS policies are created
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- SELLERS
-- ============================================================
CREATE TABLE IF NOT EXISTS sellers (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id             TEXT UNIQUE,            -- e.g. S001 from mock data
    name                    TEXT NOT NULL,
    gstin                   TEXT UNIQUE,
    udyam_number            TEXT,                   -- MSME Udyam registration
    category                TEXT NOT NULL,
    location_state          TEXT,
    floor_price_per_unit    NUMERIC(14, 2),
    list_price_per_unit     NUMERIC(14, 2),
    moq                     INTEGER DEFAULT 10,
    max_order_qty           INTEGER DEFAULT 10000,
    quality_grade           TEXT DEFAULT 'B',       -- A / B / C
    quality_certifications  TEXT[] DEFAULT '{}',
    delivery_days_min       INTEGER DEFAULT 5,
    delivery_days_max       INTEGER DEFAULT 21,
    payment_terms_accepted  TEXT[] DEFAULT '{"net_30"}',
    negotiation_strategy    TEXT DEFAULT 'boulware',
    max_discount_pct        NUMERIC(5,2) DEFAULT 10.0,
    current_stock_units     INTEGER DEFAULT 0,
    rating                  NUMERIC(3,1) DEFAULT 4.0,
    total_orders_completed  INTEGER DEFAULT 0,
    whatsapp_number         TEXT,
    tally_ledger_id         TEXT,
    is_msme_registered      BOOLEAN DEFAULT TRUE,
    is_verified             BOOLEAN DEFAULT FALSE,  -- GST/Udyam verified
    is_online               BOOLEAN DEFAULT TRUE,
    blacklisted_by          TEXT[] DEFAULT '{}',
    onboarded_via           TEXT DEFAULT 'manual',  -- manual / whatsapp / excel / tally
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BUYERS
-- ============================================================
CREATE TABLE IF NOT EXISTS buyers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id         TEXT UNIQUE,
    name                TEXT NOT NULL,
    gstin               TEXT UNIQUE,
    udyam_number        TEXT,
    location_state      TEXT,
    whatsapp_number     TEXT UNIQUE,
    director_name       TEXT,                       -- from GST API verification
    registered_address  TEXT,
    is_verified         BOOLEAN DEFAULT FALSE,
    onboarded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NEGOTIATION SESSIONS
-- One session per buyer request (covers up to 100 sellers)
-- ============================================================
CREATE TABLE IF NOT EXISTS negotiation_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id                UUID REFERENCES buyers(id) ON DELETE CASCADE,
    required_category       TEXT NOT NULL,
    quantity_units          INTEGER NOT NULL,
    target_price            NUMERIC(14, 2),
    max_price               NUMERIC(14, 2),
    quality_min             TEXT DEFAULT 'B',
    delivery_deadline_days  INTEGER DEFAULT 30,
    payment_preference      TEXT DEFAULT 'net_30',
    status                  TEXT DEFAULT 'pending',
        -- pending | running | completed | failed | expired
    sellers_queried         INTEGER DEFAULT 0,
    deals_reached           INTEGER DEFAULT 0,
    deals_failed            INTEGER DEFAULT 0,
    failure_summary         JSONB DEFAULT '{}',
    top_deals               JSONB DEFAULT '[]',     -- top-10 serialized
    whatsapp_message_id     TEXT,                   -- ID of WA message sent to buyer
    buyer_selection         INTEGER,                -- rank (1-10) buyer chose
    selected_seller_id      UUID REFERENCES sellers(id),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    completed_at            TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ============================================================
-- DEALS (Individual seller outcomes within a session)
-- ============================================================
CREATE TABLE IF NOT EXISTS deals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID REFERENCES negotiation_sessions(id) ON DELETE CASCADE,
    buyer_id            UUID REFERENCES buyers(id),
    seller_id           UUID REFERENCES sellers(id),
    seller_external_id  TEXT,
    final_price         NUMERIC(14, 2),
    quantity            INTEGER,
    quality_grade       TEXT,
    delivery_days       INTEGER,
    payment_term        TEXT,
    composite_score     NUMERIC(6, 4),
    rank_in_session     INTEGER,                    -- 1-10 (top deals only)
    narrative           TEXT,
    deal_reached        BOOLEAN DEFAULT FALSE,
    failure_reason      TEXT,
    negotiation_rounds  INTEGER DEFAULT 0,
    status              TEXT DEFAULT 'shortlisted',
        -- shortlisted | selected | contract_locked | fulfilled | cancelled
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRANSACTIONS  (Nodal account + settlement — stub for now)
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id             UUID REFERENCES deals(id),
    session_id          UUID REFERENCES negotiation_sessions(id),
    buyer_id            UUID REFERENCES buyers(id),
    seller_id           UUID REFERENCES sellers(id),
    order_value         NUMERIC(14, 2) NOT NULL,
    platform_fee_pct    NUMERIC(5, 4) DEFAULT 0.0100,   -- 1%
    platform_fee        NUMERIC(14, 2),                  -- computed
    supplier_payout     NUMERIC(14, 2),                  -- 99%
    gst_on_fee          NUMERIC(14, 2),                  -- 18% GST on platform fee
    status              TEXT DEFAULT 'pending',
        -- pending | nodal_hold | settled | failed | refunded
    payment_gateway     TEXT DEFAULT 'razorpay',
    gateway_order_id    TEXT,
    gateway_payment_id  TEXT,
    nodal_transfer_id   TEXT,
    eway_bill_number    TEXT,                            -- E-Way Bill API
    eway_bill_url       TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    nodal_hold_at       TIMESTAMPTZ,
    settled_at          TIMESTAMPTZ
);

-- ============================================================
-- ONBOARDING SESSIONS (Zero-KYC WhatsApp flow state)
-- ============================================================
CREATE TABLE IF NOT EXISTS onboarding_sessions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_number         TEXT NOT NULL,
    role                    TEXT DEFAULT 'buyer',    -- buyer | seller
    step                    TEXT DEFAULT 'welcome',
        -- welcome | doc_upload | gst_verify | requirements | completed
    uploaded_doc_url        TEXT,
    extracted_gstin         TEXT,
    extracted_invoice_amount NUMERIC(14, 2),
    extracted_line_items    JSONB DEFAULT '[]',
    gst_api_raw             JSONB DEFAULT '{}',
    verified_company_name   TEXT,
    verified_director       TEXT,
    verified_state          TEXT,
    linked_buyer_id         UUID REFERENCES buyers(id),
    linked_seller_id        UUID REFERENCES sellers(id),
    session_data            JSONB DEFAULT '{}',     -- arbitrary flow state
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- WHATSAPP MESSAGES LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    direction       TEXT NOT NULL,                  -- inbound | outbound
    from_number     TEXT,
    to_number       TEXT,
    message_type    TEXT,                           -- text | document | interactive | list_reply
    wa_message_id   TEXT UNIQUE,
    content         JSONB DEFAULT '{}',
    session_id      UUID REFERENCES negotiation_sessions(id),
    onboard_id      UUID REFERENCES onboarding_sessions(id),
    status          TEXT DEFAULT 'received',        -- received | sent | delivered | read | failed
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LLM CALL LOG (cost tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS llm_calls (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider        TEXT NOT NULL,                  -- ollama | claude | groq | sarvam
    model           TEXT,
    task            TEXT,                           -- invoice_parse | gst_extract | negotiation | translate
    prompt_tokens   INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost_usd        NUMERIC(10, 6) DEFAULT 0,       -- 0 for Ollama
    latency_ms      INTEGER,
    session_id      UUID REFERENCES negotiation_sessions(id),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_sellers_category    ON sellers(category);
CREATE INDEX IF NOT EXISTS idx_sellers_gstin       ON sellers(gstin);
CREATE INDEX IF NOT EXISTS idx_sellers_state       ON sellers(location_state);
CREATE INDEX IF NOT EXISTS idx_sellers_online      ON sellers(is_online, category);
CREATE INDEX IF NOT EXISTS idx_buyers_whatsapp     ON buyers(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_buyers_gstin        ON buyers(gstin);
CREATE INDEX IF NOT EXISTS idx_sessions_buyer      ON negotiation_sessions(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_deals_session       ON deals(session_id, rank_in_session);
CREATE INDEX IF NOT EXISTS idx_onboard_whatsapp    ON onboarding_sessions(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_wa_messages_from    ON whatsapp_messages(from_number, created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (enable but allow service role full access)
-- ============================================================
ALTER TABLE sellers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyers                ENABLE ROW LEVEL SECURITY;
ALTER TABLE negotiation_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_calls             ENABLE ROW LEVEL SECURITY;

-- Allow service role (backend) full access to all tables
CREATE POLICY "service_role_all_sellers"    ON sellers              FOR ALL USING (true);
CREATE POLICY "service_role_all_buyers"     ON buyers               FOR ALL USING (true);
CREATE POLICY "service_role_all_sessions"   ON negotiation_sessions FOR ALL USING (true);
CREATE POLICY "service_role_all_deals"      ON deals                FOR ALL USING (true);
CREATE POLICY "service_role_all_txns"       ON transactions         FOR ALL USING (true);
CREATE POLICY "service_role_all_onboard"    ON onboarding_sessions  FOR ALL USING (true);
CREATE POLICY "service_role_all_wa_msgs"    ON whatsapp_messages    FOR ALL USING (true);
CREATE POLICY "service_role_all_llm"        ON llm_calls            FOR ALL USING (true);

-- ============================================================
-- HELPER FUNCTION: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sellers_updated_at
    BEFORE UPDATE ON sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER onboarding_updated_at
    BEFORE UPDATE ON onboarding_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Done! Verify with: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
