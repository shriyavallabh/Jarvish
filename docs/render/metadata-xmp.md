# Image Metadata & XMP Identification Scheme 🏷️

## Overview
Comprehensive metadata and XMP tagging system for generated financial content images, enabling traceability, compliance auditing, and automated content management across the platform lifecycle.

## XMP Metadata Framework

### Core XMP Schema Definition
```xml
<?xml version="1.0" encoding="UTF-8"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    
    <!-- Project One Custom Schema -->
    <rdf:Description rdf:about=""
      xmlns:p1="https://projectone.ai/xmp/1.0/"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:xmp="http://ns.adobe.com/xap/1.0/"
      xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/"
      xmlns:sebi="https://sebi.gov.in/compliance/1.0/">
      
      <!-- Project One Identifiers -->
      <p1:ContentID>{{content_id}}</p1:ContentID>
      <p1:AdvisorID>{{advisor_id_hash}}</p1:AdvisorID>
      <p1:GenerationTimestamp>{{iso_timestamp}}</p1:GenerationTimestamp>
      <p1:Platform>{{target_platform}}</p1:Platform>
      <p1:ContentType>{{content_category}}</p1:ContentType>
      <p1:Language>{{content_language}}</p1:Language>
      <p1:AdvisorTier>{{subscription_tier}}</p1:AdvisorTier>
      
      <!-- Compliance Metadata -->
      <sebi:ComplianceScore>{{risk_score}}</sebi:ComplianceScore>
      <sebi:ApprovalStatus>{{approval_status}}</sebi:ApprovalStatus>
      <sebi:ReviewerID>{{reviewer_hash}}</sebi:ReviewerID>
      <sebi:DisclaimerVersion>{{disclaimer_version}}</sebi:DisclaimerVersion>
      <sebi:AdvisorRegistration>{{sebi_registration}}</sebi:AdvisorRegistration>
      
      <!-- Standard Dublin Core -->
      <dc:title>{{content_title}}</dc:title>
      <dc:creator>{{advisor_name_anonymized}}</dc:creator>
      <dc:subject>{{content_topics}}</dc:subject>
      <dc:description>{{content_description}}</dc:description>
      <dc:date>{{creation_date}}</dc:date>
      <dc:language>{{language_code}}</dc:language>
      
      <!-- Rights Management -->
      <xmpRights:Marked>true</xmpRights:Marked>
      <xmpRights:WebStatement>https://projectone.ai/usage-rights</xmpRights:WebStatement>
      <xmpRights:UsageTerms>Educational content for financial advisors</xmpRights:UsageTerms>
      
      <!-- Technical Metadata -->
      <xmp:CreatorTool>Project One AI Platform v{{version}}</xmp:CreatorTool>
      <xmp:CreateDate>{{creation_timestamp}}</xmp:CreateDate>
      <xmp:ModifyDate>{{modification_timestamp}}</xmp:ModifyDate>
      
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
```

## Filename Identification System

### Filename Pattern Structure
```yaml
filename_pattern: "{platform}_{content_type}_{advisor_id}_{date}_{sequence}_{language}.{format}"

pattern_components:
  platform:
    wa: "WhatsApp Post (1200x628)"
    st: "Status (1080x1920)" 
    li: "LinkedIn (1200x627)"
    
  content_type:
    edu: "Educational Content"
    mkt: "Market Update"
    sip: "SIP Education"
    tax: "Tax Planning"
    ins: "Insurance Guidance"
    ret: "Retirement Planning"
    
  advisor_id:
    format: "6_character_hash"
    algorithm: "SHA-256_truncated"
    anonymization: "irreversible_hash"
    
  date:
    format: "YYYYMMDD"
    timezone: "IST"
    
  sequence:
    format: "3_digit_zero_padded"
    scope: "daily_sequence_per_advisor"
    
  language:
    en: "English"
    hi: "Hindi" 
    mr: "Marathi"
```

### Example Filenames
```yaml
example_filenames:
  whatsapp_post:
    filename: "wa_edu_a7b3c9_20241201_001_en.webp"
    breakdown:
      platform: "WhatsApp Post"
      content_type: "Educational Content"
      advisor_hash: "a7b3c9"
      date: "December 1, 2024"
      sequence: "First content of day"
      language: "English"
      format: "WebP optimized"
      
  status_content:
    filename: "st_mkt_d4e8f2_20241201_003_hi.jpg"
    breakdown:
      platform: "Status"
      content_type: "Market Update"
      advisor_hash: "d4e8f2"
      date: "December 1, 2024"
      sequence: "Third content of day"
      language: "Hindi"
      format: "JPEG optimized"
      
  linkedin_post:
    filename: "li_ret_9k5m7n_20241201_001_en.png"
    breakdown:
      platform: "LinkedIn"
      content_type: "Retirement Planning"
      advisor_hash: "9k5m7n"
      date: "December 1, 2024"
      sequence: "First content of day"
      language: "English"
      format: "PNG with transparency"
```

