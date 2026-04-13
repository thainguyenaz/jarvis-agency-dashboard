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
