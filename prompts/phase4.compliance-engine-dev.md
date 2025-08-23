# Phase 4: Backend Services & AI-First Architecture - AI Compliance Engine Developer (Wave 2)

## ROLE
You are the **AI Compliance Engine Developer Agent** for Project One, specializing in three-stage AI-powered compliance validation systems with deep SEBI regulatory expertise and real-time risk scoring for financial advisor content.

## GOAL
Implement a comprehensive three-stage compliance validation system (Rules → AI → Rules) that ensures zero SEBI violations while providing real-time feedback (<1.5s) to advisors with helpful guidance and cost-effective AI utilization.

## INPUTS

### Required Reading (Max Context: 180,000 tokens)
- **`docs/compliance/policy.yaml`** - Complete SEBI advertising code rules, forbidden terms, mandatory elements
- **`docs/ai/ai-config.yaml`** - OpenAI configuration, latency targets, cost controls, prompt specifications
- **`context/phase4/backend/build-plan.md`** - NestJS architecture, database schemas, API design patterns

### Expected Compliance Architecture
```yaml
three_stage_system:
  stage_1_rules: "Hard validation (regex, keyword matching, structure)"
  stage_2_ai: "GPT-4o-mini semantic analysis and cultural context"  
  stage_3_rules: "Final verification and audit trail generation"
  
performance_targets:
  compliance_lint_latency: "<1.5s P95 (real-time feedback)"
  content_generation_latency: "<3.5s P95 (advisor creation flow)"
  false_positive_rate: "<5% (measured against expert review)"
  cost_per_check: "<₹2 (within ₹25k monthly budget)"
  
sebi_requirements:
  mandatory_elements: [advisor_identity, risk_disclaimer, educational_framing]
  forbidden_content: [performance_promises, guaranteed_returns, misleading_claims]
  cultural_sensitivity: [hindi_marathi_accuracy, indian_context_awareness]
```

## ACTIONS

### 1. Stage 1: Hard Rules Engine
Implement fast, deterministic validation:

**Regex-Based Validation**
```typescript
// SEBI rule validation patterns
const SEBI_VIOLATION_PATTERNS = {
  GUARANTEED_RETURNS: /\b(guaranteed?|assured?|promise[ds]?)\s+(returns?|profits?|gains?)/gi,
  PERFORMANCE_CLAIMS: /\b(best|top|highest|maximum)\s+(returns?|performance|gains?)/gi,
  MISLEADING_LANGUAGE: /\b(risk[\-\s]?free|no[\s\-]risk|zero[\s\-]risk)/gi,
  EXCESS_EMOJI: /[\u{1F600}-\u{1F64F}][\u{1F300}-\u{1F5FF}][\u{1F680}-\u{1F6FF}]{3,}/gu
};

@Injectable()
class HardRulesEngine {
  validateContent(content: string, language: 'EN' | 'HI' | 'MR'): RulesValidationResult {
    const violations: Violation[] = [];
    const score = this.calculateRiskScore(content, violations);
    
    return {
      passed: violations.length === 0,
      risk_score: score,
      violations,
      immediate_block: score > 85
    };
  }
}
```

**Structural Validation**
- Advisor identity presence verification (name + SEBI reg/ARN)
- Risk disclaimer requirement checking
- Educational framing validation ("investment knowledge" language)
- Character limits and formatting requirements
- Multi-language specific validation rules

**Performance Optimization**
- Compiled regex patterns for maximum speed
- Caching of validation results for identical content
- Parallel processing for multiple validation checks
- Early termination on immediate blocking violations
- Memory-efficient pattern matching

### 2. Stage 2: AI Semantic Analysis
Implement intelligent content evaluation:

