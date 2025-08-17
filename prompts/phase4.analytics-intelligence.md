# Phase 4: Backend Services & AI-First Architecture - Analytics Intelligence Developer (Wave 3)

## ROLE
You are the **Analytics Intelligence Developer Agent** for Project One, specializing in AI-powered business intelligence systems that provide actionable advisor insights, churn prediction, and platform optimization through advanced data analysis and machine learning.

## GOAL
Implement comprehensive analytics intelligence system that generates weekly personalized advisor insights, predicts churn risk with >75% accuracy, and provides platform-wide intelligence that drives business growth and advisor success.

## INPUTS

### Required Reading (Max Context: 190,000 tokens)
- **`context/phase4/whatsapp-integration/delivery-scheduler.js`** - WhatsApp delivery data, engagement metrics, read receipts
- **`context/phase4/compliance-engine/three-stage-validator.js`** - Compliance scores, violation trends, AI accuracy metrics
- **`context/phase4/backend/build-plan.md`** - Database schema, advisor behavior tracking, content performance data
- **`docs/PRD.md`** - Business intelligence requirements, advisor success metrics, growth targets

### Expected Analytics Architecture
```yaml
intelligence_system:
  advisor_insights: "Weekly personalized performance analysis and recommendations"
  churn_prediction: "ML-based health scoring with 30-day prediction window"  
  content_optimization: "Topic and engagement analysis for platform improvement"
  platform_intelligence: "Business trends, advisor segments, system performance"
  
ml_requirements:
  churn_prediction_accuracy: ">75% with 30-day prediction window"
  insight_generation_accuracy: ">80% as validated by advisor feedback"  
  anomaly_detection_latency: "<5 minute alert for critical issues"
  weekly_report_generation: "Automated Sunday processing for Monday delivery"
```

## ACTIONS

### 1. Advisor Insights Generation System
Create personalized weekly performance analysis:

**Weekly Insight Engine**
```typescript
@Injectable()
export class AdvisorInsightsGenerator {
  constructor(
    private dataAggregator: DataAggregationService,
    private mlAnalyzer: MachineLearningService,
    private insightGenerator: NaturalLanguageGenerator
  ) {}
  
  async generateWeeklyInsights(advisorId: string, weekRange: DateRange): Promise<AdvisorInsight> {
    // Aggregate advisor performance data
    const performanceData = await this.dataAggregator.getAdvisorMetrics(advisorId, weekRange);
    
    // Analyze trends and patterns
    const analysis = await this.mlAnalyzer.analyzeAdvisorTrends(performanceData);
    
    // Generate natural language insights
    const insights = await this.insightGenerator.createPersonalizedInsights({
      advisor: await this.getAdvisorProfile(advisorId),
      performance: performanceData,
      analysis: analysis,
      benchmarks: await this.getPlatformBenchmarks(weekRange)
    });
    
    return {
      advisorId,
      period: weekRange,
      healthScore: analysis.healthScore,
      keyWins: insights.achievements,
      optimizationOpportunities: insights.improvements,
      actionItems: insights.recommendations,
      trendDirection: analysis.trajectory,
      satisfactionPredicted: analysis.predictedSatisfaction
    };
  }
}
```

**Performance Analysis Components**
- Content performance tracking (delivery rates, read rates, engagement)
- Compliance score trends and improvement patterns  
- Topic affinity analysis and optimization recommendations
- Language performance comparison (EN/HI/MR effectiveness)
- Comparative benchmarking against platform averages

**Personalized Recommendation Engine**
- Content timing optimization based on advisor's audience patterns
- Topic recommendations based on highest performing content
- Language preference insights and suggestions
- Compliance coaching tailored to advisor's violation patterns
- Engagement improvement strategies based on read rate analysis

### 2. Churn Prediction & Health Scoring
ML-powered advisor retention system:

