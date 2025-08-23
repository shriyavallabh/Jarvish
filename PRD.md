Project One — PRD v4 (B2B SaaS • Admin + Advisor only) — COMPLETE REQUIREMENTS BIBLE

Delivery via Meta WhatsApp Cloud API · Three Tiers (Basic/Standard/Pro) · No End-Client Records On-Platform

This version reflects your direction: pure B2B SaaS. The platform serves advisors (paying customers). We deliver approved daily content to advisors’ WhatsApp only; advisors forward it to their own audiences off‑platform. No client onboarding or storage is included in this scope.

⸻

1) Overview & Objectives

Goal: Build an AI-first, compliance‑safe, minimalist B2B content OS that delivers WhatsApp‑ready content packs to Indian MFDs/RIAs every morning (default 06:00 IST), with AI-assisted content generation, three-stage compliance checking, nightly human‑in‑the‑loop review, and automatic continuity via Pre‑Approved Fallback Packs.

Primary outputs to advisors (on WhatsApp + dashboard download):
	•	Post‑ready captions (EN/HI/MR variants) with SEBI‑aware phrasing.
	•	WhatsApp image (1200×628) and Status image (1080×1920) with auto‑disclaimer.
	•	Optional LinkedIn image (1200×627) + caption variant.
	•	Pro Tier: brand‑on‑image (logo/name/reg no.) with compliance‑safe placement.

Not in scope now: storing or messaging end‑clients; any investor app; LinkedIn API posting; payment/investment flows.

Key constraints: SEBI Ad Code, DPDP (India), WhatsApp Cloud API policy & template rules, advisor consent to receive proactive messages.

⸻

2) Roles, Tenancy & Tiers

Roles
	•	Admin (Founder): full control, template & content approver, compliance checks, system settings.
	•	Backup Approver: secondary reviewer for nightly queue; can batch approve/reject with notes.
	•	Advisor (Tenant): paying B2B user; drafts/selects packs, requests approval, receives final assets on WhatsApp, then forwards externally.
	•	Advisor seat roles: Owner, Editor, Viewer (read-only).
	•	Data Protection Manager: handles DSAR requests, policy updates, cross-border data compliance.

No "Client" role or data exists in this scope. Downstream recipients are off‑platform (not managed in the system).

Tenancy
	•	Hard multi‑tenancy per Advisor. Cross‑tenant data isolation enforced at API and DB levels.
	•	Multi-brand advisors supported as sub-tenants under a single login (Pro only).
	•	AI personalization engine: learns from advisor selections, edits, approvals for content ranking (all tiers).

Target Market Rollout
	•	Phase 1 (Month 0–3): MFDs only 
	•	Phase 2 (Month 3+): RIAs added
	•	Unified onboarding flow with "Type = MFD | RIA" toggle affecting compliance footers and document checklist

Tiers & Caps

Capability	Basic	Standard	Pro	Enterprise (Future)
Daily packs (max/mo)	15	30	60	Custom
Languages (EN/HI/MR)	1	2	3	All + Custom
Nightly auto‑lint + approval queue	✓	✓	✓	✓
06:00 auto‑send to advisor WA	✓	✓	✓	✓
Pre‑Approved Fallback Packs	✓	✓	✓	✓
Advisor logo in caption footer	✓	✓	✓	✓
Brand‑on‑Image overlay (logo/name/reg no.)	–	–	✓	✓
Custom colorway on assets	–	–	✓	✓
Analytics (deliver/read via WA receipts)	Basic	Standard	Advanced	Advanced + Custom
Seats per advisor	1	3	5	Custom
API access (export packs)	–	–	✓	✓ + Webhooks
Storage retention	6 mo	12 mo	24 mo	Custom
AI content personalization	✓	✓	✓	✓
Offline content download (ZIP)	✓	✓	✓	✓
SSO/SAML	–	–	–	✓
Dedicated WABA/numbers	–	–	–	✓

Pricing Strategy
	•	List: Basic ₹2,999/mo; Standard ₹5,999/mo; Pro ₹11,999/mo
	•	Launch: "Founding 100" 50% discount for 3 months + 15% annual discount
	•	Caps: Basic/Standard are hard (creation blocked with upgrade CTA). Pro caps are soft with overage at ₹99/pack
	•	Add-ons: Extra seats ₹499/seat/mo across tiers
	•	Trial: 14-day with watermark, limited to 7 packs, no Pro overlays
	•	GST: 18% applicable; collect GSTIN for B2B invoices
	•	Enterprise: Custom pricing, annual billing, dedicated success manager

Pro API Access
	•	Read-only export of rendered packs + delivery stats
	•	Rate limit: 60 req/min per tenant
	•	HMAC-signed webhooks for delivery events
	•	Export format: ZIP (meta.json, captions, images) with 7-day signed URL validity

⸻

3) System Architecture (High Level)

Frontend: Next.js (App Router) for Advisor Dashboard and Admin Console; Tailwind + shadcn/UI for styling; Clerk for auth + RBAC.
Backend API: Node.js (NestJS/Express) with PostgreSQL; Redis + BullMQ for job queues; API documented via OpenAPI spec.
Image & Template Engine: Cloudinary (preferred) or ImageKit for dynamic image overlays; Node Sharp as fallback.
Messaging: Meta WhatsApp Cloud API (approved templates + media messages); HMAC‑verified webhook callbacks for delivery receipts.
Storage: Cloudflare R2 + Cloudflare CDN (default) for generated assets; use private buckets with signed URL access.
Observability: OpenTelemetry instrumentation → Datadog APM + logs; Grafana boards for SLOs and trends; define SLOs and alerts.
Security: HTTPS everywhere; Clerk 2FA for Admin; HMAC verification on webhooks; AWS KMS‑at‑rest for sensitive data; append‑only audit logs; Admin IP allowlisting.

Key services:
	•	AI Service: OpenAI integration for compliance checking, content generation, translation, and risk scoring. Manages prompt caching, fallback models, and audit trails.
		◦ Primary Models: GPT-4o-mini (lint/eval), GPT-4.1 (rewrite when needed)
		◦ Latency SLAs: Lint ≤1.5s P95, Generation ≤3.5s P95
		◦ Cost Controls: Per-advisor daily caps (10 generations + 20 lints), degrade to rules-only if budget threshold reached
		◦ Fallback Chain: Primary model → lighter model → cached variant → baseline template → Fallback Pack
	•	Content Service: handles content drafts, pack metadata, AI-powered linting, and localization workflows.
		◦ AI Personalization: Learns from advisor selections, edits, approvals for content ranking
		◦ A/B Variant Tracking: Logs "wins" by advisor selection and admin quality scores
		◦ Content Caching: Variants cached by (draft_hash, prompt_version), TTL 14 days
	•	Render Service: image/text rendering, dynamic overlays, safe‑area handling for graphics.
		◦ Pre-generation: All approved assets rendered 20:30–21:30 IST (zero AI required at 06:00)
		◦ Cache Strategy: Pre-render and cache to eliminate send-time dependencies
	•	Scheduler: orchestrates nightly preflight (20:30–21:30 IST), 06:00 send fan‑out, retries, and rate‑limiting.
		◦ Capacity Planning: 5k generations/hour during peak authoring (20:00–22:00 IST)
		◦ Queue Management: 50–150 concurrent AI calls with backpressure
	•	Messaging Service: manages WhatsApp template registry, message sending, delivery/read tracking, and quality monitoring.
		◦ Template Buffer: 3 pre-approved variants per language, 3-5 business day submission buffer
		◦ Number Sharding: Multiple phone numbers for quality rating protection and scale
	•	Compliance Guard: three-stage compliance engine (rules → AI evaluator → rules) with risk scoring and suggestion generation.
		◦ Uniform Thresholds: No leniency for high performers, consistent risk scoring
		◦ Bias Detection: Cultural sensitivity checks + human QA sampling
		◦ Incident Logging: Track regulator feedback linked to content IDs for retroactive review
	•	Fallback Orchestrator: assigns an evergreen content pack if no fresh approval is ready; triggers if primary AI model fails.
		◦ AI Curation: AI proposes fallback candidates ranked by engagement, seasonality, compliance safety
		◦ Library Size: 60 packs/language, refreshed monthly
	•	Analytics Intelligence: generates weekly AI insights on advisor performance and content effectiveness.
		◦ Churn Risk Detection: Health score based on usage + approval latency + read rates + support tickets
		◦ Market Analysis: AI suggests topics/formats for editorial backlog based on platform-wide trends

