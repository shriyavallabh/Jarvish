# Content Rejection & Regeneration Architecture
## Jarvish Platform - Technical Specifications

### Executive Summary
This document outlines the technical architecture for handling content rejection, automatic regeneration, and continuous improvement through feedback loops in the Jarvish platform. The system is designed to learn from rejection patterns, automatically improve content quality, and maintain SEBI compliance throughout the regeneration cycle.

---

## 1. System Architecture Overview

### Core Components
```
┌─────────────────────────────────────────────────────────────┐
│                    Content Generation Pipeline               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Request    │───▶│   Generate   │───▶│   Validate   │ │
│  │   Handler    │    │    Engine    │    │    Engine    │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Feedback   │◀───│  Rejection   │◀───│   Review     │ │
│  │   Analyzer   │    │   Handler    │    │   Interface  │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Prompt     │───▶│ Regeneration │───▶│   Content    │ │
│  │   Optimizer  │    │    Queue     │    │    Store     │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture
```yaml
Primary Flow:
  1. Content Request → Generation → Validation → Delivery
  
Rejection Flow:
  1. Content Rejection → Feedback Capture → Analysis
  2. Prompt Modification → Regeneration → Re-validation
  3. Learning Loop → System/Asset Prompt Updates

Feedback Integration:
  1. Real-time Feedback → Pattern Recognition
  2. Batch Analysis → Prompt Optimization
  3. A/B Testing → Performance Metrics
```

---

## 2. Rejection Feedback Capture System

### 2.1 Feedback Data Model
```typescript
interface RejectionFeedback {
  id: string;
  contentId: string;
  rejectionType: RejectionType;
  timestamp: Date;
  reviewer: {
    id: string;
    role: 'advisor' | 'compliance' | 'admin';
    expertise: string[];
  };
  feedback: {
    category: FeedbackCategory;
    severity: 'critical' | 'major' | 'minor';
    specificIssues: Issue[];
    suggestions: string;
    complianceViolations?: ComplianceViolation[];
  };
  context: {
    originalPrompt: string;
    systemPrompt: string;
    assetPrompt?: string;
    generationParams: GenerationParams;
    contentType: ContentType;
    targetAudience: string;
  };
  metadata: {
    regenerationAttempts: number;
    previousRejections: string[];
    timeToReject: number; // milliseconds
    reviewDuration: number; // milliseconds
  };
}

enum RejectionType {
  COMPLIANCE_VIOLATION = 'compliance_violation',
  QUALITY_ISSUE = 'quality_issue',
  FACTUAL_ERROR = 'factual_error',
  TONE_MISMATCH = 'tone_mismatch',
  INCOMPLETE_CONTENT = 'incomplete_content',
  FORMATTING_ERROR = 'formatting_error'
}

interface Issue {
  type: string;
  location: {
    paragraph?: number;
    sentence?: number;
    startChar?: number;
    endChar?: number;
  };
  description: string;
  suggestedFix?: string;
  confidence: number; // 0-1
}
```

### 2.2 Feedback Capture API
```typescript
// REST API Endpoints
POST   /api/v1/content/{contentId}/reject
GET    /api/v1/content/{contentId}/rejection-history
POST   /api/v1/feedback/analyze
GET    /api/v1/feedback/patterns

// WebSocket Events for Real-time Updates
ws://api/v1/feedback/stream
  - event: 'content.rejected'
  - event: 'regeneration.started'
  - event: 'regeneration.completed'
  - event: 'pattern.detected'
```

### 2.3 Feedback Storage Architecture
```sql
-- PostgreSQL Schema
CREATE TABLE rejection_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES content(id),
    rejection_type VARCHAR(50) NOT NULL,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewer_role VARCHAR(20) NOT NULL,
    feedback_data JSONB NOT NULL,
    context_data JSONB NOT NULL,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes for performance
    INDEX idx_content_rejection ON rejection_feedback(content_id),
    INDEX idx_rejection_type ON rejection_feedback(rejection_type),
    INDEX idx_created_at ON rejection_feedback(created_at DESC),
    INDEX idx_feedback_category ON rejection_feedback((feedback_data->>'category'))
);

-- Feedback patterns table for ML training
CREATE TABLE feedback_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_type VARCHAR(50) NOT NULL,
    pattern_data JSONB NOT NULL,
    frequency INTEGER DEFAULT 1,
    first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_fixes JSONB DEFAULT '[]'::jsonb,
    success_rate DECIMAL(5,2),
    
    INDEX idx_pattern_type ON feedback_patterns(pattern_type),
    INDEX idx_frequency ON feedback_patterns(frequency DESC)
);
```

---

## 3. Prompt Modification System

### 3.1 Dynamic Prompt Architecture
```typescript
class PromptModificationEngine {
  private systemPromptTemplate: SystemPrompt;
  private assetPromptTemplates: Map<string, AssetPrompt>;
  private feedbackAnalyzer: FeedbackAnalyzer;
  private promptOptimizer: PromptOptimizer;

