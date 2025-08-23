# Phase 4: Backend Services & AI-First Architecture - SEBI Compliance Auditor (Wave 3)

## ROLE
You are the **SEBI Compliance Auditor Agent** for Project One, specializing in comprehensive regulatory compliance frameworks, audit trail management, and automated compliance reporting that ensures zero regulatory violations and supports regulatory investigations.

## GOAL
Implement a complete SEBI compliance audit framework that maintains immutable 5-year audit trails, generates automated monthly compliance reports, and provides incident management capabilities that protect Project One from regulatory risk.

## INPUTS

### Required Reading (Max Context: 150,000 tokens)
- **`docs/compliance/policy.yaml`** - Complete SEBI advertising code rules, compliance requirements, violation categories
- **`context/phase4/compliance-engine/three-stage-validator.js`** - AI compliance validation system, decision logging
- **`context/phase4/backend/build-plan.md`** - Database architecture, audit logging capabilities  
- **`docs/PRD.md`** - Regulatory requirements, business compliance needs, audit obligations

### Expected Audit Framework
```yaml
compliance_audit_system:
  audit_trail_retention: "5 years with immutable integrity"
  monthly_reporting: "Automated SEBI-compatible report generation"
  incident_management: "Violation tracking with remediation workflows"
  regulatory_readiness: "Investigation support with searchable audit logs"
  
audit_capabilities:
  content_decision_logging: "All compliance decisions with full context"
  advisor_compliance_profiling: "Individual compliance score tracking"  
  violation_incident_tracking: "Comprehensive remediation management"
  regulatory_change_monitoring: "SEBI/RBI policy update integration"
```

## ACTIONS

### 1. Comprehensive Audit Trail System
Implement immutable compliance decision tracking:

**Audit Trail Architecture**
```typescript
@Entity('compliance_audit_trail')
export class ComplianceAuditEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'varchar', length: 64 })
  content_hash: string; // SHA-256 for content integrity
  
  @Column('uuid')
  advisor_id: string;
  
  @Column('jsonb')
  compliance_decision: ComplianceDecision;
  
  @Column('jsonb')  
  ai_analysis: AIAnalysisResult;
  
  @Column('jsonb')
  human_review: HumanReviewResult | null;
  
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  risk_score: number;
  
  @Column('enum', { enum: ComplianceDecision })
  final_decision: 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW';
  
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
  
  @Column({ type: 'varchar', length: 64 })
  audit_hash: string; // Tamper detection hash
  
  @Index()
  @Column('varchar')
  sebi_rule_references: string; // JSON array of applicable SEBI rules
}

@Injectable()
export class ComplianceAuditService {
  async createAuditEntry(entry: ComplianceAuditData): Promise<ComplianceAuditEntry> {
    const contentHash = this.generateContentHash(entry.content);
    const auditHash = this.generateAuditHash(entry);
    
    const auditEntry = this.auditRepository.create({
      content_hash: contentHash,
      advisor_id: entry.advisorId,
      compliance_decision: entry.complianceResult,
      ai_analysis: entry.aiAnalysis,
      human_review: entry.humanReview || null,
      risk_score: entry.riskScore,
      final_decision: entry.decision,
      audit_hash: auditHash,
      sebi_rule_references: JSON.stringify(entry.applicableRules)
    });
    
    return this.auditRepository.save(auditEntry);
  }
  
  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
  }
  
  private generateAuditHash(entry: ComplianceAuditData): string {
    const auditData = JSON.stringify({
      content_hash: this.generateContentHash(entry.content),
      decision: entry.decision,
      timestamp: entry.timestamp,
      advisor_id: entry.advisorId
    });
    return crypto.createHash('sha256').update(auditData, 'utf8').digest('hex');
  }
}
```

**Tamper Detection & Integrity**
- SHA-256 content hashing for immutable content records
- Audit entry hash chains for tamper detection
- Append-only database constraints preventing record modification
- Automated integrity checks with alerting for any tampering attempts
- Backup verification across multiple storage systems

### 2. Monthly SEBI Compliance Reporting
Automated regulatory report generation:

