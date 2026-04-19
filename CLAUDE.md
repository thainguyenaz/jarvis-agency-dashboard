# Jarvis Agency Dashboard — Claude Code Build Context

## What this project is
Next.js dashboard for Desert Recovery Centers (DRC) marketing analytics.
Houses the 6-agent chat system with BEHAVIORAL_HEALTH_EXPERTISE block in app/api/chat-agent/route.ts.

## Data-Verified Negative Keyword List (April 12, 2026)
Source: 6-month search term analysis (Oct 2025 — Apr 2026), 421 matched terms, $12,781 spend, 33 conversions.
Hardcoded into BEHAVIORAL_HEALTH_EXPERTISE in app/api/chat-agent/route.ts.

### Confirmed negatives — add to all campaigns
- therapist, therapists near me (0 conv, outpatient intent)
- online counseling, over the phone counseling (0 conv, excluded)
- anger management counseling (0 conv)
- counselors [city] — mesa, chandler, tempe (outpatient provider search)
- substance abuse counselor ($117, 0 conv)
- drug abuse counselor ($104, 0 conv)
- alcohol screening with a licensed counselor ($158, 0 conv)
- forensic psychiatric evaluation ($51, 0 conv)
- redemption psychiatry (competitor, $58, 0 conv)
- valley psychiatric hospital (competitor, $65, 0 conv)
- crossroads counseling scottsdale (competitor)

### Do NOT add as negatives — data shows these convert
- mental hospital / mental hospital phoenix / mental hospitals near me (9 conv, $422 CPA)
- inpatient psychiatric hospital phoenix (2 conv)
- long term inpatient psychiatric care (1 conv)
- psychiatrist (1 conv at $396 — DRC hiring psychiatrist MD)
- addiction counseling (1 conv at $188)
- i need counseling now (1 conv, crisis intent)
- psychology referral service (1 conv)

### New keyword opportunities (psychiatrist hire)
- psychiatrist Arizona luxury
- inpatient psychiatrist Phoenix
- psychiatric evaluation and treatment Arizona
- dual diagnosis psychiatrist Arizona
- luxury psychiatric care Scottsdale

### NEGATIVE KEYWORD EXECUTION LOG (April 17, 2026)

Thai manually added 10 data-verified negatives to 3 active Google Ads campaigns (Addiction Treatment [STR], Mental Health Treatment [STR], Brand [STR]) at the campaign level — 30 total entries. Source: April 12, 2026 search term analysis ($12,781 / 421 terms / 6-month lookback).

Negatives added (same 10 to each of 3 campaigns):
- Broad match: therapist, therapists near me
- Phrase match: "online counseling", "over the phone counseling", "anger management counseling", "substance abuse counselor", "drug abuse counselor", "forensic psychiatric evaluation"
- Exact match: [redemption psychiatry], [valley psychiatric hospital]

Deliberately NOT added: "alcohol screening with a licensed counselor" — Striventa had a close variant exact-match already in place.

Baseline context: Striventa managed a comprehensive negative keyword list prior to April 17 (hotlines, 12-step, gambling, competitors, addresses, Medicaid, free-service terms). These additions target an outpatient-counselor-seeker gap the baseline missed.

Agents must treat these 10 negatives as CLOSED — do not re-recommend them. New negatives require Thai approval before adding.

---

# JARVIS AGENCY DASHBOARD — HARDCODED DECISIONS LOG

Last updated: April 13, 2026

## MODEL
- All agents use claude-opus-4-20250514
- max_tokens: 4096
- Never downgrade to Sonnet without Thai explicit approval

## RESPONSE FORMAT RULES (enforced in all agent system prompts)
- Always complete full response in ONE message — never truncate
- Use clear headers with --- separators between sections
- Use bullet points for lists, not paragraphs
- Use specific numbers and data — never say 'unknown' if data is available
- Be direct and detailed like a senior analyst
- Every recommendation must cite data source (CTM, Google Ads API, Kipu, etc.)
- Minimum 500 words for strategic questions with actual numbers

## PRIMARY METRIC — NON-NEGOTIABLE
The ONLY metric that matters is CTM 4-5 star qualified leads with call duration >= 120 seconds.
- Google Ads "conversions" mean nothing without CTM quality confirmation
- Any campaign with zero 4-5 star calls in 30 days = FAILING
- Any campaign with qualified CPL > $1,500 = CRITICAL
- Calls under 60 seconds = FAKE or WRONG NUMBER
- Calls 60-120 seconds = BORDERLINE — treat as unqualified
- Calls 120+ seconds with 4-5 stars = TRUE QUALIFIED LEADS
- Every recommendation must tie back to: does this drive more 4-5 star calls over 2 minutes?