  async modifyPrompt(
    feedback: RejectionFeedback,
    originalPrompt: string
  ): Promise<ModifiedPrompt> {
    // Analyze feedback to identify issues
    const analysis = await this.feedbackAnalyzer.analyze(feedback);
    
    // Generate modification strategies
    const strategies = this.generateStrategies(analysis);
    
    // Apply modifications based on priority
    let modifiedPrompt = originalPrompt;
    for (const strategy of strategies) {
      modifiedPrompt = await this.applyStrategy(
        modifiedPrompt,
        strategy,
        feedback.context
      );
    }
    
    // Validate modified prompt
    const validation = await this.validatePrompt(modifiedPrompt);
    
    return {
      prompt: modifiedPrompt,
      modifications: strategies,
      confidence: validation.confidence,
      metadata: {
        originalPrompt,
        feedbackId: feedback.id,
        timestamp: new Date()
      }
    };
  }

  private generateStrategies(analysis: FeedbackAnalysis): Strategy[] {
    const strategies: Strategy[] = [];
    
    // Compliance-based modifications
    if (analysis.complianceIssues.length > 0) {
      strategies.push({
        type: 'COMPLIANCE_ENHANCEMENT',
        priority: 1,
        modifications: [
          'Add explicit SEBI compliance instructions',
          'Include disclaimer requirements',
          'Specify prohibited terms/claims'
        ]
      });
    }
    
    // Tone and style modifications
    if (analysis.toneIssues.length > 0) {
      strategies.push({
        type: 'TONE_ADJUSTMENT',
        priority: 2,
        modifications: [
          `Adjust tone to ${analysis.suggestedTone}`,
          'Modify language complexity',
          'Update formatting instructions'
        ]
      });
    }
    
    // Content completeness modifications
    if (analysis.completenessIssues.length > 0) {
      strategies.push({
        type: 'CONTENT_EXPANSION',
        priority: 3,
        modifications: [
          'Add missing sections',
          'Expand on key points',
          'Include specific examples'
        ]
      });
    }
    
    return strategies.sort((a, b) => a.priority - b.priority);
  }
}
```

### 3.2 Prompt Versioning System
```typescript
interface PromptVersion {
  id: string;
  promptType: 'system' | 'asset' | 'hybrid';
  version: string; // Semantic versioning
  content: string;
  parent?: string; // Previous version ID
  modifications: Modification[];
  performance: {
    acceptanceRate: number;
    averageRegenerations: number;
    complianceScore: number;
    userSatisfaction: number;
  };
  metadata: {
    createdAt: Date;
    createdBy: string;
    reason: string;
    testResults?: TestResult[];
  };
}

class PromptVersionManager {
  async createVersion(
    basePrompt: string,
    modifications: Modification[]
  ): Promise<PromptVersion> {
    const newVersion = {
      id: generateId(),
      version: this.incrementVersion(basePrompt),
      content: this.applyModifications(basePrompt, modifications),
      modifications,
      metadata: {
        createdAt: new Date(),
        reason: this.summarizeModifications(modifications)
      }
    };
    
    // Run automated tests
    const testResults = await this.runTests(newVersion);
    newVersion.metadata.testResults = testResults;
    
    // Store version
    await this.store(newVersion);
    
    return newVersion;
  }
  
  async rollback(versionId: string): Promise<void> {
    const version = await this.getVersion(versionId);
    if (version.parent) {
      await this.activateVersion(version.parent);
    }
  }
}
```

---

## 4. Automatic Regeneration System

### 4.1 Regeneration Triggers
```typescript
enum RegenerationTrigger {
  MANUAL_REJECTION = 'manual_rejection',
  COMPLIANCE_FAILURE = 'compliance_failure',
  QUALITY_THRESHOLD = 'quality_threshold',
  SCHEDULED_UPDATE = 'scheduled_update',
  FEEDBACK_THRESHOLD = 'feedback_threshold',
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout'
}

interface RegenerationConfig {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  timeoutMs: number;
  triggers: {
    [key in RegenerationTrigger]: {
      enabled: boolean;
      threshold?: number;
      cooldownMs?: number;
      priority: number;
    };
  };
  fallbackStrategies: FallbackStrategy[];
}

class RegenerationOrchestrator {
  private queue: PriorityQueue<RegenerationTask>;
  private config: RegenerationConfig;
  private rateLimiter: RateLimiter;
  