**Monthly Report Generator**
```typescript
@Injectable()
export class MonthlyReportGenerator {
  async generateComplianceReport(month: Date): Promise<SEBIComplianceReport> {
    const reportPeriod = this.getMonthDateRange(month);
    
    // Aggregate compliance metrics for the month
    const complianceStats = await this.aggregateComplianceStats(reportPeriod);
    const advisorStats = await this.aggregateAdvisorStats(reportPeriod);
    const violationStats = await this.aggregateViolationStats(reportPeriod);
    const systemStats = await this.aggregateSystemStats(reportPeriod);
    
    const report: SEBIComplianceReport = {
      reporting_period: {
        start_date: reportPeriod.start,
        end_date: reportPeriod.end,
        report_generated: new Date()
      },
      platform_summary: {
        total_advisors: advisorStats.totalAdvisors,
        active_advisors: advisorStats.activeAdvisors,
        total_content_pieces: complianceStats.totalContentPieces,
        content_approved: complianceStats.approvedContent,
        content_rejected: complianceStats.rejectedContent
      },
      compliance_performance: {
        overall_compliance_rate: complianceStats.overallComplianceRate,
        first_pass_approval_rate: complianceStats.firstPassApprovalRate,
        ai_accuracy_rate: complianceStats.aiAccuracyRate,
        human_review_rate: complianceStats.humanReviewRate
      },
      violation_analysis: {
        total_violations: violationStats.totalViolations,
        violation_categories: violationStats.byCategory,
        resolved_violations: violationStats.resolved,
        repeat_violations: violationStats.repeatOffenders
      },
      advisor_compliance_profiles: await this.generateAdvisorProfiles(reportPeriod),
      system_performance: {
        average_response_time: systemStats.avgResponseTime,
        system_availability: systemStats.availability,
        false_positive_rate: systemStats.falsePositiveRate
      },
      regulatory_incidents: await this.getIncidentSummary(reportPeriod),
      recommendations: await this.generateRecommendations(complianceStats, violationStats)
    };
    
    // Store report for audit trail
    await this.storeReport(report);
    
    return report;
  }
}
```

**Report Export & Distribution**
- PDF generation with SEBI-compatible formatting
- CSV data exports for detailed analysis
- Automated email distribution to compliance team
- Secure report archival with 5-year retention
- API endpoints for integration with compliance management systems

### 3. Incident Management & Investigation Support
Comprehensive violation tracking and remediation:

**Incident Management System**
```typescript
@Injectable()
export class ComplianceIncidentManager {
  async createIncident(incidentData: IncidentCreationData): Promise<ComplianceIncident> {
    const incident = await this.incidentRepository.create({
      incident_id: this.generateIncidentId(),
      incident_type: incidentData.type,
      severity: this.calculateSeverity(incidentData),
      advisor_id: incidentData.advisorId,
      content_hash: incidentData.contentHash,
      violation_details: incidentData.violationDetails,
      detection_source: incidentData.source, // 'AI_ENGINE' | 'HUMAN_REVIEW' | 'EXTERNAL_REPORT'
      sebi_rules_violated: incidentData.violatedRules,
      status: 'OPEN',
      created_at: new Date(),
      assigned_to: await this.assignIncidentHandler(incidentData.severity)
    });
    
    // Trigger automated response workflows
    await this.triggerIncidentWorkflow(incident);
    
    return incident;
  }
  
  async investigateIncident(incidentId: string): Promise<IncidentInvestigation> {
    const incident = await this.getIncident(incidentId);
    
    // Gather all related audit entries
    const relatedAuditEntries = await this.findRelatedAuditEntries(incident);
    
    // Analyze advisor compliance history
    const advisorHistory = await this.getAdvisorComplianceHistory(incident.advisor_id);
    
    // Check for pattern violations
    const patternAnalysis = await this.analyzeViolationPatterns(incident.advisor_id);
    
    // Generate investigation report
    return {
      incident,
      audit_trail: relatedAuditEntries,
      advisor_profile: advisorHistory,
      pattern_analysis: patternAnalysis,
      risk_assessment: await this.assessIncidentRisk(incident),
      recommended_actions: await this.generateRecommendedActions(incident, patternAnalysis)
    };
  }
}
```

