# Rejection Feedback & Learning System Architecture

## System Overview
A sophisticated feedback capture and learning system that transforms content rejections into actionable insights, enabling continuous improvement of content generation quality and compliance.

## Core Components

### 1. Feedback Capture Service

#### Quick Feedback Categories
```typescript
enum RejectionCategory {
  TONE_MISMATCH = "tone_mismatch",
  COMPLIANCE_ISSUE = "compliance_issue", 
  LENGTH_INAPPROPRIATE = "length_inappropriate",
  RELEVANCE_LOW = "relevance_low",
  FACTUAL_ERROR = "factual_error",
  LANGUAGE_QUALITY = "language_quality",
  TARGET_MISMATCH = "target_mismatch",
  TIMING_ISSUE = "timing_issue",
  BRAND_VIOLATION = "brand_violation",
  OTHER = "other"
}

interface QuickFeedback {
  category: RejectionCategory;
  subcategory?: string;
  severity: 'critical' | 'major' | 'minor';
  requiresDetailedFeedback: boolean;
}
```

#### Detailed Feedback Structure
```typescript
interface DetailedFeedback {
  quickFeedback: QuickFeedback;
  detailedText: string;
  specificIssues: {
    location: string; // specific part of content
    issue: string;
    suggestion?: string;
  }[];
  sentiment: {
    score: number; // -1 to 1
    emotion: string; // frustrated, confused, concerned, etc.
  };
  metadata: {
    rejectorId: string;
    rejectorRole: string;
    timestamp: Date;
    contextId: string;
    sessionId: string;
  };
}
```

### 2. Pattern Recognition Engine

#### Rejection Pattern Analysis
```typescript
interface RejectionPattern {
  patternId: string;
  category: RejectionCategory;
  frequency: number;
  commonCharacteristics: {
    contentType: string[];
    targetAudience: string[];
    timeOfDay: string[];
    contentLength: number[];
    keywords: string[];
  };
  correlations: {
    advisorSegment?: string[];
    productType?: string[];
    complianceRule?: string[];
  };
  confidence: number;
}
```

#### Machine Learning Pipeline
```python
class RejectionPatternAnalyzer:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=1000)
        self.classifier = RandomForestClassifier()
        self.clustering = DBSCAN(eps=0.3, min_samples=5)
        
    def analyze_rejection_patterns(self, rejections):
        # Extract features from rejected content
        features = self.extract_features(rejections)
        
        # Identify clusters of similar rejections
        clusters = self.clustering.fit_predict(features)
        
        # Analyze common characteristics
        patterns = self.identify_patterns(clusters, rejections)
        
        # Generate insights
        insights = self.generate_insights(patterns)
        
        return insights
    
    def extract_features(self, rejections):
        text_features = self.vectorizer.fit_transform(
            [r['content'] for r in rejections]
        )
        
        metadata_features = self.extract_metadata_features(rejections)
        feedback_features = self.extract_feedback_features(rejections)
        
        return np.hstack([
            text_features.toarray(),
            metadata_features,
            feedback_features
        ])
```

### 3. Learning & Improvement System

#### Continuous Learning Architecture
```typescript
interface LearningSystem {
  // Store rejected content with full context
  storeRejection(rejection: RejectedContent): Promise<void>;
  
  // Analyze patterns across rejections
  analyzePatterns(timeframe: TimeRange): Promise<PatternInsights>;
  
  // Generate improvement recommendations
  generateRecommendations(): Promise<Recommendation[]>;
  
  // Update system prompts based on learnings
  updateSystemPrompts(insights: PatternInsights): Promise<void>;
  
  // Create anti-patterns documentation
  generateAntiPatterns(): Promise<AntiPatternGuide>;
}

interface RejectedContent {
  contentId: string;
  originalContent: string;
  rejectionFeedback: DetailedFeedback;
  contextData: {
    requestParams: any;
    generationPrompt: string;
    modelUsed: string;
    timestamp: Date;
  };
  regenerationAttempts: RegenerationAttempt[];
  finalOutcome: 'approved' | 'abandoned' | 'escalated';
}
```