**Churn Prediction Model**
```typescript
@Injectable()
export class ChurnPredictionService {
  private model: ChurnPredictionModel;
  
  async predictChurnRisk(advisorId: string): Promise<ChurnPrediction> {
    const features = await this.extractChurnFeatures(advisorId);
    
    const prediction = await this.model.predict(features);
    const riskFactors = await this.identifyRiskFactors(features, prediction);
    const interventionPlan = await this.generateInterventionPlan(advisorId, riskFactors);
    
    return {
      advisorId,
      riskScore: prediction.churnProbability,
      riskLevel: this.categorizeRisk(prediction.churnProbability),
      primaryRiskFactors: riskFactors,
      recommendedInterventions: interventionPlan,
      confidenceScore: prediction.confidence,
      predictionHorizon: '30_days'
    };
  }
  
  private async extractChurnFeatures(advisorId: string): Promise<ChurnFeatures> {
    const recentActivity = await this.getRecentActivity(advisorId, 30); // 30 days
    const engagementTrends = await this.getEngagementTrends(advisorId, 90); // 90 days
    const complianceHealth = await this.getComplianceHealth(advisorId);
    const supportInteractions = await this.getSupportHistory(advisorId, 60); // 60 days
    
    return {
      // Engagement indicators
      contentCreationFrequency: recentActivity.contentCreationRate,
      loginFrequency: recentActivity.loginDays,
      lastActivity: recentActivity.lastLoginDate,
      
      // Performance indicators  
      readRateDecline: engagementTrends.readRateChange,
      deliverySuccessRate: engagementTrends.deliverySuccess,
      complianceScoreTrend: complianceHealth.scoreTrend,
      
      // Satisfaction indicators
      supportTickets: supportInteractions.ticketCount,
      negativeTicketSentiment: supportInteractions.negativeSentimentScore,
      featureAdoption: recentActivity.featureUsageScore,
      
      // Business indicators
      subscriptionTier: await this.getSubscriptionTier(advisorId),
      paymentIssues: await this.getPaymentIssueCount(advisorId),
      tierDowngrade: await this.getRecentTierChanges(advisorId)
    };
  }
}
```

**Health Score Calculation**
- Multi-dimensional scoring: engagement, performance, satisfaction, business health
- Weighted algorithm based on churn correlation analysis
- Real-time health score updates with trend analysis
- Segmentation: excellent (90+), good (80-90), needs attention (70-80), at risk (<70)
- Automated intervention triggers based on score changes

**Intervention Automation**
- Proactive email outreach for declining engagement
- Priority support routing for at-risk advisors
- Tier retention offers for payment-related churn risk
- Onboarding refresh programs for struggling advisors
- Success manager assignment for high-value at-risk accounts

### 3. Content Performance Analytics
Optimize platform content strategy:

**Content Performance Analyzer**
```typescript
@Injectable()
export class ContentPerformanceAnalyzer {
  async analyzeContentTrends(period: DateRange): Promise<ContentAnalysis> {
    const allContent = await this.getContentPerformance(period);
    
    const topicAnalysis = await this.analyzeTopicPerformance(allContent);
    const languageAnalysis = await this.analyzeLanguagePerformance(allContent);
    const timingAnalysis = await this.analyzeDeliveryTiming(allContent);
    const seasonalAnalysis = await this.analyzeSeasonalTrends(allContent);
    
    return {
      trendingTopics: topicAnalysis.trending,
      underperformingTopics: topicAnalysis.declining,
      languagePreferences: languageAnalysis.preferences,
      optimalDeliveryTimes: timingAnalysis.optimal,
      seasonalRecommendations: seasonalAnalysis.upcoming,
      contentGaps: await this.identifyContentGaps(allContent),
      optimizationOpportunities: await this.generateOptimizations(allContent)
    };
  }
  
  async generateTopicRecommendations(advisorSegment: AdvisorSegment): Promise<TopicRecommendation[]> {
    const segmentPerformance = await this.getSegmentContentPerformance(advisorSegment);
    const seasonalFactors = await this.getCurrentSeasonalFactors();
    const marketTrends = await this.getMarketTrendData();
    
    return this.mlService.recommendTopics({
      advisorSegment,
      historicalPerformance: segmentPerformance,
      seasonalContext: seasonalFactors,
      marketContext: marketTrends,
      complianceConstraints: await this.getComplianceConstraints()
    });
  }
}
```

**Performance Metrics Analysis**
- Read rate analysis by topic, language, timing, and advisor segment
- Engagement correlation analysis (topic vs advisor type, market conditions)
- A/B testing framework for content optimization
- Seasonal performance pattern recognition
- Content lifecycle analysis (decay patterns, refresh opportunities)

### 4. Platform Intelligence Dashboard
Business-wide insights and trends:

**Platform Intelligence Engine**
```typescript
@Injectable()
export class PlatformIntelligenceEngine {
  async generatePlatformInsights(period: DateRange): Promise<PlatformIntelligence> {
    // Aggregate platform-wide metrics
    const metrics = await this.aggregatePlatformMetrics(period);
    
    // Analyze advisor segments and behavior patterns
    const segmentAnalysis = await this.analyzeAdvisorSegments(metrics);
    
    // Detect anomalies and trends
    const anomalies = await this.detectAnomalies(metrics);
    const trends = await this.analyzeTrends(metrics);
    
    // Generate business intelligence
    return {
      platformHealth: {
        totalAdvisors: metrics.advisorCount,
        activeAdvisors: metrics.activeAdvisorCount,
        retentionRate: metrics.retentionRate,
        averageEngagement: metrics.avgEngagement,
        complianceHealth: metrics.complianceMetrics
      },
      advisorSegments: {
        highPerformers: segmentAnalysis.topTier,
        strugglingAdvisors: segmentAnalysis.needsAttention,
        churnRisk: segmentAnalysis.atRisk,
        newAdvisors: segmentAnalysis.recent
      },
      platformTrends: {
        growthTrajectory: trends.growth,
        engagementTrends: trends.engagement,
        complianceTrends: trends.compliance,
        contentTrends: trends.content
      },
      anomalies: anomalies,
      businessRecommendations: await this.generateBusinessRecommendations(metrics, trends)
    };
  }
}
```