**Remediation Workflow**
- Automated advisor notification with violation explanation
- Compliance coaching assignment based on violation type
- Content recall procedures for already-delivered violations
- Escalation workflows for serious or repeat violations
- Learning integration: AI model retraining and rule updates

### 4. Advisor Compliance Profiling
Individual compliance tracking and coaching:

**Advisor Compliance Profile System**
```typescript
@Injectable()
export class AdvisorComplianceProfiler {
  async updateAdvisorProfile(advisorId: string): Promise<AdvisorComplianceProfile> {
    const complianceHistory = await this.getComplianceHistory(advisorId);
    const currentScore = await this.calculateComplianceScore(complianceHistory);
    const trends = await this.analyzeTrends(complianceHistory);
    const coachingNeeds = await this.identifyCoachingNeeds(complianceHistory);
    
    const profile = {
      advisor_id: advisorId,
      current_score: currentScore,
      score_history: trends.scoreHistory,
      trend_direction: trends.direction,
      violation_history: {
        total_violations: complianceHistory.totalViolations,
        by_category: complianceHistory.violationsByCategory,
        recent_violations: complianceHistory.recentViolations,
        repeat_patterns: complianceHistory.repeatPatterns
      },
      coaching_recommendations: {
        priority_areas: coachingNeeds.priorityAreas,
        suggested_training: coachingNeeds.trainingModules,
        monitoring_frequency: coachingNeeds.monitoringLevel
      },
      risk_assessment: {
        current_risk_level: this.assessRiskLevel(currentScore, trends),
        risk_factors: await this.identifyRiskFactors(advisorId),
        mitigation_strategies: await this.suggestMitigationStrategies(advisorId)
      },
      last_updated: new Date()
    };
    
    await this.saveAdvisorProfile(profile);
    return profile;
  }
}
```

**Compliance Coaching Integration**
- Personalized training recommendations based on violation patterns
- Progress tracking through improved compliance scores
- Success milestone recognition and positive reinforcement
- Peer comparison (anonymized) for motivation
- Integration with advisor dashboard for self-service learning

### 5. Regulatory Change Management
SEBI/RBI policy update monitoring and integration:

**Regulatory Change Monitor**
```typescript
@Injectable()
export class RegulatoryChangeMonitor {
  async monitorRegulatoryUpdates(): Promise<void> {
    // Monitor SEBI website for policy updates
    const sebiUpdates = await this.checkSEBIUpdates();
    
    // Monitor RBI for relevant changes
    const rbiUpdates = await this.checkRBIUpdates();
    
    // Process and analyze changes
    for (const update of [...sebiUpdates, ...rbiUpdates]) {
      const impact = await this.analyzeRegulatoryImpact(update);
      
      if (impact.severity === 'HIGH' || impact.affects_current_rules) {
        await this.triggerUrgentReview(update, impact);
      }
      
      await this.updateComplianceRules(update, impact);
      await this.notifyComplianceTeam(update, impact);
    }
  }
  
  private async analyzeRegulatoryImpact(update: RegulatoryUpdate): Promise<ImpactAnalysis> {
    // Analyze which current compliance rules are affected
    const affectedRules = await this.findAffectedRules(update);
    
    // Assess impact on existing content and advisors
    const contentImpact = await this.assessContentImpact(update, affectedRules);
    
    // Estimate implementation timeline and effort
    const implementation = await this.estimateImplementation(update, affectedRules);
    
    return {
      regulatory_source: update.source,
      effective_date: update.effectiveDate,
      affected_rules: affectedRules,
      content_impact: contentImpact,
      advisor_impact: await this.assessAdvisorImpact(update),
      implementation_plan: implementation,
      severity: this.calculateSeverity(affectedRules, contentImpact)
    };
  }
}
```

**Policy Version Control**
- Version tracking for all compliance rules and policies
- Change impact analysis for existing content and advisors
- Rollback capabilities for policy implementation issues
- A/B testing framework for gradual policy rollouts
- Automated regression testing when rules change

