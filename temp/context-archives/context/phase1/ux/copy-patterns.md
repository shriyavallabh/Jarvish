# Copy Patterns & Microcopy - Project One ✍️

## Overview
Comprehensive copy guidelines for Project One's B2B SaaS platform, ensuring consistent tone, cultural sensitivity, and regulatory compliance across all user touchpoints.

## Brand Voice & Tone

### Brand Personality
```yaml
brand_voice_attributes:
  professional_yet_approachable:
    description: "Expert knowledge without intimidation"
    example: "Your content looks great! Let's just fine-tune the compliance details."
    avoid: "ERROR: Content violates SEBI regulations"
    
  confidence_building:
    description: "Reduce advisor anxiety about compliance"  
    example: "We've got your compliance covered - your risk score is excellent!"
    avoid: "Warning: This content may be rejected"
    
  efficiency_focused:
    description: "Respect busy advisor schedules"
    example: "Content generated in 3 seconds ⚡"
    avoid: "Please wait while we process your request..."
    
  culturally_aware:
    description: "Understand Indian business context"
    example: "Perfect for your morning 6 AM client outreach"
    avoid: "Schedule for optimal engagement times"
    
  empowering:
    description: "Position advisors as content experts"
    example: "Your expertise + our AI = amazing client content"
    avoid: "Let our AI handle your content creation"
```

### Tone Variations by Context
```yaml
tone_by_situation:
  onboarding_welcome:
    tone: "excited_supportive"
    example: "Welcome to Project One! Let's get your first content pack ready for your clients 🎉"
    
  compliance_feedback:
    tone: "helpful_educational"
    example: "Great content! We suggest replacing 'guaranteed returns' with 'potential returns' to stay SEBI-compliant."
    
  error_messages:
    tone: "apologetic_solution_focused"
    example: "Something went wrong on our end. Don't worry - your content is saved. Let's try again."
    
  success_confirmations:
    tone: "celebrating_professional"
    example: "Excellent! Your content is approved and scheduled for 6 AM delivery tomorrow."
    
  feature_announcements:
    tone: "informative_beneficial"
    example: "New feature: Hindi content generation is now available for your Marathi-speaking clients."
```

## Microcopy Patterns

### Navigation & Wayfinding
```yaml
navigation_copy:
  primary_menu:
    dashboard: "Dashboard" # not "Home" - implies business focus
    create: "Create Content" # clear action-oriented
    library: "My Content" # personal ownership
    analytics: "Performance" # business outcome focus
    settings: "Account Settings" # full context
    
  breadcrumbs:
    pattern: "Dashboard > Create Content > Topic Selection"
    separator: " > " # cleaner than "/"
    clickable_parents: "Dashboard and Create Content are links"
    
  page_titles:
    format: "{Action} | {Context} | Project One"
    examples:
      - "Create Content | Market Update | Project One"
      - "Approval Queue | 12 items pending | Project One"
      
  back_navigation:
    standard: "← Back to {Previous Page}"
    context_specific: "← Back to Content Creation"
    avoid: "← Back" # lacks context
```

### Form Labels & Instructions
```yaml
form_copy_patterns:
  field_labels:
    descriptive_clear: "Company Name (as it appears on your SEBI registration)"
    not_ambiguous: "Company Name" # too vague
    
  placeholder_text:
    helpful_examples: "e.g., Rajesh Kumar Financial Services"
    format_guidance: "Enter your 10-digit mobile number"
    avoid_repetition: "Don't repeat the label as placeholder"
    
  validation_messages:
    success: "✅ SEBI registration verified successfully"
    error: "❌ We couldn't verify this SEBI registration number. Please check and try again."
    warning: "⚠️ This phone number is already registered. Use a different number or contact support."
    
  help_text:
    contextual: "Your SEBI registration number helps us ensure compliance for your content."
    action_oriented: "Don't have SEBI registration? Learn how to get one →"
    progressive_disclosure: "Why do we need this? [expandable explanation]"
```