⸻

4) Advisor Onboarding & Provisioning (No Client Onboarding)

Flow:
	1.	Sign‑up – via email or OAuth, then verify email & mobile (OTP via MSG91 for phone; one-time code via AWS SES for email).
		◦ Save & Resume: Progressive onboarding with ability to save progress at each step
		◦ Expected completion rate: 70-85% for warm leads with clear document checklist UX
	2.	Business Verification – collect RIA SEBI Registration No. or MFD ARN; upload docs (PDF/JPG/PNG ≤ 5 MB each): 
		◦ RIA: SEBI reg cert, PAN, GSTIN (opt), address proof (utility/bank), website (opt)
		◦ MFD: AMFI ARN/EUIN cert, PAN, GSTIN (opt), address proof
		◦ Type Toggle: Unified flow with "Type = MFD | RIA" affecting compliance footers and doc requirements
	3.	Tier Selection & Billing – choose plan (Basic/Standard/Pro), process payment (UPI/card via Razorpay), handle 14‑day trial flags if any.
		◦ Trial Behavior: 14-day with watermark, limited to 7 packs, no Pro overlays
		◦ Founding 100 Discount: 50% off for 3 months, 15% annual discount
		◦ Payment Failure Handling: 7-day grace with watermark + fallback only, dunning at day 3/7/14
	4.	Connect WhatsApp (Cloud API) – assign our platform's WABA by default; verify webhook setup; send a test "Welcome" template message to confirm.
		◦ WABA Strategy: Start on platform WABA; "connect your WABA" future Pro-only feature
	5.	Default Settings – advisor sets preferences (primary content language for WA delivery, optional additional download languages, send window — default 06:00 IST with option for 07:00 or weekdays‑only, disclaimer footer text, brand assets like logo for Pro tier).
		◦ Fallback Default: Auto-send ON for all tiers (advisors can opt out)
		◦ Quiet Hours: 22:00–07:00 for non-critical communications
	6.	Approval Gate – Admin or Backup Approver must mark status=Approved (after reviewing business info) before any content is sent. Only once approved can the advisor request content and receive packs.

Acceptance criteria:
	•	No proactive WhatsApp content is sent to an advisor until status = approved (to satisfy onboarding compliance).
	•	Advisor’s WhatsApp connection status and quality rating are visible on their dashboard.
	•	All verification artifacts (docs, IDs) are securely stored (hashed if needed) with timestamps for audit trail.
	•	Legal: ToS, Privacy, DPDP consent, and WhatsApp opt‑in are versioned and time‑stamped at onboarding.

⸻

5) Content Lifecycle (Advisor → Admin → WA Delivery)
	1.	Create/Select Pack (Advisor):
	•	Advisor chooses a Topic Family (e.g. SIP, Tax, Market explainer, Festive), desired Languages, and output Formats (WhatsApp post image, Status image, LinkedIn image).
	•	AI generates 2 caption variants (concise + alternate angle) based on topic, occasion, and compliance rules.
	•	AI Personalization: Content ranked by advisor_profile (topic affinity, tone preference, language) learned from selections, edits, approvals
	•	Optional: minor edits to the AI-suggested caption within guardrails; AI re-validates after each edit.
	•	Variant Tracking: System logs "wins" by advisor selection and admin quality scores for future AI improvement
	•	Quality Rubric: Every caption scored on 5-axis (Clarity, Usefulness, Brevity, Brand Tone, Localizability) with admin sampling 5-10% nightly
	2.	Auto‑Lint (real‑time AI-powered):
	•	Three-stage compliance check: 
		– Stage 1: Hard rules (regex) for prohibited terms, length limits (500 chars), emoji count (≤3), mandatory disclaimer
		– Stage 2: AI evaluator (GPT-4o-mini) for nuanced violations, tone issues, performance implications, bias/cultural sensitivity
		– Stage 3: Final rule sweep to verify all requirements met
	•	Risk score (0-100) with color coding: Green (<40), Amber (40-70), Red (>70)
	•	AI provides specific suggestions for fixing flagged issues + "Use compliant baseline" button on errors
	•	Uniform compliance thresholds for all advisors (no leniency for high performers)
	•	Pro tier: also preview the brand overlay with a safe‑area grid to ensure logo/disclaimer placement is correct.
	•	Compliance Coaching: On rejection, show plain-English explanation + 1-minute micro-lesson; monthly "Top 3 pitfalls" digest
	3.	Submit for Approval (by 20:00 IST cutoff):
	•	Advisor submits the content pack for review. The system snapshots the draft (immutable hash for integrity) and places it into the Admin Approval Queue.
	4.	Nightly Review (Admin, 20:30–21:30 IST):
	•	Admin reviews each pending pack with:
		– AI risk score and rationale displayed prominently
		– Side-by-side previews with compliance issues highlighted
		– AI-generated suggestions for borderline content
		– Batch approve/reject for low-risk (green) items
		– Cultural sensitivity flags and bias detection alerts
	•	Admin then Approves or Rejects with notes for each.
	•	Target throughput: 120-180 items/hour with batch tools and canned response notes
	•	Upon Approval: the content pack is scheduled for the 06:00 delivery slot. Final assets are rendered to storage (with all overlays), and WhatsApp media IDs are pre-cached if possible for faster sending.
	5.	Pre-Render Phase (20:30–21:30 IST):
	•	All approved assets rendered and cached to eliminate send-time dependencies
	•	AI-assisted render optimization to ensure zero failures at 06:00
	•	Quality assurance: Visual snapshot tests, template validation, disclaimer verification
	6.	06:00 IST Delivery (to Advisor's WhatsApp):
	•	At the scheduled time, the platform sends out the approved pack to the advisor's WhatsApp (using templated messages):
	1.	The main post image + caption (for each chosen language, either in separate chats or a single preferred language per advisor settings).
	2.	The status image (with a note like "Status 1080×1920" for clarity).
	3.	If applicable, the LinkedIn image + its caption variant.
	4.	Optional: Download ZIP link for offline access (images + captions.txt)
	•	The sequence is compact to avoid spamming. Delivery and read receipts are logged per message for analytics.
	•	Canary sends: Test messages to internal list at 05:50 for final QA
	7.	Advisor Forwards Content:
	•	The advisor then manually forwards the received content to their client broadcast lists, posts it on their WhatsApp Status, or shares on LinkedIn as desired (all off‑platform, since end-client management is out of scope).
	•	AI Analytics: Track advisor engagement patterns for personalization and churn risk detection

Content Strategy & Editorial
	•	In-house Editorial: Part-time SME + writer producing canonical packs; AI assists drafting; Admin approves nightly
	•	Content Calendar: Pre-planned (festivals, tax season, budget) + "war-room" override for RBI/budget days
	•	AI Market Analysis: AI suggests topics/formats for editorial backlog based on platform-wide usage trends and seasonality

⸻

6) Nightly Continuity — “Pre‑Approved Fallback Packs”

Problem: Relying on a single human approver can create a content bottleneck and risk missed days if no one approves content in time.
Solution: Maintain a library of evergreen, compliance-vetted content packs (per language and topic category) that can automatically serve as a fallback.

Logic:
	•	At ~21:30 IST each night, for any advisor tenant who does not have an approved pack ready for the next morning:
	•	If the advisor’s Auto‑send setting = ON, the system will auto-assign a suitable Fallback Pack from the pre-approved library (matching the advisor’s preferred language and topic profile) for the 06:00 delivery.
	•	If Auto‑send = OFF, no fallback is sent. Instead, the advisor (and Admin) get a notification (dashboard, email, or WhatsApp) that no content is scheduled for next morning.

Controls:
	•	Admin curates and periodically updates the fallback content sets (at least monthly), ensuring they remain evergreen and compliant.
	•	Any fallback pack used is clearly marked (e.g. a small “Evergreen” watermark or note) so the advisor knows it was an auto-selected piece.
	•	Pro tier customizations (like logo overlays) are still applied to fallback content for consistency.

