/**
 * WhatsApp Quality Monitor
 * Tracks quality ratings and implements automated recovery procedures
 * Ensures messaging quality stays HIGH for optimal delivery rates
 */

const EventEmitter = require('events');
const moment = require('moment');

class WhatsAppQualityMonitor extends EventEmitter {
  constructor(config) {
    super();
    
    this.config = {
      checkInterval: 300000, // 5 minutes
      alertThresholds: {
        blockRate: 0.02, // 2%
        reportRate: 0.01, // 1%
        failureRate: 0.05, // 5%
        minQuality: 'MEDIUM'
      },
      recoveryStrategies: {
        immediate: true,
        cooldown: 48, // hours
        volumeReduction: 0.5, // 50% reduction
        templateRotation: true
      },
      ...config
    };
    
    // Quality tracking
    this.qualityHistory = new Map();
    this.currentStatus = new Map();
    this.recoveryPlans = new Map();
    
    // Metrics tracking
    this.metrics = {
      messages: new Map(),
      blocks: new Map(),
      reports: new Map(),
      failures: new Map()
    };
    
    // Pattern analysis
    this.patterns = {
      problematicTemplates: new Set(),
      problematicAdvisors: new Set(),
      peakFailureTimes: []
    };
    
    this.initializeMonitoring();
  }
  
  /**
   * Initialize quality monitoring
   * @private
   */
  initializeMonitoring() {
    // Regular quality checks
    this.monitoringInterval = setInterval(() => {
      this.performQualityCheck();
    }, this.config.checkInterval);
    
    // Daily analysis
    this.dailyAnalysis = setInterval(() => {
      this.performDailyAnalysis();
    }, 86400000); // 24 hours
  }
  
  /**
   * Track message sent
   * @param {Object} data Message data
   */
  trackMessage(data) {
    const { phoneNumberId, templateName, advisorId, timestamp } = data;
    
    // Initialize counters if needed
    if (!this.metrics.messages.has(phoneNumberId)) {
      this.metrics.messages.set(phoneNumberId, []);
      this.metrics.blocks.set(phoneNumberId, []);
      this.metrics.reports.set(phoneNumberId, []);
      this.metrics.failures.set(phoneNumberId, []);
    }
    
    // Add message to tracking
    this.metrics.messages.get(phoneNumberId).push({
      templateName,
      advisorId,
      timestamp: timestamp || new Date()
    });
    
    // Cleanup old data (keep 7 days)
    this.cleanupOldMetrics(phoneNumberId);
  }
  
  /**
   * Track user block
   * @param {Object} data Block data
   */
  trackBlock(data) {
    const { phoneNumberId, advisorId, timestamp } = data;
    
    if (!this.metrics.blocks.has(phoneNumberId)) {
      this.metrics.blocks.set(phoneNumberId, []);
    }
    
    this.metrics.blocks.get(phoneNumberId).push({
      advisorId,
      timestamp: timestamp || new Date()
    });
    
    // Check if immediate action needed
    this.checkBlockRate(phoneNumberId);
    
    // Track problematic advisor
    if (advisorId) {
      this.trackProblematicAdvisor(advisorId);
    }
  }
  
  /**
   * Track spam report
   * @param {Object} data Report data
   */
  trackReport(data) {
    const { phoneNumberId, advisorId, templateName, timestamp } = data;
    
    if (!this.metrics.reports.has(phoneNumberId)) {
      this.metrics.reports.set(phoneNumberId, []);
    }
    
    this.metrics.reports.get(phoneNumberId).push({
      advisorId,
      templateName,
      timestamp: timestamp || new Date()
    });
    
    // Check if immediate action needed
    this.checkReportRate(phoneNumberId);
    
    // Track problematic template
    if (templateName) {
      this.trackProblematicTemplate(templateName);
    }
  }
  
  /**
   * Track delivery failure
   * @param {Object} data Failure data
   */
  trackFailure(data) {
    const { phoneNumberId, reason, templateName, timestamp } = data;
    
    if (!this.metrics.failures.has(phoneNumberId)) {
      this.metrics.failures.set(phoneNumberId, []);
    }
    
    this.metrics.failures.get(phoneNumberId).push({
      reason,
      templateName,
      timestamp: timestamp || new Date()
    });
    
    // Check failure rate
    this.checkFailureRate(phoneNumberId);
  }
  
