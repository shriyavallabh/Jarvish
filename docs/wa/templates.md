# WhatsApp Cloud API Templates 📩

## Approved Template Specifications

### Template Categories & Approval Strategy
```yaml
template_categories:
  utility_templates:
    approval_time: "24-48 hours"
    examples: ["welcome_v1", "confirmation", "opt_status"]
    policy_risk: "low"
  
  marketing_templates:
    approval_time: "3-5 business days"
    examples: ["daily_pack_v1", "status_pack_v1"]
    policy_risk: "medium"
    
  rotation_strategy:
    variants_per_language: 3
    rotation_schedule: "weekly"
    fallback_required: true
```

## Template Definitions

### 1. Welcome Template (Utility)

#### English Version
```yaml
template_name: "welcome_v1_en"
category: "UTILITY"
language: "en"
parameters:
  - name: "advisor_name"
    type: "TEXT"
    example: "Rajesh"

template_content: |
  Welcome *{{1}}*,
  
  Your daily financial content delivery is now active 📈
  
  You'll receive educational content packs at 06:00 IST every business day.
  
  Reply *STOP* anytime to pause delivery.
  Reply *HELP* for assistance.

example_payload:
  messaging_product: "whatsapp"
  to: "919876543210"
  type: "template"
  template:
    name: "welcome_v1_en"
    language:
      code: "en"
    components:
      - type: "body"
        parameters:
          - type: "text"
            text: "Rajesh"
```

#### Hindi Version
```yaml
template_name: "welcome_v1_hi"
category: "UTILITY"  
language: "hi"
parameters:
  - name: "advisor_name"
    type: "TEXT"
    example: "राजेश"

template_content: |
  नमस्कार *{{1}}*,
  
  आपका दैनिक वित्तीय सामग्री वितरण अब सक्रिय है 📈
  
  आपको हर कार्य दिवस सुबह 06:00 बजे शैक्षणिक सामग्री मिलेगी।
  
  वितरण रोकने के लिए कभी भी *STOP* का जवाब दें।
  सहायता के लिए *HELP* लिखें।
```

#### Marathi Version
```yaml
template_name: "welcome_v1_mr"
category: "UTILITY"
language: "mr"
parameters:
  - name: "advisor_name"
    type: "TEXT"
    example: "राजेश"

template_content: |
  नमस्कार *{{1}}*,
  
  तुमचा दैनिक आर्थिक सामग्री वितरण आता सक्रिय आहे 📈
  
  तुम्हाला प्रत्येक कामकाजाच्या दिवशी सकाळी 06:00 वाजता शैक्षणिक सामग्री मिळेल।
  
  वितरण थांबवण्यासाठी कधीही *STOP* ला उत्तर द्या।
  मदतीसाठी *HELP* लिहा।
```

### 2. Daily Content Pack Template (Marketing)

#### English Version
```yaml
template_name: "daily_pack_v1_en"
category: "MARKETING"
language: "en"
has_media: true
media_type: "IMAGE"
parameters:
  - name: "content_topic"
    type: "TEXT"
    example: "SIP Investment"
  - name: "content_hint"
    type: "TEXT"
    example: "Perfect for client education"

template_content: |
  📈 *{{1}}* - Today's Financial Insight
  
  {{2}}
  
  Educational content only. Forward to your clients as needed.
  
  _Mutual fund investments are subject to market risks. Read all scheme related documents carefully._

example_payload:
  messaging_product: "whatsapp"
  to: "919876543210"
  type: "template"
  template:
    name: "daily_pack_v1_en"
    language:
      code: "en"
    components:
      - type: "header"
        parameters:
          - type: "image"
            image:
              id: "media_id_12345"
      - type: "body"
        parameters:
          - type: "text"
            text: "SIP Investment"
          - type: "text"
            text: "Perfect for client education"
```

#### Hindi Version
```yaml
template_name: "daily_pack_v1_hi"
category: "MARKETING"
language: "hi"
has_media: true
media_type: "IMAGE"
parameters:
  - name: "content_topic"
    type: "TEXT"
    example: "SIP निवेश"
  - name: "content_hint"  
    type: "TEXT"
    example: "ग्राहक शिक्षा के लिए उपयुक्त"

template_content: |
  📈 *{{1}}* - आज की वित्तीय जानकारी
  
  {{2}}
  
  केवल शैक्षणिक सामग्री। आवश्यकता अनुसार अपने ग्राहकों को भेजें।
  
  _म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं। सभी योजना संबंधित दस्तावेजों को ध्यान से पढ़ें।_
```

