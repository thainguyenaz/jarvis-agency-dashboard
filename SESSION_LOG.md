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

### 2026-04-18 — CTM daily report staleness banner (interim safety)

Root cause discovered: Jarvis daily call quality report at 8:05 AM ignores CTM's native 1-5 star rating field and auto-scores by duration (>180s = 4★, >90s = 3★) in `src/integrations/ctm/connector.js::computeQualityScore`. Last admissions manual tag was 2026-04-12 — 5-6 days stale. Report has been claiming ~60 qualified leads/30d when admissions actually tagged 3. This has been artificially LOWERING reported CPL precisely when admissions stops tagging.

Interim fix shipped (commit `398b7ae` on jarvis-marketing-agency main): staleness banner at top of Telegram report when `daysSinceLastAdmissionsTag > 2`. Banner text: "⚠️ TAGGING STALE — LAST ADMISSIONS TAG X DAYS AGO ... Treat CPL numbers as unreliable until admissions tagging resumes." File touched: `src/monitors/ctm-quality-monitor.js` (+48, -1). No changes to `computeQualityScore`, CPL math, connector, or any database. Verified by dry-run harness — banner rendered with "LAST ADMISSIONS TAG 5 DAYS AGO" as of Apr 18 16:28 UTC. pm2 jarvis-telegram restarted; `[CTM-QUALITY] Scheduled: Daily 8:05am Arizona` reconfirmed in logs.

Admissions-tag keywords checked (case-insensitive substring match): `qualified`, `not qualified`, `voicemail`, `wrong number`, `follow up`, `admit`, `referral`. 30-day lookback window. If the lookup errors or returns zero calls, a softer fallback banner is used ("Could not verify admissions tag freshness"). If qualifiedCount === 0 AND missed5Star === 0, the report is still skipped entirely (pre-existing behavior preserved).

Permanent fix tracked for Monday: (1) read CTM's native rating field as primary signal in `computeQualityScore`, (2) separate "tagged-qualified" from "duration-qualified" in the report, (3) make duration-qualified calls NOT feed the qualified-CPL ratio.

Related action: Thai to notify Adam Leonard that admissions tagging has been stale since Apr 12 and must resume for the report to be meaningful going forward.

### 2026-04-18 — User-add email fire-and-forget fix

Root cause: `POST /api/admin/users` called `transporter.sendMail(...)` fire-and-forget (no `await`, only `.then/.catch` for logging) and returned `email_sent` based on whether `SMTP_USER` env var existed — not whether delivery actually succeeded. Admin UI would show "email sent" even on later bounce. Surfaced during the 2026-04-17 Megan Pitcher credential-email miss diagnostic.

Fix shipped (jarvis-workspace commit `5f6ac3d`, single file: `jarvis-api/src/routes/admin.js`): awaited `sendMail` inside try/catch. Response now returns `email_sent` (true only on resolved send), `email_message_id` (M365 messageId on success, else null), `email_error` (short safe error string on failure, else null). HTTP status is now 201 Created on success. User creation is NOT rolled back on email failure — admin sees row inserted + email failed and can relay credentials manually (as Thai did for Megan).

Verification — live test with a throwaway `testfire*` user against the production VPS (id 8, deleted immediately after via admin DELETE endpoint, table returned to original 5 rows):
- HTTP 201
- `email_sent: true`
- `email_message_id: "<652da798-4c19-4766-242b-0caf767917d9@desertrecoverycenters.com>"` — real M365 messageId
- `email_error: null`
- pm2 jarvis-api restart clean (restart #70, no startup errors)

Related: Megan's missing email (2026-04-17) was not caused by this bug. Send actually succeeded at the SMTP hop (`[ADMIN] Welcome email sent to getthepitch@gmail.com` in logs) and landed in Gmail Spam due to plaintext temporary password in the template + probable SPF/DKIM misalignment on M365 → gmail.com delivery. That's Monday scope.

Monday scope remaining (explicitly NOT done today): (1) switch to token-based password-set link instead of plaintext password in the email body, (2) new frontend `/set-password/[token]` page, (3) `password_reset_tokens` table, (4) audit SPF/DKIM/DMARC for the M365 sender identity against desertrecoverycenters.com, (5) email template rewrite to remove spam-triggering patterns (bright accent colors, monospace password box, "TEMPORARY PASSWORD" label). Template, SMTP config, DB schema, and dashboard frontend unchanged by this fix.