  /**
   * Update quality rating for a phone number
   * @param {string} phoneNumberId Phone number ID
   * @param {string} quality New quality rating
   */
  updateQualityRating(phoneNumberId, quality) {
    const previousQuality = this.currentStatus.get(phoneNumberId)?.quality;
    
    // Update current status
    this.currentStatus.set(phoneNumberId, {
      quality,
      lastUpdated: new Date(),
      previousQuality
    });
    
    // Track history
    if (!this.qualityHistory.has(phoneNumberId)) {
      this.qualityHistory.set(phoneNumberId, []);
    }
    
    this.qualityHistory.get(phoneNumberId).push({
      quality,
      timestamp: new Date()
    });
    
    // Check if recovery needed
    if (this.isQualityDegraded(quality, previousQuality)) {
      this.initiateRecovery(phoneNumberId, quality, previousQuality);
    }
    
    // Emit quality change event
    this.emit('quality:updated', {
      phoneNumberId,
      quality,
      previousQuality
    });
  }
  
  /**
   * Perform regular quality check
   * @private
   */
  async performQualityCheck() {
    for (const [phoneNumberId, status] of this.currentStatus) {
      const metrics = this.calculateMetrics(phoneNumberId);
      
      // Check thresholds
      const issues = [];
      
      if (metrics.blockRate > this.config.alertThresholds.blockRate) {
        issues.push({
          type: 'HIGH_BLOCK_RATE',
          value: metrics.blockRate,
          threshold: this.config.alertThresholds.blockRate
        });
      }
      
      if (metrics.reportRate > this.config.alertThresholds.reportRate) {
        issues.push({
          type: 'HIGH_REPORT_RATE',
          value: metrics.reportRate,
          threshold: this.config.alertThresholds.reportRate
        });
      }
      
      if (metrics.failureRate > this.config.alertThresholds.failureRate) {
        issues.push({
          type: 'HIGH_FAILURE_RATE',
          value: metrics.failureRate,
          threshold: this.config.alertThresholds.failureRate
        });
      }
      
      if (this.getQualityScore(status.quality) < this.getQualityScore(this.config.alertThresholds.minQuality)) {
        issues.push({
          type: 'LOW_QUALITY_RATING',
          value: status.quality,
          threshold: this.config.alertThresholds.minQuality
        });
      }
      
      // Take action if issues found
      if (issues.length > 0) {
        this.handleQualityIssues(phoneNumberId, issues, metrics);
      }
    }
  }
  
  /**
   * Calculate metrics for a phone number
   * @private
   */
  calculateMetrics(phoneNumberId) {
    const messages = this.metrics.messages.get(phoneNumberId) || [];
    const blocks = this.metrics.blocks.get(phoneNumberId) || [];
    const reports = this.metrics.reports.get(phoneNumberId) || [];
    const failures = this.metrics.failures.get(phoneNumberId) || [];
    
    // Calculate rates for last 7 days
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    
    const recentMessages = messages.filter(m => m.timestamp > sevenDaysAgo);
    const recentBlocks = blocks.filter(b => b.timestamp > sevenDaysAgo);
    const recentReports = reports.filter(r => r.timestamp > sevenDaysAgo);
    const recentFailures = failures.filter(f => f.timestamp > sevenDaysAgo);
    
    const totalMessages = recentMessages.length || 1; // Avoid division by zero
    
    return {
      totalMessages,
      blocks: recentBlocks.length,
      reports: recentReports.length,
      failures: recentFailures.length,
      blockRate: recentBlocks.length / totalMessages,
      reportRate: recentReports.length / totalMessages,
      failureRate: recentFailures.length / totalMessages
    };
  }
  