## CTM DATA IN ALL AGENTS
All 6 agents (01, 03, 07, 11, 18, 20) must receive:
- CTM quality report (4-5 star distribution, qualification rate by source)
- Qualified leads deep (2+ minute, 4-5 star filtered calls)
- Campaign quality correlation (qualified CPL per campaign)

## CURRENT BASELINE (established April 12, 2026)
- True qualified leads: 51/month (4-5 star, 2+ min, answered)
- True qualification rate: 8.6% (51 of 591 calls)
- Avg qualified call duration: 6min 19sec
- Paid qualified CPL: $2,500
- Top sources by qualified leads:
  - Google Ads: 20 leads at $2,500 CPL
  - Google Organic: 10 leads at $0 CPL
  - GBP Combined: 10 leads at $0 CPL
  - Recovery.com: 7 leads at 54.5% qualification rate
  - Direct/Unknown: 4 leads at $0 CPL
- Target: 100 qualified leads/month by Day 90

## OCCUPANCY-BASED BUDGET CONTROL (APRIL 17 2026 — ACTIVE RULE, Thai-approved)

This is the SINGLE SOURCE OF TRUTH for budget posture. Any answer about budgets, zones, occupancy-linked spend, or campaign allocation must reference this rule. Do not invent zone schemes. Do not reference old BELOW_70/MAINTAIN rules. Do not reference $1,200 floors, $500 floors, PMax $3K monthly hold, or proportional/monthly-divided-by-30 math — all DELETED.

MONITOR:
- Runs 8:10am AZ daily via occupancy-budget-monitor.js
- Targets ACTUAL PROJECTED SPEND, not budget cap sums
- Never auto-executes. Every proposal goes to Thai via Telegram for approval.

ZONES:
- BELOW_50 (< 50% occupancy) → queue INCREASE proposals to zone target; $65K/month actual spend target
- HOLD (50-89% occupancy) → do nothing; no proposals, no Telegram alerts; log only
- ABOVE_90 (>= 90% occupancy) → queue DECREASE proposals to zone target; $50K/month actual spend baseline

FIXED ALLOCATION (PMax permanently excluded):
- Addiction Treatment: 65%
- Mental Health: 32%
- Brand: 3%

ZONE CAP TARGETS:
- BELOW_50: AT=$1,875/day, MH=$1,250/day, Brand=$25/day
- ABOVE_90: AT=$1,442/day, MH=$961/day, Brand=$20/day

FLOORS: NONE. The old $1,200 AT/MH floors and $500 Brand floor are REMOVED.