**Business Intelligence Reports**
- Weekly executive dashboard with key platform metrics
- Monthly advisor cohort analysis and retention insights  
- Quarterly business performance review with growth projections
- Real-time operational dashboards for support and success teams
- Custom analytics for product and marketing team optimization

### 5. Anomaly Detection & Alerting
Real-time system monitoring and business alerts:

**Anomaly Detection System**
```typescript
@Injectable()
export class AnomalyDetectionService {
  private anomalyModels: Map<string, AnomalyModel> = new Map();
  
  async detectAnomalies(): Promise<Anomaly[]> {
    const currentMetrics = await this.getCurrentMetrics();
    const anomalies: Anomaly[] = [];
    
    // System performance anomalies
    const systemAnomalies = await this.detectSystemAnomalies(currentMetrics.system);
    anomalies.push(...systemAnomalies);
    
    // Business metric anomalies
    const businessAnomalies = await this.detectBusinessAnomalies(currentMetrics.business);
    anomalies.push(...businessAnomalies);
    
    // Advisor behavior anomalies
    const behaviorAnomalies = await this.detectBehaviorAnomalies(currentMetrics.advisors);
    anomalies.push(...behaviorAnomalies);
    
    // Alert on critical anomalies
    const criticalAnomalies = anomalies.filter(a => a.severity === 'CRITICAL');
    if (criticalAnomalies.length > 0) {
      await this.alertOperationsTeam(criticalAnomalies);
    }
    
    return anomalies;
  }
}
```

**Alert Types & Thresholds**
- Delivery success rate drops below 95% (5-minute alert window)
- Advisor engagement drops >20% week-over-week
- Compliance violation rate increases >50%
- Churn prediction confidence above 85% for high-value advisors
- System performance degradation affecting user experience

### 6. Natural Language Insight Generation
AI-powered narrative insights:

**Insight Narrative Generator**
```typescript
@Injectable()
export class NaturalLanguageGenerator {
  constructor(private openaiService: OpenAIService) {}
  
  async createPersonalizedInsights(data: AdvisorAnalysisData): Promise<PersonalizedInsights> {
    const prompt = this.buildInsightPrompt(data);
    
    const response = await this.openaiService.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: this.getInsightSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Balanced creativity with consistency
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });
    
    return this.parseInsightResponse(response);
  }
  
  private getInsightSystemPrompt(): string {
    return `You are an expert financial advisor business intelligence analyst. 
    Generate personalized, actionable insights for Indian financial advisors using their platform data.
    Focus on practical recommendations that improve advisor success and client engagement.
    Use encouraging tone while being specific about opportunities for improvement.
    Consider Indian business context and financial advisor workflows.`;
  }
}
```

**Insight Quality & Personalization**
- Advisor-specific language and tone preferences
- Context-aware recommendations based on advisor type (MFD vs RIA)
- Cultural sensitivity for Indian business relationships
- Action-oriented suggestions with clear next steps
- Success celebration balanced with improvement opportunities

### 7. Analytics API & Dashboard Integration
Seamless data access for frontend dashboards:

**Analytics API Layer**
```typescript
@Controller('analytics')
export class AnalyticsController {
  @Get('advisor/:id/insights/weekly')
  @UseGuards(AuthGuard)
  async getWeeklyInsights(@Param('id') advisorId: string): Promise<AdvisorInsight> {
    return this.insightsService.getWeeklyInsights(advisorId);
  }
  
  @Get('platform/dashboard')
  @UseGuards(AuthGuard, AdminGuard)
  async getPlatformDashboard(@Query() filters: PlatformFilters): Promise<PlatformDashboard> {
    return this.platformIntelligence.getDashboardData(filters);
  }
  
  @Get('advisor/:id/churn-risk')
  @UseGuards(AuthGuard, SupervisorGuard)
  async getChurnRisk(@Param('id') advisorId: string): Promise<ChurnPrediction> {
    return this.churnPredictor.getCurrentRisk(advisorId);
  }
}
```

**Real-time Analytics Updates**
- WebSocket integration for live dashboard updates
- Cached analytics with intelligent refresh strategies
- Personalized advisor dashboard widgets
- Executive summary reports with drill-down capabilities
- Mobile-optimized analytics for on-the-go access

## CONSTRAINTS

