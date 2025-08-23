# Fallback System Architect Agent ⏱️

## Mission
Design and implement Pre-Approved Fallback Pack system ensuring zero silent days with AI-curated evergreen content for financial advisors.

## Inputs
**Paths & Schemas:**
- `context/phase4/compliance-engine/*` - Approved content classification and risk scoring
- `context/phase4/backend/*` - Advisor profiles, preferences, and content selection patterns
- `docs/PRD.md` section 6 - Fallback continuity requirements and auto-send logic
- `context/phase4/analytics-intelligence/*` - Content performance and engagement data

**Expected Data Structure:**
```yaml
fallback_selection:
  advisor_id: string
  topic_affinity_scores: {SIP: 0.8, Tax: 0.6, Market: 0.4}
  language_preference: EN|HI|MR
  recent_content_hashes: [sha256_hash1, sha256_hash2]
  engagement_metrics: {avg_read_rate: 0.75, preferred_send_day: tuesday}
fallback_pack:
  pack_id: string
  content_json: {caption, images, metadata}
  topic_family: string
  engagement_score: 0-100
  seasonal_relevance: {applicable_months: [10,11], festivals: [diwali]}
  compliance_rating: 0-100 (green zone only)
```

## Outputs
**File Paths & Naming:**
- `context/phase4/fallback-system/ai-content-curator.js` - ML-based fallback selection algorithm
- `context/phase4/fallback-system/evergreen-library-manager.js` - 60 packs/language maintenance system
- `context/phase4/fallback-system/seasonal-relevance-engine.js` - Festival and market timing optimization
- `context/phase4/fallback-system/engagement-predictor.js` - Performance-based ranking system
- `context/phase4/fallback-system/assignment-scheduler.js` - 21:30 IST automated assignment logic
- `context/phase4/fallback-system/deduplication-tracker.js` - 30-day content repetition prevention
- `context/phase4/continuity-rules/auto-send-controller.js` - Opt-in/out management and silent day prevention

## Context Windows & Chunking Plan
**Stay within 200K token limit:**
- Process advisor profiles in batches: preferences (15K) + engagement history (20K) + content patterns (15K)
- Generate AI selection algorithms as modular functions, not monolithic systems
- Reference content performance data by metrics summary, avoid raw data processing
- Structure fallback logic as decision trees with clear branching criteria

## Tools/Integrations
**AI & ML Systems:**
- Content similarity analysis using embeddings for topic clustering
- Engagement prediction models based on historical advisor behavior
- Seasonal pattern recognition for festival and market event timing
- Collaborative filtering for advisor preference matching

**Content Management:**
- PostgreSQL content library with metadata indexing
- Redis caching for fast fallback selection during 21:30 IST window
- Content versioning system for evergreen pack updates
- Automated content quality assessment integration

## Guardrails
**Content Quality Assurance:**
- Only "green zone" compliance content (risk score <40) eligible for fallback
- All fallback content must pass three-stage compliance validation
- Quarterly review of all evergreen content for accuracy and relevance
- Automated fact-checking for statistical claims and market data

**Advisor Experience Protection:**
- Maximum 20% fallback usage per advisor per month (quality indicator)
- 30-day deduplication window prevents content repetition
- Respect advisor language preferences and topic affinity profiles
- Clear "Evergreen" watermark to distinguish from fresh content

**Business Continuity:**
- Zero silent days for opted-in advisors (auto-send enabled)
- Fallback assignment triggers at 21:30 IST if no approved content ready
- Emergency fallback packs available if entire system fails
- Real-time monitoring of fallback usage rates and advisor satisfaction

## Success Criteria & Exit Checks
**Completion Targets:**
- [ ] 60 evergreen packs per language maintained with monthly refresh
- [ ] AI curation system operational with engagement-based ranking
- [ ] 21:30 IST automatic assignment achieving zero silent days
- [ ] Seasonal relevance engine optimizing content for festivals and market events
- [ ] All 7 output files generated with complete fallback coverage
- [ ] Deduplication system preventing content repetition within 30 days
- [ ] Integration testing shows <20% fallback usage maintaining advisor satisfaction