#### Marathi Version
```yaml
template_name: "daily_pack_v1_mr"
category: "MARKETING"
language: "mr"
has_media: true
media_type: "IMAGE"
parameters:
  - name: "content_topic"
    type: "TEXT"
    example: "SIP गुंतवणूक"
  - name: "content_hint"
    type: "TEXT"
    example: "ग्राहक शिक्षणासाठी योग्य"

template_content: |
  📈 *{{1}}* - आजची आर्थिक माहिती
  
  {{2}}
  
  केवळ शैक्षणिक सामग्री. आवश्यकतेनुसार आपल्या ग्राहकांना पाठवा.
  
  _म्यूच्युअल फंड गुंतवणूक बाजार जोखमींच्या अधीन आहेत. सर्व योजना संबंधित कागदपत्रे काळजीपूर्वक वाचा._
```

### 3. Status Content Template (Marketing)

#### English Version
```yaml
template_name: "status_pack_v1_en"
category: "MARKETING"
language: "en"
has_media: true
media_type: "IMAGE"
parameters:
  - name: "content_topic"
    type: "TEXT"
    example: "Market Update"

template_content: |
  📱 WhatsApp Status Ready: *{{1}}*
  
  1080×1920 format optimized for Status posting
  Professional design with compliance disclaimers
  
  Perfect for sharing market insights with your network 🎯

example_payload:
  messaging_product: "whatsapp"
  to: "919876543210"
  type: "template"
  template:
    name: "status_pack_v1_en"
    language:
      code: "en"
    components:
      - type: "header"
        parameters:
          - type: "image"
            image:
              id: "media_id_status_67890"
      - type: "body"
        parameters:
          - type: "text"
            text: "Market Update"
```

#### Hindi Version
```yaml
template_name: "status_pack_v1_hi"
category: "MARKETING"
language: "hi"
has_media: true
media_type: "IMAGE"
parameters:
  - name: "content_topic"
    type: "TEXT"
    example: "बाजार अपडेट"

template_content: |
  📱 WhatsApp Status तैयार: *{{1}}*
  
  1080×1920 फॉर्मेट Status पोस्टिंग के लिए अनुकूलित
  अनुपालन अस्वीकरण के साथ व्यावसायिक डिज़ाइन
  
  अपने नेटवर्क के साथ बाजार की जानकारी साझा करने के लिए उपयुक्त 🎯
```

#### Marathi Version
```yaml
template_name: "status_pack_v1_mr"
category: "MARKETING"
language: "mr"
has_media: true
media_type: "IMAGE"
parameters:
  - name: "content_topic"
    type: "TEXT"
    example: "बाजार अपडेट"

template_content: |
  📱 WhatsApp Status तयार: *{{1}}*
  
  1080×1920 फॉर्मेट Status पोस्टिंगसाठी अनुकूलित
  अनुपालन अस्वीकरण सह व्यावसायिक डिझाइन
  
  आपल्या नेटवर्कसह बाजाराची माहिती सामायिक करण्यासाठी योग्य 🎯
```

## Template Variables & Parameters

### Variable Mapping System
```yaml
variable_definitions:
  advisor_name:
    validation: "^[a-zA-Z\\s]{2,50}$"
    sanitization: "trim_whitespace"
    fallback: "Valued Advisor"
    
  content_topic:
    validation: "^[a-zA-Z0-9\\s\\-]{5,100}$"
    sanitization: "remove_special_chars"
    fallback: "Financial Education"
    
  content_hint:
    validation: "^.{10,200}$"
    sanitization: "sebi_compliance_filter"
    fallback: "Educational content for your clients"
```

### Example Payloads

#### Welcome Message Payload
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "welcome_v1_en",
    "language": {
      "code": "en",
      "policy": "deterministic"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Rajesh Sharma"
          }
        ]
      }
    ]
  }
}
```

#### Daily Pack with Media Payload
```json
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual", 
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "daily_pack_v1_en",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "header",
        "parameters": [
          {
            "type": "image",
            "image": {
              "id": "1234567890123456"
            }
          }
        ]
      },
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "SIP Investment Strategy"
          },
          {
            "type": "text", 
            "text": "Perfect timing for systematic investment planning"
          }
        ]
      }
    ]
  }
}
```

## Quality Rating Recovery Playbook

### Quality Rating Monitoring
```yaml
quality_metrics:
  rating_levels:
    high: ">= 80% positive feedback"
    medium: "70-79% positive feedback"
    low: "< 70% positive feedback"
    
  monitoring_frequency:
    real_time: "delivery_status_tracking"
    daily: "quality_score_assessment"
    weekly: "comprehensive_quality_review"
    
  alert_thresholds:
    warning: "quality_drops_below_75%"
    critical: "quality_drops_below_65%"
    emergency: "number_blocked_or_flagged"