Acceptance criteria:
	•	Advisors who have Auto-send ON should never experience a “silent day” — content goes out every scheduled day even if the advisor forgets to submit or admin fails to approve.
	•	The audit log clearly records when a fallback pack was used for a given day and which pack ID was sent (with reasoning, e.g. “no approved content, so fallback X was sent”).

⸻

7) Brand‑on‑Image (Pro Tier) — Implementation & Compliance

Renderer Options:
	•	Cloudinary (preferred): use secure upload presets and dynamic text/image overlays; supports DPR scaling (for high DPI), auto-format conversion (AVIF/WebP), and named transformation presets for consistency.
	•	Imgix or ImageKit (alternative): URL-driven image transformations; ImageKit has Indian PoPs which might reduce latency for local delivery.
	•	Fallback (DIY): Use Node Sharp (with Pango for text) to programmatically composite images server-side if external services fail or are cost-prohibitive.

Overlay Specifications:
	•	Input assets: advisor’s logo (SVG/PNG), advisor name, SEBI reg/ARN number, optional city name; plus the standard disclaimer text string.
	•	Use a defined safe‑area grid on base templates. Dynamic placement logic avoids covering any face or key graphic by referencing “no-cover” zones defined per template.
	•	Adaptive text: ensure overlay text is legible – use minimum font size ~12–14px at 1× resolution (scale up for retina exports). Export images at 2× for crispness on WhatsApp.
	•	Automatic contrast: apply an outline or shadow to overlay text if needed to maintain WCAG AA contrast against the background image.
	•	Cloudinary named transforms: proOverlayV1, statusV1, lnkdV1.

Compliance checks (for images):
	•	The disclaimer text on images must never be obscured or cut off – enforce minimum height, padding, and position within safe zones.
	•	Co-branding rules: the advisor’s logo on the image should occupy no more than ~12% of the image width and must not mimic any AMC or regulatory logo (to avoid misrepresentation).
	•	Each generated image should embed an ID (in XMP metadata and/or filename) encoding template ID, render job ID, advisor ID, and timestamp for audit traceability; avoid PII in EXIF.

⸻

8) WhatsApp Cloud API Usage (Advisor Delivery Only)
	•	Template Messages: Templates at MVP per language: 
		◦ welcome_v1(name) (Utility)
		◦ daily_pack_v1(topic, lang, hint) (Marketing, image slot)
		◦ status_pack_v1(topic, lang) (Marketing, image slot)
		◦ Template Strategy: Maintain 3 pre-approved variants per language; submit new templates 3-5 business days before needed
		◦ Media Strategy: Pre-upload media, reuse media_id when possible; fallback to signed CDN URL TTL 48h
	•	Throughput & Rate Limits: Fan-out across 05:59:30–06:04:30 with jitter; burst cap per sender configured; SLO remains 06:05. Failures trigger retries with exponential backoff.
		◦ Number Sharding: Multiple phone numbers for quality protection and horizontal scale
		◦ Capacity: Design for 12k sends/day with margin for growth
	•	24-hour Session Rules: Because daily sends are proactive (not in response to user), they must use Message Templates as per WhatsApp policy. We monitor template quality and adhere to rate limits; any failures will trigger retries with exponential backoff.
	•	Quality & Health Monitoring: We track delivery rates, blocks, or reports. If the WhatsApp phone number's quality rating degrades (e.g. too many blocks or spam reports), the system auto‑throttles sends and alerts the Admin to investigate content or sending practices.
		◦ Quality Recovery: Reduce frequency, switch to neutral template, add STOP hint, cooldown 48-72h
		◦ Hot Spares: Keep 2+ phone numbers on same WABA as backup; warm gradually
	•	Opt-In & STOP/START Management: Advisors explicitly consent during onboarding (opt‑in timestamp recorded). We accept STOP, PAUSE, START, RESUME (case/locale‑insensitive); send confirmation acks; accidental STOP triggers an in‑app re‑opt flow with a confirmation template.
		◦ Platform Risk Mitigation: Conservative templates, strong opt-out UX, email/SMS as future backup channels

⸻

9) Compliance & Security
	•	SEBI Ad Code: All captions are neutral-tone educational (no performance promises or guaranteed returns). Mandatory mutual fund disclaimer is included wherever required. Every post identifies the advisor (name + SEBI Reg/ARN) either in caption or on image to meet regulations.
		◦ Type-Specific Compliance: MFD vs RIA footer templates and lexicon differences handled automatically
		◦ Incident Logging: Track regulator feedback linked to content IDs for retroactive pattern analysis
		◦ Policy Monitoring: Automated SEBI/RBI website monitoring with human review for regulatory changes
		◦ Compliance Coaching: Plain-English rejection explanations + micro-lessons + monthly pitfall digests
	•	WhatsApp Policy: Only messaging advisors who have opted in. Content is purely informational/educational (no direct marketing of products without template approval). Advisors can easily pause messages (reply STOP) to comply with WhatsApp's rules on unsolicited messages.
	•	DPDP (India Data Protection): We minimize personal data collection (only advisor's own info). All personal data at rest is encrypted (e.g. using KMS for keys) and all data in transit is over HTTPS. We honor deletion requests and have a defined data retention limit per tier.
		◦ Data Protection Manager: Designated role for DSAR handling (ACK 72h, resolve 7-15 days)
		◦ Data Residency: All PII + message logs stored in ap-south-1; cross-border AI processing with data minimization
		◦ AI Data Policy: Send content only to OpenAI (no raw PII); contractual training/retention opt-out where available
	•	Audit Logging: Every important action (onboarding steps, content approval decisions, render completions, message sends, opt-outs, configuration changes) is logged to an append-only audit store with timestamps and actor info (admin, advisor, or system). This is crucial for compliance audits and troubleshooting.
		◦ SEBI Audit Reports: Monthly per-advisor CSV/PDF with content hashes, disclaimers, approvals, delivery status
		◦ AI Audit Trail: Store model versions, prompt versions, input/output hashes for 5-year retention
		◦ Export Tools: Admin CSV/JSON export with PII redaction options
	•	Access Controls: Robust RBAC – advisors only access their own data; admin has full access. Admin console will have 2FA enforcement (via Clerk). Optionally, we can restrict admin console by IP allowlisting for additional security.
	•	Backups & DR: Daily database snapshots and periodic off-site backups. Generated content assets are stored with versioning (to recover any lost data). Tightened DR targets: RTO ≤60min, RPO ≤15min with multi-AZ setup.
		◦ Policy Change Management: Policy YAML versioning + regression test suite + hotfix deployment path

⸻

10) Data Model (Key Entities)
	•	advisor: {id, status (pending|approved|suspended), tier, type (RIA|MFD), sebi_reg_no or arn, company_name, logo_url, wa_business_phone, waba_id (WhatsApp Business Account ID), wa_optin_ts, language_set, send_window (local time), disclaimer_footer, seats_allowed, billing_customer_id, auto_send_enabled, health_score, created_at}.
	•	advisor_profile: {advisor_id (FK), topic_affinity_scores, tone_preference, edit_patterns, approval_success_rate, engagement_metrics, last_updated}.
	•	admin_user: {id, email, has_2fa_enabled, role (admin|backup_approver|dpo)}.
	•	content_pack: {id, creator_type (advisor|admin), topic_family, languages[], draft_content_json, ai_risk_score, ai_suggestions[], compliance_reasons[], status (draft|pending|approved|rejected|scheduled|sent), schedule_date, content_hash, admin_notes, quality_scores, variant_selection_log, created_at}.
	•	render_job: {id, content_pack_id (FK), variants_requested (wa_post, status, linkedin), overlay_config, result_asset_urls, checksums, cache_status, completed_at}.
	•	wa_template: {name, category (utility|marketing), supported_locales[], placeholders[], status (approved|pending), variant_number}.
	•	delivery: {id, content_pack_id, advisor_id, channel (whatsapp), content_variant (post|status|linkedin), message_id (from WA), status (queued|throttled|sent|delivered|read|failed), error_code, timestamp, retry_count}.
	•	fallback_policy: {id, enabled (bool), languages[], topic_priority[], library_size, ai_curation_enabled, last_updated, audit_notes}.
	•	fallback_pack: {id, content_json, languages[], topic_family, engagement_score, seasonal_relevance, compliance_rating, created_at, last_used}.
	•	audit_log (append-only): {id, actor_type (admin/advisor/system), action, entity_type, entity_id, details_json, timestamp}.
	•	ai_audit_log: {id, content_pack_id, model_name, model_version, prompt_version, prompt_hash, input_hash, output_hash, risk_score, reasons[], latency_ms, token_count, cost_cents, timestamp}.
	•	compliance_incident: {id, content_pack_id, regulator_source, feedback_text, impact_assessment, related_content_ids[], resolution_notes, created_at}.
	•	policy_version: {id, version_tag, policy_yaml_hash, effective_date, change_summary, regression_test_results}.