  async triggerRegeneration(
    contentId: string,
    trigger: RegenerationTrigger,
    feedback?: RejectionFeedback
  ): Promise<RegenerationResult> {
    // Check if regeneration is allowed
    if (!await this.canRegenerate(contentId, trigger)) {
      return this.handleFallback(contentId);
    }
    
    // Create regeneration task
    const task: RegenerationTask = {
      id: generateId(),
      contentId,
      trigger,
      priority: this.config.triggers[trigger].priority,
      feedback,
      attempt: await this.getAttemptCount(contentId) + 1,
      scheduledAt: new Date()
    };
    
    // Add to queue
    await this.queue.enqueue(task);
    
    // Process immediately if high priority
    if (task.priority <= 2) {
      return await this.processTask(task);
    }
    
    return {
      status: 'queued',
      taskId: task.id,
      estimatedTime: this.estimateProcessingTime()
    };
  }
  
  private async processTask(
    task: RegenerationTask
  ): Promise<RegenerationResult> {
    try {
      // Modify prompt based on feedback
      const modifiedPrompt = await this.modifyPrompt(
        task.contentId,
        task.feedback
      );
      
      // Generate new content
      const newContent = await this.generateContent(
        modifiedPrompt,
        task
      );
      
      // Validate new content
      const validation = await this.validateContent(newContent);
      
      if (validation.passed) {
        return {
          status: 'success',
          content: newContent,
          attempt: task.attempt,
          modifications: modifiedPrompt.modifications
        };
      } else {
        // Recursive regeneration with new feedback
        if (task.attempt < this.config.maxAttempts) {
          return await this.triggerRegeneration(
            task.contentId,
            RegenerationTrigger.COMPLIANCE_FAILURE,
            validation.feedback
          );
        } else {
          return this.handleMaxAttemptsReached(task);
        }
      }
    } catch (error) {
      return this.handleRegenerationError(task, error);
    }
  }
}
```

### 4.2 Regeneration Queue Management
```typescript
class RegenerationQueue {
  private redis: Redis;
  private workers: Worker[];
  
  constructor(config: QueueConfig) {
    this.redis = new Redis(config.redis);
    this.workers = this.initializeWorkers(config.workerCount);
  }
  
  async add(task: RegenerationTask): Promise<void> {
    const priority = task.priority;
    const score = Date.now() / priority; // Lower score = higher priority
    
    await this.redis.zadd(
      'regeneration:queue',
      score,
      JSON.stringify(task)
    );
    
    // Notify workers
    await this.redis.publish('regeneration:new_task', task.id);
  }
  
  async process(): Promise<void> {
    while (true) {
      // Get highest priority task
      const tasks = await this.redis.zrange(
        'regeneration:queue',
        0,
        0,
        'WITHSCORES'
      );
      
      if (tasks.length === 0) {
        await this.sleep(1000);
        continue;
      }
      
      const task = JSON.parse(tasks[0]);
      
      // Process task
      try {
        await this.processTask(task);
        
        // Remove from queue
        await this.redis.zrem('regeneration:queue', tasks[0]);
        
        // Update metrics
        await this.updateMetrics(task, 'success');
      } catch (error) {
        await this.handleError(task, error);
      }
    }
  }
}
```

---

## 5. Feedback Loop Integration

### 5.1 Learning Pipeline
```typescript
class FeedbackLearningPipeline {
  private mlModel: ContentQualityModel;
  private patternDetector: PatternDetector;
  private promptEvolver: PromptEvolver;
  
  async processFeedback(
    feedback: RejectionFeedback[]
  ): Promise<LearningOutcome> {
    // Stage 1: Pattern Detection
    const patterns = await this.patternDetector.detect(feedback);
    
    // Stage 2: Feature Extraction
    const features = this.extractFeatures(feedback, patterns);
    
    // Stage 3: Model Training
    const trainingResult = await this.mlModel.train(features);
    
    // Stage 4: Prompt Evolution
    const evolvedPrompts = await this.promptEvolver.evolve(
      patterns,
      trainingResult
    );
    
    // Stage 5: A/B Test Setup
    const tests = await this.setupABTests(evolvedPrompts);
    
    return {
      patternsDetected: patterns.length,
      modelAccuracy: trainingResult.accuracy,
      promptsEvolved: evolvedPrompts.length,
      testsInitiated: tests.length
    };
  }
  