#### Prompt Evolution System
```typescript
class PromptEvolutionEngine {
  private promptVersions: Map<string, PromptVersion[]>;
  private performanceMetrics: Map<string, PerformanceMetric>;
  
  async evolvePrompt(
    currentPrompt: string,
    rejectionPatterns: RejectionPattern[]
  ): Promise<string> {
    // Analyze what's causing rejections
    const issues = this.identifyPromptIssues(rejectionPatterns);
    
    // Generate prompt modifications
    const modifications = await this.generateModifications(
      currentPrompt,
      issues
    );
    
    // A/B test new prompts
    const testResults = await this.runPromptTests(modifications);
    
    // Select best performing version
    return this.selectBestPrompt(testResults);
  }
  
  private generateModifications(
    prompt: string,
    issues: Issue[]
  ): PromptModification[] {
    return issues.map(issue => {
      switch(issue.type) {
        case 'COMPLIANCE':
          return this.addComplianceGuardrails(prompt, issue);
        case 'TONE':
          return this.adjustToneInstructions(prompt, issue);
        case 'LENGTH':
          return this.modifyLengthConstraints(prompt, issue);
        default:
          return this.genericImprovement(prompt, issue);
      }
    });
  }
}
```

### 4. Regeneration Workflow Engine

#### Intelligent Regeneration Strategy
```typescript
class RegenerationEngine {
  private strategies: Map<RejectionCategory, RegenerationStrategy>;
  private maxAttempts: number = 3;
  
  async regenerateContent(
    rejection: RejectedContent,
    feedback: DetailedFeedback
  ): Promise<RegeneratedContent> {
    // Select appropriate strategy
    const strategy = this.selectStrategy(feedback);
    
    // Apply targeted modifications
    const modifiedParams = await strategy.modifyParameters(
      rejection.contextData.requestParams,
      feedback
    );
    
    // Track regeneration attempt
    const attempt: RegenerationAttempt = {
      attemptNumber: rejection.regenerationAttempts.length + 1,
      strategy: strategy.name,
      modifications: modifiedParams.changes,
      timestamp: new Date()
    };
    
    // Generate new content
    const newContent = await this.generateWithModifications(
      modifiedParams
    );
    
    // Validate improvements
    const validation = await this.validateRegeneration(
      newContent,
      feedback
    );
    
    if (!validation.passed && attempt.attemptNumber < this.maxAttempts) {
      // Try different strategy
      return this.tryAlternativeStrategy(rejection, feedback);
    }
    
    return {
      content: newContent,
      attempt,
      validation
    };
  }
  
  private async tryAlternativeStrategy(
    rejection: RejectedContent,
    feedback: DetailedFeedback
  ): Promise<RegeneratedContent> {
    // Escalate to more sophisticated approach
    const escalationStrategies = [
      new ComplianceFirstStrategy(),
      new HumanAssistedStrategy(),
      new TemplateBasedStrategy()
    ];
    
    for (const strategy of escalationStrategies) {
      const result = await strategy.regenerate(rejection, feedback);
      if (result.success) return result;
    }
    
    // Final escalation
    return this.escalateToHuman(rejection, feedback);
  }
}
```

### 5. Database Schema

```sql
-- Core rejection tracking
CREATE TABLE rejections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  original_content TEXT NOT NULL,
  rejection_category VARCHAR(50) NOT NULL,
  rejection_subcategory VARCHAR(100),
  severity VARCHAR(20) NOT NULL,
  detailed_feedback TEXT,
  sentiment_score DECIMAL(3,2),
  sentiment_emotion VARCHAR(50),
  rejector_id UUID NOT NULL,
  rejector_role VARCHAR(50) NOT NULL,
  session_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_category (rejection_category),
  INDEX idx_rejector (rejector_id),
  INDEX idx_created (created_at)
);

-- Pattern recognition results
CREATE TABLE rejection_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  frequency INTEGER NOT NULL,
  confidence_score DECIMAL(3,2),
  characteristics JSONB NOT NULL,
  correlations JSONB,
  first_detected TIMESTAMP NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_category_confidence (category, confidence_score DESC)
);

-- Learning insights
CREATE TABLE learning_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type VARCHAR(50) NOT NULL,
  pattern_id UUID REFERENCES rejection_patterns(id),
  insight_data JSONB NOT NULL,
  action_taken VARCHAR(100),
  impact_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  applied_at TIMESTAMP,
  
  INDEX idx_type_impact (insight_type, impact_score DESC)
);

-- Prompt evolution tracking
CREATE TABLE prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_key VARCHAR(100) NOT NULL,
  version INTEGER NOT NULL,
  prompt_content TEXT NOT NULL,
  parent_version_id UUID REFERENCES prompt_versions(id),
  modifications JSONB,
  performance_metrics JSONB,
  rejection_rate DECIMAL(5,2),
  approval_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active_from TIMESTAMP,
  active_until TIMESTAMP,
  
  UNIQUE(prompt_key, version),
  INDEX idx_active (prompt_key, active_from, active_until)
);

-- Regeneration attempts
CREATE TABLE regeneration_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rejection_id UUID REFERENCES rejections(id),
  attempt_number INTEGER NOT NULL,
  strategy_used VARCHAR(100) NOT NULL,
  modifications_applied JSONB NOT NULL,
  regenerated_content TEXT,
  validation_result JSONB,
  outcome VARCHAR(50) NOT NULL, -- approved, rejected, escalated
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_rejection_attempts (rejection_id, attempt_number)
);

-- Anti-pattern documentation
CREATE TABLE anti_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  examples JSONB NOT NULL,
  avoidance_guidelines TEXT NOT NULL,
  detection_rules JSONB,
  frequency INTEGER DEFAULT 0,
  severity VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_occurrence TIMESTAMP,
  
  INDEX idx_category_severity (category, severity)
);
```