  /**
   * Handle quality issues
   * @private
   */
  handleQualityIssues(phoneNumberId, issues, metrics) {
    console.log(`Quality issues detected for ${phoneNumberId}:`, issues);
    
    // Determine severity
    const severity = this.determineSeverity(issues);
    
    // Create recovery plan
    const recoveryPlan = this.createRecoveryPlan(phoneNumberId, severity, issues, metrics);
    
    // Store recovery plan
    this.recoveryPlans.set(phoneNumberId, recoveryPlan);
    
    // Execute immediate actions
    if (recoveryPlan.immediateActions.length > 0) {
      this.executeImmediateActions(phoneNumberId, recoveryPlan.immediateActions);
    }
    
    // Emit alert
    this.emit('quality:alert', {
      phoneNumberId,
      severity,
      issues,
      metrics,
      recoveryPlan
    });
  }
  
  /**
   * Determine issue severity
   * @private
   */
  determineSeverity(issues) {
    // Critical if quality is FLAGGED or multiple high-severity issues
    const criticalIssues = issues.filter(i => 
      i.type === 'LOW_QUALITY_RATING' && i.value === 'FLAGGED'
    );
    
    if (criticalIssues.length > 0) {
      return 'CRITICAL';
    }
    
    // High if block/report rates exceeded significantly
    const highIssues = issues.filter(i => 
      (i.type === 'HIGH_BLOCK_RATE' && i.value > i.threshold * 2) ||
      (i.type === 'HIGH_REPORT_RATE' && i.value > i.threshold * 2)
    );
    
    if (highIssues.length > 0) {
      return 'HIGH';
    }
    
    // Medium for other threshold violations
    if (issues.length > 0) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }
  
  /**
   * Create recovery plan based on severity
   * @private
   */
  createRecoveryPlan(phoneNumberId, severity, issues, metrics) {
    const plan = {
      phoneNumberId,
      severity,
      createdAt: new Date(),
      immediateActions: [],
      shortTermActions: [],
      longTermActions: [],
      monitoring: {
        duration: 48, // hours
        checkInterval: 30 // minutes
      }
    };
    
    switch (severity) {
      case 'CRITICAL':
        // Immediate actions for critical issues
        plan.immediateActions.push(
          { action: 'PAUSE_NON_CRITICAL', description: 'Pause all non-critical messages' },
          { action: 'ACTIVATE_BACKUP', description: 'Switch to backup number' },
          { action: 'ALERT_TEAM', description: 'Send immediate alert to operations team' }
        );
        
        plan.shortTermActions.push(
          { action: 'TEMPLATE_REVIEW', description: 'Review and revise all templates' },
          { action: 'REDUCE_VOLUME', description: 'Reduce message volume by 75%' }
        );
        
        plan.longTermActions.push(
          { action: 'NUMBER_COOLDOWN', description: '72-hour cooldown period' },
          { action: 'GRADUAL_RAMP', description: 'Gradual volume increase over 7 days' }
        );
        break;
        
      case 'HIGH':
        plan.immediateActions.push(
          { action: 'REDUCE_FREQUENCY', description: 'Reduce messaging frequency by 50%' },
          { action: 'ROTATE_TEMPLATES', description: 'Switch to alternative templates' }
        );
        
        plan.shortTermActions.push(
          { action: 'CONTENT_REVIEW', description: 'Review content for compliance' },
          { action: 'SEGMENT_AUDIENCES', description: 'Pause messaging to low-engagement segments' }
        );
        
        plan.longTermActions.push(
          { action: 'MONITOR_48H', description: '48-hour enhanced monitoring' },
          { action: 'A_B_TESTING', description: 'A/B test new message formats' }
        );
        break;
        
      case 'MEDIUM':
        plan.immediateActions.push(
          { action: 'MONITOR_CLOSELY', description: 'Increase monitoring frequency' }
        );
        
        plan.shortTermActions.push(
          { action: 'OPTIMIZE_TIMING', description: 'Adjust message timing' },
          { action: 'PERSONALIZATION', description: 'Increase message personalization' }
        );
        break;
        
      default:
        plan.shortTermActions.push(
          { action: 'STANDARD_MONITORING', description: 'Continue standard monitoring' }
        );
    }
    
    return plan;
  }
  
