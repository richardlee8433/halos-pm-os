# HALOS AI PM OS

**Live:** https://hlaipmos.netlify.app
**PM OS Repo:** https://github.com/richardlee8433/halos-ai-pm-os
**MVP Repo:** https://github.com/richardlee8433/video_insigh_MVP

An interactive AI Product Manager OS built to demonstrate how I think, decide, and ship as a PM candidate for HALOS — a Video Forensics Platform for law enforcement and security.

---

## What This Is

A working demo that does two things at once:

1. **An interactive PM** — ask it anything about product decisions, trade-offs, cost models, compliance risks, or working style. It answers as the framework, not as a chatbot.
2. **A live PM artefact** — the briefing card on the home screen is pulled directly from the active Inner Spec. The left panel shows market intelligence, the workflow framework, and Workflow A live status. Nothing is fabricated for the demo.

---

## Development Timeline

### Week 1 — MVP: Video Insight Assistant (v1.0 → v8.1)

Built in response to the HALOS JD. Seven days, eight versions.

| Version | What was built | Key decision |
|---------|---------------|-------------|
| v1.0 | FastAPI + React, Whisper STT indexing | Text-first: lowest cost, highest retrieval value |
| v2.0–v3.0 | GPT-4o Vision, SHA-256 hashing, Audit Log | Evidence integrity before features |
| v4.0 | Live CCTV (HLS), pixel difference edge filter | 80% compute saving before any AI call |
| v5.0 | Semantic search via cosine similarity | Keyword search is insufficient — "use of force" ≠ "suspect restrained" |
| v6.0 | Crowd density detection, yt-dlp auto URL refresh | Quantified thresholds beat vague AI judgements |
| v7.0 | Multi-camera Tactical-Link, semantic Re-ID | Cross-camera tracking without model training |
| v8.0 | Body Cam Adaptive Mode, Laplacian sharpness filter | Failure mode: AI said "food inquiry" on a pursuit — root cause was sampling rate, not the model |
| v8.1 | Gemini 1.5 Flash parallel, model toggle UI | Native video input outperforms frame-sampled GPT-4o; cost drops 80% |

**Live MVP:** https://videoinsighter.netlify.app

---

### Week 2 — PM OS Framework

After shipping the MVP, built a structured PM workflow system to retroactively document the decisions and create a reusable operating framework for HALOS.

#### What was built

**HALOS PM OS** — a workflow system with:
- **Use Case Layer** (Pre-Stage 0): Workflow Cluster declaration, Use Case Profile, Agent Mandate Matrix
- **4 Analysis Agents**: Trust & Compliance · Cost Analysis · Market Analysis · User Analysis
- **Stage 0–5 workflow**: From signal capture to monitoring & iteration
- **Decision Rationale block**: Every spec ships with model choice, cost basis, compliance basis, and golden test set — no blank fields

#### Workflow A: Video Evidence Investigation — complete documentation

The MVP (v1.0–v8.1) was retroactively mapped through the framework. Full document chain:

| Document | Contents |
|----------|---------|
| `use-case-profile.md` | Use Case Profile + Stage 0 field signal + Stage 1 demo log |
| `stage-2-decomposition.md` | Context Chain (9 states + 5 failure paths), routing logic, 6 User Stories with edge cases, agent reviews |
| `stage-3-inner-spec.md` | Inner Spec (40 lines hard limit): Problem, Success Metrics, API schema, Decision Rationale, AI Confidence Handling |
| `stage-3-compliance-annex.md` | GDPR chain-of-custody, GDPR Art.9 biometric gap, audit trail spec, court submission edge cases, training data coverage gaps |
| `stage-4-gate-report.md` | Pre-launch gates: Technical / UX / Financial / Legal — 18 checks, honest about what is verified vs. pending |
| `stage-5-monitoring.md` | Primary metrics, adoption stage map, agent triggers, priority formula with ranked next-build candidates |

---

## Key Product Decisions (with reasoning)

**Gemini Flash over GPT-4o as primary model**
Native video input eliminates frame extraction overhead. 80% cost reduction. Better temporal reasoning on body cam footage. GPT-4o retained for parallel comparison only.
Cost basis: ~$0.005/video · <$30 per 1,000hr · 6× headroom vs. cost ceiling.

**L1 filter before any AI call**
Laplacian sharpness filter (body cam) and pixel difference (static CCTV) run CPU-only at $0 cost. Filters ~90% of static footage. L2 AI only fires when there is something worth analysing.

**SHA-256 client-side before transmission**
Evidence fingerprint established at source. AI writes isolated to `analysis_record` — never touch `evidence_record`. Chain-of-custody is architectural, not procedural.

**Tactical-Link Re-ID: blocked in production**
GPT-4o Vision describing person characteristics = biometric data processing under GDPR Art.9. No legal basis documented. Feature returns 403 in production until resolved. This is not deprioritisation — the legal path exists (Art.9(2)(g) substantial public interest, or restrict to post-incident review). It is honesty about what cannot ship yet.

**Confidence threshold 0.85 (proposed, not signed)**
Based on v8.1 output quality observation. No formal golden test set to validate it yet. Stage 3 Inner Spec marks it as open. Stage 4 gate cannot pass until PM + Legal sign off.

---

## Architecture

```
User uploads video
        ↓
SHA-256 computed client-side → evidence_record locked (immutable)
        ↓
Scene detection: Body Cam | Static CCTV | Unknown
        ↓
L1 Filter (CPU, $0):
  Body Cam    → Laplacian sharpness filter at 1/5s
  Static CCTV → Pixel difference > 15%
        ↓
L2 AI Analysis:
  Gemini 1.5 Flash (preferred) — native video upload
  GPT-4o Vision (comparison)   — frame-sampled, parallel on request
        ↓
Results → analysis_record (never merged into evidence_record)
Confidence score always visible · ≤1 action to correct · correction_log written
```

---

## Hard Lines

1. Never ship anything that could compromise evidence integrity
2. AI confidence always visible — never hidden from user
3. Reporting wrong AI result requires ≤1 user action — verified in Stage 4 before release
4. Every spec ships with a fully populated Decision Rationale block — no blank fields
5. Compliance Annex is human-reviewed by Legal or QA before any AI feature reaches production
6. No slide decks. Prototypes talk.
7. Buffering = product failure

---

## Stack

**MVP:** FastAPI · React/Vite · Whisper · GPT-4o Vision · Gemini 1.5 Flash · text-embedding-3-small
**PM OS:** React/Vite · OpenAI GPT-4o-mini · Netlify

---

*Built by Richard Lee — PM candidate for HALOS*
*richardlee8433@gmail.com*