### 6. API Endpoints

```typescript
// Feedback Collection APIs
POST /api/feedback/rejection
{
  contentId: string;
  quickFeedback: QuickFeedback;
  detailedFeedback?: string;
  specificIssues?: Issue[];
}

// Pattern Analysis APIs
GET /api/patterns/analysis
Query params: timeframe, category, minConfidence

GET /api/patterns/insights/:patternId
Returns detailed insights for specific pattern

// Learning System APIs
POST /api/learning/process-rejection
Triggers learning pipeline for new rejection

GET /api/learning/recommendations
Returns improvement recommendations

POST /api/learning/apply-insight/:insightId
Applies specific learning insight to system

// Regeneration APIs
POST /api/regenerate/content
{
  rejectionId: string;
  strategy?: string;
  customModifications?: any;
}

GET /api/regenerate/status/:attemptId
Returns regeneration attempt status

// Prompt Evolution APIs
GET /api/prompts/performance/:promptKey
Returns performance metrics for prompt versions

POST /api/prompts/evolve
{
  promptKey: string;
  targetMetric: string;
}

// Anti-pattern APIs
GET /api/antipatterns/check
POST /api/antipatterns/report
```

### 7. Machine Learning Components

#### Sentiment Analysis Model
```python
class FeedbackSentimentAnalyzer:
    def __init__(self):
        self.model = pipeline(
            'sentiment-analysis',
            model='finiteautomata/bertweet-base-sentiment-analysis'
        )
        self.emotion_model = pipeline(
            'text-classification',
            model='j-hartmann/emotion-english-distilroberta-base'
        )
    
    def analyze_feedback(self, feedback_text):
        # Sentiment scoring
        sentiment = self.model(feedback_text)[0]
        
        # Emotion detection
        emotion = self.emotion_model(feedback_text)[0]
        
        # Extract key phrases indicating issues
        issues = self.extract_issue_indicators(feedback_text)
        
        return {
            'sentiment_score': self.normalize_score(sentiment),
            'emotion': emotion['label'],
            'emotion_confidence': emotion['score'],
            'key_issues': issues
        }
```

#### Content Similarity Engine
```python
class ContentSimilarityEngine:
    def __init__(self):
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.index = faiss.IndexFlatL2(384)
        
    def find_similar_rejections(self, content, threshold=0.85):
        # Encode new content
        embedding = self.encoder.encode([content])
        
        # Search for similar rejected content
        distances, indices = self.index.search(embedding, k=10)
        
        # Filter by similarity threshold
        similar = [
            {'index': idx, 'similarity': 1 - dist}
            for idx, dist in zip(indices[0], distances[0])
            if 1 - dist >= threshold
        ]
        
        return similar
    
    def learn_from_similar(self, rejections):
        # Extract common rejection reasons
        common_issues = self.extract_common_issues(rejections)
        
        # Generate avoidance strategies
        strategies = self.generate_strategies(common_issues)
        
        return strategies
```

### 8. Performance Tracking

