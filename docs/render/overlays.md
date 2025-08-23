# Image Rendering & Overlay Specifications 🖼️

## Overview
Comprehensive image rendering pipeline with safe-area overlays, Cloudinary transforms, and failure fallback strategies for financial content delivery across WhatsApp, Status, and LinkedIn formats.

## Safe Area Definitions

### WhatsApp Post Format (1200×628)
```json
{
  "format_name": "whatsapp_post",
  "dimensions": {
    "width": 1200,
    "height": 628
  },
  "safe_areas": {
    "content_area": {
      "x": 60,
      "y": 60,
      "width": 1080,
      "height": 508,
      "description": "Primary content area avoiding WhatsApp UI overlap"
    },
    "disclaimer_area": {
      "x": 60,
      "y": 548,
      "width": 1080,
      "height": 50,
      "description": "SEBI compliance disclaimer area"
    },
    "logo_area": {
      "x": 1020,
      "y": 20,
      "width": 160,
      "height": 40,
      "description": "Advisor branding area (Pro tier)"
    },
    "avoid_zones": [
      {
        "name": "whatsapp_timestamp",
        "x": 980,
        "y": 588,
        "width": 200,
        "height": 20,
        "reason": "WhatsApp timestamp overlay"
      },
      {
        "name": "profile_pic_area", 
        "x": 0,
        "y": 0,
        "width": 50,
        "height": 50,
        "reason": "WhatsApp profile picture area"
      }
    ]
  }
}
```

### WhatsApp Status Format (1080×1920)
```json
{
  "format_name": "whatsapp_status",
  "dimensions": {
    "width": 1080,
    "height": 1920
  },
  "safe_areas": {
    "main_content": {
      "x": 80,
      "y": 200,
      "width": 920,
      "height": 1200,
      "description": "Primary content area avoiding Status UI"
    },
    "headline_area": {
      "x": 80,
      "y": 120,
      "width": 920,
      "height": 80,
      "description": "Main headline/topic area"
    },
    "disclaimer_area": {
      "x": 80,
      "y": 1680,
      "width": 920,
      "height": 60,
      "description": "Compliance disclaimer area"
    },
    "advisor_branding": {
      "x": 80,
      "y": 1760,
      "width": 920,
      "height": 80,
      "description": "Advisor name and registration (Pro tier)"
    },
    "avoid_zones": [
      {
        "name": "status_bar",
        "x": 0,
        "y": 0,
        "width": 1080,
        "height": 100,
        "reason": "Status bar and notification area"
      },
      {
        "name": "bottom_controls",
        "x": 0,
        "y": 1850,
        "width": 1080,
        "height": 70,
        "reason": "Status viewer controls and CTA area"
      }
    ]
  }
}
```

### LinkedIn Format (1200×627)
```json
{
  "format_name": "linkedin_post",
  "dimensions": {
    "width": 1200,
    "height": 627
  },
  "safe_areas": {
    "content_area": {
      "x": 80,
      "y": 80,
      "width": 1040,
      "height": 467,
      "description": "Primary professional content area"
    },
    "professional_disclaimer": {
      "x": 80,
      "y": 547,
      "width": 1040,
      "height": 50,
      "description": "Professional disclaimer and SEBI compliance"
    },
    "advisor_credentials": {
      "x": 80,
      "y": 20,
      "width": 1040,
      "height": 60,
      "description": "Professional credentials and registration"
    },
    "avoid_zones": [
      {
        "name": "linkedin_border",
        "x": 0,
        "y": 0,
        "width": 1200,
        "height": 20,
        "reason": "LinkedIn post border area"
      }
    ]
  }
}
```

## Named Cloudinary Transformations