  private extractFeatures(
    feedback: RejectionFeedback[],
    patterns: Pattern[]
  ): FeatureSet {
    return {
      textFeatures: {
        avgLength: this.calculateAvgLength(feedback),
        complexity: this.calculateComplexity(feedback),
        sentimentScores: this.analyzeSentiment(feedback)
      },
      complianceFeatures: {
        violationTypes: this.categorizeViolations(feedback),
        riskScores: this.calculateRiskScores(feedback)
      },
      temporalFeatures: {
        timeOfDay: this.extractTimePatterns(feedback),
        dayOfWeek: this.extractDayPatterns(feedback),
        seasonality: this.detectSeasonality(feedback)
      },
      userFeatures: {
        reviewerExpertise: this.analyzeReviewerPatterns(feedback),
        audienceSegments: this.segmentAudience(feedback)
      }
    };
  }
}
```

### 5.2 Pattern Recognition System
```typescript
class PatternDetector {
  private patterns: Map<string, Pattern>;
  private threshold: number = 0.7;
  
  async detect(
    feedback: RejectionFeedback[]
  ): Promise<Pattern[]> {
    const detectedPatterns: Pattern[] = [];
    
    // Group feedback by rejection type
    const grouped = this.groupByType(feedback);
    
    for (const [type, items] of grouped) {
      // Extract common elements
      const commonElements = this.findCommonElements(items);
      
      // Calculate pattern confidence
      const confidence = commonElements.frequency / items.length;
      
      if (confidence >= this.threshold) {
        detectedPatterns.push({
          id: generateId(),
          type,
          elements: commonElements,
          confidence,
          occurrences: items.length,
          firstSeen: this.getEarliest(items),
          lastSeen: this.getLatest(items),
          suggestedFix: this.generateFix(commonElements)
        });
      }
    }
    
    // Store patterns for future reference
    await this.storePatterns(detectedPatterns);
    
    return detectedPatterns;
  }
  
  private generateFix(elements: CommonElements): Fix {
    const fixes: Fix[] = [];
    
    // Analyze rejection reasons
    if (elements.complianceIssues?.length > 0) {
      fixes.push({
        type: 'PROMPT_MODIFICATION',
        action: 'Add compliance constraints',
        details: elements.complianceIssues.map(issue => ({
          constraint: this.mapIssueToConstraint(issue),
          priority: issue.severity === 'critical' ? 1 : 2
        }))
      });
    }
    
    if (elements.qualityIssues?.length > 0) {
      fixes.push({
        type: 'QUALITY_ENHANCEMENT',
        action: 'Improve content quality',
        details: elements.qualityIssues.map(issue => ({
          improvement: this.mapIssueToImprovement(issue),
          priority: 3
        }))
      });
    }
    
    return this.prioritizeFixes(fixes);
  }
}
```

---

## 6. System vs Asset Prompt Architecture

### 6.1 Prompt Hierarchy
```typescript
interface PromptArchitecture {
  systemPrompt: {
    role: 'foundation';
    scope: 'global';
    components: [
      'compliance_rules',
      'tone_guidelines',
      'format_standards',
      'quality_criteria'
    ];
    updateFrequency: 'weekly';
    version: string;
  };
  
  assetPrompts: {
    role: 'specialization';
    scope: 'content_type_specific';
    types: {
      market_update: AssetPromptConfig;
      educational_content: AssetPromptConfig;
      investment_insight: AssetPromptConfig;
      regulatory_update: AssetPromptConfig;
    };
    updateFrequency: 'on_feedback';
    inheritance: 'extends_system_prompt';
  };
  
  combinationStrategy: {
    method: 'hierarchical_merge';
    precedence: ['asset_prompt', 'system_prompt'];
    conflictResolution: 'asset_overrides_system';
  };
}

class PromptManager {
  private systemPrompt: SystemPrompt;
  private assetPrompts: Map<ContentType, AssetPrompt>;
  
  async constructPrompt(
    contentType: ContentType,
    context: GenerationContext
  ): Promise<string> {
    // Get base system prompt
    const system = await this.getSystemPrompt();
    
    // Get asset-specific prompt
    const asset = await this.getAssetPrompt(contentType);
    
    // Merge prompts based on strategy
    const merged = this.mergePrompts(system, asset, context);
    
    // Add dynamic context
    const contextualized = this.addContext(merged, context);
    
    // Add feedback-based modifications
    const optimized = await this.applyOptimizations(
      contextualized,
      contentType
    );
    
    return optimized;
  }
  
  private mergePrompts(
    system: SystemPrompt,
    asset: AssetPrompt,
    context: GenerationContext
  ): string {
    return `
      # System Instructions
      ${system.content}
      
      # Asset-Specific Instructions
      ${asset.content}
      
      # Context-Specific Requirements
      - Target Audience: ${context.audience}
      - Compliance Level: ${context.complianceLevel}
      - Tone: ${context.tone}
      - Length: ${context.lengthRequirements}
      
      # Learned Optimizations
      ${this.getLearnedOptimizations(context.contentType)}
    `;
  }
  
