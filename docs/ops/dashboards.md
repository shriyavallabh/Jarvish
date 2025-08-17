# Observability Dashboards - Datadog & Grafana 📟

## Dashboard Architecture Overview

### Dashboard Hierarchy
```yaml
dashboard_structure:
  executive_level:
    - "Business KPIs & North Star Metrics"
    - "Advisor Health & Growth Dashboard"
    - "Compliance & Risk Overview"
    
  operational_level:
    - "Delivery Pipeline Status (06:00 IST Focus)"
    - "AI Processing & Performance"
    - "WhatsApp Health & Quality"
    - "Infrastructure & System Health"
    
  engineering_level:
    - "Application Performance Monitoring"
    - "Database & Cache Performance" 
    - "Error Analysis & Debugging"
    - "Cost & Resource Optimization"
```

## Executive Dashboards

### 1. Business KPIs & North Star Metrics
**Platform**: Datadog  
**Audience**: C-Level, Board  
**Refresh**: Real-time with 5-minute aggregation  

```json
{
  "dashboard_name": "Executive - Business KPIs",
  "layout_type": "ordered",
  "widgets": [
    {
      "widget_type": "query_value",
      "title": "99% Delivery SLA (North Star)",
      "metric": "whatsapp.delivery.success_rate",
      "aggregation": "avg",
      "timeframe": "1mo",
      "precision": 3,
      "conditional_formats": [
        {"comparator": ">=", "value": 99.0, "palette": "white_on_green"},
        {"comparator": "<", "value": 99.0, "palette": "white_on_red"}
      ]
    },
    {
      "widget_type": "timeseries",
      "title": "Daily Active Advisors",
      "metrics": [
        "advisors.daily_active.count",
        "advisors.content_created.unique_count",
        "advisors.whatsapp_delivered.unique_count"
      ],
      "timeframe": "1mo"
    },
    {
      "widget_type": "query_value",
      "title": "Monthly Recurring Revenue",
      "metric": "business.mrr.current",
      "aggregation": "latest",
      "timeframe": "1d",
      "unit": "₹"
    },
    {
      "widget_type": "heatmap",
      "title": "Advisor Health Score Distribution",
      "metric": "advisors.health_score.distribution",
      "bins": ["0-25", "25-50", "50-75", "75-90", "90-100"],
      "timeframe": "1w"
    }
  ]
}
```

### 2. Advisor Health & Growth Dashboard
**Platform**: Datadog  
**Audience**: Leadership, Product, Customer Success  

```json
{
  "dashboard_name": "Executive - Advisor Health & Growth",
  "widgets": [
    {
      "widget_type": "sunburst", 
      "title": "Advisor Segmentation",
      "metrics": [
        "advisors.tier.basic.count",
        "advisors.tier.standard.count", 
        "advisors.tier.pro.count"
      ],
      "breakdown_by": "advisor.health_status"
    },
    {
      "widget_type": "funnel",
      "title": "Onboarding Conversion Funnel",
      "stages": [
        {"stage": "signups", "metric": "advisors.signup.count"},
        {"stage": "email_verified", "metric": "advisors.email_verified.count"},
        {"stage": "whatsapp_connected", "metric": "advisors.whatsapp_connected.count"},
        {"stage": "first_content", "metric": "advisors.first_content.count"},
        {"stage": "first_delivery", "metric": "advisors.first_delivery.count"}
      ]
    },
    {
      "widget_type": "timeseries",
      "title": "Churn Risk Analysis",
      "metrics": [
        "advisors.churn_risk.high.count",
        "advisors.churn_risk.medium.count", 
        "advisors.engagement_score.avg"
      ],
      "timeframe": "1mo"
    }
  ]
}
```

### 3. Compliance & Risk Overview
**Platform**: Datadog  
**Audience**: Legal, Compliance, Leadership  

```json
{
  "dashboard_name": "Executive - Compliance & Risk",
  "widgets": [
    {
      "widget_type": "alert_graph",
      "title": "Critical Compliance Alerts",
      "alert_query": "sebi.violation.critical:*",
      "timeframe": "1w"
    },
    {
      "widget_type": "distribution",
      "title": "Content Risk Score Distribution", 
      "metric": "content.risk_score",
      "percentiles": [50, 75, 90, 95, 99],
      "timeframe": "1d"
    },
    {
      "widget_type": "query_value",
      "title": "Zero Compliance Incidents",
      "metric": "compliance.incidents.count",
      "aggregation": "sum",
      "timeframe": "1mo",
      "conditional_formats": [
        {"comparator": "==", "value": 0, "palette": "white_on_green"},
        {"comparator": ">", "value": 0, "palette": "white_on_red"}
      ]
    },
    {
      "widget_type": "log_stream",
      "title": "Recent SEBI Audit Events",
      "query": "service:compliance source:sebi_audit",
      "columns": ["timestamp", "advisor_id", "content_id", "action"],
      "timeframe": "1d"
    }
  ]
}
```

## Operational Dashboards