### proOverlayV1 - Pro Tier Branding
```javascript
const proOverlayV1 = {
  transformation_name: "proOverlayV1",
  description: "Professional advisor branding with compliance integration",
  
  parameters: {
    // Base image optimization
    quality: "auto:best",
    format: "auto",
    dpr: "auto",
    
    // Overlay composition
    overlay: {
      text_overlay: {
        text: "{advisor_name}",
        font_family: "Roboto",
        font_size: 32,
        font_weight: "semibold",
        color: "#1E3A8A",
        background: "rgba(255,255,255,0.9)",
        padding: "10_10_10_10"
      },
      
      registration_overlay: {
        text: "SEBI RIA {registration_number}",
        font_family: "Roboto",
        font_size: 20,
        font_weight: "medium", 
        color: "#6B7280",
        y_offset: 35
      },
      
      logo_overlay: {
        public_id: "advisor_logos/{advisor_id}",
        width: 120,
        height: 40,
        crop: "fit",
        gravity: "north_east",
        x_offset: 60,
        y_offset: 20
      },
      
      disclaimer_overlay: {
        text: "Educational content only. Mutual fund investments are subject to market risks.",
        font_family: "Roboto",
        font_size: 16,
        color: "#374151",
        background: "rgba(243,244,246,0.95)",
        width: 1080,
        gravity: "south",
        y_offset: 20,
        text_align: "center"
      }
    }
  },
  
  cloudinary_url_format: "https://res.cloudinary.com/{cloud_name}/image/upload/q_auto:best,f_auto,dpr_auto/l_text:Roboto_32_semibold:{advisor_name},co_rgb:1E3A8A,b_rgb:FFFFFF_90,x_60,y_20,g_north_east/l_text:Roboto_20_medium:SEBI%20RIA%20{registration_number},co_rgb:6B7280,y_55,g_north_east/l_{advisor_id}_logo,w_120,h_40,c_fit,g_north_east,x_200,y_20/l_text:Roboto_16:Educational%20content%20only.%20Mutual%20fund%20investments%20are%20subject%20to%20market%20risks.,co_rgb:374151,b_rgb:F3F4F6_95,w_1080,g_south,y_20,c_fit/{public_id}"
}
```

### statusV1 - WhatsApp Status Optimization
```javascript
const statusV1 = {
  transformation_name: "statusV1", 
  description: "WhatsApp Status 1080×1920 with compliance overlays",
  
  parameters: {
    // Status format optimization
    width: 1080,
    height: 1920,
    crop: "fill",
    gravity: "center",
    quality: "auto:good",
    format: "auto",
    
    // Content positioning
    overlay: {
      headline_text: {
        text: "{content_topic}",
        font_family: "Roboto",
        font_size: 48,
        font_weight: "bold",
        color: "#FFFFFF",
        stroke: "2px #000000",
        gravity: "north",
        y_offset: 120,
        width: 920
      },
      
      main_content: {
        text: "{content_body}",
        font_family: "Roboto",
        font_size: 32,
        font_weight: "medium",
        color: "#FFFFFF",
        stroke: "1px #000000",
        gravity: "center",
        width: 920,
        text_align: "center"
      },
      
      disclaimer_footer: {
        text: "म्यूचुअल फंड निवेश बाजार जोखिमों के अधीन हैं।",
        font_family: "Roboto",
        font_size: 24,
        color: "#FFFFFF",
        background: "rgba(0,0,0,0.7)",
        gravity: "south",
        y_offset: 160,
        width: 920,
        text_align: "center"
      },
      
      advisor_attribution: {
        text: "{advisor_name} • {registration_number}",
        font_family: "Roboto",
        font_size: 20,
        color: "#FFFFFF",
        background: "rgba(0,0,0,0.7)",
        gravity: "south",
        y_offset: 80,
        width: 920,
        text_align: "center"
      }
    }
  },
  
  cloudinary_url_format: "https://res.cloudinary.com/{cloud_name}/image/upload/w_1080,h_1920,c_fill,g_center,q_auto:good,f_auto/l_text:Roboto_48_bold:{content_topic},co_white,stroke_2px_000000,g_north,y_120,w_920/l_text:Roboto_32_medium:{content_body},co_white,stroke_1px_000000,g_center,w_920,a_center/l_text:Roboto_24:म्यूचुअल%20फंड%20निवेश%20बाजार%20जोखिमों%20के%20अधीन%20हैं।,co_white,b_rgb:000000_70,g_south,y_160,w_920,a_center/l_text:Roboto_20:{advisor_name}%20•%20{registration_number},co_white,b_rgb:000000_70,g_south,y_80,w_920,a_center/{public_id}"
}
```