```

### Recovery Action Matrix

#### Stage 1: Quality Drop (75% → 70%)
```yaml
immediate_actions:
  - reduce_sending_frequency_by_50_percent
  - switch_to_neutral_utility_templates
  - increase_opt_out_messaging_prominence
  - monitor_delivery_metrics_every_hour

template_adjustments:
  - remove_emoji_from_marketing_templates
  - add_explicit_educational_disclaimers
  - reduce_call_to_action_language
  - include_stop_instructions_in_every_message

timeline: "implement_within_2_hours"
```

#### Stage 2: Critical Quality (70% → 65%)
```yaml
emergency_actions:
  - pause_all_marketing_templates_immediately  
  - switch_to_utility_templates_only
  - implement_48_hour_cooldown_period
  - activate_backup_phone_number
  - notify_meta_business_support

communication_strategy:
  - send_advisor_notification_about_delivery_issues
  - provide_alternative_delivery_methods
  - explain_quality_improvement_measures
  - set_expectations_for_service_restoration

recovery_timeline: "72-96_hours_minimum"
```

#### Stage 3: Number Blocked/Flagged
```yaml
crisis_response:
  - immediately_cease_all_messaging
  - activate_hot_spare_business_account
  - migrate_active_advisor_base
  - submit_appeal_to_meta_if_applicable
  - implement_comprehensive_messaging_audit

preventive_measures:
  - complete_template_compliance_review
  - advisor_education_on_forwarding_best_practices
  - implement_additional_consent_confirmation
  - reduce_messaging_frequency_permanently

restoration_timeline: "7-14_days_minimum"
```

### Hot Spare Management
```yaml
backup_infrastructure:
  spare_phone_numbers: 3
  spare_business_accounts: 2
  pre_approved_templates: "all_current_templates"
  
  activation_procedure:
    step_1: "dns_failover_to_backup_webhooks"
    step_2: "update_database_phone_mappings"
    step_3: "warm_up_spare_number_gradually"
    step_4: "migrate_advisor_subscriptions"
    
  testing_schedule:
    monthly: "spare_number_functionality_test"
    quarterly: "full_failover_simulation"
```

## Template Lifecycle Management

### Submission & Approval Process
```yaml
submission_workflow:
  stage_1_internal_review:
    duration: "24_hours"
    checklist:
      - sebi_compliance_validation
      - dpdp_privacy_compliance
      - brand_consistency_check
      - variable_parameter_validation
      
  stage_2_meta_submission:
    duration: "3-5_business_days"
    requirements:
      - template_name_uniqueness
      - language_specific_submission
      - category_classification_accuracy
      - sample_use_case_documentation
      
  stage_3_approval_testing:
    duration: "24_hours"
    process:
      - canary_test_with_internal_numbers
      - delivery_rate_validation
      - formatting_accuracy_verification
      - opt_out_mechanism_testing
```

### Template Rotation Strategy
```yaml
rotation_schedule:
  daily_pack_templates:
    rotation_frequency: "weekly"
    variants_per_language: 3
    selection_algorithm: "round_robin_with_quality_weighting"
    
  status_templates:
    rotation_frequency: "bi_weekly"
    variants_per_language: 2
    selection_algorithm: "performance_based_selection"
    
  utility_templates:
    rotation_frequency: "monthly"
    variants_per_language: 2
    selection_algorithm: "compliance_optimized"

fallback_strategy:
  primary_template_failure:
    action: "immediate_fallback_to_backup_variant"
    notification: "alert_operations_team"
    
  all_variants_unavailable:
    action: "pause_delivery_for_affected_language"
    escalation: "emergency_template_submission_process"
```

### Compliance Integration
```yaml
template_compliance:
  sebi_requirements:
    - mandatory_disclaimer_inclusion
    - educational_content_focus
    - no_performance_guarantee_language
    - advisor_registration_details
    
  whatsapp_policy_compliance:
    - explicit_opt_in_confirmation
    - clear_opt_out_instructions
    - business_purpose_alignment
    - no_misleading_content
    
  automated_compliance_checking:
    frequency: "every_template_submission"
    tools: "integrated_with_three_stage_validation"
    alerts: "immediate_notification_on_violations"
```