  async updateFromFeedback(
    feedback: RejectionFeedback[],
    promptType: 'system' | 'asset'
  ): Promise<void> {
    // Analyze feedback patterns
    const patterns = await this.analyzePatterns(feedback);
    
    // Generate prompt modifications
    const modifications = this.generateModifications(patterns);
    
    // Apply to appropriate prompt level
    if (promptType === 'system') {
      await this.updateSystemPrompt(modifications);
    } else {
      await this.updateAssetPrompts(modifications, feedback);
    }
    
    // Version and store
    await this.versionPrompts();
  }
}
```

### 6.2 Prompt Optimization Strategy
```sql
-- Prompt performance tracking
CREATE TABLE prompt_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_type VARCHAR(20) NOT NULL,
    prompt_version VARCHAR(20) NOT NULL,
    content_type VARCHAR(50),
    acceptance_rate DECIMAL(5,2),
    avg_regenerations DECIMAL(5,2),
    compliance_score DECIMAL(5,2),
    user_satisfaction DECIMAL(5,2),
    total_uses INTEGER DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    INDEX idx_prompt_version ON prompt_performance(prompt_version),
    INDEX idx_performance_period ON prompt_performance(period_start, period_end)
);

-- A/B test results
CREATE TABLE ab_test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id VARCHAR(100) NOT NULL,
    variant_a_prompt TEXT NOT NULL,
    variant_b_prompt TEXT NOT NULL,
    variant_a_metrics JSONB NOT NULL,
    variant_b_metrics JSONB NOT NULL,
    winner VARCHAR(1),
    confidence_level DECIMAL(5,2),
    sample_size INTEGER,
    test_duration_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    INDEX idx_test_id ON ab_test_results(test_id),
    INDEX idx_completed ON ab_test_results(completed_at)
);
```

---

## 7. Real-time Content Generation Pipeline

### 7.1 Pipeline Architecture
```typescript
class ContentGenerationPipeline {
  private stages: PipelineStage[];
  private monitor: PipelineMonitor;
  private cache: ContentCache;
  
  async generate(request: GenerationRequest): Promise<Content> {
    const pipelineExecution = {
      id: generateId(),
      startTime: Date.now(),
      request,
      stages: []
    };
    
    try {
      // Stage 1: Request Validation
      const validated = await this.validateRequest(request);
      pipelineExecution.stages.push({
        name: 'validation',
        duration: Date.now() - pipelineExecution.startTime
      });
      
      // Stage 2: Cache Check
      const cached = await this.cache.get(request);
      if (cached && !request.forceRegenerate) {
        return cached;
      }
      
      // Stage 3: Prompt Construction
      const prompt = await this.constructPrompt(request);
      
      // Stage 4: AI Generation
      const generated = await this.generateWithAI(prompt, request);
      
      // Stage 5: Compliance Check
      const compliant = await this.checkCompliance(generated);
      
      // Stage 6: Quality Assessment
      const quality = await this.assessQuality(compliant);
      
      // Stage 7: Post-processing
      const processed = await this.postProcess(quality);
      
      // Stage 8: Caching
      await this.cache.set(request, processed);
      
      // Record metrics
      await this.monitor.record(pipelineExecution);
      
      return processed;
      
    } catch (error) {
      // Handle pipeline failure
      return await this.handlePipelineFailure(
        error,
        pipelineExecution
      );
    }
  }
  
  private async generateWithAI(
    prompt: string,
    request: GenerationRequest
  ): Promise<GeneratedContent> {
    const config = {
      model: request.priority === 'high' ? 'gpt-4' : 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: request.maxLength || 1000,
      timeout: 5000, // 5 seconds
      retries: 3
    };
    
    // Implement circuit breaker pattern
    if (await this.circuitBreaker.isOpen()) {
      throw new Error('AI service temporarily unavailable');
    }
    
    try {
      const response = await this.aiService.generate(prompt, config);
      
      // Reset circuit breaker on success
      await this.circuitBreaker.recordSuccess();
      
      return response;
    } catch (error) {
      // Record failure for circuit breaker
      await this.circuitBreaker.recordFailure();
      throw error;
    }
  }
}
```

### 7.2 Stream Processing for Real-time Updates
```typescript
class StreamProcessor {
  private kafka: KafkaClient;
  private websocket: WebSocketServer;
  
  async initializeStreams(): Promise<void> {
    // Kafka topics for event streaming
    await this.kafka.createTopics([
      'content.generation.requested',
      'content.generation.completed',
      'content.rejection.received',
      'content.regeneration.triggered',
      'feedback.pattern.detected'
    ]);
    
    // WebSocket channels for real-time updates
    this.websocket.on('connection', (ws) => {
      ws.on('subscribe', (channel) => {
        this.subscribeToChannel(ws, channel);
      });
    });
  }
  