  /**
   * Execute immediate recovery actions
   * @private
   */
  executeImmediateActions(phoneNumberId, actions) {
    for (const action of actions) {
      console.log(`Executing: ${action.action} for ${phoneNumberId}`);
      
      switch (action.action) {
        case 'PAUSE_NON_CRITICAL':
          this.emit('action:pause_messaging', { phoneNumberId, critical_only: true });
          break;
          
        case 'ACTIVATE_BACKUP':
          this.emit('action:activate_backup', { phoneNumberId });
          break;
          
        case 'ALERT_TEAM':
          this.emit('action:alert_team', { 
            phoneNumberId, 
            severity: 'CRITICAL',
            message: 'Critical quality issue detected'
          });
          break;
          
        case 'REDUCE_FREQUENCY':
          this.emit('action:reduce_frequency', { phoneNumberId, reduction: 0.5 });
          break;
          
        case 'ROTATE_TEMPLATES':
          this.emit('action:rotate_templates', { phoneNumberId });
          break;
          
        case 'MONITOR_CLOSELY':
          this.increaseMonitoringFrequency(phoneNumberId);
          break;
      }
    }
  }
  
  /**
   * Initiate recovery for quality degradation
   * @private
   */
  initiateRecovery(phoneNumberId, currentQuality, previousQuality) {
    console.log(`Initiating recovery for ${phoneNumberId}: ${previousQuality} -> ${currentQuality}`);
    
    const recoveryStrategy = {
      phoneNumberId,
      startedAt: new Date(),
      fromQuality: previousQuality,
      toQuality: currentQuality,
      status: 'IN_PROGRESS'
    };
    
    if (currentQuality === 'FLAGGED') {
      // Critical recovery needed
      recoveryStrategy.actions = [
        'immediate_pause',
        'backup_activation',
        'full_audit'
      ];
    } else if (currentQuality === 'LOW') {
      // Moderate recovery
      recoveryStrategy.actions = [
        'volume_reduction',
        'template_optimization',
        'timing_adjustment'
      ];
    } else if (currentQuality === 'MEDIUM' && previousQuality === 'HIGH') {
      // Preventive recovery
      recoveryStrategy.actions = [
        'content_review',
        'engagement_analysis',
        'gradual_optimization'
      ];
    }
    
    this.emit('recovery:initiated', recoveryStrategy);
  }
  
  /**
   * Check if quality has degraded
   * @private
   */
  isQualityDegraded(current, previous) {
    const scores = { HIGH: 3, MEDIUM: 2, LOW: 1, FLAGGED: 0 };
    return (scores[current] || 0) < (scores[previous] || 3);
  }
  
  /**
   * Get quality score
   * @private
   */
  getQualityScore(quality) {
    const scores = { HIGH: 3, MEDIUM: 2, LOW: 1, FLAGGED: 0 };
    return scores[quality] || 0;
  }
  
  /**
   * Check block rate and take action if needed
   * @private
   */
  checkBlockRate(phoneNumberId) {
    const metrics = this.calculateMetrics(phoneNumberId);
    
    if (metrics.blockRate > this.config.alertThresholds.blockRate * 2) {
      // Double the threshold - immediate action
      this.emit('action:emergency_pause', {
        phoneNumberId,
        reason: 'block_rate_critical',
        blockRate: metrics.blockRate
      });
    }
  }
  
  /**
   * Check report rate and take action if needed
   * @private
   */
  checkReportRate(phoneNumberId) {
    const metrics = this.calculateMetrics(phoneNumberId);
    
    if (metrics.reportRate > this.config.alertThresholds.reportRate * 2) {
      // Double the threshold - immediate action
      this.emit('action:template_suspension', {
        phoneNumberId,
        reason: 'report_rate_critical',
        reportRate: metrics.reportRate
      });
    }
  }
  
  /**
   * Check failure rate
   * @private
   */
  checkFailureRate(phoneNumberId) {
    const metrics = this.calculateMetrics(phoneNumberId);
    
    if (metrics.failureRate > this.config.alertThresholds.failureRate) {
      this.emit('quality:high_failure_rate', {
        phoneNumberId,
        failureRate: metrics.failureRate,
        threshold: this.config.alertThresholds.failureRate
      });
    }
  }
  