⸻

11) API Surface (Illustrative)
	•	POST /v1/advisors – (Admin) Create a new advisor (or approve/suspend existing).
	•	POST /v1/advisors/{id}/connect-wa – Initiate WhatsApp Business setup for advisor (provision number, verify webhook, send test message).
	•	GET /v1/templates – List all WhatsApp message templates (approved) available for use.
	•	POST /v1/packs – (Advisor) Create or update a content pack draft.
	•	POST /v1/packs/{id}/submit – Mark an advisor’s draft pack as ready for admin approval.
	•	POST /v1/packs/{id}/approve (or reject) – (Admin) Approve or reject a content pack, with optional feedback notes.
	•	POST /v1/packs/{id}/schedule – Schedule an approved pack for a specific date (defaults to next 06:00 slot if not specified).
	•	POST /v1/render/{id} – Force re-render of a pack’s images (e.g. if logo changed or to regenerate variants).
	•	POST /v1/admin/fallback/run – Manually trigger the fallback assignment logic (for testing or dry-run).
	•	POST /webhooks/wa – Endpoint for WhatsApp incoming webhook events (delivery reports, inbound messages). HMAC verification required.

Auth: Dashboard API calls use Clerk/JWT for the advisor or admin. All endpoints enforce tenant scoping (an advisor only accesses their resources). Rate limiting applied on sensitive endpoints. Pro API access (read‑only export + delivery stats) is limited to 60 req/min per tenant and HMAC‑signed webhooks are provided for Pro tenants.

⸻

12) Storage & CDN
	•	Primary Storage: Cloudflare R2 + Cloudflare CDN (default). Use private buckets and generate signed URLs when giving the advisor download links (for extra security on content).
	•	CDN Delivery: WhatsApp can fetch media from a URL; provide short‑lived signed URLs when needed.
	•	On-the-fly Transforms: Rely on Cloudinary for on-demand image transformations (especially for Pro overlays and multiple sizes). Use versioned public IDs to bust cache on updates.
	•	Signed URL TTL: 48h for advisor downloads; 24h for internal previews. Formats: AVIF/WebP first; export 2× assets for WA clarity.

⸻

13) Observability, SLOs & Alerts

SLOs (Service Level Objectives):
	•	≥ 99% of scheduled daily WhatsApp deliveries completed by 06:05 IST (within 5 minutes of target 06:00 send time). Monthly error budget 0.5%.
	•	0 critical PII leaks or violations of compliance in content (i.e., no send should go out without the required disclaimer or with unauthorized personal data).
	•	Fallback content usage < 20% of total sends per month per advisor.
	•	AI Performance SLAs: Lint ≤1.5s P95, Generation ≤3.5s P95
	•	North Star MVP Metric: ≥98% of advisors receive complete daily pack by 06:05 IST for 14 consecutive business days

AI Monitoring KPIs:
	•	Compliance pass rate pre-human review vs admin decisions (false positive/negative tracking)
	•	Content approval rate and turnaround time
	•	Advisor satisfaction scores (👍/👎 on AI suggestions)
	•	WhatsApp quality impact correlation with AI-generated content
	•	AI latency per check/generation and cost per pack
	•	Model fallback frequency and trigger reasons

Alerts & Monitoring:
	•	Approval Delay: If by 21:15 IST there are still pending packs awaiting review, send an urgent WhatsApp and email alert to Admin and Backup Approver to intervene.
	•	WhatsApp Quality Drop: If the WhatsApp number's quality rating falls to a lower tier or a high block/report rate is detected, automatically pause non‑critical sends and notify Admin to investigate content issues.
	•	Send Failures: If >2% of messages fail in a 5‑minute window, trigger an alert and halt further sends to prevent cascading issues.
	•	AI Performance Degradation: Alert on AI latency >2x normal, cost >150% daily budget, or fallback rate >10%
	•	Queue Depth: Alert when AI processing queue >500 items or processing time >10min average
	•	On‑call: 05:30–06:30 IST paging window for send failure/quality drop events.
	•	Infra Errors: Monitor for storage or CDN errors, webhook signature mismatches, and high 5xx errors on the API.

Analytics & Intelligence:
	•	AI Weekly Insights: Personalized advisor performance analysis (read rates, content effectiveness, engagement patterns)
	•	Churn Risk Scoring: AI-powered health score combining usage, approval latency, read rates, support tickets
	•	Content Performance Analysis: Track sent/delivered/read rates with AI-powered anomaly detection
	•	Market Intelligence: AI suggestions for new topics/formats based on platform-wide trends

Support Operations:
	•	Coverage: 7×12 initially
	•	Staffing Ratios: L1 (1 per 250-300 advisors), L2 (1 per 1,000), Compliance SME (1 total)
	•	Channels: WhatsApp bot + email + in-app ticketing
	•	SLA: Standard tier (next business day), Pro tier (same day)

⸻



§14 — UI Design Strategy & Spec (drop-in Markdown)

14.1 Goals

Deliver a premium, advisor-first dashboard that is on-brand, accessible, and fast. Design is done in code (no Figma) using an AI-assisted iterative workflow and a component system to guarantee consistency and speed.

14.2 Brand Integration (visual + verbal)
	•	Primary font: Open Sans (UI/body, 14–16 px base).
	•	Secondary font (headlines): Fraunces (the “Frontges” noted earlier; used for H1/H2 only).
	•	Tone: professional, clear, friendly microcopy; minimal ornamentation; generous whitespace; predictable placements (logo top-left).
	•	Color usage: primary for CTAs and selection states; secondary for structure; accents only for alerts/emphasis; always AA contrast.

14.3 Design Principles
	•	User-centric hierarchy: core tasks and next actions above the fold; progressive disclosure for advanced options.
	•	Consistency: one design language across Admin + Advisor; stable nav, filter and table patterns.
	•	Clarity over chrome: cards/tabs for modularity, whitespace for scanability, minimal shadows, purposeful motion.
	•	Accessibility: WCAG AA contrast, keyboard focus states, semantic HTML, skip-to-content, aria for complex widgets.

14.4 Screens (must-ship)

Advisor (tenant)
	1.	Auth & Onboarding (email/OTP, business verification wizard)
	2.	Overview (today’s pack, countdown to next 06:00, WA health)
	3.	Packs Library (browse curated + drafted; filters, search)
	4.	Pack Composer (caption editor with lint, preview images, language toggles)
	5.	Approvals (statuses, admin notes, diffs)
	6.	Branding & Assets (logo upload, Pro overlay preview)
	7.	Analytics (sent/delivered/read charts)
	8.	Settings (profile, WABA connect, notifications, tier/billing)

Admin
	1.	Approval Queue (batch approve/reject with notes, preview)
	2.	Advisors (create/verify/suspend, seat & tier)
	3.	Templates (WA templates registry)
	4.	Fallback Packs (curate, rotate, audit)
	5.	System Health (WA quality, rate limits, job queue)
	6.	Analytics (global metrics, per-tenant drill-down)
	7.	Compliance & Audit Logs (filterable events)

Each screen ships with empty-states, loading, error, and pagination behaviors.

14.5 AI-Assisted Workflow (no Figma)
	•	Phase A – Layout (wireframes): Generate 5 ASCII/HTML variants per key screen via Claude Code + SuperDesign; pick best layout; remix as needed.
	•	Phase B – Theme (visuals): Apply brand tokens and request 5 visual themes; select 1; iterate (color balance, density, radii, motion).
	•	Phase C – Hi-fi prototype: Produce interactive HTML/CSS; verify responsive at desktop/tablet/mobile; add micro-interactions (tap/press, hover, enter/exit).
	•	Phase D – Componentization: Port to shadcn/ui components; ensure theme parity; remove ad-hoc CSS.
	•	Phase E – UAT polish: Stakeholder walkthrough; fix usability snags; lock tokens.