### Calls-to-Action (CTAs)
```yaml
cta_copy_patterns:
  primary_actions:
    specific_outcome: "Generate My Content" # not "Generate"
    time_indication: "Create Tomorrow's Pack" # implies timing
    benefit_focused: "Get Compliance-Ready Content" # highlights value
    
  secondary_actions:
    supportive: "Save as Draft" # implies safety
    exploratory: "Preview in WhatsApp" # shows result
    administrative: "View All Content" # comprehensive access
    
  destructive_actions:
    clear_consequence: "Delete Content (Can't be undone)"
    confirmation_required: "Yes, Delete Forever"
    escape_hatch: "Cancel, Keep Content"
    
  progress_actions:
    step_indication: "Next: Review & Submit" # shows progress
    completion_focus: "Finish & Schedule Delivery"
    alternative_path: "Save & Continue Later"
```

### Status Messages & Feedback
```yaml
status_message_patterns:
  loading_states:
    specific_action: "Generating your market update content..."
    time_estimate: "This usually takes 3-5 seconds ⏱️"
    progress_indication: "Creating compliance-safe content for you..."
    
  success_messages:
    achievement_celebration: "🎉 Content approved! Scheduled for 6 AM delivery."
    next_step_guidance: "Perfect! Check your analytics tomorrow to see how it performs."
    reassurance: "All set! Your clients will receive this at 6 AM sharp."
    
  error_messages:
    apologetic_tone: "Sorry, something went wrong while saving your content."
    action_guidance: "Your work is safe. Try clicking 'Generate' again."
    support_escalation: "Still having trouble? Contact our support team for help."
    
  warning_messages:
    preventive: "Heads up: This content has a medium compliance risk."
    educational: "Consider softening language like 'guaranteed' to improve approval chances."
    actionable: "Edit your content or submit for admin review."
```

## Language-Specific Copy

### English Copy Standards
```yaml
english_copy_standards:
  financial_terminology:
    use: ["returns", "investments", "portfolio", "risk assessment"]
    avoid: ["profits", "gains", "guaranteed income", "sure returns"]
    
  cultural_context:
    indian_context: "Perfect for your morning client outreach"
    business_hours: "6 AM IST delivery for maximum engagement"
    local_preferences: "Your clients prefer receiving updates in the morning"
    
  regulatory_language:
    compliant: "Mutual funds are subject to market risks"
    compliant: "Past performance may not indicate future results"  
    avoid: "This is a risk-free investment opportunity"
    
  professional_tone:
    respectful: "Your expertise helps clients make informed decisions"
    empowering: "You know your clients best - our AI helps you scale that knowledge"
    collaborative: "Together, we'll create content that truly serves your clients"
```

### Hindi Copy Patterns
```yaml
hindi_copy_guidelines:
  greeting_patterns:
    formal_respectful: "नमस्ते, {advisor_name} जी" # respectful greeting
    professional: "आपका आज का कंटेंट तैयार है" # your today's content is ready
    
  financial_terms:
    hybrid_approach: "म्यूचुअल फंड में निवेश करना (Mutual Fund Investment)"
    familiar_concepts: "बचत और निवेश" # savings and investment
    risk_terminology: "जोखिम (Risk) के साथ रिटर्न की संभावना"
    
  action_language:
    create_content: "कंटेंट बनाएं" # create content
    review_approve: "समीक्षा और स्वीकृति" # review and approval
    send_clients: "ग्राहकों को भेजें" # send to clients
    
  compliance_messaging:
    sebi_compliance: "सेबी नियमों के अनुसार" # according to SEBI rules
    risk_disclosure: "बाजार जोखिमों के अधीन" # subject to market risks
    professional_advice: "वित्तीय सलाह के लिए सलाहकार से संपर्क करें" # contact advisor for financial advice
```

### Marathi Copy Patterns  
```yaml
marathi_copy_guidelines:
  respectful_address:
    formal: "{advisor_name} साहेब/मॅडम" # sir/madam respectful form
    professional: "तुमचा आजचा कंटेंट तयार आहे" # your today's content is ready
    
  financial_vocabulary:
    investment_terms: "गुंतवणूक आणि बचत" # investment and savings
    mutual_funds: "म्यूच्युअल फंड गुंतवणूक" # mutual fund investment  
    returns: "परतावा आणि जोखीम" # returns and risk
    
  cultural_sensitivity:
    festival_awareness: "दिवाळी सीझनमध्ये गुंतवणुकीच्या योजना" # investment plans in Diwali season
    local_context: "महाराष्ट्रातील गुंतवणूकदारांसाठी" # for investors in Maharashtra
    
  user_interface:
    create: "कंटेंट तयार करा" # create content
    settings: "सेटिंग्ज" # settings
    analytics: "कामगिरी विश्लेषण" # performance analysis
```

