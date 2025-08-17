# Analytics Intelligence Agent Prompt 📈

## When to Use
- Phase 4 after WhatsApp delivery and backend systems are operational
- When implementing AI-powered advisor insights and churn prediction
- Critical for advisor retention and platform optimization
- After sufficient data collection from delivery and engagement tracking

## Reads / Writes

**Reads:**
- `context/phase4/wa/*.js` - WhatsApp delivery data and engagement metrics
- `context/phase4/backend/*.js` - Advisor behavior and content creation patterns
- `docs/PRD.md` - Analytics requirements and business intelligence specifications

**Writes:**
- `context/phase4/analytics/*.js` - Complete AI-powered analytics system
- `context/phase4/analytics/advisor-insights-generator.js` - Weekly personalized insights
- `context/phase4/analytics/churn-prediction-model.js` - Advisor health scoring
- `context/phase4/analytics/content-performance-analyzer.js` - Engagement optimization
- `context/phase4/analytics/platform-intelligence-engine.js` - Business trend analysis
- `context/phase4/analytics/anomaly-detector.js` - Real-time issue identification

## Checklist Before Run

- [ ] WhatsApp delivery data pipeline operational with engagement metrics
- [ ] Backend advisor activity tracking comprehensive and reliable
- [ ] Compliance system providing risk scoring and violation data
- [ ] Data privacy requirements (DPDP) understood for advisor analytics
- [ ] Machine learning approach for churn prediction researched and planned
- [ ] Weekly insight generation format and delivery mechanism designed
- [ ] Real-time anomaly detection thresholds and alerting strategy established
- [ ] Analytics dashboard integration points with frontend identified

## One-Shot Prompt Block