  async processGenerationStream(
    event: GenerationEvent
  ): Promise<void> {
    // Publish to Kafka for durability
    await this.kafka.publish(
      'content.generation.requested',
      event
    );
    
    // Notify WebSocket subscribers for real-time updates
    this.websocket.broadcast('generation', {
      id: event.id,
      status: 'processing',
      estimatedTime: this.estimateTime(event)
    });
    
    // Process in background
    this.processInBackground(event);
  }
  
  private async processInBackground(
    event: GenerationEvent
  ): Promise<void> {
    const updates = new Subject<StatusUpdate>();
    
    // Subscribe to updates
    updates.subscribe((update) => {
      this.websocket.broadcast('generation', update);
    });
    
    try {
      // Generate content with progress updates
      const content = await this.generateWithProgress(
        event,
        updates
      );
      
      // Publish completion
      await this.kafka.publish(
        'content.generation.completed',
        { ...event, content, status: 'completed' }
      );
      
      updates.next({
        id: event.id,
        status: 'completed',
        content
      });
    } catch (error) {
      updates.next({
        id: event.id,
        status: 'failed',
        error: error.message
      });
    }
  }
}
```

---

## 8. Fallback Content Strategies

### 8.1 Fallback Hierarchy
```typescript
enum FallbackStrategy {
  CACHED_SIMILAR = 'cached_similar',      // Use similar approved content
  TEMPLATE_BASED = 'template_based',      // Use pre-approved templates
  MANUAL_QUEUE = 'manual_queue',          // Queue for manual creation
  SIMPLIFIED_REGEN = 'simplified_regen',  // Regenerate with simpler prompt
  EXTERNAL_API = 'external_api',          // Use external content API
  DEFAULT_CONTENT = 'default_content'     // Use generic default
}

class FallbackManager {
  private strategies: Map<FallbackStrategy, FallbackHandler>;
  private config: FallbackConfig;
  
  async executeFallback(
    contentRequest: ContentRequest,
    failureReason: FailureReason
  ): Promise<FallbackResult> {
    const applicableStrategies = this.getApplicableStrategies(
      contentRequest,
      failureReason
    );
    
    for (const strategy of applicableStrategies) {
      try {
        const handler = this.strategies.get(strategy);
        const result = await handler.execute(contentRequest);
        
        if (result.success) {
          // Log fallback usage
          await this.logFallbackUsage(strategy, contentRequest);
          
          return {
            content: result.content,
            strategy,
            isFullback: true,
            metadata: {
              originalRequest: contentRequest,
              failureReason,
              fallbackTime: Date.now()
            }
          };
        }
      } catch (error) {
        console.error(`Fallback ${strategy} failed:`, error);
        continue;
      }
    }
    
    // All fallbacks failed
    throw new Error('All fallback strategies exhausted');
  }
  
  private getApplicableStrategies(
    request: ContentRequest,
    reason: FailureReason
  ): FallbackStrategy[] {
    const strategies: FallbackStrategy[] = [];
    
    // Timeout or API failures - try cache first
    if (reason.type === 'timeout' || reason.type === 'api_error') {
      strategies.push(FallbackStrategy.CACHED_SIMILAR);
      strategies.push(FallbackStrategy.TEMPLATE_BASED);
    }
    
    // Compliance failures - use pre-approved content
    if (reason.type === 'compliance_failure') {
      strategies.push(FallbackStrategy.TEMPLATE_BASED);
      strategies.push(FallbackStrategy.MANUAL_QUEUE);
    }
    
    // Quality issues - try simplified regeneration
    if (reason.type === 'quality_failure') {
      strategies.push(FallbackStrategy.SIMPLIFIED_REGEN);
      strategies.push(FallbackStrategy.CACHED_SIMILAR);
    }
    
    // Always add default as last resort
    strategies.push(FallbackStrategy.DEFAULT_CONTENT);
    
    return strategies;
  }
}
```

### 8.2 Template-based Fallback System
```typescript
interface ContentTemplate {
  id: string;
  type: ContentType;
  category: string;
  template: string;
  variables: Variable[];
  complianceApproved: boolean;
  approvalDate: Date;
  expiryDate: Date;
  usage: {
    count: number;
    lastUsed: Date;
    effectiveness: number;
  };
}

class TemplateManager {
  private templates: Map<string, ContentTemplate>;
  private compiler: TemplateCompiler;
  
  async getTemplate(
    contentType: ContentType,
    context: GenerationContext
  ): Promise<CompiledTemplate> {
    // Find best matching template
    const template = this.findBestTemplate(contentType, context);
    
    if (!template) {
      throw new Error('No suitable template found');
    }
    
    // Check if template is still valid
    if (template.expiryDate < new Date()) {
      await this.refreshTemplate(template);
    }
    
    // Compile template with context
    const compiled = await this.compiler.compile(template, context);
    
    // Validate compiled content
    const validation = await this.validateCompiledContent(compiled);
    
    if (!validation.passed) {
      // Try next best template
      return this.getTemplate(contentType, {
        ...context,
        excludeTemplates: [template.id]
      });
    }
    
    return compiled;
  }
  