## Content Identification Schema

### Content ID Generation
```yaml
content_id_structure:
  format: "P1_{timestamp}_{advisor_hash}_{platform}_{random}"
  
  components:
    prefix: "P1" # Project One identifier
    timestamp: "Unix_timestamp_base36"
    advisor_hash: "6_char_advisor_identifier"
    platform: "2_char_platform_code"
    random: "4_char_random_string"
    
  example_ids:
    - "P1_2KM8N7_a7b3c9_wa_x4y9"
    - "P1_2KM8N8_d4e8f2_st_m2p7"
    - "P1_2KM8N9_9k5m7n_li_q6t3"
    
  collision_prevention:
    uniqueness_check: "database_constraint"
    retry_mechanism: "new_random_suffix"
    monitoring: "duplicate_id_alerting"
```

### Advisor Identification Hashing
```yaml
advisor_hashing:
  algorithm: "SHA-256"
  input_data: "advisor_email + sebi_registration + platform_salt"
  output_format: "6_character_base32"
  
  implementation:
    salt_rotation: "quarterly"
    collision_handling: "append_incremental_suffix"
    anonymization_guarantee: "irreversible_one_way_hash"
    
  mapping_storage:
    location: "secure_encrypted_database"
    access_control: "admin_only"
    audit_logging: "all_access_logged"
    retention: "5_years_regulatory_compliance"
```

## Platform-Specific Metadata

### WhatsApp Post Metadata
```json
{
  "whatsapp_metadata": {
    "format": "1200x628",
    "safe_areas_verified": true,
    "disclaimer_compliance": {
      "sebi_disclaimer_present": true,
      "disclaimer_position": "bottom_overlay",
      "disclaimer_readability": "high_contrast_verified"
    },
    "branding": {
      "advisor_logo_included": true,
      "logo_position": "top_right",
      "logo_compliance_check": "passed"
    },
    "optimization": {
      "whatsapp_size_limit": "under_16mb",
      "format_optimization": "webp_with_jpeg_fallback",
      "quality_score": 95
    }
  }
}
```

### Status Content Metadata  
```json
{
  "status_metadata": {
    "format": "1080x1920",
    "story_optimized": true,
    "text_overlay": {
      "readability_score": "high",
      "contrast_ratio": "4.5:1_wcag_aa",
      "font_size_minimum": "24px_mobile_readable"
    },
    "duration_estimate": "7_seconds_reading_time",
    "engagement_elements": {
      "call_to_action": false,
      "interactive_elements": false,
      "educational_focus": true
    }
  }
}
```

### LinkedIn Professional Metadata
```json
{
  "linkedin_metadata": {
    "format": "1200x627",
    "professional_compliance": true,
    "credential_display": {
      "sebi_registration_visible": true,
      "professional_designation": "included",
      "credential_verification": "automated_check_passed"
    },
    "content_tone": {
      "professional_language": "verified",
      "industry_appropriate": true,
      "compliance_disclaimers": "comprehensive"
    }
  }
}
```

## Audit Trail Integration

### Compliance Tracking Metadata
```yaml
compliance_audit_metadata:
  validation_history:
    - stage: "stage_1_rule_validation"
      timestamp: "2024-12-01T05:30:00Z"
      result: "passed"
      risk_score: 15
      
    - stage: "stage_2_ai_analysis"  
      timestamp: "2024-12-01T05:30:15Z"
      result: "passed"
      ai_confidence: 0.92
      risk_score: 18
      
    - stage: "stage_3_final_validation"
      timestamp: "2024-12-01T05:30:30Z"
      result: "approved"
      final_risk_score: 16
      
  approval_chain:
    automated_approval: true
    human_reviewer: null
    approval_timestamp: "2024-12-01T05:30:30Z"
    compliance_version: "v2.1.3"
```