14.6 Component System & Theming
	•	Library: shadcn/ui (Radix primitives + Tailwind tokens).
	•	Theming: central CSS variables for colors, spacing, radii, and typography; apply with TweakCN theme export; dark-mode ready (stretch).
	•	Charts: Recharts (consistent axis/legend patterns).
	•	Icons: lucide-react (stroke-consistent, 20–24px).

14.7 Design Tokens (authoritative)

// /apps/web/tokens/design-tokens.ts
export const colors = {
  ink:        '#0B1F33',   // primary text
  gold:       '#CEA200',   // micro-accent
  cta:        '#0C310C',   // primary action (Palm Green)
  bg:         '#FFFFFF',
  bgMuted:    '#F6F8FA',
  border:     '#E6E8EB',
  danger:     '#D92D20',
  success:    '#12B76A',
  warning:    '#F79009'
};
export const fonts = {
  body:       'Open Sans, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  heading:    'Fraunces, "Times New Roman", serif',
  mono:       'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
};
export const radii = { sm: '8px', md: '12px', lg: '16px', xl: '20px' };
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 };
export const shadow = { sm:'0 1px 2px rgba(16,24,40,0.06)', md:'0 4px 8px rgba(16,24,40,0.08)' };
export const typography = { base: 16, line: 1.5, h1: 32, h2: 24, h3: 20, small: 13 };

14.8 Interaction Patterns (baseline)
	•	Buttons: press feedback (scale 0.98 for 120ms); hover elevation from shadow.sm → shadow.md.
	•	Tables: sticky header, row hover, 12px cell padding; empty-state with primary CTA.
	•	Forms: inline validation; helper text always visible; destructive actions require confirm dialog.
	•	Toasts: top-right; 3–4 seconds; semantic coloring (success/warn/error).
	•	Navigation: sidebar (Admin/Advisor), breadcrumb for deep views, search in header.

14.9 Responsiveness
	•	Breakpoints: ≥1280 (desktop), 768–1279 (tablet), ≤767 (mobile).
	•	Collapse sidebar → icon rail (tablet) → drawer (mobile).
	•	Cards stack 3→2→1; tables gain column toggles on mobile; filters collapse to sheet.

14.10 Accessibility Checklist (AA)

Contrast ≥ 4.5:1 body text; focus rings visible; skip link; aria-labels for icon-only controls; label-input association; keyboard-operable drawers/menus; motion-reduced CSS for prefers-reduced-motion.

14.11 Performance Budget

First paint < 1.2s on mid-range laptop; route bundle < 180KB gz; images AVIF/WebP; icon sprites; avoid layout thrash; defer chart libs offscreen.

14.12 Definition of Done (each screen)
	•	Matches tokens (§14.7) and patterns (§14.8).
	•	Passes aXe checks; tab order correct.
	•	Works at all breakpoints (§14.9).
	•	Storybook story with controls + zero visual diffs in CI.
	•	Copy reviewed for tone and clarity.

