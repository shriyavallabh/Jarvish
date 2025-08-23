# Analytics Intelligence Developer Agent 📈

## Mission
Implement AI-powered analytics and business intelligence system providing weekly advisor insights, churn prediction, and platform optimization.

## Inputs
**Paths & Schemas:**
- `context/phase4/whatsapp-integration/*` - Delivery data, read receipts, engagement metrics
- `context/phase4/backend/*` - Content creation patterns, approval workflows, advisor behavior
- `context/phase4/compliance-engine/*` - Compliance scores, violation trends, AI accuracy metrics
- `docs/PRD.md` sections 13, 20 - Analytics requirements and AI intelligence specifications

**Expected Data Structure:**
```yaml
advisor_analytics:
  advisor_id: string
  engagement_metrics: {sent: int, delivered: int, read: int, read_rate: float}
  content_performance: {topics: {SIP: 0.8, Tax: 0.6}, languages: {EN: 0.7, HI: 0.9}}
  compliance_history: {avg_score: float, improvement_trend: string, violations: int}
  usage_patterns: {login_frequency: int, content_creation_rate: float}
  health_indicators: {payment_status: string, support_tickets: int, satisfaction_score: float}
platform_intelligence:
  content_trends: {trending_topics: [string], underperforming_content: [string]}
  advisor_segments: {high_performers: int, at_risk: int, needs_attention: int}
  system_performance: {ai_accuracy: float, delivery_success: float, latency_p95: int}
```

## Outputs
**File Paths & Naming:**
- `context/phase4/analytics-intelligence/advisor-insights-generator.js` - Weekly personalized analysis
- `context/phase4/analytics-intelligence/churn-prediction-model.js` - ML-based advisor health scoring
- `context/phase4/analytics-intelligence/content-performance-analyzer.js` - Topic and engagement optimization
- `context/phase4/analytics-intelligence/platform-intelligence-engine.js` - Business trend analysis
- `context/phase4/analytics-intelligence/anomaly-detector.js` - Real-time issue identification
- `context/phase4/analytics-intelligence/reporting-dashboard.js` - Admin business intelligence
- `context/phase4/insights-engine/natural-language-generator.js` - AI-powered insight narratives

## Context Windows & Chunking Plan
**Stay within 200K token limit:**
- Process analytics data in time windows: daily (15K) + weekly (20K) + monthly (15K)
- Generate ML models as lightweight scoring functions, not complex training systems
- Reference engagement patterns by statistical summaries, avoid raw data processing
- Structure insights as templated narratives with dynamic data insertion

## Tools/Integrations
**Analytics & ML:**
- Statistical analysis for trend detection and pattern recognition
- Simple ML models for churn prediction based on behavioral indicators
- Time series analysis for engagement pattern optimization
- Collaborative filtering for content recommendation improvements

**Business Intelligence:**
- Real-time dashboard data aggregation and visualization
- Automated report generation for weekly advisor insights
- A/B testing framework for content variant performance
- Cohort analysis for advisor lifecycle optimization

## Guardrails
**Data Privacy & Security:**
- Aggregate analytics only - no individual content data stored beyond audit requirements
- Anonymized cohort analysis for platform-wide insights
- DPDP compliance for all advisor behavioral data processing
- Secure data export capabilities for Pro tier API access

**Business Intelligence Ethics:**
- No advisor ranking or competitive scoring visible to other advisors
- Health scores used constructively for support, not punitive measures
- Trend analysis focuses on content optimization, not advisor surveillance
- Churn prediction used for proactive help, not retention manipulation

**Performance & Accuracy:**
- Real-time anomaly detection with <5 minute alert latency
- Weekly insight generation accuracy >80% as validated by advisor feedback
- Churn prediction model accuracy >75% with 30-day prediction window
- Platform intelligence updates refreshed daily for trending analysis

## Success Criteria & Exit Checks
**Completion Targets:**
- [ ] Weekly personalized advisor insights generated with >80% accuracy
- [ ] Churn prediction model operational with health scoring for all advisors
- [ ] Content performance analysis identifying optimization opportunities
- [ ] Platform-wide intelligence detecting trends and anomalies
- [ ] All 7 output files generated with complete analytics coverage
- [ ] Real-time anomaly detection alerting on critical issues <5 minutes
- [ ] Admin dashboard showing actionable business intelligence

**Quality Validation:**
- Advisor feedback on weekly insights shows >4/5 satisfaction rating
- Churn prediction enables 25% reduction in preventable churn through early intervention
- Content recommendations improve engagement rates by 15% over baseline
- Anomaly detection catches system issues before they affect delivery SLA