```
ROLE: Analytics Intelligence Developer - AI-Powered Advisor Insights
GOAL: Implement comprehensive analytics system providing weekly advisor insights, churn prediction, content optimization, and platform intelligence using AI-driven analysis.

CONTEXT: Building analytics for 150-300 financial advisors scaling to 1,000-2,000, providing actionable insights to improve advisor engagement, reduce churn, and optimize content performance. System must process delivery data, engagement metrics, and advisor behavior patterns.

AI-POWERED ANALYTICS REQUIREMENTS:
• Weekly Advisor Insights: Personalized performance analysis with AI-generated recommendations
• Churn Prediction: ML-based advisor health scoring with 30-day prediction window
• Content Optimization: Engagement pattern analysis with topic and timing recommendations  
• Platform Intelligence: Business trend analysis for strategic decision making
• Anomaly Detection: Real-time system health monitoring with automated alerting
• Privacy Protection: DPDP-compliant analytics with advisor data anonymization

DATA SOURCES & PROCESSING:
• WhatsApp Delivery: Send rates, delivery success, read receipts, engagement responses
• Content Creation: Advisor content patterns, compliance scores, approval times
• Platform Usage: Login frequency, feature utilization, support ticket patterns
• Billing Data: Payment history, tier changes, revenue attribution
• Support Interactions: Ticket resolution, satisfaction scores, feature requests

MACHINE LEARNING MODELS:
• Churn Prediction: Random Forest/XGBoost with behavioral feature engineering
• Content Recommendation: Collaborative filtering with engagement optimization
• Anomaly Detection: Statistical process control with dynamic thresholds
• Trend Analysis: Time series forecasting for business planning
• Advisor Segmentation: Unsupervised clustering for personalized insights

INPUT FILES TO ANALYZE:
1. context/phase4/wa/delivery-scheduler.js - WhatsApp delivery data source
2. context/phase4/wa/analytics-integration.js - Engagement metrics pipeline
3. context/phase4/backend/advisor-service.js - Advisor activity and behavior data
4. context/phase4/compliance/audit-framework.js - Compliance performance data
5. docs/PRD.md - Analytics and business intelligence requirements

REQUIRED ANALYTICS OUTPUTS:
1. context/phase4/analytics/advisor-insights-generator.js
   - Weekly personalized advisor performance analysis
   - AI-generated recommendations for engagement improvement
   - Content performance breakdown by topic, timing, and audience response
   - Compliance trend analysis with improvement suggestions
   - Comparative benchmarking against peer advisors (anonymized)
   - Natural language insight generation using GPT-4o-mini

2. context/phase4/analytics/churn-prediction-model.js
   - ML-based advisor health scoring with interpretable features
   - 30-day churn probability with confidence intervals
   - Risk factor identification: payment issues, engagement drop, support escalations
   - Intervention trigger automation: proactive outreach, retention offers
   - Model performance monitoring with drift detection
   - Advisor segment-specific models for improved accuracy

3. context/phase4/analytics/content-performance-analyzer.js
   - Topic engagement analysis with trending content identification
   - Optimal timing recommendations based on advisor audience patterns
   - Language preference analysis (English/Hindi/Marathi) with engagement correlation
   - A/B testing framework for content optimization experiments
   - Compliance correlation analysis: engagement vs risk score patterns
   - Seasonal trend analysis for financial content effectiveness

4. context/phase4/analytics/platform-intelligence-engine.js
   - Business KPI dashboard: advisor growth, revenue trends, churn rates
   - Feature utilization analysis with adoption funnel optimization
   - Market trend analysis: advisor behavior changes, industry patterns
   - Revenue attribution modeling across advisor tiers and features
   - Competitive analysis integration with advisor feedback and market research
   - Strategic planning insights for product roadmap prioritization

5. context/phase4/analytics/anomaly-detector.js
   - Real-time system health monitoring with statistical anomaly detection
   - Delivery SLA violation early warning with root cause analysis
   - Advisor behavior anomaly detection: sudden engagement drops, spam patterns
   - Platform performance monitoring: API response times, error rates
   - Automated alerting with escalation procedures and remediation suggestions
   - Historical trend comparison with seasonal adjustment and baseline establishment

6. context/phase4/analytics/reporting-dashboard.js
   - Executive dashboard with key business metrics and trend visualization
   - Advisor-facing analytics: personal performance insights and benchmarking
   - Operational dashboard: system health, SLA compliance, support metrics
   - Financial reporting: revenue analysis, cost attribution, profitability insights
   - Regulatory reporting: compliance metrics, audit trail summaries
   - Export functionality: PDF reports, CSV data export for Pro tier advisors

ANALYTICS METHODOLOGY:
• Data Pipeline: ETL processes with data quality validation and error handling
• Feature Engineering: Behavioral pattern extraction with time-series analysis
• Model Training: Automated retraining with performance monitoring and validation
• A/B Testing: Statistical significance testing with proper experiment design
• Privacy Protection: Data anonymization and aggregation for DPDP compliance
• Real-time Processing: Stream processing for immediate insights and alerts

INSIGHT GENERATION FRAMEWORK:
• Natural Language Generation: GPT-4o-mini for advisor-friendly insight explanations
• Visualization: Interactive charts and graphs with drill-down capabilities
• Actionability: Every insight includes specific recommended actions
• Personalization: Insights tailored to advisor tier, experience level, and business focus
• Benchmarking: Anonymous peer comparison for competitive motivation
• Trend Analysis: Historical pattern recognition with future projections

SUCCESS CRITERIA:
• Weekly advisor insights achieve >4/5 satisfaction rating from advisor feedback
• Churn prediction accuracy >75% with 30-day prediction window
• Content recommendations improve engagement rates by >15% over baseline
• Anomaly detection catches system issues before SLA violations occur
• Platform intelligence supports strategic business decisions with data-driven insights
• All analytics respect DPDP privacy requirements with proper data anonymization
• Real-time processing provides insights within 5 minutes of data availability
```

## Post-Run Validation Checklist

- [ ] Weekly advisor insights system generates personalized, actionable recommendations
- [ ] Churn prediction model achieves >75% accuracy with interpretable risk factors
- [ ] Content performance analyzer identifies optimization opportunities effectively
- [ ] Platform intelligence dashboard provides comprehensive business insights
- [ ] Anomaly detection system identifies issues before SLA violations occur
- [ ] All analytics comply with DPDP privacy requirements and advisor data protection
- [ ] AI-generated insights use natural language that advisors find helpful and actionable
- [ ] Machine learning models include proper performance monitoring and drift detection
- [ ] Real-time analytics processing provides insights within 5-minute target latency
- [ ] A/B testing framework enables data-driven content and feature optimization
- [ ] Reporting dashboard serves both advisor-facing and internal business intelligence needs
- [ ] Data pipeline handles all source systems with proper error handling and validation
- [ ] Analytics export functionality supports Pro tier advisor advanced reporting needs
- [ ] Integration testing validates end-to-end analytics workflow functionality
- [ ] Performance optimization ensures analytics processing doesn't impact operational systems