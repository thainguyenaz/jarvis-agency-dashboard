---

## 2026-04-17 — Live Data Injection + Agent Grounding Session

### Shipped and verified (8 items)

1. **30 data-verified negative keywords added to Google Ads** across Addiction Treatment [STR], Mental Health Treatment [STR], and Brand [STR]. 10 per campaign, campaign-level. Match types: broad (therapist, therapists near me), phrase (online counseling, over the phone counseling, anger management counseling, substance abuse counselor, drug abuse counselor, forensic psychiatric evaluation), exact ([redemption psychiatry], [valley psychiatric hospital]). Source: April 12 search term analysis ($12,781 / 421 terms / 6mo). Skipped alcohol-screening variant — Striventa baseline had close-match.

2. **Census drift fix (T1)** — all 6 dashboard agents now agree on live Kipu census. Was: Agent 01=55%, others=60% due to hardcoded text in route.ts. Now: all 6 cite live source + timestamp.

3. **Live Google Ads budget cap injection (T1)** — new VPS route /api/google-ads/budget-caps (1-hour cache, read-only). buildLiveOpsBlock() in lib/jarvis-data-server.ts composes LIVE OPERATIONAL DATA section from live Kipu + live Google Ads, prepended to every agent systemPrompt as persona + liveOpsBlock + contextBlock.

4. **Monitor Log dashboard page built (T2)** — /dashboard/monitor-log renders occupancy_budget_log history. 4 KPI cards, filter chips (ALL/HOLD/BELOW_50/ABOVE_90/BELOW_70 legacy), zone and action color coding. Legacy BELOW_70 rows preserved for history.

5. **Standalone /dashboard/approvals fixed (T3)** — URL path was /api/agents/pending-approvals (404), corrected to /api/approvals/pending. Approve/deny buttons wired with POST to /approve and /deny. End-to-end test confirmed.

6. **Agent 07 and Agent 01 updated with NEGATIVE KEYWORD EXECUTION LOG** — new block in BEHAVIORAL_HEALTH_EXPERTISE documenting the April 17 additions. 7/7 MATCH on verification battery. Agents will not re-recommend the 30 closed terms.

7. **60% rot cleanup** — removed all hardcoded occupancy/budget text from route.ts OCCUPANCY_BUDGET_RULE, jarvis-agency-dashboard/CLAUDE.md, jarvis-marketing-agency/CLAUDE.md. Replaced with pointers to buildLiveOpsBlock(). 6/6 LIVE on verification.

8. **Monitor Log auth fix** — page was returning HTTP 401 because inline fetch did not include bearer token. Refactored to use jarvisFetch from lib/api.ts (same pattern as google-ads). Deploys correctly.

### Current state (as of April 17, 2026 end of session)

- Occupancy: 55% (11/20) — HOLD zone
- Live budgets: AT=$1,875/day, MH=$1,250/day, Brand=$25/day
- PMax: PAUSED. Detox: PAUSED.
- Rule: BELOW_50/HOLD/ABOVE_90 with 65/32/3 allocation, no floors, PMax permanently excluded
- All 6 dashboard agents grounded in live data, cite source + timestamp on every answer

### Architecture rules locked in

- Never hardcode occupancy %, bed counts, or daily budget values in prompts. buildLiveOpsBlock is single source of truth.
- OCCUPANCY_BUDGET_RULE is a JS template literal — never use dollar-curly-brace interpolation syntax in prose, breaks build.
- Use jarvisFetch from lib/api.ts for all authenticated dashboard fetches (handles Content-Type + 401 auto-redirect).
- The 30 negatives added April 17 are CLOSED — do not re-recommend them in future search term analyses.

### Git commits (key)

- jarvis-agency-dashboard: 105e661 (live injection), 76f8958 (monitor-log), 47ff93a (approvals fix), da161f4 (rot cleanup), b726f73 (monitor-log auth fix), c9f03fb (agent 07 negatives log)
- jarvis-workspace: 8afddae (/api/google-ads/budget-caps route)
- jarvis-marketing-agency: d15b7c0 (Telegram negatives log), e055fa3 (rot cleanup)

### Residual items (next session)

1. HubSpot deal stage breakdown fix — deals_by_stage and 30d contacts missing from API
2. GBP review automation — OAuth2 pending Google approval
3. Striventa transition: export Google Ads negatives CSV baseline, commit uncommitted VPS work in jarvis-marketing-agency (approval-gate wiring, buildAuditContext, 3-location expertise)
4. Pass 2 dashboard: surface campaign_budget_audit table, decide whether Glendale-GBP-#1 fact should be promoted to all agents vs specialized to Agent 11
5. Doc the template literal interpolation trap somewhere findable

### Verification evidence preserved

- Negative keywords: Thai manual verification in Google Ads UI with screenshots
- Agent grounding: 6-answer verification battery (Agents 01 and 07 × Q1/Q2/Q3) — all LIVE
- Agent 07 memory: 7-answer verification battery — all MATCH
- Monitor Log: curl returned HTTP 200 with runs=5, hold_count_30d=1
- Approvals: end-to-end test with insert/deny/cleanup cycle

---

## 2026-04-18 (post-session) — Bed board accuracy fixes + fake overnight cron disabled

**Bed board split** — Changed outpatient census display from single "Indian School (PHP/IOP)" line to separate Phoenix PHP and Phoenix IOP counts. Kipu returns `program` field on every patient — aggregator in kipu-sync.js was ignoring it. Now splits on program value (PHP, IOP). Updated FACILITIES constant in admissions.agent.js. Kipu location matching keywords (`indian school`, `phoenix`) unchanged — Kipu's internal name is still "Indian School."

**TMS not displayed** — TMS is a concurrent modality, not a census bucket. Kipu `/api/patients/census` does not surface TMS — it's tracked in treatment plans / scheduling. Bed board includes a footer: "TMS tracked separately in Kipu treatment plans — not in census feed." Do NOT add a "Phoenix TMS: 0" line — it would fabricate data. Separate Kipu investigation needed if TMS census display is required.

**Test patient filter upgraded** — TEST2025-118 was leaking into outpatient census as a phantom IOP count, inflating census by 1. `isTestPatient()` in kipu-sync.js (and admissions.agent.js) now also strips patients whose MR starts with "TEST" (case-insensitive). Real outpatient census today was 7 PHP / 0 IOP, not 8.

**Fake overnight report cron disabled** — `/home/openclaw/.openclaw/workspace/tools/report_marketing_phase1.py` was fabricating "kept working overnight in Phase 1 read-only mode" every morning with invented commit hashes and stale March snapshot file counts. Cron line commented out in user crontab (script preserved on disk). Phase 1 read-only was NOT actually violated — the script was lying.

**Pre-existing issues surfaced, not fixed tonight**:
- Residential patients are bucketed by location_name regex but Kipu also sets `program = "Residential - Church" / "Residential - Frier"` — redundant but consistent, no fix needed
- MEMORY.md index line about Kipu API returning "empty 200s, HMAC secret missing" was stale and has been updated — API returns real data now
