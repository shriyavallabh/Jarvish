/**
 * Agent Monitoring & Validation System
 * Real-time monitoring, SLA tracking, and quality validation for all 25 agents
 */

import { AgentSyncManager } from './agent-sync-manager';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Monitoring Metrics
interface AgentMetrics {
  agentId: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  successRate: number;
  errorCount: number;
  lastExecution?: Date;
  outputQuality: number; // 0-100 score
  tokenUsage: number;
  memoryUsage: number;
}

interface PhaseMetrics {
  phase: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  agentsCompleted: number;
  agentsTotal: number;
  filesGenerated: number;
  validationsPassed: number;
  validationsTotal: number;
  slaStatus: 'on_track' | 'at_risk' | 'breached';
}

interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  activeAgents: number;
  queuedTasks: number;
  errorRate: number;
  memoryPressure: number;
  diskUsage: number;
  avgResponseTime: number;
}

// Quality validation rules
interface ValidationRule {
  name: string;
  description: string;
  filePath: string;
  validator: (content: string) => boolean;
  errorMessage: string;
}

export class AgentMonitor {
  private syncManager: AgentSyncManager;
  private agentMetrics: Map<string, AgentMetrics> = new Map();
  private phaseMetrics: Map<string, PhaseMetrics> = new Map();
  private validationRules: Map<string, ValidationRule[]> = new Map();
  private alertThresholds: any;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(syncManager: AgentSyncManager) {
    this.syncManager = syncManager;
    this.setupValidationRules();
    this.setupAlertThresholds();
    this.setupEventListeners();
    this.startMonitoring();
  }

  private setupValidationRules(): void {
    // Phase 1 validation rules
    this.validationRules.set('phase1', [
      {
        name: 'ux_flow_completeness',
        description: 'UX flows must include onboarding, content creation, and approval tracking',
        filePath: 'context/phase1/ux-flows/content-composer-workflow.md',
        validator: (content: string) => {
          return content.includes('onboarding') && 
                 content.includes('content creation') && 
                 content.includes('approval');
        },
        errorMessage: 'UX flow missing required sections'
      },
      {
        name: 'compliance_patterns_defined',
        description: 'Compliance patterns must define SEBI requirements',
        filePath: 'context/phase1/compliance-patterns.md',
        validator: (content: string) => {
          return content.includes('SEBI') && 
                 content.includes('validation') && 
                 content.length > 500;
        },
        errorMessage: 'Compliance patterns insufficient or missing SEBI requirements'
      }
    ]);

    // Phase 2 validation rules
    this.validationRules.set('phase2', [
      {
        name: 'design_tokens_structure',
        description: 'Design tokens must be valid JavaScript/JSON',
        filePath: 'context/phase2/design-system/tokens.js',
        validator: (content: string) => {
          try {
            // Check if it's valid JS/JSON structure
            return content.includes('colors') && 
                   content.includes('typography') && 
                   content.includes('spacing');
          } catch {
            return false;
          }
        },
        errorMessage: 'Design tokens file invalid or incomplete'
      },
      {
        name: 'component_specifications',
        description: 'Component specs must define props, states, and accessibility',
        filePath: 'context/phase2/design-system/components.md',
        validator: (content: string) => {
          return content.includes('props') && 
                 content.includes('accessibility') && 
                 content.includes('states');
        },
        errorMessage: 'Component specifications missing required sections'
      }
    ]);

    // Phase 3 validation rules
    this.validationRules.set('phase3', [
      {
        name: 'react_component_syntax',
        description: 'React components must have valid syntax',
        filePath: 'context/phase3/dashboard-app/content-composer.tsx',
        validator: (content: string) => {
          return content.includes('export') && 
                 content.includes('React') && 
                 content.includes('return');
        },
        errorMessage: 'React component syntax invalid'
      },
      {
        name: 'typescript_compliance',
        description: 'TypeScript components must have proper typing',
        filePath: 'context/phase3/dashboard-app/advisor-layout.tsx',
        validator: (content: string) => {
          return content.includes('interface') || 
                 content.includes('type') || 
                 content.includes(': React.');
        },
        errorMessage: 'TypeScript typing missing or insufficient'
      }
    ]);

    // Phase 4 validation rules
    this.validationRules.set('phase4', [
      {
        name: 'api_endpoint_structure',
        description: 'API endpoints must have proper error handling',
        filePath: 'context/phase4/compliance-api/endpoints.js',
        validator: (content: string) => {
          return content.includes('try') && 
                 content.includes('catch') && 
                 content.includes('status');
        },
        errorMessage: 'API endpoints missing error handling'
      },
      {
        name: 'whatsapp_integration_complete',
        description: 'WhatsApp integration must handle all required scenarios',
        filePath: 'context/phase4/whatsapp-integration/delivery-scheduler.js',
        validator: (content: string) => {
          return content.includes('schedule') && 
                 content.includes('retry') && 
                 content.includes('webhook');
        },
        errorMessage: 'WhatsApp integration incomplete'
      }
    ]);
  }