### lnkdV1 - LinkedIn Professional Format
```javascript
const lnkdV1 = {
  transformation_name: "lnkdV1",
  description: "LinkedIn professional format with credentials",
  
  parameters: {
    // LinkedIn optimization
    width: 1200,
    height: 627,
    crop: "fill",
    gravity: "center",
    quality: "auto:best",
    format: "auto",
    
    // Professional overlay composition
    overlay: {
      credentials_header: {
        text: "{advisor_name} | {professional_designation}",
        font_family: "Roboto",
        font_size: 28,
        font_weight: "semibold",
        color: "#0A66C2",
        background: "rgba(255,255,255,0.95)",
        gravity: "north",
        y_offset: 20,
        width: 1040,
        padding: "15_20_15_20"
      },
      
      registration_info: {
        text: "SEBI Registered Investment Advisor - {registration_number}",
        font_family: "Roboto",
        font_size: 18,
        font_weight: "medium",
        color: "#5E6C84",
        gravity: "north",
        y_offset: 60,
        width: 1040
      },
      
      professional_disclaimer: {
        text: "Educational content for professional networks. Investment decisions should align with individual financial goals and risk tolerance. Mutual fund investments are subject to market risks.",
        font_family: "Roboto",
        font_size: 16,
        color: "#374151",
        background: "rgba(243,244,246,0.95)",
        gravity: "south",
        y_offset: 20,
        width: 1040,
        text_align: "left",
        padding: "10_15_10_15"
      }
    }
  },
  
  cloudinary_url_format: "https://res.cloudinary.com/{cloud_name}/image/upload/w_1200,h_627,c_fill,g_center,q_auto:best,f_auto/l_text:Roboto_28_semibold:{advisor_name}%20|%20{professional_designation},co_rgb:0A66C2,b_rgb:FFFFFF_95,g_north,y_20,w_1040,p_15_20_15_20/l_text:Roboto_18_medium:SEBI%20Registered%20Investment%20Advisor%20-%20{registration_number},co_rgb:5E6C84,g_north,y_60,w_1040/l_text:Roboto_16:Educational%20content%20for%20professional%20networks...,co_rgb:374151,b_rgb:F3F4F6_95,g_south,y_20,w_1040,a_left,p_10_15_10_15/{public_id}"
}
```

## Failure Fallback Strategies

### Primary Failure Detection
```yaml
failure_detection:
  cloudinary_service_timeout:
    detection_threshold: "15_seconds"
    fallback_trigger: "automatic"
    
  transformation_error:
    invalid_parameters: "parameter_validation_failure"
    missing_overlay_assets: "asset_not_found_error"
    quota_exceeded: "api_limit_reached"
    
  image_processing_failure:
    corrupt_source_image: "image_decode_error"
    unsupported_format: "format_conversion_error"
    size_limit_exceeded: "file_too_large_error"
```

### Fallback Hierarchy

#### Level 1: Simplified Transform
```yaml
simplified_fallback:
  trigger: "complex_transformation_failure"
  action: "remove_complex_overlays_retain_basic"
  
  simplified_transforms:
    proOverlayV1_fallback:
      - "remove_logo_overlay"
      - "simplify_text_overlays"
      - "retain_disclaimer_only"
      
    statusV1_fallback:
      - "remove_stroke_effects"
      - "simplify_font_rendering"
      - "basic_text_overlay_only"
      
    lnkdV1_fallback:
      - "remove_background_overlays" 
      - "basic_text_positioning"
      - "essential_disclaimer_only"
```

#### Level 2: Pre-Generated Templates
```yaml
template_fallback:
  trigger: "all_dynamic_transforms_failed"
  action: "use_pre_generated_template_images"
  
  template_library:
    whatsapp_post_generic:
      public_id: "templates/whatsapp_generic_1200x628"
      text_slots: ["headline", "disclaimer"]
      
    status_generic:
      public_id: "templates/status_generic_1080x1920"  
      text_slots: ["main_message", "advisor_name"]
      
    linkedin_generic:
      public_id: "templates/linkedin_generic_1200x627"
      text_slots: ["professional_message", "credentials"]
```