  /**
   * Track problematic template
   * @private
   */
  trackProblematicTemplate(templateName) {
    this.patterns.problematicTemplates.add(templateName);
    
    // Check if template needs immediate suspension
    const reportCount = Array.from(this.metrics.reports.values())
      .flat()
      .filter(r => r.templateName === templateName).length;
    
    if (reportCount > 10) {
      this.emit('template:suspend', {
        templateName,
        reason: 'high_report_count',
        reports: reportCount
      });
    }
  }
  
  /**
   * Track problematic advisor
   * @private
   */
  trackProblematicAdvisor(advisorId) {
    this.patterns.problematicAdvisors.add(advisorId);
    
    // Check if advisor needs coaching
    const blockCount = Array.from(this.metrics.blocks.values())
      .flat()
      .filter(b => b.advisorId === advisorId).length;
    
    if (blockCount > 5) {
      this.emit('advisor:needs_coaching', {
        advisorId,
        reason: 'high_block_count',
        blocks: blockCount
      });
    }
  }
  
  /**
   * Perform daily analysis
   * @private
   */
  performDailyAnalysis() {
    const analysis = {
      date: moment().format('YYYY-MM-DD'),
      phoneNumbers: {},
      patterns: {
        topProblematicTemplates: [],
        topProblematicAdvisors: [],
        peakFailureTimes: []
      },
      recommendations: []
    };
    
    // Analyze each phone number
    for (const [phoneNumberId, status] of this.currentStatus) {
      const metrics = this.calculateMetrics(phoneNumberId);
      
      analysis.phoneNumbers[phoneNumberId] = {
        quality: status.quality,
        metrics,
        trend: this.calculateQualityTrend(phoneNumberId)
      };
    }
    
    // Identify patterns
    analysis.patterns.topProblematicTemplates = Array.from(this.patterns.problematicTemplates)
      .slice(0, 5);
    analysis.patterns.topProblematicAdvisors = Array.from(this.patterns.problematicAdvisors)
      .slice(0, 5);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(analysis);
    
    // Emit daily report
    this.emit('analysis:daily', analysis);
    
    // Reset daily patterns
    this.patterns.problematicTemplates.clear();
    this.patterns.problematicAdvisors.clear();
  }
  
  /**
   * Calculate quality trend
   * @private
   */
  calculateQualityTrend(phoneNumberId) {
    const history = this.qualityHistory.get(phoneNumberId) || [];
    
    if (history.length < 2) {
      return 'STABLE';
    }
    
    const recent = history.slice(-7); // Last 7 entries
    let improving = 0;
    let degrading = 0;
    
    for (let i = 1; i < recent.length; i++) {
      const prevScore = this.getQualityScore(recent[i - 1].quality);
      const currScore = this.getQualityScore(recent[i].quality);
      
      if (currScore > prevScore) improving++;
      if (currScore < prevScore) degrading++;
    }
    
    if (improving > degrading) return 'IMPROVING';
    if (degrading > improving) return 'DEGRADING';
    return 'STABLE';
  }
  