  private findBestTemplate(
    type: ContentType,
    context: GenerationContext
  ): ContentTemplate | null {
    const candidates = Array.from(this.templates.values())
      .filter(t => 
        t.type === type &&
        t.complianceApproved &&
        !context.excludeTemplates?.includes(t.id)
      )
      .sort((a, b) => {
        // Sort by effectiveness and recency
        const scoreA = a.usage.effectiveness * 0.7 + 
                      (1 / (Date.now() - a.usage.lastUsed.getTime())) * 0.3;
        const scoreB = b.usage.effectiveness * 0.7 + 
                      (1 / (Date.now() - b.usage.lastUsed.getTime())) * 0.3;
        return scoreB - scoreA;
      });
    
    return candidates[0] || null;
  }
}
```

---

## 9. A/B Testing Framework

### 9.1 Test Configuration and Management
```typescript
interface ABTest {
  id: string;
  name: string;
  type: 'prompt' | 'content' | 'strategy';
  status: 'draft' | 'running' | 'completed' | 'aborted';
  variants: {
    control: Variant;
    treatment: Variant[];
  };
  allocation: {
    method: 'random' | 'weighted' | 'sequential';
    weights?: number[];
    segmentation?: SegmentationRule[];
  };
  metrics: {
    primary: Metric;
    secondary: Metric[];
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    minSampleSize: number;
    maxDuration: number; // hours
  };
  results?: TestResults;
}

class ABTestManager {
  private tests: Map<string, ABTest>;
  private allocator: TrafficAllocator;
  private analyzer: StatisticalAnalyzer;
  
  async createTest(config: ABTestConfig): Promise<ABTest> {
    const test: ABTest = {
      id: generateId(),
      name: config.name,
      type: config.type,
      status: 'draft',
      variants: this.setupVariants(config),
      allocation: config.allocation,
      metrics: config.metrics,
      schedule: config.schedule
    };
    
    // Validate test configuration
    await this.validateTest(test);
    
    // Schedule test start
    if (config.autoStart) {
      await this.scheduleTest(test);
    }
    
    // Store test
    this.tests.set(test.id, test);
    
    return test;
  }
  
  async allocateVariant(
    testId: string,
    context: AllocationContext
  ): Promise<Variant> {
    const test = this.tests.get(testId);
    
    if (!test || test.status !== 'running') {
      return null; // Return control/default
    }
    
    // Check if user already allocated
    const existing = await this.getAllocation(context.userId, testId);
    if (existing) {
      return existing;
    }
    
    // Allocate based on strategy
    const variant = await this.allocator.allocate(test, context);
    
    // Record allocation
    await this.recordAllocation(testId, context.userId, variant);
    
    return variant;
  }
  
  async analyzeResults(testId: string): Promise<TestAnalysis> {
    const test = this.tests.get(testId);
    const data = await this.collectTestData(testId);
    
    // Calculate statistical significance
    const significance = await this.analyzer.calculateSignificance(
      data.control,
      data.treatment,
      test.metrics.primary
    );
    
    // Perform segmentation analysis
    const segments = await this.analyzer.analyzeSegments(
      data,
      test.allocation.segmentation
    );
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(
      significance,
      segments
    );
    
    return {
      testId,
      significance,
      segments,
      recommendations,
      confidence: significance.confidenceLevel,
      winner: significance.pValue < 0.05 ? 
              significance.winner : 
              'inconclusive'
    };
  }
}
```

### 9.2 Metrics Collection and Analysis
```typescript
interface MetricsCollector {
  async collectMetrics(
    testId: string,
    variant: Variant,
    event: Event
  ): Promise<void> {
    const metrics = {
      timestamp: Date.now(),
      testId,
      variantId: variant.id,
      userId: event.userId,
      eventType: event.type,
      metadata: event.metadata
    };
    
    // Real-time metrics
    await this.redis.zadd(
      `test:${testId}:metrics`,
      Date.now(),
      JSON.stringify(metrics)
    );
    
    // Batch processing queue
    await this.kafka.publish('ab_test_metrics', metrics);
    
    // Update running statistics
    await this.updateStatistics(testId, variant.id, event);
  }
  