#### Level 3: Static Images
```yaml
static_fallback:
  trigger: "complete_transformation_system_failure"
  action: "serve_static_branded_images"
  
  static_assets:
    emergency_whatsapp:
      public_id: "emergency/whatsapp_service_update"
      message: "Content delivery temporarily using static format"
      
    emergency_status:
      public_id: "emergency/status_service_update"
      message: "Status content temporarily unavailable"
      
    emergency_linkedin:
      public_id: "emergency/linkedin_service_update" 
      message: "Professional content delivery issue"
```

## Performance Optimization

### Caching Strategy
```yaml
caching_configuration:
  advisor_logo_cache:
    duration: "30_days"
    invalidation: "manual_advisor_logo_update"
    
  transformation_cache:
    duration: "24_hours"
    key_pattern: "transform_{template}_{params_hash}"
    
  generated_image_cache:
    duration: "7_days"
    cdn_distribution: "global_edge_caching"
    
  template_metadata_cache:
    duration: "1_hour"
    includes: ["safe_areas", "transformation_configs"]
```

### Pre-Processing Pipeline
```yaml
pre_processing:
  advisor_assets:
    logo_optimization:
      - "convert_to_png_with_transparency"
      - "resize_to_standard_dimensions"
      - "optimize_for_overlay_usage"
      
    branding_validation:
      - "verify_sebi_compliance_in_logo"
      - "check_image_quality_standards"
      - "validate_safe_area_compatibility"
      
  content_preparation:
    text_processing:
      - "validate_character_limits_per_format"
      - "check_font_rendering_compatibility"
      - "verify_multilanguage_support"
      
    image_optimization:
      - "format_conversion_webp_avif"
      - "quality_optimization_per_platform"
      - "size_optimization_for_whatsapp_limits"
```

## Quality Assurance

### Automated Testing
```yaml
automated_qa:
  visual_regression_testing:
    frequency: "every_transformation_update"
    test_cases: ["safe_area_compliance", "text_readability", "branding_accuracy"]
    
  cross_platform_validation:
    whatsapp_rendering: "test_across_android_ios"
    status_display: "verify_story_format_compliance"
    linkedin_preview: "validate_professional_appearance"
    
  compliance_verification:
    sebi_disclaimer_presence: "automated_text_detection"
    advisor_attribution_accuracy: "regex_pattern_matching"
    safe_area_boundary_respect: "pixel_level_validation"
```

### Manual Quality Checks
```yaml
manual_qa_process:
  daily_spot_checks:
    sample_size: "10_random_generated_images_per_format"
    checklist: ["text_clarity", "overlay_positioning", "brand_consistency"]
    
  advisor_feedback_integration:
    feedback_collection: "embedded_rating_system"
    issue_categorization: ["layout", "branding", "compliance", "quality"]
    resolution_timeline: "24_hours_for_critical_issues"
    
  regulatory_compliance_audit:
    frequency: "weekly"
    scope: ["disclaimer_visibility", "sebi_requirement_compliance"]
    documentation: "compliance_audit_trail"
```

## Error Handling & Logging

### Error Classification
```yaml
error_handling:
  transformation_errors:
    parameter_errors: "invalid_overlay_parameters"
    asset_errors: "missing_advisor_logo_or_template"
    service_errors: "cloudinary_api_unavailable"
    
  quality_errors:
    safe_area_violations: "content_overlaps_avoid_zones"
    readability_issues: "text_too_small_or_unclear"
    compliance_violations: "missing_mandatory_disclaimers"
    
  performance_errors:
    timeout_errors: "transformation_exceeds_time_limit"
    size_errors: "generated_image_exceeds_platform_limits"
    format_errors: "unsupported_output_format_requested"
```

### Monitoring & Alerting
```yaml
monitoring_system:
  real_time_metrics:
    - "transformation_success_rate_by_type"
    - "average_processing_time_per_format"
    - "fallback_usage_frequency"
    - "error_rate_by_category"
    
  alert_thresholds:
    warning_level: "success_rate_below_95_percent"
    critical_level: "success_rate_below_85_percent"
    emergency_level: "complete_service_unavailable"
    
  business_impact_tracking:
    advisor_satisfaction: "image_quality_ratings"
    delivery_impact: "fallback_vs_primary_usage"
    compliance_risk: "disclaimer_rendering_failures"
```

This comprehensive rendering specification ensures reliable, compliant, and high-quality image generation across all platforms with robust fallback strategies.