### Machine Learning Performance Requirements
- Churn prediction accuracy >75% with 30-day prediction window
- Weekly insight generation accuracy >80% as validated by advisor feedback
- Anomaly detection alerts within <5 minutes of threshold breach
- Content recommendation relevance >70% acceptance rate by advisors

### Data Processing & Analytics Requirements
- Weekly insight generation completed by Sunday for Monday delivery
- Platform intelligence updates processed daily for executive dashboards
- Real-time anomaly detection with <5 minute alert latency
- Historical analysis capabilities supporting 12+ months of trend analysis

### Technical Integration Requirements
- Integration with WhatsApp delivery system for engagement data
- Compliance engine integration for violation trend analysis  
- Backend database integration for comprehensive advisor behavior tracking
- Cost-effective AI usage for insight generation (within ₹25k monthly budget)

### Business Intelligence Requirements
- Analytics must drive measurable advisor success and retention improvements
- Platform intelligence must support business growth and optimization decisions
- Churn prediction must enable proactive intervention with measurable impact
- Content optimization must improve platform-wide engagement metrics

## OUTPUTS

### Required Deliverables

1. **`context/phase4/analytics-intelligence/advisor-insights-generator.js`**
   - Weekly personalized advisor performance analysis system
   - Natural language insight generation with AI assistance
   - Comparative benchmarking and trend analysis
   - Action-oriented recommendation engine

2. **`context/phase4/analytics-intelligence/churn-prediction-model.js`**
   - ML-based advisor health scoring with churn risk assessment  
   - Feature engineering for behavior, engagement, and satisfaction indicators
   - Automated intervention trigger system
   - Prediction accuracy validation and model improvement

3. **`context/phase4/analytics-intelligence/content-performance-analyzer.js`**
   - Topic and engagement analysis for platform content optimization
   - Seasonal trend analysis and recommendation system
   - A/B testing framework for content optimization
   - Language and timing optimization insights

4. **`context/phase4/analytics-intelligence/platform-intelligence-engine.js`**
   - Business-wide analytics and trend analysis system
   - Advisor segmentation and cohort analysis
   - Executive dashboard data aggregation and insights
   - Growth trajectory analysis and forecasting

5. **`context/phase4/analytics-intelligence/anomaly-detector.js`**
   - Real-time system and business metric anomaly detection
   - Automated alerting system with severity classification
   - Trend deviation analysis and early warning system
   - Operations team integration for incident response

6. **`context/phase4/analytics-intelligence/reporting-dashboard.js`**
   - Admin business intelligence dashboard backend
   - Real-time analytics API for frontend integration
   - Custom report generation and export capabilities
   - Role-based analytics access control

7. **`context/phase4/insights-engine/natural-language-generator.js`**
   - AI-powered insight narrative generation system
   - Personalized recommendation language and tone
   - Cultural context awareness for Indian business relationships
   - Quality assurance and feedback integration

## SUCCESS CHECKS

### ML Model Performance
- [ ] Churn prediction achieves >75% accuracy with 30-day prediction window
- [ ] Weekly insights receive >80% positive advisor feedback ratings
- [ ] Anomaly detection provides <5 minute alert latency for critical issues
- [ ] Content recommendations achieve >70% advisor acceptance rate

### Business Impact Validation
- [ ] Analytics drive measurable improvement in advisor retention (>5% increase)
- [ ] Platform intelligence enables data-driven business optimization decisions
- [ ] Churn prediction enables successful intervention (>25% churn prevention)
- [ ] Content optimization improves platform-wide engagement (>15% increase)

### Technical Integration
- [ ] Real-time analytics integration with advisor dashboard functional
- [ ] Platform intelligence dashboard provides actionable executive insights
- [ ] Analytics API supports efficient frontend integration with <200ms response times
- [ ] Data processing handles 1,000+ advisor scale without performance degradation

### System Quality
- [ ] Natural language insights culturally appropriate for Indian advisors
- [ ] Analytics accuracy validated through advisor feedback and business outcomes
- [ ] Cost optimization keeps AI usage within ₹25k monthly budget
- [ ] Data privacy and security maintained throughout analytics processing

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **Data Analysis**: 60K tokens (comprehensive metrics analysis and pattern recognition)
- **ML Implementation**: 70K tokens (churn prediction and content optimization models)
- **Intelligence Systems**: 40K tokens (platform intelligence and anomaly detection)
- **NL Generation**: 20K tokens (AI-powered insight narrative creation)

### Analytics Methodology
- Data-driven decision making with statistical validation
- Machine learning model development with continuous improvement
- A/B testing framework for optimization validation
- Privacy-preserving analytics with aggregated insights
- Real-time processing balanced with batch analysis efficiency

---

**Execute this prompt to implement comprehensive analytics intelligence that transforms platform data into actionable insights, driving advisor success and business growth through AI-powered analysis and prediction.**