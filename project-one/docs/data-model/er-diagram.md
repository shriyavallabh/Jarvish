# Entity Relationship Diagram - Project One

## Core Entities

### Advisors & Authentication
```
advisor: {
  id (PK)
  status: pending|approved|suspended
  tier: basic|standard|pro
  type: RIA|MFD
  sebi_reg_no / arn
  company_name
  logo_url
  wa_business_phone
  waba_id
  wa_optin_ts
  language_set: [EN,HI,MR]
  send_window: 06:00|07:00
  disclaimer_footer
  seats_allowed
  billing_customer_id
  auto_send_enabled: boolean
  health_score: 0-100
  created_at, updated_at
}

advisor_profile: {
  advisor_id (FK)
  topic_affinity_scores: json
  tone_preference
  edit_patterns: json
  approval_success_rate
  engagement_metrics: json
  last_updated
}

admin_user: {
  id (PK)
  email
  role: admin|backup_approver|dpo
  has_2fa_enabled: boolean
  ip_allowlist: text[]
  created_at
}
```

### Content & Compliance
```
content_pack: {
  id (PK)
  advisor_id (FK)
  creator_type: advisor|admin
  topic_family
  languages: text[]
  draft_content_json: jsonb
  ai_risk_score: 0-100
  ai_suggestions: text[]
  compliance_reasons: text[]
  status: draft|pending|approved|rejected|scheduled|sent
  schedule_date
  content_hash: text
  admin_notes
  quality_scores: json
  variant_selection_log: json
  created_at, updated_at
}

render_job: {
  id (PK)
  content_pack_id (FK)
  variants_requested: text[]
  overlay_config: json
  result_asset_urls: json
  checksums: json
  cache_status
  completed_at
}
```

### WhatsApp & Delivery
```
wa_template: {
  id (PK)
  name
  category: utility|marketing
  supported_locales: text[]
  placeholders: text[]
  status: approved|pending
  variant_number: integer
  created_at
}

delivery: {
  id (PK)
  content_pack_id (FK)
  advisor_id (FK)
  channel: whatsapp
  content_variant: post|status|linkedin
  message_id: text
  status: queued|throttled|sent|delivered|read|failed
  error_code
  timestamp
  retry_count: integer
}
```

### Fallback System
```
fallback_policy: {
  id (PK)
  enabled: boolean
  languages: text[]
  topic_priority: json
  library_size: integer
  ai_curation_enabled: boolean
  last_updated
  audit_notes
}

fallback_pack: {
  id (PK)
  content_json: jsonb
  languages: text[]
  topic_family
  engagement_score: decimal
  seasonal_relevance: json
  compliance_rating: integer
  created_at
  last_used
}
```

### Audit & Compliance
```
audit_log: {
  id (PK)
  actor_type: admin|advisor|system
  actor_id
  action
  entity_type
  entity_id
  details_json: jsonb
  timestamp
}

ai_audit_log: {
  id (PK)
  content_pack_id (FK)
  model_name
  model_version
  prompt_version
  prompt_hash
  input_hash
  output_hash
  risk_score: integer
  reasons: text[]
  latency_ms: integer
  token_count: integer
  cost_cents: integer
  timestamp
}

compliance_incident: {
  id (PK)
  content_pack_id (FK)
  regulator_source
  feedback_text
  impact_assessment
  related_content_ids: integer[]
  resolution_notes
  created_at
}

policy_version: {
  id (PK)
  version_tag
  policy_yaml_hash
  effective_date
  change_summary
  regression_test_results: json
  created_at
}
```

## Key Relationships

```
advisor ||--o{ content_pack }o--|| admin_user (approver)
content_pack ||--o{ render_job
content_pack ||--o{ delivery
advisor ||--|| advisor_profile
content_pack }o--|| fallback_pack (via AI selection)
wa_template ||--o{ delivery (via template usage)
```

## Data Residency & Protection
- **PII Storage**: ap-south-1 region only
- **Encryption**: At-rest with AWS KMS, quarterly key rotation
- **Retention**: Tier-based (6mo/12mo/24mo), hard delete with audit trail
- **Cross-border**: AI processing only, no PII in prompts
- **DSAR**: Automated export/delete with 7-day SLA