/**
 * Alerting System for JARVISH Platform
 * Manages alerts, notifications, and incident escalation
 */

import axios from 'axios';
import { metrics } from './metrics-collector';
import logger from './logger';

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum AlertChannel {
  PAGERDUTY = 'pagerduty',
  SLACK = 'slack',
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook'
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
  channels: AlertChannel[];
  acknowledged?: boolean;
  resolvedAt?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: AlertSeverity;
  channels: AlertChannel[];
  cooldown: number; // minutes
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration?: number; // seconds
  aggregation?: 'avg' | 'sum' | 'min' | 'max';
}

class AlertingSystem {
  private static instance: AlertingSystem;
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  
  private constructor() {
    this.initializeAlertRules();
    this.startMonitoring();
  }
  
  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }
  
  private initializeAlertRules() {
    // SLA Critical Alerts
    this.addRule({
      id: 'whatsapp-delivery-sla',
      name: 'WhatsApp Delivery SLA Violation',
      description: 'WhatsApp delivery rate below 99% SLA',
      condition: {
        metric: 'jarvish_whatsapp_delivery_rate',
        operator: 'lt',
        threshold: 99,
        duration: 300 // 5 minutes
      },
      severity: AlertSeverity.CRITICAL,
      channels: [AlertChannel.PAGERDUTY, AlertChannel.SLACK],
      cooldown: 15,
      enabled: true
    });
    
    this.addRule({
      id: 'api-response-time-sla',
      name: 'API Response Time SLA Violation',
      description: 'API P95 response time exceeds 1.5 seconds',
      condition: {
        metric: 'jarvish_api_duration_seconds',
        operator: 'gt',
        threshold: 1.5,
        duration: 180,
        aggregation: 'avg'
      },
      severity: AlertSeverity.HIGH,
      channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
      cooldown: 30,
      enabled: true
    });
    
    // System Health Alerts
    this.addRule({
      id: 'system-health-critical',
      name: 'System Health Critical',
      description: 'Overall system health below critical threshold',
      condition: {
        metric: 'jarvish_system_health',
        operator: 'lt',
        threshold: 50,
        duration: 60
      },
      severity: AlertSeverity.CRITICAL,
      channels: [AlertChannel.PAGERDUTY, AlertChannel.SLACK, AlertChannel.SMS],
      cooldown: 10,
      enabled: true
    });
    
    this.addRule({
      id: 'database-connection-pool',
      name: 'Database Connection Pool Exhausted',
      description: 'Database connection pool near exhaustion',
      condition: {
        metric: 'jarvish_db_connection_pool_size',
        operator: 'gt',
        threshold: 90, // 90% of max connections
        duration: 120
      },
      severity: AlertSeverity.HIGH,
      channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
      cooldown: 20,
      enabled: true
    });
    
    // Performance Alerts
    this.addRule({
      id: 'high-error-rate',
      name: 'High API Error Rate',
      description: 'API error rate exceeds threshold',
      condition: {
        metric: 'jarvish_api_errors_total',
        operator: 'gt',
        threshold: 100, // errors per minute
        duration: 300,
        aggregation: 'sum'
      },
      severity: AlertSeverity.HIGH,
      channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
      cooldown: 15,
      enabled: true
    });
    
    this.addRule({
      id: 'queue-backlog',
      name: 'Queue Backlog High',
      description: 'Message queue backlog exceeding threshold',
      condition: {
        metric: 'jarvish_queue_size',
        operator: 'gt',
        threshold: 5000,
        duration: 600
      },
      severity: AlertSeverity.MEDIUM,
      channels: [AlertChannel.SLACK],
      cooldown: 30,
      enabled: true
    });
    
    // Business Metrics Alerts
    this.addRule({
      id: 'high-churn-rate',
      name: 'High Customer Churn Rate',
      description: 'Customer churn rate exceeds acceptable threshold',
      condition: {
        metric: 'jarvish_churn_rate',
        operator: 'gt',
        threshold: 5, // 5% monthly churn
        duration: 3600
      },
      severity: AlertSeverity.MEDIUM,
      channels: [AlertChannel.EMAIL],
      cooldown: 1440, // Daily
      enabled: true
    });
    
    this.addRule({
      id: 'compliance-violations',
      name: 'Compliance Violations Detected',
      description: 'Multiple compliance violations detected',
      condition: {
        metric: 'jarvish_compliance_violations_total',
        operator: 'gt',
        threshold: 10,
        duration: 3600
      },
      severity: AlertSeverity.HIGH,
      channels: [AlertChannel.SLACK, AlertChannel.EMAIL],
      cooldown: 60,
      enabled: true
    });
    
    // Security Alerts
    this.addRule({
      id: 'suspicious-activity',
      name: 'Suspicious Activity Detected',
      description: 'Unusual access patterns or security events',
      condition: {
        metric: 'jarvish_security_events',
        operator: 'gt',
        threshold: 5,
        duration: 300
      },
      severity: AlertSeverity.CRITICAL,
      channels: [AlertChannel.PAGERDUTY, AlertChannel.SLACK, AlertChannel.SMS],
      cooldown: 5,
      enabled: true
    });
  }
  
  private addRule(rule: AlertRule) {
    this.alertRules.set(rule.id, rule);
  }
  
  private startMonitoring() {
    // Check alert conditions every 30 seconds
    setInterval(() => {
      this.checkAlertConditions();
    }, 30000);
  }
  
  private async checkAlertConditions() {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;
      
      try {
        // Check if in cooldown period
        const lastAlert = this.lastAlertTime.get(ruleId);
        if (lastAlert) {
          const cooldownMs = rule.cooldown * 60 * 1000;
          if (Date.now() - lastAlert.getTime() < cooldownMs) {
            continue;
          }
        }
        
        // Evaluate condition
        const shouldAlert = await this.evaluateCondition(rule.condition);
        
        if (shouldAlert) {
          await this.triggerAlert(rule);
        }
      } catch (error) {
        logger.error(`Failed to check alert rule ${ruleId}`, error);
      }
    }
  }
  
  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    // This is a simplified implementation
    // In production, you would query actual metrics from Prometheus or your metrics store
    
    // For demonstration, we'll use random values
    const currentValue = Math.random() * 100;
    
    switch (condition.operator) {
      case 'gt':
        return currentValue > condition.threshold;
      case 'lt':
        return currentValue < condition.threshold;
      case 'gte':
        return currentValue >= condition.threshold;
      case 'lte':
        return currentValue <= condition.threshold;
      case 'eq':
        return currentValue === condition.threshold;
      default:
        return false;
    }
  }
  
  private async triggerAlert(rule: AlertRule) {
    const alert: Alert = {
      id: `alert-${Date.now()}-${rule.id}`,
      title: rule.name,
      description: rule.description,
      severity: rule.severity,
      source: 'jarvish-monitoring',
      timestamp: new Date().toISOString(),
      channels: rule.channels,
      metadata: {
        ruleId: rule.id,
        condition: rule.condition
      }
    };
    
    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.lastAlertTime.set(rule.id, new Date());
    
    // Log alert
    logger.warn(`Alert triggered: ${alert.title}`, {
      alert,
      severity: alert.severity
    });
    
    // Send notifications
    for (const channel of rule.channels) {
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        logger.error(`Failed to send alert to ${channel}`, error);
      }
    }
  }
  
  private async sendNotification(channel: AlertChannel, alert: Alert) {
    switch (channel) {
      case AlertChannel.PAGERDUTY:
        await this.sendPagerDutyAlert(alert);
        break;
      case AlertChannel.SLACK:
        await this.sendSlackAlert(alert);
        break;
      case AlertChannel.EMAIL:
        await this.sendEmailAlert(alert);
        break;
      case AlertChannel.SMS:
        await this.sendSmsAlert(alert);
        break;
      case AlertChannel.WEBHOOK:
        await this.sendWebhookAlert(alert);
        break;
    }
  }
  
  private async sendPagerDutyAlert(alert: Alert) {
    if (!process.env.PAGERDUTY_INTEGRATION_KEY) {
      logger.warn('PagerDuty integration key not configured');
      return;
    }
    
    const payload = {
      routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
      event_action: 'trigger',
      payload: {
        summary: alert.title,
        severity: this.mapSeverityToPagerDuty(alert.severity),
        source: alert.source,
        timestamp: alert.timestamp,
        custom_details: {
          description: alert.description,
          ...alert.metadata
        }
      }
    };
    
    try {
      await axios.post('https://events.pagerduty.com/v2/enqueue', payload);
      logger.info('PagerDuty alert sent', { alertId: alert.id });
    } catch (error) {
      logger.error('Failed to send PagerDuty alert', error);
      throw error;
    }
  }
  
  private async sendSlackAlert(alert: Alert) {
    if (!process.env.SLACK_WEBHOOK_URL) {
      logger.warn('Slack webhook URL not configured');
      return;
    }
    
    const color = this.mapSeverityToColor(alert.severity);
    const emoji = this.mapSeverityToEmoji(alert.severity);
    
    const payload = {
      attachments: [{
        color,
        title: `${emoji} ${alert.title}`,
        text: alert.description,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toLocaleString(),
            short: true
          }
        ],
        footer: 'JARVISH Monitoring',
        ts: Math.floor(Date.now() / 1000)
      }]
    };
    
    try {
      await axios.post(process.env.SLACK_WEBHOOK_URL, payload);
      logger.info('Slack alert sent', { alertId: alert.id });
    } catch (error) {
      logger.error('Failed to send Slack alert', error);
      throw error;
    }
  }
  
  private async sendEmailAlert(alert: Alert) {
    // Implementation would use your email service (SendGrid, SES, etc.)
    logger.info('Email alert would be sent', { alertId: alert.id });
  }
  
  private async sendSmsAlert(alert: Alert) {
    // Implementation would use SMS service (Twilio, etc.)
    logger.info('SMS alert would be sent', { alertId: alert.id });
  }
  
  private async sendWebhookAlert(alert: Alert) {
    if (!process.env.ALERT_WEBHOOK_URL) {
      logger.warn('Alert webhook URL not configured');
      return;
    }
    
    try {
      await axios.post(process.env.ALERT_WEBHOOK_URL, alert);
      logger.info('Webhook alert sent', { alertId: alert.id });
    } catch (error) {
      logger.error('Failed to send webhook alert', error);
      throw error;
    }
  }
  
  // Helper methods
  private mapSeverityToPagerDuty(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return 'critical';
      case AlertSeverity.HIGH:
        return 'error';
      case AlertSeverity.MEDIUM:
        return 'warning';
      case AlertSeverity.LOW:
      case AlertSeverity.INFO:
        return 'info';
      default:
        return 'info';
    }
  }
  
  private mapSeverityToColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '#FF0000';
      case AlertSeverity.HIGH:
        return '#FF8C00';
      case AlertSeverity.MEDIUM:
        return '#FFD700';
      case AlertSeverity.LOW:
        return '#00CED1';
      case AlertSeverity.INFO:
        return '#808080';
      default:
        return '#808080';
    }
  }
  
  private mapSeverityToEmoji(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.CRITICAL:
        return '🚨';
      case AlertSeverity.HIGH:
        return '⚠️';
      case AlertSeverity.MEDIUM:
        return '📢';
      case AlertSeverity.LOW:
        return 'ℹ️';
      case AlertSeverity.INFO:
        return '💡';
      default:
        return '📌';
    }
  }
  
  // Public methods
  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }
  
  public acknowledgeAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', { alertId });
    }
  }
  
  public resolveAlert(alertId: string) {
    const alert = this.activeAlerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date().toISOString();
      this.activeAlerts.delete(alertId);
      logger.info('Alert resolved', { alertId });
    }
  }
  
  public getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }
  
  public updateRule(ruleId: string, updates: Partial<AlertRule>) {
    const rule = this.alertRules.get(ruleId);
    if (rule) {
      Object.assign(rule, updates);
      logger.info('Alert rule updated', { ruleId, updates });
    }
  }
}

export default AlertingSystem.getInstance();