### 4. Delivery Pipeline Status (06:00 IST Focus)
**Platform**: Grafana  
**Audience**: Operations, Engineering  
**Refresh**: 30-second real-time during delivery window  

```json
{
  "dashboard": {
    "title": "Delivery Pipeline - 06:00 IST",
    "time": {"from": "now-2h", "to": "now"},
    "refresh": "30s",
    "panels": [
      {
        "title": "Real-time Delivery Success Rate",
        "type": "stat",
        "targets": [
          {
            "query": "rate(whatsapp_delivery_success_total[5m]) * 100",
            "legendFormat": "Success %"
          }
        ],
        "thresholds": [
          {"color": "red", "value": 0},
          {"color": "yellow", "value": 95},
          {"color": "green", "value": 99}
        ]
      },
      {
        "title": "Delivery Timeline (05:30-06:30 IST)",
        "type": "graph",
        "targets": [
          {"query": "whatsapp_messages_sent_total", "legendFormat": "Messages Sent"},
          {"query": "whatsapp_messages_delivered_total", "legendFormat": "Delivered"},
          {"query": "whatsapp_messages_failed_total", "legendFormat": "Failed"}
        ],
        "xAxis": {"buckets": null, "mode": "time"},
        "yAxis": {"label": "Message Count"}
      },
      {
        "title": "Queue Processing Status",
        "type": "table",
        "targets": [
          {
            "query": "approval_queue_pending_count by (priority)",
            "format": "table"
          }
        ]
      },
      {
        "title": "Advisor Delivery Heatmap",
        "type": "heatmap",
        "targets": [
          {
            "query": "whatsapp_delivery_success_by_advisor",
            "legendFormat": "{{advisor_tier}}"
          }
        ]
      }
    ]
  }
}
```

### 5. AI Processing & Performance
**Platform**: Datadog  
**Audience**: Engineering, AI Team  

```json
{
  "dashboard_name": "AI Processing & Performance",
  "widgets": [
    {
      "widget_type": "timeseries",
      "title": "AI Processing Latency (P95)",
      "metrics": [
        "openai.compliance_check.latency.p95",
        "openai.content_generation.latency.p95",
        "openai.translation.latency.p95"
      ],
      "display_type": "line"
    },
    {
      "widget_type": "query_value",
      "title": "AI Cost (Monthly)",
      "metric": "openai.cost.monthly_spend",
      "aggregation": "sum",
      "unit": "₹",
      "timeframe": "1mo"
    },
    {
      "widget_type": "toplist",
      "title": "Top AI Error Types",
      "metric": "openai.errors.count",
      "aggregation": "sum",
      "group_by": ["error_type"],
      "limit": 10
    },
    {
      "widget_type": "distribution", 
      "title": "Content Generation Token Usage",
      "metric": "openai.tokens.consumed",
      "timeframe": "1d"
    }
  ]
}
```

### 6. WhatsApp Health & Quality
**Platform**: Grafana  
**Audience**: Operations, Marketing  

```json
{
  "dashboard": {
    "title": "WhatsApp Health & Quality",
    "panels": [
      {
        "title": "Quality Rating Status",
        "type": "gauge",
        "targets": [
          {"query": "whatsapp_quality_rating", "legendFormat": "Current Rating"}
        ],
        "fieldConfig": {
          "min": 0,
          "max": 100,
          "thresholds": [
            {"color": "red", "value": 0},
            {"color": "yellow", "value": 70},
            {"color": "green", "value": 80}
          ]
        }
      },
      {
        "title": "Template Performance",
        "type": "table",
        "targets": [
          {
            "query": "whatsapp_template_metrics",
            "format": "table",
            "columns": ["template_name", "success_rate", "read_rate", "usage_count"]
          }
        ]
      },
      {
        "title": "Phone Number Health",
        "type": "heatmap",
        "targets": [
          {"query": "whatsapp_phone_number_health by (phone_number)"}
        ]
      },
      {
        "title": "Delivery Error Analysis",
        "type": "pie",
        "targets": [
          {"query": "whatsapp_delivery_errors by (error_code)"}
        ]
      }
    ]
  }
}
```

## Engineering Dashboards

### 7. Application Performance Monitoring
**Platform**: Datadog  
**Audience**: Engineering Team  

```json
{
  "dashboard_name": "Application Performance Monitoring",
  "widgets": [
    {
      "widget_type": "timeseries",
      "title": "API Response Times (P95)",
      "metrics": [
        "nextjs.api.response_time.p95",
        "nodejs.api.response_time.p95",
        "postgres.query.response_time.p95"
      ]
    },
    {
      "widget_type": "heatmap",
      "title": "HTTP Status Code Distribution",
      "metric": "http.response.status_code",
      "group_by": ["status_code", "endpoint"]
    },
    {
      "widget_type": "error_tracking",
      "title": "Application Errors",
      "service": "project-one-api",
      "env": "production"
    },
    {
      "widget_type": "trace_analytics", 
      "title": "Request Trace Analysis",
      "service": "project-one-api",
      "operation": "*"
    }
  ]
}
```