  private async updateStatistics(
    testId: string,
    variantId: string,
    event: Event
  ): Promise<void> {
    const key = `test:${testId}:stats:${variantId}`;
    
    // Increment counters
    await this.redis.hincrby(key, 'total_events', 1);
    await this.redis.hincrby(key, event.type, 1);
    
    // Update conversion metrics
    if (event.type === 'conversion') {
      await this.redis.hincrby(key, 'conversions', 1);
      
      // Calculate running conversion rate
      const total = await this.redis.hget(key, 'total_events');
      const conversions = await this.redis.hget(key, 'conversions');
      const rate = conversions / total;
      
      await this.redis.hset(key, 'conversion_rate', rate);
    }
    
    // Update quality metrics
    if (event.type === 'quality_score') {
      await this.updateRunningAverage(
        key,
        'quality_score',
        event.metadata.score
      );
    }
  }
}

class StatisticalAnalyzer {
  async calculateSignificance(
    control: VariantData,
    treatment: VariantData,
    metric: Metric
  ): Promise<SignificanceResult> {
    // Calculate sample sizes
    const n1 = control.sampleSize;
    const n2 = treatment.sampleSize;
    
    // Calculate conversion rates
    const p1 = control.conversions / n1;
    const p2 = treatment.conversions / n2;
    
    // Pooled proportion
    const p = (control.conversions + treatment.conversions) / (n1 + n2);
    
    // Standard error
    const se = Math.sqrt(p * (1 - p) * (1/n1 + 1/n2));
    
    // Z-score
    const z = (p2 - p1) / se;
    
    // P-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));
    
    // Confidence interval
    const ci = this.calculateConfidenceInterval(p1, p2, se);
    
    // Effect size (Cohen's h)
    const effectSize = 2 * (Math.asin(Math.sqrt(p2)) - 
                           Math.asin(Math.sqrt(p1)));
    
    return {
      control: { rate: p1, count: control.conversions },
      treatment: { rate: p2, count: treatment.conversions },
      difference: p2 - p1,
      relativeDifference: (p2 - p1) / p1,
      pValue,
      zScore: z,
      confidenceInterval: ci,
      effectSize,
      significant: pValue < 0.05,
      winner: p2 > p1 ? 'treatment' : 'control',
      confidenceLevel: 1 - pValue
    };
  }
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- Set up database schema for feedback and patterns
- Implement basic rejection feedback capture API
- Create regeneration queue infrastructure
- Deploy Redis for caching and queue management

### Phase 2: Core Pipeline (Week 3-4)
- Build prompt modification engine
- Implement automatic regeneration triggers
- Create fallback content strategies
- Set up real-time generation pipeline

### Phase 3: Learning Integration (Week 5-6)
- Deploy pattern detection system
- Implement feedback learning pipeline
- Create prompt evolution mechanism
- Build A/B testing framework

### Phase 4: Optimization (Week 7-8)
- Performance tuning and caching optimization
- Implement advanced fallback strategies
- Deploy monitoring and analytics
- Load testing and scalability improvements

---

## 11. Monitoring and Analytics

### 11.1 Key Performance Indicators
```yaml
Content Quality Metrics:
  - Acceptance Rate: >85% target
  - Average Regenerations: <1.5 per content
  - Time to Approval: <2 minutes
  - Compliance Score: >95%

System Performance:
  - Generation Latency: <1.5 seconds p95
  - Regeneration Success Rate: >90%
  - Fallback Usage: <5% of requests
  - Cache Hit Rate: >60%

Learning Effectiveness:
  - Pattern Detection Accuracy: >80%
  - Prompt Evolution Success: >70% improvement
  - A/B Test Completion Rate: >90%
  - Feedback Processing Time: <500ms
```

### 11.2 Monitoring Dashboard
```typescript
interface DashboardMetrics {
  realTime: {
    activeRegenerations: number;
    queueDepth: number;
    averageLatency: number;
    errorRate: number;
  };
  
  daily: {
    totalGenerated: number;
    totalRejected: number;
    acceptanceRate: number;
    topRejectionReasons: RejectionReason[];
  };
  
  learning: {
    patternsDetected: number;
    promptsEvolved: number;
    activeABTests: number;
    improvementRate: number;
  };
}
```

---

## 12. Security and Compliance

### 12.1 Data Protection
- Encryption at rest for all feedback data
- PII masking in feedback logs
- Audit trail for all content modifications
- Role-based access control for prompt modifications

### 12.2 Compliance Integration
- SEBI validation at every regeneration
- Immutable audit logs for all decisions
- Compliance score tracking for all variants
- Automated regulatory reporting

---

## Conclusion

This architecture provides a robust, learning-based system for content rejection and regeneration that:
1. Captures and learns from rejection feedback
2. Automatically improves content quality over time
3. Maintains high performance and reliability
4. Ensures continuous compliance with regulations
5. Provides measurable improvement through A/B testing

The system is designed to scale with the platform's growth while maintaining sub-2-second response times and 99% delivery SLA.