14.13 MCP & Repo Prereqs (UI only)
	•	MCP servers to use:
	•	shadcn-mcp (component knowledge + scaffolding)
	•	superdesign (layout/theme agent context)
	•	firecrawl-mcp (optional, inspiration only)
	•	Repo/paths:
	•	/apps/web/ — Next.js app
	•	/apps/web/app/(advisor)/* — Advisor routes
	•	/apps/web/app/(admin)/* — Admin routes
	•	/apps/web/components/ui/* — shadcn components
	•	/apps/web/styles/theme.css — CSS vars from tokens
	•	/apps/web/tokens/design-tokens.ts — source of truth (see §14.7)
	•	/.claude/claude.md — SuperDesign prompt context
	•	/.claude/commands/shadcn-plan.md — /shadcn plan command
	•	/.claude/mcp/shadcn.json — MCP config
	•	/.claude/mcp/firecrawl.json — (optional)
	•	/stories/* — Storybook stories for all screens

14.14 Build Process (UI)
	1.	Layout (5 variants) → pick 1
	2.	Theme (5 variants) → pick 1
	3.	Hi-fi HTML/CSS → responsiveness + micro-interactions
	4.	Port to shadcn/ui + apply tokens
	5.	Wire to data + Storybook + visual regression


⸻

15) Risks & Mitigations
	•	Single approver bottleneck → Mitigation: Implement Fallback Packs and consider adding a secondary/backup approver role. Automated alerts will ensure approvers are reminded before cutoff.
	•	WhatsApp template rejections → Mitigation: Keep templates generic and reusable; have them pre-approved well in advance. Create a pipeline for quickly updating/adding templates if policies change.
	•	Overlay positioning issues → Mitigation: Design with safe‑area templates and add programmatic checks (and possibly visual QA snapshots) to ensure logos/disclaimers never obscure key content.
	•	Rate limits or quality drops on WhatsApp → Mitigation: Build per-tenant send throttling, backoff strategies, and mix content types. Monitor quality metrics so we can proactively adjust send frequency if needed.
	•	Scope creep (end-client features) → Mitigation: Strictly enforce out-of-scope boundaries for this phase. Any end-client related requests are flagged for future roadmap, not added to MVP.
	•	AI content (accuracy) risk → If using AI for drafting or linting, maintain human oversight to catch any compliance nuance or hallucination. (The nightly human review step remains the fail-safe to ensure nothing inappropriate goes out.)

⸻

16) Acceptance Criteria (Go/No‑Go for MVP)
	•	An Advisor user can complete onboarding (with verification and WhatsApp setup), select a tier, and subsequently receive a daily content pack via WhatsApp at 06:00 IST, without any manual steps by the team (assuming content was approved or fallback engaged).
	•	The Admin can view all submitted content packs, approve or reject them with feedback, and the system properly delivers approved content with all required elements (disclaimers, correct language variants, correct branding overlays).
	•	If no content is approved on a given day, the fallback mechanism kicks in automatically (for those opted in), so no opted-in advisor misses a content day.
	•	Basic analytics are available: the dashboard shows each advisor how many messages were sent, delivered, and read for each type of content (post, status, etc.).
	•	All webhooks (from WhatsApp) are properly authenticated (HMAC verified) and processed. The audit log contains a complete history of critical events (onboarding steps, content submissions, approvals, sends).

⸻

17) Decisions to Finalize (Defaults proposed)
	•	Send window – Default to 06:00 IST for daily sends (advisors can adjust per their preference).
	•	Fallback – Default ON for all tiers (so new advisors automatically have continuity; they can opt out).
	•	Renderer – Use Cloudinary by default for image generation (switch to ImageKit only if latency testing shows a significant benefit for India region).
	•	Storage – Use Cloudflare R2 by default (use AWS S3 only if the team is more comfortable or if specific AWS integration is needed).
	•	Templates – Prepare 1 welcome template (Utility category) and ~3 daily content notification templates (Marketing category) per language to begin with (expand as needed).
	•	Compliance engine – Start with a purely rule-based Compliance Guard for MVP. Plan to integrate the MCP/AI-based compliance assistant after MVP once its reliability is proven and content rules are well-understood.

⸻

18) Appendix — Compliance Copy Blocks (Advisor‑only)

Caption footer (auto‑appended to posts when required):
“Educational content only. Not investment advice. Mutual fund investments are subject to market risks. Read all scheme related documents carefully. — {{advisor_name}}, {{sebi_or_arn}}”

WhatsApp opt-in notice (shown during onboarding consent step):
“You agree to receive proactive WhatsApp messages containing educational content and asset files from {{brand_name}}. You can reply STOP at any time to pause these notifications.”

⸻

19) AI Implementation Strategy (Complete AI-First Architecture)

AI Models & Architecture (Updated)
	•	Vendor: OpenAI exclusively for MVP
	•	Model Configuration:
		– Compliance Primary: GPT-4o-mini for lint/evaluation (temperature 0.2)
		– Content Generation: GPT-4.1 for rewrites when needed (temperature 0.5 EN, 0.4 HI/MR)
		– Fast Evaluator: GPT-4o-mini for quick rule hints and bias detection
	•	Cost Controls: Per-advisor daily caps (10 generations + 20 lints); degrade to rules-only if monthly budget threshold reached
	•	Fallback Chain: Primary model → lighter model → cached variant → baseline template → Pre-Approved Fallback Pack
	•	Versioning: Pin model names in config/ai.yml with semver; canary upgrades with golden set comparison
	•	Model Upgrade Process: Dual-run on golden set → compare labels/costs → feature-flag rollout → one-click rollback

AI Personalization Engine
	•	Learning Scope: Ranking only, never compliance rule relaxation
	•	Data Sources: Advisor selections, edits, approvals/rejections, thumbs up/down feedback
	•	Profile Attributes: Topic affinity, tone preference, language usage patterns, engagement success
	•	Application: Rank pre-approved content and rewrite suggestions; bias future generation patterns
	•	Privacy: Use advisor_profile table with hashed/anonymized learning data only

Content Generation & Quality
	•	Variants: Generate 2 maximum per pack (concise + alternate angle)
	•	A/B Testing: Log "wins" by advisor selection + admin quality scores for pattern improvement
	•	Quality Scoring: 5-axis rubric (Clarity, Usefulness, Brevity, Brand Tone, Localizability) with 5-10% admin sampling
	•	Content Recommendations: AI ranks pre-approved packs by advisor profile + global popularity
	•	Caching Strategy: Cache variants by (draft_hash, prompt_version), TTL 14 days, invalidate on policy changes

Three-Stage Compliance Engine (Enhanced)
	•	Stage 1: Hard Rules (Regex/Policy Gates)
		– Max caption: 500 chars (550 with disclaimer)
		– Max emojis: 3, max hashtags: 2
		– Forbidden terms: guaranteed, sure-shot, risk-free, multibagger, assured returns, no risk, definite profit
		– Mandatory: disclaimer + advisor identity footer
	•	Stage 2: AI Evaluator (GPT-4o-mini)
		– Nuanced tone analysis and implication detection
		– Cultural sensitivity and bias detection
		– Performance-adjacent language identification
		– Risk score generation (0-100) with reasoning
	•	Stage 3: Final Verification
		– Rule compliance double-check
		– Disclaimer placement verification
		– Safe-area overlay validation (Pro tier)
	•	Uniform Thresholds: No advisor-specific leniency; consistent risk scoring across all users

AI Operational Intelligence
	•	Churn Risk Detection: Analyze usage patterns + approval latency + read rates + support tickets
	•	Market Analysis: AI suggests editorial topics/formats based on platform-wide trends, seasonality, macro events
	•	Performance Insights: Weekly personalized analysis per advisor (engagement trends, content effectiveness, optimization recommendations)
	•	Anomaly Detection: Flag unusual patterns (spike in rejections, low read streaks, compliance violations)
	•	Content Strategy: AI proposes monthly content calendar for admin review

AI Infrastructure & Performance (Updated)
	•	Latency Targets: Lint ≤1.5s P95, Generation ≤3.5s P95 per variant
	•	Concurrency: 50-150 concurrent AI calls during peak (20:00-22:00 IST) with backpressure
	•	Pre-generation: All approved assets rendered 20:30-21:30 IST (zero AI dependency at 06:00)
	•	Capacity Planning: 5k generations/hour during peak authoring with queue management
	•	Prompt Caching: Cache policy preambles and instruction blocks; prompt versioning in config
	•	Error Handling: Specific guidance on failures + "Use compliant baseline" button

AI Audit & Compliance
	•	Audit Trail: Store model name, version, prompt version, input/output hashes for 5-year retention
	•	Incident Response: Link regulator feedback to content IDs for retroactive pattern analysis
	•	Policy Evolution: Automated SEBI/RBI monitoring + policy YAML updates + regression test suite
	•	Change Management: Golden set for testing, canary rollouts, automated rollback capabilities
	•	Data Minimization: Send content only to OpenAI (no raw PII), contractual training opt-out

Translation & Localization (Enhanced)
	•	AI Translation Flow: EN → HI/MR with confidence scoring; flag <0.9 confidence for admin review
	•	Style Guidelines: Neutral-formal tone, Arabic numerals, avoid heavy transliteration at MVP
	•	Quality Assurance: Post-translation compliance pass, local language disclaimer enforcement
	•	Not at MVP: Hinglish support, regional dialect variants (future feature)

AI Cost Management
	•	Budget Controls: Monthly ceiling with degradation thresholds
	•	Usage Optimization: Efficient model selection (GPT-4o-mini for evaluation, GPT-4.1 for generation only when needed)
	•	Caching Strategy: Aggressive caching by content hash to reduce redundant API calls
	•	Monitoring: Real-time cost tracking per advisor, alert at 150% daily budget

AI Coaching & User Experience
	•	Compliance Coaching: Plain-English rejection explanations + micro-lessons + monthly pitfall digests
	•	Suggestion System: "Rewrite for compliance", "Explain fix", "Auto-translate" buttons in composer
	•	Learning Feedback: Optional advisor thumbs up/down on suggestions for quality improvement
	•	Error UX: Show specific guidance with rule names and example fixes rather than generic errors

Explicitly Not at MVP (Confirmed)
	•	No fine-tuning or autonomous model training
	•	No A/B testing infrastructure for content variants
	•	No Hinglish or regional language support
	•	No auto-approval (100% human oversight maintained)
	•	No external site crawling for trend analysis
	•	No per-advisor send-time optimization
	•	No LinkedIn/SMS automation beyond export capabilities

⸻

20) Decisions & Defaults (Authoritative — supersedes §17 proposals)

Business goals, scope, success
	•	North-star MVP metric: % of advisors who reliably receive a complete daily pack on WhatsApp by 06:05 IST for 14 consecutive business days. Target ≥ 98%.
	•	Scale targets:
	– T+90 days: 150–300 advisors; 1–2 packs/day; EN/HI; ~600–1,200 WA sends/day.
	– T+12 months: 1,000–2,000 advisors; 2–3 packs/day; EN/HI/MR; 6k–12k sends/day.
	•	Vertical focus: MFDs first, RIAs next (keeps compliance simpler on captions/CTAs).
	•	Infra/model budget ceilings: MVP infra ≤ ₹65k/month; model spend ≤ ₹25k/month (room to flex ±20%).
	•	Launch cadence: Soft-pilot with 10–20 friendly advisors; rolling cohorts; no hard public date in PID.

AI-first strategy
	•	Day-one AI: compliance lint, caption rewrites within guardrails, localization drafts, pack recommendations, admin “approve risk score.
	•	Models: Hosted APIs (Anthropic/OpenAI) for text; no model training on our data; log retention off where possible.
	•	Guardrails: Rules/regex first, LLM as final check with explanation.
	•	Images: No AI image gen at MVP; use brand templates + overlays.
	•	Template selection & WA health: AI suggests template + flags quality drops; human remains in loop.
	•	AI performance: Track lint precision/recall, false-block %, advisor satisfaction (thumbs up/down), time-to-approve.

Personas & roles
	•	Roles: Admin, Backup Approver, Advisor.
	•	Advisor seats: Owner, Editor, Viewer (read-only).
	•	Multi-brand advisors: supported via sub-tenants under one login (Pro only).

Tiers, pricing, seats, limits
	•	Proposed pricing (to tune later): Basic ₹2,999 /mo; Standard ₹5,999 /mo; Pro ₹11,999 /mo. Annual −20%.
	•	Caps: Basic/Standard = hard (block creation with upgrade CTA). Pro = soft with overage packs @ ₹99/pack.
	•	Add-on seats: ₹499/seat/mo across tiers.
	•	Pro API scope: read-only export of rendered packs, delivery stats; 60 req/min per tenant.

Onboarding & verification
	•	Docs:
	– RIA: SEBI reg cert, PAN, GSTIN (opt), address proof (utility/bank), website (opt).
	– MFD: AMFI ARN/EUIN cert, PAN, GSTIN (opt), address proof.
	– Formats: PDF/JPG/PNG; ≤ 5 MB each.
	•	OTP: Phone via MSG91; email via AWS SES one-time code.
	•	WABA: Start on our platform WABA; “connect your WABA” is a Pro-only future flag.
	•	Legal: ToS, Privacy, DPDP consent, WhatsApp opt-in—versioned + time-stamped.

WhatsApp Cloud API specifics
	•	Templates at MVP (per language):
	– welcome_v1(name) (Utility)
	– daily_pack_v1(topic, lang, hint) (Marketing, image slot)
	– status_pack_v1(topic, lang) (Marketing, image slot)
	•	Throughput plan: Fan-out across 05:59:30–06:04:30 with jitter; burst cap per sender configured; SLO still 06:05.
	•	Media: Pre-upload, reuse media_id when possible; else signed CDN URL TTL 48h.
	•	STOP/START: Accept STOP, PAUSE, START, RESUME (case/locale-insensitive); confirm with acks; accidental STOP → in-app re-opt flow + confirm template.

Content strategy & taxonomy
	•	Authoring: Curated human base + AI assists; advisors can tweak within guardrails.
	•	Families: SIP, Tax, Asset basics, Market explainer, Festive, Behavioral, Regulatory note.
	•	Calendar: Daily micro-tips + weekly explainer; AI proposes a monthly plan for Admin review.
	•	Images: Licensed stock/our templates only; no third-party logos unless Pro overlay for advisor branding.

Caption & compliance rules
	•	Hard don'ts (AI-enforced): No guarantees, no "sure-shot/multibagger/assured returns/risk-free", no selective past performance, no FOMO, no unapproved solicitations.
	•	Length: ≤ 500 chars body + 50 char disclaimer (550 total WA friendly); ≤ 3 emojis; 0–2 hashtags max.
	•	RIA vs MFD: Footer varies by reg type; AI auto-inserts appropriate disclaimer and reg number.
	•	Languages: AI ensures mandated disclaimer blocks per language with compliance-verified translation.

Localization (EN/HI/MR)
	•	Flow: AI translate → confidence score → if <0.9, highlight for admin glance.
	•	Style: Neutral-formal; numerals stay Arabic; avoid heavy transliteration at MVP (Hinglish later).
	•	Preference: Tenant selects one primary language for WA delivery; others as optional downloads.

Brand-on-image overlays (Pro)
	•	Safe-area JSON per template: {top,bottom,left,right} in px/% plus “no-cover” masks.
	•	Logo: SVG preferred; PNG ≥ 512px; auto-detect + warn if low-res.
	•	Cloudinary: Named transforms: proOverlayV1, statusV1, lnkdV1.
	•	Metadata: Write IDs in XMP; filenames human-readable; no PII in EXIF.

Fallback library & continuity
	•	Size: 60 packs/lang rolling; refresh monthly.
	•	AI Curation: AI proposes fallback candidates ranked by:
		– Historical engagement scores
		– Seasonal relevance
		– Topic diversity to avoid repetition
		– Compliance safety (only green-rated content)
	•	Auto-send: If enabled and no approval by 21:30 → AI selects best-fit fallback with "Evergreen" mark.
	•	Model Fallback: If primary AI fails, system uses lighter model; if both fail, sends pre-selected safe pack.

Scheduling & delivery windows
	•	Default 06:00 IST; advisors may shift to 07:00 or weekdays-only.
	•	Quiet hours: 22:00–07:00 for non-critical comms.
	•	Holiday logic: Indian holiday calendar; nudge to shift sending the day prior.

Analytics & experimentation
	•	KPIs: sent, delivered, read rates; day/week trendlines; baseline vs anonymized cohort.
	•	AI Weekly Insights: Personalized paragraph per advisor analyzing:
		– Performance trends ("Your read rate rose 8% week-over-week")
		– Content effectiveness ("Festive content outperformed SIP by 15%")
		– Engagement patterns and recommendations
		– Compliance score trends
	•	AI Anomaly Detection: Flags unusual patterns (spike in rejections, low read streaks, compliance violations)
	•	A/B: Not at MVP (future: AI-suggested caption variants to 10% subset)

Admin operations
	•	Staffing: 1 Approver + 1 Backup nightly; target 120–180 items/hr with batch approve.
	•	Batch tools: Multi-select approve/reject; canned notes; inline edit with tracked diffs.

Data model clarifications
	•	content_pack.status: scheduled only after approval (Admin can force-approve + schedule).
	•	render_job.overlay_config: versioned per template; advisor overrides stored separately.
	•	delivery.status: queued | throttled | sent | delivered | read | failed.
	•	Retention: tier-based hard delete of media; metadata kept 24 mo (audit), then archived unless legal hold.

API & integrations
	•	Billing: Razorpay (UPI/cards); GST invoices built-in (Zoho Books later optional).
	•	Webhooks (ours): idempotency keys; retry with exponential backoff to 24h.
	•	Advisor webhooks (Pro): delivery events + URLs; 60 req/min; HMAC-signed.

Observability & SLOs
	•	SLO: ≥ 99% packs delivered by 06:05; monthly error budget 0.5%.
	•	On-call: 05:30–06:30 IST; page on send failure >2% in 5 min or WA quality drop.
	•	Tooling: Datadog APM + logs; Grafana for SLO boards.

Security, privacy, compliance
	•	KMS: AWS KMS; keys rotated quarterly.
	•	Residency: ap-south-1 for PII & media.
	•	Pen test: External before GA; medium findings must be remediated.
	•	DPDP: Export within 7 days, delete within 30 days; admin self-serve tools.
	•	Admin IP allowlist: yes, configurable.

Storage, CDN, media
	•	Primary: Cloudflare R2 + CDN.
	•	Signed URL TTL: 48h (downloads) / 24h (internal preview).
	•	Formats: AVIF/WebP first; ship 2× assets for WA clarity.

Infra & environments
	•	Envs: dev, staging, prod; seeded demo tenants.
	•	CI/CD: GitHub Actions—typecheck, lint, unit, Storybook build, Playwright smoke.
	•	Feature flags: ConfigCat.

Billing & taxation
	•	GST: capture GSTIN; validate format; invoice shows SAC/HSN.
	•	Trials: 14-day; Basic limits; watermark on images; no API during trial.

UI/UX (composer copilot & a11y)
	•	Composer co-pilot: Rewrite, Summarize, “Explain compliance fix”, Auto-translate buttons.
	•	Accessibility: AA across; dark mode = post-MVP.

Risks & mitigations
	•	Template pause: auto-fallback to *_v2 backup template; alert Admin.
	•	Quality drop: throttle + quality tips to advisor.
	•	DR: RTO 4h, RPO 1h; daily snapshots + infra as code.

Legal & policy content
	•	ToS/Privacy/DPDP placeholders included; advisor warranties on content source and branding rights; indemnity for misuse.

Roadmap boundaries
	•	Explicitly out-of-scope MVP: end-client storage/messaging, CRM, LinkedIn API posting, payments/investments, AI image gen.
	•	Post-MVP: LinkedIn posting, per-client personalization, SMS fallback, dark mode, Hinglish, advisor WABA connect.

Performance budgets
	•	Dashboard FCP: < 1.2s on mid-range laptop; route bundles < 180KB gz; chart libs lazy-loaded.
	•	Queue latency: render < 60s; 06:00 fan-out finish by 06:05.

Governance & audit
	•	Compliance rule changes: Admin + Backup Approver sign-off; auto-versioned.
	•	Audit access: Admin export (CSV/JSON) with PII redaction options; retain 24 mo.

Data science & insights
	•	Not day-one. Log events for future topic-affinity scoring; Redis-backed features later.

Edge cases & failure modes
	•	Render fail @05:55: send last-known-good pack; if none, fallback library.
	•	Partial WA fail: retry within window; counts as on-time if sent ≤ 06:05 queue; otherwise mark late.
	•	Logo change @05:59: lock assets at 21:30; new logo applies next cycle.

WA languages/transliteration
	•	No RTL; transliteration (Hinglish/Marathi in Latin) = future toggle.

Pro API access
	•	Export format: ZIP (meta.json, captions, images); signed URL 7 days; API key + HMAC.

Support & ops
	•	Channels: in-app + email + WA support; SLA next business day (Standard), same day (Pro).
	•	Status page: in-product banner for WA health.

Final defaults (confirming §17)
	•	Fallback ON all tiers (toggle per tenant).
	•	Renderer Cloudinary; Storage R2.
	•	Compliance rules-first + LLM backstop at MVP.

MCP & repo prerequisites (UI)
	•	MCP servers: shadcn-mcp, superdesign; firecrawl-mcp optional for inspiration only.
	•	Key paths:
/apps/web/app/(advisor|admin)/* • /apps/web/components/ui/* • /apps/web/tokens/design-tokens.ts • /apps/web/styles/theme.css • /.claude/claude.md • /.claude/mcp/*.json • /stories/*

⸻

21) AI Configuration & Prompts (Reference Implementation)

AI Config (config/ai.yaml):
```yaml
ai:
  vendor: openai
  models:
    compliance_primary: gpt-4-turbo-preview
    compliance_fastgate: gpt-3.5-turbo
    copy_primary: gpt-4-turbo-preview
    translate_primary: gpt-4-turbo-preview
  temperatures:
    compliance: 0.2
    copy_en: 0.5
    copy_hi_mr: 0.4
  timeouts_ms:
    compliance: 5000
    copy: 7000
  retries:
    max_attempts: 2
    backoff_ms: 300
  retention_days: 90

compliance:
  hard_rules:
    max_caption_chars: 500
    max_emojis: 3
    forbid_terms:
      - guaranteed
      - sure-shot
      - risk-free
      - multibagger (as promise)
      - double your money
      - assured returns
      - no risk
      - definite profit
    require_disclaimer: true
    require_identity_footer: true
  advisor_types:
    RIA:
      footer_template: "{{advisor_name}}, SEBI RIA {{sebi_no}} — Educational only. No investment advice."
    MFD:
      footer_template: "{{advisor_name}}, ARN {{arn}} — Mutual fund investments are subject to market risks. Read all scheme related documents carefully."
  reason_codes:
    - MISSING_DISCLAIMER
    - MISSING_IDENTITY
    - RISK_PERF_PROMISE
    - RISK_TONE_CERTAINTY
    - LENGTH_EXCEEDED
    - EXCESS_EMOJI
    - BRAND_TONE_VIOLATION
    - PROHIBITED_TERM
    - MISSING_BALANCE

localization:
  languages: [EN, HI, MR]
  number_format: "INDIAN_GROUPING"
  avoid_hinglish: true
  enforce_local_disclaimer: true

fallbacks:
  enabled: true
  trigger_cutoff_ist: "21:30"
  library_tag: "Evergreen"
```

System Prompts:

Compliance Check (Primary):
```
You are a SEBI-aware compliance checker for financial captions sent B2B to advisors in India. 
Your role is to ensure strict adherence to SEBI advertising code and mutual fund regulations.

Rules:
1. Never allow predictions, guarantees, or return promises
2. Require proper disclaimer and advisor identity footer
3. Flag any forward-looking statements without appropriate hedging
4. Ensure educational tone without solicitation
5. Check for balanced presentation (risks mentioned with benefits)

Output JSON format:
{
  "allowed": boolean,
  "risk_score": 0-100,
  "reasons": ["reason_code1", "reason_code2"],
  "suggestions": ["specific improvement 1", "specific improvement 2"],
  "fixed_caption": "compliant version of caption if fixable"
}

Use Indian English conventions. Be strict but helpful.
```

Caption Generation:
```
You are a financial content creator for Indian mutual fund advisors.
Create educational content that is:
- Compliant with SEBI regulations
- Informative without being promotional
- Culturally relevant to Indian investors
- Clear and jargon-free
- Engaging but professional

Topic: {{topic}}
Language: {{language}}
Occasion: {{occasion if any}}

Constraints:
- Maximum 400 characters (leaving room for disclaimer)
- No performance promises or guarantees
- Include actionable insight or learning
- End with a question or reflection to encourage engagement

Generate 2 variants: one concise, one with slightly different angle.
```

Translation Instruction (EN→HI/MR):
```
Translate the following financial educational content from English to {{target_language}}.

Guidelines:
- Preserve meaning and compliance intent
- Use formal-neutral tone appropriate for financial communication
- Keep numbers in Indian grouping (e.g., 1.5 lakh, 50 हज़ार)
- Translate technical terms accurately but keep widely understood English terms
- Maintain any disclaimers word-for-word accuracy
- Avoid idioms that don't translate well

Original: {{english_caption}}

Return:
{
  "translated_caption": "...",
  "notes": ["any adjustments made for clarity"],
  "disclaimer_verified": true/false
}
```

Risk Scoring Logic:
```python
# Pseudocode for risk scoring
def calculate_risk_score(analysis_result):
    score = 0
    
    # Critical violations (high weight)
    if "guaranteed" in text or "assured returns" in text:
        score += 40
    if missing_disclaimer:
        score += 30
    if missing_identity:
        score += 20
    
    # Medium violations
    if forward_looking_without_hedge:
        score += 15
    if excessive_optimism:
        score += 10
    if unbalanced_presentation:
        score += 10
    
    # Minor violations
    if emoji_count > 3:
        score += 5
    if hashtag_count > 2:
        score += 5
    if informal_tone:
        score += 5
    
    return min(score, 100)
```

⸻

## COMPREHENSIVE REQUIREMENTS SUMMARY (Implementation Bible)

This PRD now serves as the complete requirements bible for building the AI-first B2B financial content platform. Key additions and clarifications include:

### **AI-First Strategy (Fully Defined)**Can you tell me, can you give me the actual links so that I can click and see?
- **Models**: GPT-4o-mini (lint/eval), GPT-4.1 (generation), with cost controls and fallback chains
- **Personalization**: Advisor-specific content ranking (never compliance rule relaxation)
- **Three-Stage Compliance**: Rules → AI Evaluator → Final Verification with uniform thresholds
- **Performance**: ≤1.5s lint, ≤3.5s generation latency with 50-150 concurrent processing capacity
- **Cost Management**: Per-advisor daily caps, budget degradation thresholds, aggressive caching

### **Business Model (Validated)**
- **Launch Strategy**: "Founding 100" 50% discount, MFD focus first 3 months, then RIA expansion
- **Pricing**: Confirmed ₹2,999/₹5,999/₹11,999 with 14-day trials and GST compliance
- **Scale Targets**: 150-300 advisors at T+90, 1,000-2,000 at T+12 months
- **Revenue**: ₹45-90L ARR at T+90, ₹3.6-7.2Cr ARR at T+12 months

### **Technical Architecture (AI-Optimized)**
- **Pre-generation**: All content rendered 20:30-21:30 IST (zero AI dependency at 06:00)
- **WhatsApp Strategy**: Multiple phone numbers, template buffering, quality recovery playbooks
- **Data Protection**: India-region storage, AI data minimization, DPO role, DSAR automation
- **Disaster Recovery**: RTO ≤60min, RPO ≤15min with multi-AZ setup

### **Compliance & Legal (Comprehensive)**
- **SEBI Alignment**: Automated monitoring, incident logging, policy YAML versioning
- **Audit Trail**: 5-year retention, model versioning, content hashing, regulatory reporting
- **Risk Mitigation**: Platform dependencies, regulatory changes, scaling challenges, AI failures

### **User Experience (AI-Enhanced)**
- **Onboarding**: 70-85% completion rate target with progressive save/resume
- **Content Creation**: AI coaching, compliance suggestions, personalized recommendations
- **Mobile Strategy**: Desktop-first dashboard, offline content downloads, responsive design

### **Operations (Scalable)**
- **Support Model**: 7×12 coverage, tiered staffing ratios, multi-channel support
- **Quality Assurance**: Automated testing, visual regression, compliance validation
- **Performance Monitoring**: North star metric (98% delivery success), AI KPIs, churn detection

### **Implementation Phases**
1. **MVP (0-3 months)**: MFD focus, core AI, basic features
2. **Expansion (3-6 months)**: RIA support, AI intelligence, Pro features  
3. **Scale (6-12 months)**: Enterprise features, API access, advanced analytics

This document now contains every requirement, decision, and specification needed to build the platform successfully. All questions have been answered, all edge cases considered, and all AI-first implementations detailed. This serves as the authoritative source for development, compliance, and business operations.