### 8. Database & Cache Performance
**Platform**: Grafana  
**Audience**: Database Team, Engineering  

```json
{
  "dashboard": {
    "title": "Database & Cache Performance",
    "panels": [
      {
        "title": "PostgreSQL Connection Pool",
        "type": "graph",
        "targets": [
          {"query": "postgresql_connections_active", "legendFormat": "Active"},
          {"query": "postgresql_connections_idle", "legendFormat": "Idle"},
          {"query": "postgresql_connections_max", "legendFormat": "Max"}
        ]
      },
      {
        "title": "Query Performance",
        "type": "table",
        "targets": [
          {
            "query": "postgresql_slow_queries",
            "format": "table",
            "columns": ["query", "avg_duration", "calls", "table"]
          }
        ]
      },
      {
        "title": "Redis Cache Hit Rate",
        "type": "stat",
        "targets": [
          {"query": "redis_cache_hit_rate * 100", "legendFormat": "Hit Rate %"}
        ]
      },
      {
        "title": "Database Locks",
        "type": "graph", 
        "targets": [
          {"query": "postgresql_locks_count by (lock_type)"}
        ]
      }
    ]
  }
}
```

### 9. Cost & Resource Optimization
**Platform**: Datadog  
**Audience**: Engineering, Finance  

```json
{
  "dashboard_name": "Cost & Resource Optimization",
  "widgets": [
    {
      "widget_type": "sunburst",
      "title": "Monthly Cost Breakdown",
      "metrics": [
        "cost.openai.monthly",
        "cost.cloudinary.monthly", 
        "cost.infrastructure.monthly",
        "cost.whatsapp_api.monthly"
      ]
    },
    {
      "widget_type": "timeseries",
      "title": "Resource Utilization Trends",
      "metrics": [
        "infrastructure.cpu.utilization.avg",
        "infrastructure.memory.utilization.avg",
        "infrastructure.disk.utilization.avg"
      ]
    },
    {
      "widget_type": "change",
      "title": "Cost Efficiency Metrics",
      "metrics": [
        "cost.per_advisor.monthly",
        "cost.per_message.delivered",
        "cost.per_content.generated"
      ],
      "change_type": "relative"
    }
  ]
}
```

## Dashboard Configuration Standards

### Datadog Dashboard Configuration
```yaml
datadog_standards:
  naming_convention: "{audience}_{purpose}_{timeframe}"
  examples:
    - "Executive_Business_KPIs"
    - "Operations_Delivery_Realtime"
    - "Engineering_Performance_Debug"
  
  widget_standards:
    colors:
      success: "#1DB584" # Green
      warning: "#FFB84D" # Yellow  
      error: "#F95F53"   # Red
      info: "#3B82F6"    # Blue
    
    time_ranges:
      real_time: "Past 1 hour"
      operational: "Past 4 hours"
      daily: "Past 24 hours" 
      weekly: "Past 7 days"
      monthly: "Past 30 days"
    
  alert_integration:
    all_dashboards_linked_to_relevant_monitors: true
    critical_widgets_have_alert_overlays: true
    anomaly_detection_enabled_for_key_metrics: true
```

### Grafana Dashboard Configuration
```yaml
grafana_standards:
  templating:
    advisor_filter: "{{advisor_id}}"
    environment_filter: "{{env}}"
    time_range_picker: "enabled_all_dashboards"
    
  annotations:
    deployment_markers: true
    incident_markers: true
    maintenance_windows: true
    
  alerting:
    grafana_alerts_for_real_time_metrics: true
    slack_integration: "#alerts-grafana"
    pagerduty_integration: "delivery-team"
    
  data_sources:
    prometheus: "primary_metrics"
    elasticsearch: "log_analysis" 
    postgres: "business_metrics"
    redis: "cache_metrics"
```

## Dashboard Access Control

### Role-Based Dashboard Access
```yaml
access_control:
  executive_dashboards:
    roles: ["ceo", "cto", "board_member"]
    sharing: "organization_wide_read_only"
    
  operational_dashboards:
    roles: ["operations", "engineering", "compliance"]
    sharing: "team_based_read_write"
    
  engineering_dashboards:
    roles: ["engineering", "devops", "site_reliability"]
    sharing: "engineering_team_read_write"
    
  sensitive_dashboards:
    roles: ["admin", "security_team"]
    sharing: "restricted_access_audit_logged"
```

### Dashboard Maintenance Schedule
```yaml
maintenance_schedule:
  daily_health_check:
    - "verify_all_widgets_loading"
    - "check_data_freshness"
    - "validate_alert_thresholds"
    
  weekly_optimization:
    - "review_query_performance"
    - "update_dashboard_descriptions"
    - "clean_unused_metrics"
    
  monthly_review:
    - "stakeholder_feedback_collection"
    - "dashboard_usage_analytics"
    - "cost_optimization_review"
```

This comprehensive dashboard specification provides real-time visibility into all critical aspects of the platform with appropriate detail levels for each audience.