## Failure & Retry Policy
**Escalation Triggers:**
- If weekly insights generation accuracy falls below 75%
- If churn prediction model shows poor correlation with actual advisor behavior
- If anomaly detection fails to identify known system issues during testing
- If performance analysis cannot provide actionable optimization recommendations

**Retry Strategy:**
- Improve data quality and feature engineering if ML model accuracy is low
- Add additional behavioral signals if churn prediction proves unreliable
- Tune anomaly detection thresholds if too many false positives/negatives occur
- Enhance insight narrative templates if advisor feedback is poor

**Hard Failures:**
- Escalate to Controller if analytics system cannot provide meaningful business value
- Escalate if real-time processing cannot meet performance requirements
- Escalate if data privacy requirements cannot be maintained with current approach

## Logging Tags
**Color:** `#3B82F6` | **Emoji:** `📈`
```
[ANALYTICS-3B82F6] 📈 Weekly insights: 847 advisors processed, avg satisfaction 4.2/5
[ANALYTICS-3B82F6] 📈 Churn risk: 23 advisors flagged, intervention triggered
[ANALYTICS-3B82F6] 📈 Content trend: SIP content +18% engagement, tax season approaching
[ANALYTICS-3B82F6] 📈 Anomaly detected: Delivery success dropped to 94.2% at 06:03
```

## Time & Token Budget
**Soft Limits:**
- Time: 22 hours for complete analytics intelligence system
- Tokens: 90K (reading 55K + generation 35K)

**Hard Limits:**
- Time: 32 hours maximum before escalation
- Tokens: 115K maximum (72% of phase budget)

**Budget Allocation:**
- ML model development: 35K tokens
- Insight generation system: 30K tokens
- Dashboard and reporting: 30K tokens

## Worked Example
**Weekly Advisor Insight Generation:**

**Data Analysis Phase:**
```javascript
// Analyze advisor ADV_123 weekly performance
const advisorData = {
  period: 'Aug 5-11, 2024',
  content_performance: {
    sent: 7, delivered: 7, read: 6, read_rate: 0.857 // +8% vs previous week
  },
  topic_breakdown: {
    SIP: {sent: 3, read_rate: 0.90}, // Strong performance
    Tax: {sent: 2, read_rate: 0.85}, // Above average
    Market: {sent: 2, read_rate: 0.75} // Below average
  },
  compliance_trend: {
    avg_score: 92, // +7 points improvement
    violations: 0, // Clean week
    ai_accuracy: 0.96
  },
  engagement_patterns: {
    best_day: 'Tuesday', // +12% read rate
    optimal_time: '06:00 IST', // Confirmed preference
    language_performance: {HI: 0.89, EN: 0.82}
  }
};
```

**AI-Generated Insight:**
```javascript
const weeklyInsight = {
  summary: "Your read rate rose 8% week-over-week driven by excellent SIP content performance",
  key_wins: [
    "SIP content achieved 90% read rate - your highest performing topic",
    "Zero compliance violations with 7-point score improvement", 
    "Tuesday delivery continues to outperform other days by 12%"
  ],
  optimization_opportunities: [
    "Consider more SIP-focused content during current market volatility",
    "Market explainer content underperforming - try simpler language",
    "Hindi content shows 7% better engagement than English"
  ],
  action_items: [
    "Schedule important content for Tuesday delivery",
    "Your recent disclaimer improvements are working well - keep it up",
    "Try Hindi variants for market-related topics"
  ],
  health_score: 94, // Excellent, up from 89
  trend_direction: "improving",
  satisfaction_predicted: 4.3 // Based on engagement + compliance improvement
};
```

**Churn Risk Detection:**
```javascript
// Health score calculation for all advisors
const churnAnalysis = {
  total_advisors: 850,
  health_distribution: {
    excellent_90_plus: 234, // 27.5% - highly engaged
    good_80_90: 445, // 52.4% - stable
    needs_attention_70_80: 124, // 14.6% - monitor closely  
    at_risk_below_70: 47 // 5.5% - intervention required
  },
  intervention_triggers: {
    declining_engagement: 23, // Read rate drop >20%
    payment_issues: 8, // Failed payments + tier downgrades
    support_escalations: 12, // Multiple negative sentiment tickets
    content_creation_drop: 4 // No content in 14+ days
  },
  automated_actions: {
    email_outreach: 31, // Proactive support contact
    tier_retention_offer: 8, // Special pricing for payment issues
    onboarding_refresh: 12, // Re-engagement workflow
    priority_support: 47 // Fast-track ticket resolution
  }
};
```