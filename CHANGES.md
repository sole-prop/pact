Changelog — automated fixes applied on 2026-05-28

- Replaced WhatsApp integration with internal `api.services.notification` (demo mode).
  - Removed `api/routers/whatsapp.py` and `api/services/whatsapp_sender.py`.
  - Onboarding and negotiate flows now use `notification.send_message` / `send_text`.

- Added structured logging and replaced `print(...)` calls in core API services:
  - `api/main.py` now configures logging and uses logger instead of prints.
  - Replaced prints with logging in: `invoice_parser.py`, `gst_verifier.py`, `sarvam.py`, `llm_router.py`, `api/routers/stats.py`.

- Avoided blocking file I/O in async endpoints:
  - `api/routers/negotiate.py` now loads `mock_sellers.json` via `asyncio.to_thread`.
  - `api/routers/stats.py` seller cache loader is async and reads files via `asyncio.to_thread`.
  - Latest report and automotive report reads are now non-blocking.

- Frontend proxy hardcoded URL removed in favor of `process.env.BACKEND_URL` in `dashboard/next.config.ts`.

- Added `api/services/notification.py` to log and optionally persist notifications to DB (table `notifications`).

Notes & next recommended steps:
- Run the full test suite and `npm run build` for the dashboard.
- Add CI checks for linting and to ensure no hardcoded URLs or prints are reintroduced.
- Add DB migration to drop WhatsApp-specific columns/tables or alias them to generic notification fields if desired.

If you want, I can:
- Open a PR with these changes and run tests/build.
- Convert other remaining `print` usages in `simulation/` scripts to logging.
- Add a lightweight integration test to exercise onboarding → negotiate → select flows.