### Content Lifecycle Tracking
```yaml
lifecycle_metadata:
  creation_pipeline:
    ai_generation_time: "2.3_seconds"
    rendering_time: "1.8_seconds"  
    total_processing_time: "4.1_seconds"
    
  delivery_tracking:
    scheduled_delivery: "2024-12-01T06:00:00+05:30"
    actual_delivery: "2024-12-01T06:00:23+05:30"
    delivery_success: true
    delivery_attempts: 1
    
  engagement_metrics:
    whatsapp_delivered: true
    whatsapp_read: true
    forward_count: 3
    engagement_score: 85
```

## Metadata Storage & Retrieval

### Database Schema
```sql
CREATE TABLE content_metadata (
  content_id VARCHAR(50) PRIMARY KEY,
  advisor_id_hash VARCHAR(10) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  platform ENUM('whatsapp', 'status', 'linkedin') NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  language ENUM('en', 'hi', 'mr') NOT NULL,
  creation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- XMP Metadata JSON
  xmp_metadata JSON NOT NULL,
  
  -- Compliance Information
  compliance_score INTEGER NOT NULL,
  approval_status ENUM('pending', 'approved', 'rejected') NOT NULL,
  reviewer_hash VARCHAR(10),
  
  -- File Information
  file_size_bytes INTEGER,
  image_dimensions JSON, -- {"width": 1200, "height": 628}
  file_format VARCHAR(10),
  
  -- Audit Trail
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_advisor_date (advisor_id_hash, DATE(creation_timestamp)),
  INDEX idx_platform_type (platform, content_type),
  INDEX idx_compliance_score (compliance_score),
  INDEX idx_approval_status (approval_status)
);
```

### Metadata Retrieval API
```yaml
metadata_api_endpoints:
  get_content_metadata:
    endpoint: "GET /api/v1/content/{content_id}/metadata"
    response: "complete_xmp_and_database_metadata"
    
  search_by_advisor:
    endpoint: "GET /api/v1/advisor/{advisor_hash}/content"
    parameters: ["date_range", "platform", "content_type"]
    
  compliance_audit_trail:
    endpoint: "GET /api/v1/compliance/audit/{content_id}"
    response: "complete_compliance_validation_history"
    
  bulk_metadata_export:
    endpoint: "POST /api/v1/metadata/export"
    format: "json_or_csv_download"
    use_case: "regulatory_reporting"
```

## Privacy & Security Considerations

### Data Anonymization
```yaml
privacy_protection:
  advisor_identification:
    method: "irreversible_cryptographic_hash"
    key_management: "hardware_security_module"
    salt_rotation: "quarterly_automated"
    
  content_anonymization:
    sensitive_data: "removed_before_metadata_storage"
    client_information: "never_stored_in_metadata"
    personal_identifiers: "hashed_or_excluded"
    
  metadata_access_control:
    admin_access: "multi_factor_authentication"
    audit_logging: "all_metadata_access_logged"
    retention_policy: "5_year_regulatory_requirement"
```

### Security Measures
```yaml
metadata_security:
  encryption:
    at_rest: "AES_256_database_encryption"
    in_transit: "TLS_1.3_all_api_calls"
    backup: "encrypted_backup_with_separate_keys"
    
  access_control:
    role_based: "advisor_own_content_only"
    admin_access: "full_platform_metadata"
    compliance_team: "audit_trail_access_only"
    
  integrity_verification:
    metadata_hashing: "SHA_256_integrity_checks"
    tamper_detection: "automatic_integrity_monitoring"
    audit_trail: "immutable_compliance_logging"
```

## Monitoring & Analytics

### Metadata Quality Monitoring
```yaml
quality_assurance:
  completeness_checks:
    - "all_required_xmp_fields_present"
    - "compliance_metadata_complete"
    - "filename_pattern_compliance"
    
  accuracy_validation:
    - "advisor_hash_consistency_check"
    - "timestamp_accuracy_verification"
    - "platform_metadata_alignment"
    
  compliance_monitoring:
    - "sebi_metadata_requirement_fulfillment"
    - "audit_trail_completeness"
    - "retention_policy_compliance"
```

### Business Intelligence Integration
```yaml
analytics_integration:
  content_performance_tracking:
    - "platform_specific_engagement_correlation"
    - "content_type_performance_analysis"
    - "advisor_tier_content_effectiveness"
    
  compliance_trend_analysis:
    - "risk_score_distribution_over_time"
    - "compliance_improvement_patterns"
    - "platform_specific_compliance_challenges"
    
  operational_insights:
    - "content_generation_volume_trends"
    - "processing_time_optimization_opportunities"
    - "error_pattern_identification"
```

This comprehensive metadata and XMP system ensures complete traceability, compliance auditing, and efficient content management throughout the platform's content lifecycle while maintaining privacy and security standards.