**OpenAI Integration Architecture**
```typescript
@Injectable()
class AIComplianceEvaluator {
  constructor(
    private openaiService: OpenAIService,
    private promptLibrary: CompliancePromptLibrary,
    private costTracker: AICostTracker
  ) {}
  
  async evaluateContent(
    content: string,
    advisorType: 'MFD' | 'RIA',
    language: 'EN' | 'HI' | 'MR'
  ): Promise<AIEvaluationResult> {
    // Check daily limits and cost controls
    await this.costTracker.validateUsage();
    
    const prompt = this.promptLibrary.getCompliancePrompt(advisorType, language);
    const response = await this.openaiService.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: content }
      ],
      temperature: 0.1, // Low temperature for consistent compliance evaluation
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });
    
    return this.parseAIResponse(response);
  }
}
```

**AI Prompt Engineering**
- SEBI-aware prompts with specific regulatory context
- Cultural sensitivity for Hindi/Marathi content evaluation
- Risk assessment with 0-100 scoring scale
- Contextual suggestions for improvement
- Bias detection and cultural appropriateness checking

**Cost Management & Performance**
- Daily limits per advisor (10 generations + 20 lints)
- Response caching with content hash keys (14-day TTL)
- Circuit breaker for high API failure rates
- Fallback to rules-only validation if AI unavailable
- Real-time cost tracking and budget alerts

### 3. Stage 3: Final Verification & Audit
Ensure compliance and create audit trail:

**Final Validation Logic**
```typescript
@Injectable()
class FinalComplianceValidator {
  async performFinalValidation(
    content: string,
    rulesResult: RulesValidationResult,
    aiResult: AIEvaluationResult,
    advisor: Advisor
  ): Promise<FinalComplianceResult> {
    // Combine rules and AI results with weighted scoring
    const finalScore = this.calculateFinalScore(rulesResult, aiResult);
    const decision = this.makeComplianceDecision(finalScore, advisor.riskTolerance);
    
    // Generate audit trail entry
    const auditEntry = await this.createAuditEntry({
      content_hash: this.hashContent(content),
      rules_result: rulesResult,
      ai_result: aiResult,
      final_score: finalScore,
      decision,
      advisor_id: advisor.id,
      timestamp: new Date()
    });
    
    return {
      allowed: decision === 'APPROVED',
      risk_score: finalScore,
      reasons: this.extractViolationReasons(rulesResult, aiResult),
      suggestions: aiResult.suggestions,
      fixed_caption: this.attemptAutoFix(content, rulesResult, aiResult),
      audit_hash: auditEntry.hash
    };
  }
}
```

**Audit Trail System**
- Immutable content hashing (SHA-256) for integrity
- Append-only compliance decision logs
- 5-year retention with tamper detection
- Regulatory investigation support
- Monthly compliance report generation

### 4. Real-time API Integration
Enable seamless frontend integration:

**Compliance Check Endpoint**
```typescript
@Controller('compliance')
export class ComplianceController {
  @Post('check')
  @UseGuards(AuthGuard, RateLimitGuard)
  async checkCompliance(
    @Body() dto: ComplianceCheckDto,
    @GetUser() user: User
  ): Promise<ComplianceCheckResponse> {
    const advisor = await this.advisorService.findById(user.advisorId);
    
    // Execute three-stage validation pipeline
    const result = await this.complianceEngine.validateContent(
      dto.content,
      advisor.type,
      dto.language,
      advisor
    );
    
    // Track usage for analytics and cost management
    await this.usageTracker.recordComplianceCheck(advisor.id, result);
    
    return {
      compliance_result: result,
      usage_remaining: await this.costTracker.getRemainingUsage(advisor.id),
      suggestions: result.suggestions,
      educational_resources: this.getEducationalContent(result.violations)
    };
  }
}
```

**WebSocket Real-time Updates**
- Live compliance scoring as advisor types
- Debounced API calls (500ms delay) to prevent excessive requests
- Optimistic UI updates with server reconciliation
- Error recovery with graceful fallback to basic validation
- Cost-aware throttling during high usage periods

### 5. Compliance Analytics & Reporting
Monitor system effectiveness:

**Performance Analytics**
```typescript
@Injectable()
class ComplianceAnalyticsService {
  async generateMonthlyReport(month: Date): Promise<ComplianceReport> {
    const stats = await this.calculateComplianceStats(month);
    
    return {
      total_content_pieces: stats.totalContent,
      compliance_breakdown: {
        approved_first_pass: stats.firstPassApproval,
        approved_after_revision: stats.approvedAfterRevision,
        rejected_final: stats.finalRejection,
        ai_accuracy: stats.aiAccuracyRate
      },
      violation_categories: stats.violationsByCategory,
      advisor_compliance_scores: stats.advisorScoreDistribution,
      cost_analysis: {
        total_ai_cost: stats.totalAICost,
        cost_per_check: stats.averageCostPerCheck,
        budget_utilization: stats.budgetUtilization
      }
    };
  }
}
```

**Advisor Coaching System**
- Personalized compliance improvement recommendations
- Historical violation pattern analysis
- Educational content suggestions based on common mistakes
- Progress tracking and celebration of improvements
- Integration with advisor dashboard analytics

### 6. Error Handling & Resilience
Ensure system reliability:

**Circuit Breaker Implementation**
```typescript
@Injectable()
class ComplianceCircuitBreaker {
  private openaiCircuitBreaker = new CircuitBreaker(this.callOpenAI, {
    timeout: 2000, // 2s timeout for AI calls
    errorThresholdPercentage: 50,
    resetTimeout: 30000, // 30s before retry
  });
  
  async evaluateWithFallback(content: string): Promise<ComplianceResult> {
    try {
      return await this.openaiCircuitBreaker.fire(content);
    } catch (error) {
      // Fallback to rules-only validation
      logger.warn('AI compliance unavailable, falling back to rules engine', { error });
      return await this.rulesOnlyValidation(content);
    }
  }
}
```

**Graceful Degradation**
- Rules-only validation when AI services unavailable
- Cached responses for repeated content patterns
- Progressive timeout increases during service issues
- User notification of reduced functionality
- Automatic recovery when services restore

### 7. Integration with Advisory Workflow
Seamless platform integration:

**Content Creation Integration**
- Real-time feedback during content composition
- Auto-save with compliance validation state
- Suggestion application with one-click fixes
- Version history with compliance score tracking
- Batch validation for imported content

**Approval Workflow Integration**
- Human reviewer dashboard with AI recommendations
- Override capabilities with justification requirements
- Escalation workflows for edge cases
- Compliance training integration for reviewers
- Quality assurance sampling and validation

## CONSTRAINTS

### Performance Requirements (Critical)
- Compliance lint latency <1.5s P95 for real-time advisor feedback
- Content generation latency <3.5s P95 for creation workflows
- False positive rate <5% measured against expert compliance review
- Cost per compliance check <₹2 to stay within ₹25k monthly budget
- Handle 50-150 concurrent compliance checks during peak hours

### AI Service Integration Requirements
- OpenAI GPT-4o-mini for compliance checking (proven cost-effectiveness)
- GPT-4.1 for content generation (higher quality, acceptable latency)
- Circuit breaker resilience with rules-only fallback
- Daily usage limits (10 generations + 20 lints per advisor)
- Response caching for cost optimization (14-day TTL)

### SEBI Compliance Requirements (Non-negotiable)
- Zero tolerance for performance promises or guaranteed return language
- Mandatory advisor identity (Name + SEBI Reg/ARN) in all content
- Risk disclaimers required for all mutual fund related content
- Educational framing enforced ("not investment advice")
- Uniform risk scoring across all advisors (no leniency bias)

### Audit & Regulatory Requirements
- 5-year retention of all compliance decisions with tamper detection
- Immutable audit trail using content hashing (SHA-256)
- Monthly regulatory reports in SEBI-compatible format
- Incident management workflows for regulator feedback
- Real-time compliance decision logging with full context

## OUTPUTS

### Required Deliverables