## Contextual Copy Guidelines

### Onboarding Flow Copy
```yaml
onboarding_copy_sequence:
  welcome_screen:
    headline: "Welcome to Project One!"
    subheading: "Create compliance-safe content for your clients in minutes, not hours"
    cta: "Get Started with My First Content"
    
  registration_form:
    headline: "Let's set up your account"
    subheading: "We'll verify your SEBI registration to ensure compliance from day one"
    form_intro: "This information helps us create content that's perfectly compliant for your advisory practice."
    
  tier_selection:
    headline: "Choose the plan that fits your practice"
    subheading: "All plans include daily content creation and WhatsApp delivery. Upgrade anytime."
    founding_100_banner: "🎉 Founding 100 Special: 50% off for your first 3 months!"
    
  whatsapp_setup:
    headline: "Connect your WhatsApp Business"
    subheading: "Your content will be delivered directly to your professional WhatsApp number"
    reassurance: "We never see your client messages - only delivery confirmations"
    
  completion:
    headline: "You're all set! 🎉"
    subheading: "Your account is ready. Let's create your first content pack."
    next_steps: "Create your first piece of content and we'll show you how everything works."
```

### Content Creation Flow Copy
```yaml
content_creation_copy:
  topic_selection:
    headline: "What topic resonates with your clients today?"
    subheading: "Choose a topic and we'll create compelling, compliant content in seconds"
    custom_topic_prompt: "Have a specific topic in mind? Describe it here:"
    
  ai_generation:
    generating_message: "🤖 Creating personalized content for your clients..."
    time_estimate: "This usually takes 3-5 seconds"
    completion_message: "✅ Your content is ready! Review and edit below."
    
  editing_interface:
    headline: "Perfect your content"
    subheading: "Edit the text and see how it looks on WhatsApp"
    compliance_sidebar: "Compliance Check"
    preview_area: "WhatsApp Preview"
    
  compliance_review:
    low_risk: "✅ Excellent! Low compliance risk (Score: {score}/100)"
    medium_risk: "⚠️ Medium risk detected. Consider these improvements:"
    high_risk: "❌ High compliance risk. Please review these issues:"
    
  submission:
    headline: "Ready to submit?"
    subheading: "Your content will be reviewed and scheduled for tomorrow's 6 AM delivery"
    submit_button: "Submit for Approval"
    draft_button: "Save as Draft"
```

### Admin Interface Copy
```yaml
admin_interface_copy:
  approval_queue:
    headline: "Content Approval Queue"
    subheading: "{count} items pending review • Average review time: {time} minutes"
    priority_labels:
      high: "🔴 High Priority - Review First"
      medium: "🟡 Standard Review"
      low: "🟢 Low Risk - Bulk Approval Eligible"
      
  review_interface:
    advisor_context: "Content from {advisor_name} ({tier} tier)"
    ai_analysis: "AI Risk Analysis"
    recommendation: "Recommended Action: {action}"
    
  batch_operations:
    select_prompt: "Select items for batch processing"
    approve_confirmation: "Approve {count} selected items?"
    feedback_prompt: "Add feedback for rejected items (optional):"
    
  compliance_dashboard:
    headline: "Platform Compliance Overview"
    subheading: "Real-time monitoring of content risk and advisor performance"
    zero_violations: "🎉 Zero compliance violations this month!"
```

## Error Handling Copy

### User Error Messages
```yaml
user_error_patterns:
  form_validation:
    required_field: "Please enter your {field_name} to continue"
    invalid_format: "Please enter a valid {field_type} (example: {example})"
    sebi_validation: "We couldn't verify this SEBI registration. Please check the number and try again."
    
  content_creation:
    generation_failed: "Content generation failed. Your previous work is saved. Try again?"
    compliance_error: "Compliance check failed. Your content is saved as a draft - edit and resubmit when ready."
    submission_error: "Couldn't submit for approval right now. Your content is safely saved as a draft."
    
  whatsapp_integration:
    connection_failed: "Couldn't connect to your WhatsApp Business account. Check your number and try again."
    delivery_failed: "Delivery failed this morning. Don't worry - we'll retry automatically and notify you."
    webhook_error: "WhatsApp connection needs attention. Your content delivery may be affected."
```