PAUSED CAMPAIGNS (do not touch without Thai's explicit approval):
- Detox — permanently paused. Broken economics ($28,942 qualified CPL over 17 months, $121,184 spend, 1 qualified lead / 90 days).
- PMax — permanently paused. Excluded from allocation. No $3K monthly hold. No redistribution.

CURRENT STATE:
Live occupancy, bed count, zone, live daily budgets, and monitor run status are read from Kipu census API and Google Ads API at runtime and injected into agent prompts via buildLiveOpsBlock() (lib/jarvis-data-server.ts). Do NOT hardcode current-state values in this doc — they will drift and conflict with the live-injected data. For live values, query any dashboard agent or see /dashboard/monitor-log.

APPROVAL GATES:
- Budget changes > 30% of current → require Thai approval
- Any bid strategy change → require Thai approval
- Any PMax or Detox unpause → require Thai approval
- Any new campaign launch → require Thai approval
- Learning phase active on a campaign → no changes

### Config files
- Guardrails: `/home/openclaw/jarvis-marketing-agency/config/budget-guardrails.json`
- Monitor: `/home/openclaw/jarvis-marketing-agency/src/monitors/occupancy-budget-monitor.js`
- Wired in: `/home/openclaw/jarvis-marketing-agency/src/cmo-entry.js`

## DATA ARCHITECTURE
- VPS: 93.188.166.239 (Hostinger Ubuntu)
- All API calls from Vercel must use public VPS IP — never localhost
- jarvis-data-server.ts VPS_BASE = 'https://api.desertrecoverycenters.com' (nginx HTTPS proxy → port 3002)
- SQLite first, API fallback for all data fetches
- SQLite DB: /home/openclaw/data/jarvis-cache.db

## USERS AND ACCESS (as of April 13, 2026)
- thai / admin / full access + sees all conversations
- jason / user / Jason Inserra / full agent access / private conversations
- adam / user / Adam Leonard / full agent access / private conversations
- blayne / user / Blayne Archer / full agent access / private conversations
- Default user password: DRC2026! (users should change on first login)

## NEGATIVE KEYWORDS — DATA VERIFIED (April 12, 2026)
Add to Mental Health campaign:
- therapist, therapists near me (zero conversions confirmed)
- online counseling, over the phone counseling
- anger management counseling
- counselors [city] — mesa, chandler, tempe
- substance abuse counselor
- alcohol screening with a licensed counselor
- forensic psychiatric evaluation
- redemption psychiatry (competitor)
- valley psychiatric hospital (competitor)
- crossroads counseling scottsdale (competitor)

DO NOT add as negatives (converting traffic confirmed):
- mental hospital, mental hospital phoenix (9 convs, crisis intent)
- inpatient psychiatric hospital (2 convs)
- long term inpatient psychiatric care (1 conv)
- psychiatrist (DRC hiring psychiatrist MD — keep)
- addiction counseling (1 conv)
- i need counseling now (1 conv)

## VERIFIED KEYWORD OPPORTUNITIES (Google Keyword Planner confirmed)
Build as exact match only:
- [tricare rehab] — 110/mo, LOW competition
- [tricare approved rehabs] — 90/mo, LOW competition
- [dual diagnosis] — 4,900/mo, LOW competition
- [dual diagnosis near me] — 210/mo
- [executive rehab] — 210/mo, LOW competition
- [private luxury rehab] — 90/mo, LOW competition
- [luxury alcohol treatment] — 70/mo, LOW competition
- [rehab for men near me] — 400/mo, Medium competition
- [women's rehab near me] — 720/mo, Medium competition
- [female rehab] — 720/mo, Medium competition

## CONFIRMED WASTE — PAUSE IMMEDIATELY
- 25 zero-conversion keywords: $10,755/month confirmed waste
- Near Me ad groups: $4,310 for 1 conversion
- Tablets + Connected TV: $521, zero conversions
- Detox Treatment [STR]: $121,184 all-time, zero qualified leads — stay paused

## BUDGET REALLOCATION PLAN (SUPERSEDED April 17, 2026)
The previous reallocation plan (PMax $3K hold, MH $14K exact match, AT $12K exact match,
new test campaigns) is DELETED. Budget posture is now governed exclusively by the
OCCUPANCY-BASED BUDGET CONTROL rule above. PMax and Detox are PERMANENTLY PAUSED.

## CTM OFFLINE CONVERSION UPLOAD (built April 10, 2026)
- Status: DRY RUN active — go-live April 17, 2026
- Filters: 4-5 star calls, duration >= 120 seconds, answered only
- Conversion action: "Quality Inbound Call" in Google Ads
- Cron: 9:05 AM Arizona daily
- To go live: change crontab to add --live flag
- Deduplication: active — won't double-upload

## STRIVENTA TRANSITION
- Ghosted Friday April 11 deadline
- Account ownership transfer email drafted — send Monday BEFORE termination
- $121,184 Detox waste documented for termination letter
- Google Ads Standard Access application submitted April 13, 2026

## DAZOS MIGRATION (planned within 30 days)
- Replacing HubSpot with Dazos CRM (behavioral health specific)
- Dazos pre-integrated with Kipu EMR
- Call Dazos: (888) 230-2120 — ask for API docs
- HubSpot forms on website must be replaced before cutover
- Jarvis HubSpot connector will need full rebuild for Dazos

## WEEKLY MONITORING
- CTM quality report: Monday 7am AZ via Telegram
- CTM conversion upload: 9:05am daily
- Google Ads change monitor: 9am daily
- Health check: 8am daily
- SQLite backup: 2am AZ daily → SharePoint auto-upload

---

## DEPLOYMENT ARCHITECTURE — CRITICAL RULES

### Repo → Vercel Project Mapping (NEVER mix these up)
- jarvis-agency-dashboard repo → Vercel project: jarvis-agency-dashboard (prj_wMnjlqcpKdGdGj1UkUjyvcpfHVXR)
- jarvis-workspace/command-center → Vercel project: command-center (prj_g8i4CccsMTjx2XR3gudqAqCEjMPs) — IGNORED via ignoreCommand, do not use
- jarvis-marketing-agency → pm2 only, NO Vercel deployment
- jarvis-workspace/jarvis-api → pm2 only, NO Vercel deployment

### Where Each File Lives
- Dashboard frontend (Next.js): /home/openclaw/jarvis-agency-dashboard/
- API backend (Express): /home/openclaw/jarvis-workspace/jarvis-api/
- Agent runtime + crons: /home/openclaw/jarvis-marketing-agency/
- Command center (deprecated): /home/openclaw/jarvis-workspace/command-center/ — DO NOT USE

### Rules for Claude Code
1. Frontend changes (UI, pages, components) → ALWAYS go in jarvis-agency-dashboard
2. API route changes → ALWAYS go in jarvis-workspace/jarvis-api
3. Agent/cron/Telegram changes → ALWAYS go in jarvis-marketing-agency
4. NEVER commit frontend code to jarvis-workspace
5. NEVER commit API routes to jarvis-agency-dashboard
6. NEVER use localhost:3002 in jarvis-agency-dashboard — use https://api.desertrecoverycenters.com (nginx HTTPS proxy to VPS port 3002). Direct HTTP to 93.188.166.239:3002 causes mixed-content block in browsers.
7. command-center is deprecated — do not add features or fix bugs there

### PM2 Process Map
- id 1: jarvis-agents → /home/openclaw/jarvis-marketing-agency/index.js
- id 2: jarvis-api → /home/openclaw/jarvis-workspace/jarvis-api/src/index.js
- id 3: jarvis-marketing-agency → /home/openclaw/jarvis-marketing-agency/src/cmo-entry.js

### Vercel Deploy Confirmation
After every push to jarvis-agency-dashboard, confirm deploy at:
https://vercel.com/thainguyenazs-projects/jarvis-agency-dashboard
Expected: Ready in ~29 seconds

---

## CTM CACHE ARCHITECTURE (fixed April 14, 2026)

### Nightly Sync Schedule (runs 2am AZ via nightly-sync.js)
- ctm/qualified-history-12m — 24hr TTL (heavy 12-month pull — MUST be in nightly sync)
- ctm/quality-30d — 4hr TTL
- ctm/campaign-quality-30d — 4hr TTL
- All other CTM endpoints — 4hr TTL

### Stale-While-Revalidate Pattern
- When cache expires: return stale data immediately, trigger background refresh
- Never block the user waiting for live CTM API
- Only blocks on cold cache (first-ever load after server restart)
- Cold cache load time: 2-5 minutes (unavoidable — CTM API is slow)

### Performance Targets
- Cache warm: under 0.2 seconds
- Cache expired: under 0.2 seconds (stale served + background refresh)
- Cold cache: 2-5 minutes (acceptable — only happens once)

### Freshness Metadata
Every CTM response includes: _fetchedAt, _ageMinutes, _cached
UI displays "Last updated: X minutes ago (cached)" in green/yellow

---

## AGENT 07 — VERIFIED WORKING (April 14, 2026)

### Anti-Hallucination Fix (commits eee27b9 + 25285c9)
- Campaign data injected as single numbered list with ALL metrics attached
- CTM by-source explicitly labeled "TRAFFIC SOURCE (NOT Google Ads campaign names)"
- CRITICAL DATA INTEGRITY RULE: use only provided data, never fabricate

### Strategy Guardrails Hardcoded (commit 25285c9)
- PMax: labeled FAKE $3 CPA, real CPL $946, never recommend increasing
- Detox: permanently paused, $121K waste, no reactivation
- Mental Health [STR]: reduce to $14,000, exact match only
- Addiction Treatment [STR]: reduce to $12,000, exact match only
- Brand [STR]: never cut, best qualification rate at 14.3%
- All recommendations require Thai approval — Phase 1 advisory only

### Verified Test Output (April 14, 2026)
Agent 07 correctly produced:
- Reduce Mental Health to $14,000 ✅
- Reduce Addiction to $12,000 ✅
- PMax: hold, do not increase, conversions are fake ✅
- Brand: increase to $1,000 ✅
- Detox: stay paused ✅
- All items marked "Requires Thai Approval" ✅

---

## TELEGRAM NOTIFICATION RULES (hardcoded April 15, 2026 — commit deecef1)

### What triggers a Telegram message — COMPLETE LIST:

WEEKLY (always send):
- Monday 7am AZ: Full Google Ads weekly report
- Monday 6am AZ: SEO weekly scan report

DAILY (only send if data changed):
- 8am AZ: Daily health check — ONLY if status changed from yesterday. Never send "all green" if nothing changed.
- 8:05am AZ: CTM quality — ONLY if 4-5 star calls came in OR qualified leads changed. Never send on zero-call days.
- 9am AZ: Google Ads change monitor — ONLY if campaign changes detected

EVENT-BASED (always send):
- Approval requests — always send immediately
- System errors — always send (API failures, PM2 crashes)
- Agent 19 news — ONLY CRITICAL or WARNING level. INFO suppressed.

### What was removed (fake/templated updates):
- Daily health check "all green" messages when nothing changed
- Daily CTM quality messages on zero-call days
- Agent 19 INFO-level news (fired 90% of days with no real content)

### telegram_last_sent table
- Stores last sent value per metric in SQLite
- Prevents duplicate sends when data has not changed
- Table: telegram_last_sent (metric TEXT PRIMARY KEY, last_value TEXT, last_sent_at TEXT)

### SQLite Backup Status (confirmed April 15, 2026)
- Local backup: daily 2am AZ to /home/openclaw/data/backups/ — 7 day retention — WORKING
- SharePoint backup: daily 11:05pm AZ via MS Graph — RESTORED April 15, 2026
- GitHub backup: hourly at :10 — ACTIVE
- fetched_at format: ISO datetime (fixed April 15, 2026 — 26 rows migrated from epoch)

### GA4 Cache Issue (April 15, 2026)
- GA4 landing pages cache showing 41+ hours stale
- Investigate why GA4 nightly sync is not refreshing landing pages
- Add to next session priorities

---

## SHAREPOINT BACKUP — RESTORED April 15, 2026 (commit f78c94d)

### What broke
MS Graph OAuth refresh token stalled around March 10, 2026. Script ran daily but failed silently — 35 days of missed backups.

### Fix applied
- Token manually refreshed — valid for 90 days (expires ~July 14, 2026)
- CALENDAR REMINDER NEEDED: Rotate MS Graph token before July 14, 2026

### What gets backed up to SharePoint (37 files, daily at 11:05pm AZ)
- /home/openclaw/data/jarvis-cache.db (SQLite database)
- jarvis-agency-dashboard/CLAUDE.md
- jarvis-marketing-agency/CLAUDE.md
- Identity docs, memory files, system config, project memories

### Backup schedule summary
- SQLite local backup: 2am AZ daily → /home/openclaw/data/backups/ (7 day retention)
- SharePoint backup: 11:05pm AZ daily → MS Graph upload (37 files)
- GitHub backup: hourly at :10
- Next SharePoint run: tonight 11:05pm AZ

---

## DATA BUG FIXES — April 15, 2026 (commits 1dd3ae9 + 9120cf5)

### Bug 1 — Google Ads missing days parameter (FIXED)
- Before: fetched /api/google-ads/performance (30-day default) — LLM hallucinated 7-day numbers
- After: fetches ?days=7 AND ?days=30 separately, labeled clearly in context
- Rule: ALWAYS pass ?days=7 for 7-day context, ?days=30 for 30-day. Never use default.

### Bug 2 — Hardcoded occupancy (FIXED)
- Before: hardcoded "Church 9/10 | Frier 5/10 | Total 14/20" in 2 places — stale and wrong
- After: live Kipu census with all 3 locations (Church, Frier, Indian School)
- Rule: NEVER hardcode occupancy. Always pull from /api/kipu/census live.

### Bug 3 — Wrong Google Ads field names (FIXED)
- Before: gads.spend, gads.cost_per_conversion — fields don't exist, context was empty
- After: gads.summary.total_spend, gads.summary.total_clicks, gads.summary.avg_cpc, gads.summary.total_conversions, gads.summary.cost_per_conversion
- Rule: Always use gads.summary.* for aggregate fields

### Bug 4 — Hardcoded speed-to-lead (FIXED)
- Before: avg_response_time_minutes: 12.4 hardcoded in 3 places — never measured
- After: returns null with note "Speed-to-lead measurement not yet instrumented"
- Rule: Never hardcode metrics. If not measured, return null and say so.

### Verification standard
After any agent data change, run raw API comparison:
curl http://localhost:3002/api/google-ads/performance?days=7 → compare to agent report
curl http://localhost:3002/api/kipu/census → compare to occupancy in agent report
If numbers differ by more than rounding, there is a data bug.