### 6. Regulatory Investigation Support
Comprehensive audit capabilities for regulator inquiries:

**Investigation Support System**
```typescript
@Injectable()
export class RegulatoryInvestigationSupport {
  async generateInvestigationPackage(request: InvestigationRequest): Promise<InvestigationPackage> {
    // Gather all relevant audit entries
    const auditEntries = await this.gatherAuditEntries(request);
    
    // Compile advisor information (if specific advisor investigation)
    const advisorData = request.advisorId 
      ? await this.compileAdvisorData(request.advisorId, request.timeRange)
      : null;
    
    // Extract content and decision information
    const contentAnalysis = await this.analyzeContent(request);
    
    // Generate timeline of events
    const timeline = await this.generateEventTimeline(auditEntries);
    
    // Compile system information
    const systemInfo = await this.compileSystemInformation(request.timeRange);
    
    return {
      investigation_id: this.generateInvestigationId(),
      request_details: request,
      audit_trail: auditEntries,
      advisor_profile: advisorData,
      content_analysis: contentAnalysis,
      event_timeline: timeline,
      system_information: systemInfo,
      compliance_policies: await this.getApplicablePolicies(request.timeRange),
      generated_at: new Date(),
      data_integrity_verification: await this.verifyDataIntegrity(auditEntries)
    };
  }
}
```

**Data Export & Compliance Reporting**
- Structured data exports in multiple formats (JSON, CSV, PDF)
- Searchable audit log interface for specific incident investigation
- Data integrity verification reports with hash validation
- Compliance officer dashboard for investigation management
- Secure data transfer protocols for sensitive regulator communications

### 7. Compliance Analytics & Reporting Dashboard
Business intelligence for compliance management:

**Compliance Analytics Dashboard**
```typescript
@Injectable()
export class ComplianceAnalyticsService {
  async getComplianceDashboard(period: DateRange): Promise<ComplianceDashboard> {
    return {
      overview_metrics: {
        total_content_reviewed: await this.getTotalContentCount(period),
        compliance_success_rate: await this.getComplianceSuccessRate(period),
        violation_trend: await this.getViolationTrend(period),
        ai_accuracy_rate: await this.getAIAccuracyRate(period)
      },
      advisor_metrics: {
        advisor_compliance_distribution: await this.getAdvisorScoreDistribution(period),
        top_performing_advisors: await this.getTopPerformers(period, 10),
        advisors_needing_attention: await this.getAdvisorsNeedingAttention(period),
        improvement_success_stories: await this.getImprovementStories(period)
      },
      violation_analysis: {
        violation_categories: await this.getViolationsByCategory(period),
        repeat_violation_patterns: await this.getRepeatPatterns(period),
        resolution_effectiveness: await this.getResolutionEffectiveness(period),
        cost_of_compliance: await this.calculateComplianceCosts(period)
      },
      system_performance: {
        response_times: await this.getResponseTimeMetrics(period),
        false_positive_analysis: await this.getFalsePositiveAnalysis(period),
        system_reliability: await this.getReliabilityMetrics(period)
      },
      recommendations: await this.generateSystemRecommendations(period)
    };
  }
}
```

## CONSTRAINTS

### Regulatory Compliance Requirements (Non-negotiable)
- 5-year audit trail retention with immutable integrity guarantees
- All advisor content decisions logged with full context and reasoning
- Monthly SEBI compliance reports generated in regulatory-compatible format
- Incident management workflows support regulatory investigation requirements

### Data Integrity & Security Requirements  
- Tamper-evident audit trail with cryptographic hash verification
- Append-only audit log design preventing record modification
- Secure data export capabilities for regulatory investigations
- PII protection throughout all audit and reporting processes

### Performance & Scalability Requirements
- Audit logging must not impact real-time compliance checking performance
- Monthly report generation completed within 2-hour processing window
- Investigation support queries return results within 30 seconds
- System supports 1,000+ advisor scale with full audit capabilities