  /**
   * Generate recommendations based on analysis
   * @private
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    for (const [phoneNumberId, data] of Object.entries(analysis.phoneNumbers)) {
      if (data.quality === 'LOW' || data.quality === 'FLAGGED') {
        recommendations.push({
          type: 'URGENT',
          phoneNumberId,
          action: 'Consider replacing this number or implementing 72-hour cooldown'
        });
      }
      
      if (data.trend === 'DEGRADING') {
        recommendations.push({
          type: 'WARNING',
          phoneNumberId,
          action: 'Quality trending down - review content and frequency'
        });
      }
      
      if (data.metrics.blockRate > this.config.alertThresholds.blockRate * 0.8) {
        recommendations.push({
          type: 'PREVENTIVE',
          phoneNumberId,
          action: 'Block rate approaching threshold - increase personalization'
        });
      }
    }
    
    if (analysis.patterns.topProblematicTemplates.length > 0) {
      recommendations.push({
        type: 'CONTENT',
        action: `Review and revise templates: ${analysis.patterns.topProblematicTemplates.join(', ')}`
      });
    }
    
    return recommendations;
  }
  
  /**
   * Increase monitoring frequency for specific number
   * @private
   */
  increaseMonitoringFrequency(phoneNumberId) {
    // Create dedicated monitoring for this number
    const enhancedInterval = setInterval(() => {
      const metrics = this.calculateMetrics(phoneNumberId);
      const status = this.currentStatus.get(phoneNumberId);
      
      console.log(`Enhanced monitoring for ${phoneNumberId}:`, {
        quality: status?.quality,
        metrics
      });
      
      // Check if situation improved
      if (metrics.blockRate < this.config.alertThresholds.blockRate * 0.5 &&
          metrics.reportRate < this.config.alertThresholds.reportRate * 0.5) {
        console.log(`Situation improved for ${phoneNumberId}, reducing monitoring`);
        clearInterval(enhancedInterval);
      }
    }, 60000); // Check every minute
    
    // Auto-stop after 48 hours
    setTimeout(() => {
      clearInterval(enhancedInterval);
    }, 48 * 3600000);
  }
  
  /**
   * Cleanup old metrics data
   * @private
   */
  cleanupOldMetrics(phoneNumberId) {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    
    // Clean each metric type
    ['messages', 'blocks', 'reports', 'failures'].forEach(metricType => {
      const data = this.metrics[metricType].get(phoneNumberId);
      if (data) {
        this.metrics[metricType].set(
          phoneNumberId,
          data.filter(item => item.timestamp > sevenDaysAgo)
        );
      }
    });
  }
  
  /**
   * Get quality report for a phone number
   * @public
   */
  getQualityReport(phoneNumberId) {
    const status = this.currentStatus.get(phoneNumberId);
    const metrics = this.calculateMetrics(phoneNumberId);
    const trend = this.calculateQualityTrend(phoneNumberId);
    const recoveryPlan = this.recoveryPlans.get(phoneNumberId);
    
    return {
      phoneNumberId,
      currentQuality: status?.quality || 'UNKNOWN',
      lastUpdated: status?.lastUpdated,
      metrics,
      trend,
      recoveryPlan: recoveryPlan ? {
        severity: recoveryPlan.severity,
        createdAt: recoveryPlan.createdAt,
        actionsCount: recoveryPlan.immediateActions.length + 
                     recoveryPlan.shortTermActions.length + 
                     recoveryPlan.longTermActions.length
      } : null
    };
  }
  
  /**
   * Get overall quality dashboard
   * @public
   */
  getDashboard() {
    const dashboard = {
      timestamp: new Date(),
      phoneNumbers: [],
      overallHealth: 'GOOD',
      activeRecoveryPlans: this.recoveryPlans.size,
      patterns: {
        problematicTemplates: this.patterns.problematicTemplates.size,
        problematicAdvisors: this.patterns.problematicAdvisors.size
      }
    };
    
    // Add each phone number's status
    for (const [phoneNumberId, status] of this.currentStatus) {
      const metrics = this.calculateMetrics(phoneNumberId);
      dashboard.phoneNumbers.push({
        id: phoneNumberId,
        quality: status.quality,
        metrics: {
          messages: metrics.totalMessages,
          blockRate: (metrics.blockRate * 100).toFixed(2) + '%',
          reportRate: (metrics.reportRate * 100).toFixed(2) + '%',
          failureRate: (metrics.failureRate * 100).toFixed(2) + '%'
        }
      });
      
      // Update overall health
      if (status.quality === 'FLAGGED' || status.quality === 'LOW') {
        dashboard.overallHealth = 'CRITICAL';
      } else if (status.quality === 'MEDIUM' && dashboard.overallHealth !== 'CRITICAL') {
        dashboard.overallHealth = 'WARNING';
      }
    }
    
    return dashboard;
  }
  
  /**
   * Cleanup and stop monitoring
   * @public
   */
  cleanup() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.dailyAnalysis) {
      clearInterval(this.dailyAnalysis);
    }
  }
}

module.exports = WhatsAppQualityMonitor;