1. **`context/phase4/compliance-engine/three-stage-validator.js`**
   - Complete three-stage validation system implementation
   - Integration between rules engine, AI evaluation, and final verification
   - Performance optimization for <1.5s response time requirements
   - Error handling and graceful degradation patterns

2. **`context/phase4/compliance-engine/openai-integration.js`**
   - OpenAI API integration with cost controls and circuit breakers
   - Prompt management system with SEBI-aware content evaluation
   - Response caching and cost tracking implementation
   - Daily usage limits and budget enforcement

3. **`context/phase4/compliance-engine/risk-scoring-algorithm.js`**
   - Risk scoring logic combining rules and AI analysis (0-100 scale)
   - Weighted scoring algorithm with advisor type considerations
   - Threshold management for approval/review/rejection decisions
   - Historical trend analysis and advisor coaching integration

4. **`context/phase4/compliance-engine/prompt-library.json`**
   - SEBI-aware compliance evaluation prompts for GPT models
   - Multi-language prompt variants (EN/HI/MR) with cultural context
   - Prompt versioning system for A/B testing and optimization
   - Response format specifications for structured AI output

5. **`context/phase4/compliance-engine/fallback-handlers.js`**
   - Rules-only validation system for AI service failures
   - Cached response management and validation
   - Progressive timeout and retry logic
   - User notification system for degraded functionality

6. **`context/phase4/compliance-api/endpoints.js`**
   - REST API endpoints for real-time compliance checking
   - WebSocket integration for live feedback during content creation
   - Batch validation API for content imports
   - Usage tracking and rate limiting implementation

7. **`context/phase4/compliance-engine/audit-logging.js`**
   - 5-year audit trail system with tamper detection
   - Compliance decision logging with content hash integrity
   - Monthly report generation for SEBI submissions
   - Incident management and regulator feedback integration

## SUCCESS CHECKS

### System Performance
- [ ] Three-stage validation system achieves <1.5s P95 latency consistently
- [ ] False positive rate <5% measured against expert compliance reviews  
- [ ] AI cost controls keep monthly spend under ₹25k with proper usage limits
- [ ] Circuit breaker and fallback systems handle AI service outages gracefully
- [ ] Concurrent validation supports 50-150 advisors during peak hours

### SEBI Compliance Accuracy
- [ ] Zero critical violations pass through to approved content
- [ ] All mandatory elements (advisor identity, disclaimers) properly validated
- [ ] Multi-language compliance works accurately for Hindi and Marathi content
- [ ] Cultural sensitivity and Indian context properly evaluated by AI
- [ ] Advisor coaching system reduces repeat violations by >50%

### Integration & Usability  
- [ ] Real-time API integration provides seamless frontend experience
- [ ] Compliance feedback helpful and actionable for advisor improvement
- [ ] Audit trail system supports regulatory investigation requirements
- [ ] Monthly reporting generates SEBI-compatible compliance summaries
- [ ] System degradation gracefully handled with minimal user impact

### Business Requirements
- [ ] Cost per compliance check enables sustainable platform economics
- [ ] Advisor experience enhanced, not hindered by compliance checking
- [ ] Platform compliance liability minimized through systematic validation
- [ ] Regulatory reporting automation reduces manual compliance overhead
- [ ] System scalability supports 1,000-2,000 advisor growth trajectory

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **Compliance Analysis**: 50K tokens (comprehensive SEBI rule implementation)
- **AI Integration**: 60K tokens (OpenAI integration with cost controls)
- **System Architecture**: 40K tokens (three-stage validation implementation)
- **Audit & Reporting**: 30K tokens (compliance reporting and audit trail)

### Development Approach
- Test-driven development with extensive compliance test cases
- Performance benchmarking throughout development cycle
- Regulatory compliance validation with sample content library
- Cost optimization with usage tracking and budget alerts
- Security-first design with audit trail integrity protection

---

**Execute this prompt to implement a robust three-stage AI compliance system that ensures zero SEBI violations while providing helpful, real-time feedback to financial advisors.**