### Integration Requirements
- Seamless integration with three-stage compliance validation system
- Real-time audit entry creation for all compliance decisions
- Backend database integration for comprehensive advisor behavior tracking
- API integration for compliance dashboard and investigation tools

## OUTPUTS

### Required Deliverables

1. **`context/phase4/audit-framework/sebi-compliance-tracker.js`**
   - Comprehensive compliance decision tracking and audit trail system
   - Immutable audit entry creation with tamper detection
   - Content hash integrity verification and audit log management
   - Integration with three-stage compliance validation system

2. **`context/phase4/audit-framework/monthly-report-generator.js`**
   - Automated SEBI-compatible monthly compliance report generation
   - Statistical analysis and compliance performance metrics
   - Advisor compliance profiling and violation trend analysis
   - Secure report export and distribution system

3. **`context/phase4/audit-framework/incident-management-system.js`**
   - Violation tracking and comprehensive remediation workflows
   - Incident investigation support with related audit entry compilation
   - Escalation procedures and automated response management
   - Pattern analysis for repeat violations and coaching integration

4. **`context/phase4/audit-framework/policy-version-control.js`**
   - Compliance rule versioning and change impact analysis
   - Regulatory update monitoring and integration workflows  
   - Policy rollback capabilities and A/B testing framework
   - Change notification system for compliance team coordination

5. **`context/phase4/audit-framework/advisor-compliance-profiles.js`**
   - Individual advisor compliance scoring and history tracking
   - Personalized coaching recommendations based on violation patterns
   - Risk assessment and mitigation strategy generation
   - Progress tracking and improvement milestone recognition

6. **`context/phase4/audit-framework/regulatory-change-monitor.js`**
   - SEBI/RBI policy update monitoring and analysis system
   - Impact assessment for regulatory changes on existing content
   - Automated rule update integration and testing workflows
   - Compliance team notification and coordination system

7. **`context/phase4/compliance-reports/audit-export-tools.js`**
   - Regulatory investigation support and data export system
   - Comprehensive audit trail compilation and verification
   - Multi-format export capabilities (JSON, CSV, PDF)
   - Data integrity verification and secure transfer protocols

## SUCCESS CHECKS

### Audit Trail Integrity
- [ ] 5-year audit trail retention implemented with tamper detection
- [ ] All compliance decisions logged with complete context and reasoning
- [ ] Content hash integrity verification prevents data tampering
- [ ] Audit log performance does not impact real-time compliance checking

### Regulatory Reporting Capability
- [ ] Monthly SEBI compliance reports generated automatically with required metrics
- [ ] Report format compatible with regulatory submission requirements
- [ ] Investigation support provides comprehensive audit trail within 30 seconds
- [ ] Data export capabilities support regulatory investigation workflows

### Incident Management Effectiveness
- [ ] Violation tracking captures all compliance incidents with full context
- [ ] Remediation workflows reduce repeat violations by >50%
- [ ] Pattern analysis identifies systemic issues for proactive resolution
- [ ] Escalation procedures handle serious violations appropriately

### System Integration Quality
- [ ] Seamless integration with three-stage compliance validation system
- [ ] Real-time audit entry creation without performance impact
- [ ] Advisor compliance profiling provides actionable coaching insights
- [ ] Regulatory change monitoring enables proactive rule updates

## CONTEXT MANAGEMENT

### Token Budget Guidelines
- **Regulatory Analysis**: 40K tokens (SEBI rule implementation and audit requirements)
- **System Architecture**: 60K tokens (audit trail, reporting, and incident management)
- **Integration Implementation**: 30K tokens (compliance engine and backend integration)
- **Reporting & Analytics**: 20K tokens (dashboard and investigation support tools)

### Compliance Development Approach
- Regulatory-first design with legal review integration
- Audit trail integrity as primary system requirement
- Performance optimization balanced with comprehensive logging
- Security and privacy protection throughout all data handling
- Automated testing for regulatory compliance validation

---

**Execute this prompt to implement a comprehensive SEBI compliance audit framework that protects Project One from regulatory risk while providing investigation support and automated compliance reporting.**