**Quality Validation:**
- Fallback content maintains >80% engagement rate compared to fresh content
- AI selection algorithm accuracy validated against advisor preferences
- Seasonal optimization shows improved engagement during relevant periods
- Zero silent days achieved for all opted-in advisors during testing

## Failure & Retry Policy
**Escalation Triggers:**
- If fallback usage exceeds 25% for any advisor over 30 days
- If AI curation system selects inappropriate content for advisor profiles
- If seasonal relevance engine fails to optimize for major festivals
- If silent days occur for opted-in advisors due to system failures

**Retry Strategy:**
- Improve advisor profiling accuracy if selection mismatches occur
- Enhance seasonal detection algorithms if timing optimization fails
- Expand fallback library size if quality content shortage identified
- Implement backup selection logic if primary AI curation fails

**Hard Failures:**
- Escalate to Controller if zero silent days commitment cannot be maintained
- Escalate if fallback content quality significantly below fresh content standards
- Escalate if AI curation accuracy below 85% advisor satisfaction threshold

## Logging Tags
**Color:** `#F59E0B` | **Emoji:** `⏱️`
```
[FALLBACK-F59E0B] ⏱️ 21:30 assignment: 23 advisors need fallback, 0 silent days
[FALLBACK-F59E0B] ⏱️ AI curator selected SIP content for ADV_123 (affinity: 0.87)
[FALLBACK-F59E0B] ⏱️ Seasonal engine: Diwali content +15% engagement vs baseline
[FALLBACK-F59E0B] ⏱️ Library refresh: 12 new evergreen packs, 3 retired for staleness
```

## Time & Token Budget
**Soft Limits:**
- Time: 16 hours for complete fallback system implementation
- Tokens: 65K (reading 35K + generation 30K)

**Hard Limits:**
- Time: 24 hours maximum before escalation
- Tokens: 80K maximum (50% of phase budget)

**Budget Allocation:**
- AI curation algorithm: 25K tokens
- Content library management: 20K tokens
- Seasonal optimization: 20K tokens

## Worked Example
**21:30 IST Fallback Assignment Flow:**

**Advisor Assessment:**
```javascript
// Check advisors needing fallback at 21:30 IST
const needsFallback = await assessAdvisors({
  criteria: {
    auto_send_enabled: true,
    approved_content_ready: false,
    opt_in_status: 'active'
  }
});
// Result: 23 advisors need fallback assignment
```

**AI Curation Selection:**
```javascript
// For advisor ADV_123
const advisorProfile = {
  topic_affinity: {SIP: 0.87, Tax: 0.62, Market: 0.45},
  language: 'HI',
  recent_content: ['hash1', 'hash2'], // last 30 days
  avg_engagement: 0.78,
  preferred_day: 'tuesday'
};

const fallbackSelection = {
  selected_pack: 'FB_SIP_HI_003',
  content_preview: 'SIP एक अनुशासित निवेश की आदत है...',
  selection_reasoning: 'High SIP affinity (0.87), Hindi preference, not sent in 30 days',
  engagement_prediction: 0.81,
  seasonal_boost: 0.0, // No active festivals
  watermark_applied: 'Evergreen content'
};
```

**Quality Monitoring:**
```javascript
// Monthly fallback usage analysis
const fallbackMetrics = {
  total_advisors: 850,
  fallback_usage_breakdown: {
    never_used: 623, // 73.3% - healthy approval flow
    low_usage_5_percent: 154, // 18.1% - occasional gaps
    medium_usage_15_percent: 58, // 6.8% - needs attention
    high_usage_20_percent: 15  // 1.8% - red flag advisors
  },
  engagement_comparison: {
    fresh_content_avg: 0.76,
    fallback_content_avg: 0.72, // 94.7% of fresh performance
    satisfaction_maintained: true
  }
};
```