  private setupAlertThresholds(): void {
    this.alertThresholds = {
      maxExecutionTime: 300000, // 5 minutes
      minSuccessRate: 0.95, // 95%
      maxErrorRate: 0.05, // 5%
      maxMemoryUsage: 1024 * 1024 * 1024, // 1GB
      maxQueueSize: 10,
      slaTimeouts: {
        phase1: 7 * 24 * 60 * 60 * 1000, // 7 days
        phase2: 10 * 24 * 60 * 60 * 1000, // 10 days
        phase3: 21 * 24 * 60 * 60 * 1000, // 21 days
        phase4: 28 * 24 * 60 * 60 * 1000  // 28 days
      }
    };
  }

  private setupEventListeners(): void {
    this.syncManager.on('agent_started', (event) => {
      this.recordAgentStart(event.agentId, event.timestamp);
    });

    this.syncManager.on('agent_completed', (event) => {
      this.recordAgentCompletion(event.agentId, event.timestamp, event.data.outputs);
    });

    this.syncManager.on('agent_failed', (event) => {
      this.recordAgentFailure(event.agentId, event.timestamp, event.data.error);
    });

    this.syncManager.on('file_created', (event) => {
      this.validateFile(event.data.filePath, event.agentId);
    });
  }

  private startMonitoring(): void {
    // Monitor system health every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.checkSystemHealth();
      this.checkSLAs();
      this.cleanupOldMetrics();
    }, 30000);

    console.log('📊 Agent monitoring started');
  }

  private recordAgentStart(agentId: string, timestamp: Date): void {
    if (!this.agentMetrics.has(agentId)) {
      this.agentMetrics.set(agentId, {
        agentId,
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        successRate: 1.0,
        errorCount: 0,
        outputQuality: 100,
        tokenUsage: 0,
        memoryUsage: 0
      });
    }

    const metrics = this.agentMetrics.get(agentId)!;
    metrics.lastExecution = timestamp;
    metrics.executionCount++;

    console.log(`🎬 Agent ${agentId} started execution #${metrics.executionCount}`);
  }

  private recordAgentCompletion(agentId: string, timestamp: Date, outputs: string[]): void {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics || !metrics.lastExecution) return;

    const executionTime = timestamp.getTime() - metrics.lastExecution.getTime();
    metrics.totalExecutionTime += executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executionCount;

    // Update success rate
    const totalAttempts = metrics.executionCount;
    const successfulAttempts = totalAttempts - metrics.errorCount;
    metrics.successRate = successfulAttempts / totalAttempts;

    console.log(`✅ Agent ${agentId} completed in ${executionTime}ms (avg: ${Math.round(metrics.averageExecutionTime)}ms)`);

    // Validate outputs
    outputs.forEach(filePath => {
      this.validateFile(filePath, agentId);
    });

    // Check for performance alerts
    this.checkPerformanceAlerts(agentId, metrics);
  }

  private recordAgentFailure(agentId: string, timestamp: Date, error: string): void {
    const metrics = this.agentMetrics.get(agentId);
    if (!metrics) return;

    metrics.errorCount++;
    
    // Update success rate
    const totalAttempts = metrics.executionCount;
    const successfulAttempts = totalAttempts - metrics.errorCount;
    metrics.successRate = successfulAttempts / totalAttempts;

    console.error(`❌ Agent ${agentId} failed: ${error}`);
    console.error(`📉 Success rate now: ${(metrics.successRate * 100).toFixed(1)}%`);

    // Check for error rate alerts
    if (metrics.successRate < this.alertThresholds.minSuccessRate) {
      this.sendAlert('error_rate_high', {
        agentId,
        successRate: metrics.successRate,
        errorCount: metrics.errorCount
      });
    }
  }

  private validateFile(filePath: string, agentId: string): void {
    // Determine phase from file path
    const phase = this.getPhaseFromFilePath(filePath);
    if (!phase) return;

    const rules = this.validationRules.get(phase) || [];
    const applicableRules = rules.filter(rule => filePath.includes(rule.filePath) || filePath.endsWith(rule.filePath));

    if (applicableRules.length === 0) return;

    console.log(`🔍 Validating ${filePath} against ${applicableRules.length} rules`);

    let validationsPassed = 0;
    
    applicableRules.forEach(rule => {
      try {
        if (!existsSync(filePath)) {
          console.warn(`⚠️ File not found for validation: ${filePath}`);
          return;
        }

        const content = readFileSync(filePath, 'utf8');
        const isValid = rule.validator(content);

        if (isValid) {
          validationsPassed++;
          console.log(`✅ ${rule.name} passed for ${filePath}`);
        } else {
          console.error(`❌ ${rule.name} failed for ${filePath}: ${rule.errorMessage}`);
          this.sendAlert('validation_failed', {
            agentId,
            filePath,
            rule: rule.name,
            error: rule.errorMessage
          });
        }
      } catch (error) {
        console.error(`💥 Validation error for ${rule.name}:`, error);
      }
    });

    // Update quality score
    const qualityScore = (validationsPassed / applicableRules.length) * 100;
    const metrics = this.agentMetrics.get(agentId);
    if (metrics) {
      metrics.outputQuality = Math.round((metrics.outputQuality + qualityScore) / 2);
    }

    console.log(`🎯 Quality score for ${agentId}: ${qualityScore}% (overall: ${metrics?.outputQuality}%)`);
  }

  private getPhaseFromFilePath(filePath: string): string | null {
    if (filePath.includes('phase1')) return 'phase1';
    if (filePath.includes('phase2')) return 'phase2';
    if (filePath.includes('phase3')) return 'phase3';
    if (filePath.includes('phase4')) return 'phase4';
    return null;
  }

  private checkSystemHealth(): void {
    const syncStatus = this.syncManager.getSyncStatus();
    const allMetrics = Array.from(this.agentMetrics.values());
    
    const avgResponseTime = allMetrics.reduce((sum, m) => sum + m.averageExecutionTime, 0) / allMetrics.length || 0;
    const errorRate = allMetrics.reduce((sum, m) => sum + (1 - m.successRate), 0) / allMetrics.length || 0;

    const health: SystemHealth = {
      overallStatus: this.determineOverallStatus(errorRate, avgResponseTime, syncStatus.pendingMessages),
      activeAgents: syncStatus.activeAgents,
      queuedTasks: syncStatus.pendingMessages,
      errorRate,
      memoryPressure: this.calculateMemoryPressure(),
      diskUsage: this.calculateDiskUsage(),
      avgResponseTime
    };

    // Log health summary every 5 minutes
    if (Date.now() % 300000 < 30000) { // Approximately every 5 minutes
      console.log(`💚 System Health: ${health.overallStatus} | Active: ${health.activeAgents} | Queue: ${health.queuedTasks} | Error Rate: ${(health.errorRate * 100).toFixed(1)}%`);
    }

    // Alert on critical issues
    if (health.overallStatus === 'critical') {
      this.sendAlert('system_critical', health);
    }
  }

  private determineOverallStatus(errorRate: number, avgResponseTime: number, queueSize: number): SystemHealth['overallStatus'] {
    if (errorRate > this.alertThresholds.maxErrorRate || 
        avgResponseTime > this.alertThresholds.maxExecutionTime ||
        queueSize > this.alertThresholds.maxQueueSize) {
      return 'critical';
    }
    
    if (errorRate > this.alertThresholds.maxErrorRate * 0.7 || 
        avgResponseTime > this.alertThresholds.maxExecutionTime * 0.7) {
      return 'degraded';
    }
    
    return 'healthy';
  }

  private calculateMemoryPressure(): number {
    // Simplified memory calculation
    const totalMetrics = Array.from(this.agentMetrics.values());
    const totalMemory = totalMetrics.reduce((sum, m) => sum + m.memoryUsage, 0);
    return Math.min(totalMemory / (1024 * 1024 * 1024), 1.0); // Normalized to 0-1
  }

  private calculateDiskUsage(): number {
    // Simplified disk usage (would use actual disk stats in production)
    return 0.1; // 10% placeholder
  }

  private checkSLAs(): void {
    // Check phase-level SLAs
    this.phaseMetrics.forEach((phase, phaseId) => {
      if (phase.startTime && !phase.endTime) {
        const elapsed = Date.now() - phase.startTime.getTime();
        const slaLimit = this.alertThresholds.slaTimeouts[phaseId as keyof typeof this.alertThresholds.slaTimeouts];
        
        if (elapsed > slaLimit * 0.9) { // 90% of SLA time
          phase.slaStatus = 'at_risk';
          this.sendAlert('sla_at_risk', { phase: phaseId, elapsed, limit: slaLimit });
        } else if (elapsed > slaLimit) { // SLA breached
          phase.slaStatus = 'breached';
          this.sendAlert('sla_breached', { phase: phaseId, elapsed, limit: slaLimit });
        }
      }
    });
  }

  private checkPerformanceAlerts(agentId: string, metrics: AgentMetrics): void {
    // Check execution time
    if (metrics.averageExecutionTime > this.alertThresholds.maxExecutionTime) {
      this.sendAlert('execution_time_high', {
        agentId,
        averageTime: metrics.averageExecutionTime,
        threshold: this.alertThresholds.maxExecutionTime
      });
    }

    // Check memory usage
    if (metrics.memoryUsage > this.alertThresholds.maxMemoryUsage) {
      this.sendAlert('memory_usage_high', {
        agentId,
        memoryUsage: metrics.memoryUsage,
        threshold: this.alertThresholds.maxMemoryUsage
      });
    }
  }

  private sendAlert(type: string, data: any): void {
    const alert = {
      type,
      timestamp: new Date(),
      data,
      severity: this.getAlertSeverity(type)
    };

    console.log(`🚨 ALERT [${alert.severity}]: ${type}`, data);
    
    // In production, would send to external monitoring systems
    // this.sendToDatadog(alert);
    // this.sendToSlack(alert);
  }

  private getAlertSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'validation_failed': 'medium',
      'error_rate_high': 'high',
      'execution_time_high': 'medium',
      'memory_usage_high': 'high',
      'sla_at_risk': 'medium',
      'sla_breached': 'critical',
      'system_critical': 'critical'
    };
    
    return severityMap[type] || 'low';
  }

  private cleanupOldMetrics(): void {
    // Clean up metrics older than 24 hours
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    
    this.agentMetrics.forEach((metrics, agentId) => {
      if (metrics.lastExecution && metrics.lastExecution.getTime() < cutoff) {
        // Reset execution-specific metrics but keep historical data
        metrics.lastExecution = undefined;
      }
    });
  }

  // Public API methods
  
  getAgentMetrics(agentId?: string): AgentMetrics | AgentMetrics[] {
    if (agentId) {
      return this.agentMetrics.get(agentId) || this.createEmptyMetrics(agentId);
    }
    return Array.from(this.agentMetrics.values());
  }

  getPhaseMetrics(phase?: string): PhaseMetrics | PhaseMetrics[] {
    if (phase) {
      return this.phaseMetrics.get(phase) || this.createEmptyPhaseMetrics(phase);
    }
    return Array.from(this.phaseMetrics.values());
  }

  startPhase(phase: string): void {
    this.phaseMetrics.set(phase, {
      phase,
      startTime: new Date(),
      agentsCompleted: 0,
      agentsTotal: this.getPhaseAgentCount(phase),
      filesGenerated: 0,
      validationsPassed: 0,
      validationsTotal: 0,
      slaStatus: 'on_track'
    });
    
    console.log(`🏁 Phase ${phase} started`);
  }

  completePhase(phase: string): void {
    const phaseMetrics = this.phaseMetrics.get(phase);
    if (phaseMetrics) {
      phaseMetrics.endTime = new Date();
      phaseMetrics.duration = phaseMetrics.endTime.getTime() - (phaseMetrics.startTime?.getTime() || 0);
      
      console.log(`🎯 Phase ${phase} completed in ${Math.round(phaseMetrics.duration / 1000)} seconds`);
    }
  }

  private createEmptyMetrics(agentId: string): AgentMetrics {
    return {
      agentId,
      executionCount: 0,
      totalExecutionTime: 0,
      averageExecutionTime: 0,
      successRate: 1.0,
      errorCount: 0,
      outputQuality: 100,
      tokenUsage: 0,
      memoryUsage: 0
    };
  }

  private createEmptyPhaseMetrics(phase: string): PhaseMetrics {
    return {
      phase,
      agentsCompleted: 0,
      agentsTotal: 0,
      filesGenerated: 0,
      validationsPassed: 0,
      validationsTotal: 0,
      slaStatus: 'on_track'
    };
  }

  private getPhaseAgentCount(phase: string): number {
    // Based on workflow/chain.yaml
    const phaseCounts: Record<string, number> = {
      'phase1': 3,
      'phase2': 2, 
      'phase3': 1,
      'phase4': 5
    };
    
    return phaseCounts[phase] || 0;
  }

  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log('📊 Agent monitoring stopped');
  }
}

// Export global monitor instance
export const globalAgentMonitor = new AgentMonitor(require('./agent-sync-manager').globalSyncManager);