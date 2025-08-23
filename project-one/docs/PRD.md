# Project One — PRD v4 (B2B SaaS • Admin + Advisor only) — COMPLETE REQUIREMENTS BIBLE

Delivery via Meta WhatsApp Cloud API · Three Tiers (Basic/Standard/Pro) · No End-Client Records On-Platform

## Overview & Objectives

**Goal:** Build an AI-first, compliance‑safe, minimalist B2B content OS that delivers WhatsApp‑ready content packs to Indian MFDs/RIAs every morning (default 06:00 IST), with AI-assisted content generation, three-stage compliance checking, nightly human‑in‑the‑loop review, and automatic continuity via Pre‑Approved Fallback Packs.

## Primary Outputs
- Post‑ready captions (EN/HI/MR variants) with SEBI‑aware phrasing
- WhatsApp image (1200×628) and Status image (1080×1920) with auto‑disclaimer
- Optional LinkedIn image (1200×627) + caption variant
- Pro Tier: brand‑on‑image (logo/name/reg no.) with compliance‑safe placement

## Key Constraints
- SEBI Ad Code compliance
- DPDP (India) data protection
- WhatsApp Cloud API policy & template rules
- Advisor consent for proactive messages

## Business Model
**Target Scale:** 150-300 advisors at T+90 days, 1,000-2,000 at T+12 months
**Pricing:** Basic ₹2,999/mo, Standard ₹5,999/mo, Pro ₹11,999/mo
**Launch Strategy:** "Founding 100" 50% discount for 3 months + 15% annual discount

## Technical Architecture
- **Frontend:** Next.js (App Router) + shadcn/UI + Clerk auth
- **Backend:** Node.js (NestJS/Express) + PostgreSQL + Redis/BullMQ
- **AI:** OpenAI GPT-4o-mini (lint/eval), GPT-4.1 (generation)
- **Messaging:** Meta WhatsApp Cloud API
- **Storage:** Cloudflare R2 + CDN
- **Observability:** Datadog APM + Grafana

## Success Metrics
**North Star:** ≥98% of advisors receive complete daily pack by 06:05 IST for 14 consecutive business days
**SLO:** ≥99% scheduled WhatsApp deliveries completed by 06:05 IST (5min SLA)

*Full PRD details available in original document*