```typescript
interface PerformanceMetrics {
  rejectionRate: {
    overall: number;
    byCategory: Record<RejectionCategory, number>;
    trend: 'improving' | 'stable' | 'declining';
  };
  
  regenerationSuccess: {
    firstAttempt: number;
    secondAttempt: number;
    thirdAttempt: number;
    escalationRate: number;
  };
  
  learningEffectiveness: {
    promptImprovementRate: number;
    patternDetectionAccuracy: number;
    antiPatternAvoidance: number;
  };
  
  feedbackQuality: {
    detailedFeedbackRate: number;
    averageSentiment: number;
    actionabilityScore: number;
  };
}

class PerformanceTracker {
  async calculateMetrics(timeframe: TimeRange): Promise<PerformanceMetrics> {
    const rejections = await this.getRejections(timeframe);
    const regenerations = await this.getRegenerations(timeframe);
    const insights = await this.getInsights(timeframe);
    
    return {
      rejectionRate: this.calculateRejectionMetrics(rejections),
      regenerationSuccess: this.calculateRegenerationMetrics(regenerations),
      learningEffectiveness: this.calculateLearningMetrics(insights),
      feedbackQuality: this.calculateFeedbackMetrics(rejections)
    };
  }
  
  async generateReport(): Promise<PerformanceReport> {
    const metrics = await this.calculateMetrics(last30Days);
    const trends = await this.analyzeTrends();
    const recommendations = await this.generateRecommendations(metrics);
    
    return {
      metrics,
      trends,
      recommendations,
      topPatterns: await this.getTopPatterns(),
      successStories: await this.getSuccessStories()
    };
  }
}
```

### 9. Integration Architecture

```typescript
// Event-driven integration
class RejectionEventProcessor {
  private eventBus: EventEmitter;
  private processors: Map<string, EventProcessor>;
  
  constructor() {
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Rejection received
    this.eventBus.on('rejection.received', async (event) => {
      await Promise.all([
        this.captureContext(event),
        this.analyzeSentiment(event),
        this.checkSimilarRejections(event),
        this.triggerLearning(event)
      ]);
    });
    
    // Pattern detected
    this.eventBus.on('pattern.detected', async (event) => {
      await Promise.all([
        this.updatePrompts(event),
        this.notifyContentStrategist(event),
        this.updateAntiPatterns(event)
      ]);
    });
    
    // Regeneration completed
    this.eventBus.on('regeneration.completed', async (event) => {
      await this.evaluateSuccess(event);
      await this.updateStrategies(event);
    });
  }
}
```

### 10. Escalation & Human-in-the-Loop

```typescript
interface EscalationPath {
  level1: {
    trigger: 'repeated_rejection' | 'critical_compliance';
    action: 'senior_review' | 'compliance_team';
    sla: number; // minutes
  };
  
  level2: {
    trigger: 'pattern_detected' | 'systemic_issue';
    action: 'product_team' | 'engineering_team';
    sla: number; // hours
  };
  
  level3: {
    trigger: 'regulatory_risk' | 'brand_damage';
    action: 'leadership' | 'legal_team';
    sla: number; // hours
  };
}

class EscalationManager {
  async evaluateEscalation(
    rejection: RejectedContent,
    attemptCount: number
  ): Promise<EscalationDecision> {
    // Check escalation triggers
    const triggers = await this.checkTriggers(rejection);
    
    if (triggers.includes('critical_compliance')) {
      return this.escalateToCompliance(rejection);
    }
    
    if (attemptCount >= 3) {
      return this.escalateToHuman(rejection);
    }
    
    if (await this.isSystemicIssue(rejection)) {
      return this.escalateToEngineering(rejection);
    }
    
    return { escalate: false };
  }
}
```

## Implementation Priorities

### Phase 1: Foundation (Week 1-2)
1. Feedback capture UI with dropdown + text
2. Basic database schema and APIs
3. Simple sentiment analysis
4. Rejection storage system

### Phase 2: Pattern Recognition (Week 3-4)
1. Pattern analysis engine
2. Similarity detection
3. Anti-pattern documentation
4. Basic learning pipeline

### Phase 3: Intelligent Regeneration (Week 5-6)
1. Regeneration strategies
2. Multi-attempt workflow
3. Validation system
4. Escalation paths

### Phase 4: Continuous Learning (Week 7-8)
1. Prompt evolution system
2. Performance tracking
3. Automated insights
4. System optimization

## Success Metrics

- **Rejection Rate Reduction**: 30% decrease in 3 months
- **First-Attempt Approval**: 75% success rate
- **Pattern Detection**: 90% accuracy in identifying issues
- **Learning Effectiveness**: 20% improvement in content quality
- **Feedback Quality**: 80% providing detailed feedback
- **System Performance**: <500ms feedback processing