### System Error Messages
```yaml
system_error_patterns:
  service_unavailable:
    ai_service: "Our AI service is temporarily busy. Your request will be processed shortly."
    database_error: "We're experiencing technical difficulties. Your work is saved and we'll restore service quickly."
    api_timeout: "The service is taking longer than usual. Please try again in a moment."
    
  maintenance_mode:
    scheduled: "We're doing some quick maintenance. We'll be back in {duration} minutes."
    emergency: "We're fixing an issue that's affecting service. Follow @ProjectOneStatus for updates."
    
  recovery_messages:
    service_restored: "We're back! Thanks for your patience. All your content is safe and ready."
    data_recovery: "Good news: We've recovered all your content. Everything is back to normal."
```

## Success & Achievement Copy

### Milestone Celebrations
```yaml
achievement_messaging:
  first_content_created:
    message: "🎉 Congratulations! You've created your first piece of content."
    next_step: "It's now being reviewed and will be delivered to your clients tomorrow at 6 AM."
    
  first_delivery:
    message: "✅ Success! Your first content was delivered to all your clients this morning."
    engagement: "Check your analytics to see how your clients are engaging with your content."
    
  perfect_week:
    message: "🏆 Amazing! You've had perfect delivery for 7 days straight."
    social_proof: "You're in the top 10% of advisors for consistent content delivery."
    
  compliance_excellence:
    message: "⭐ Excellent work! Your compliance score is consistently above 95."
    recognition: "Your content quality sets a great example for other advisors."
    
  engagement_milestone:
    message: "📈 Fantastic! Your client read rate has improved by 25% this month."
    insight: "Your clients are really engaging with your content strategy."
```

### Progress Indicators
```yaml
progress_messaging:
  onboarding_progress:
    step_completion: "Step {current} of {total} completed ✅"
    overall_progress: "You're {percentage}% done setting up your account"
    next_step_preview: "Next: Connect your WhatsApp Business account"
    
  content_creation_progress:
    topic_selected: "✅ Topic selected: {topic_name}"
    content_generated: "✅ Content created in {time} seconds"
    compliance_checked: "✅ Compliance verified - Low risk score"
    
  approval_workflow:
    submitted: "✅ Submitted for review (typically takes 2-4 hours)"
    under_review: "👀 Currently under review by our compliance team"
    approved: "✅ Approved! Scheduled for tomorrow's delivery"
```

## Accessibility Copy Guidelines

### Screen Reader Optimization
```yaml
accessibility_copy:
  alt_text_patterns:
    icons: "Settings icon" not "Gear icon"
    status_indicators: "Approved status - green checkmark"
    charts: "Line chart showing delivery success rate of 98% over 7 days"
    
  aria_labels:
    buttons: "Create new content for tomorrow's delivery"
    links: "View detailed analytics for this week's performance"
    form_fields: "Enter your company name as registered with SEBI"
    
  heading_structure:
    h1: "Page title - primary purpose"
    h2: "Major sections within page"
    h3: "Subsections and card titles"
    h4: "Form sections and detailed groupings"
```

### Inclusive Language Guidelines
```yaml
inclusive_language:
  gender_neutral:
    use: "advisor", "financial professional", "team member"
    avoid: "guys", "businessman", "salesman"
    
  ability_inclusive:
    use: "view", "access", "navigate to"
    avoid: "see", "look at", "walk through"
    
  cultural_sensitivity:
    respectful: "Indian financial advisors", "regional language support"
    inclusive: "advisors across India", "serving diverse client communities"
    
  plain_language:
    clear: "Your content will be delivered tomorrow morning"
    avoid: "Content deployment will be executed at the designated temporal interval"
```

This comprehensive copy pattern guide ensures consistent, culturally appropriate, and legally compliant communication across all Project One user touchpoints while maintaining professional efficacy and user confidence.