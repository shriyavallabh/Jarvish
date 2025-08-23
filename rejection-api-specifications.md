# Rejection-Regeneration API Specifications
## Complete API Documentation for Jarvish Platform

### Table of Contents
1. [Authentication](#authentication)
2. [Rejection & Feedback APIs](#rejection--feedback-apis)
3. [Regeneration APIs](#regeneration-apis)
4. [Pattern Analysis APIs](#pattern-analysis-apis)
5. [Learning Pipeline APIs](#learning-pipeline-apis)
6. [Prompt Management APIs](#prompt-management-apis)
7. [WebSocket Events](#websocket-events)
8. [Error Handling](#error-handling)

---

## Authentication

All API requests require authentication using JWT tokens.

```http
Authorization: Bearer <jwt_token>
```

### Token Structure
```json
{
  "sub": "advisor_id",
  "role": "advisor|admin|compliance",
  "permissions": ["content.reject", "content.regenerate"],
  "exp": 1234567890
}
```

---

## Rejection & Feedback APIs

### 1. Submit Content Rejection
```http
POST /api/v1/content/{contentId}/reject
```

**Request Body:**
```json
{
  "quickFeedback": {
    "category": "compliance_violation",
    "subcategory": "disclaimer_missing",
    "severity": "critical",
    "suggestedAction": "regenerate"
  },
  "detailedFeedback": {
    "text": "The content is missing the mandatory mutual fund disclaimer and uses promotional language that violates SEBI guidelines.",
    "specificIssues": [
      {
        "location": "paragraph_2",
        "issue": "Uses term 'guaranteed returns'",
        "suggestion": "Replace with 'potential returns subject to market risks'"
      }
    ],
    "suggestions": [
      "Add standard mutual fund disclaimer",
      "Remove all guarantee-related language",
      "Soften promotional tone"
    ],
    "contextualNotes": "This is for a conservative investor segment"
  },
  "metadata": {
    "reviewDuration": 45000,
    "deviceType": "desktop",
    "userAgent": "Mozilla/5.0..."
  }
}
```

**Response (200 OK):**
```json
{
  "rejectionId": "rej_abc123def456",
  "contentId": "cnt_789ghi012jkl",
  "regenerationStatus": "queued",
  "estimatedTime": 1200,
  "queuePosition": 3,
  "aiAnalysis": {
    "detectedCategory": "compliance_violation",
    "confidence": 0.92,
    "extractedIssues": [
      "missing_disclaimer",
      "promotional_language",
      "guarantee_claims"
    ],
    "sentiment": {
      "score": -0.6,
      "emotion": "concerned"
    }
  },
  "nextSteps": {
    "autoRegeneration": true,
    "escalationLevel": 0,
    "humanReviewRequired": false
  }
}
```

### 2. Get Rejection History
```http
GET /api/v1/content/{contentId}/rejections?limit=10&offset=0&includeRegenerations=true
```

**Response (200 OK):**
```json
{
  "rejections": [
    {
      "id": "rej_abc123def456",
      "timestamp": "2024-01-15T10:30:00Z",
      "category": "compliance_violation",
      "severity": "critical",
      "feedback": {
        "quick": {
          "category": "compliance_violation",
          "subcategory": "disclaimer_missing"
        },
        "detailed": {
          "text": "Missing disclaimer...",
          "issues": []
        }
      },
      "regenerations": [
        {
          "attemptNumber": 1,
          "strategy": "compliance_enhancement",
          "outcome": "failed",
          "processingTime": 1150
        },
        {
          "attemptNumber": 2,
          "strategy": "template_based",
          "outcome": "success",
          "processingTime": 890
        }
      ],
      "finalStatus": "approved",
      "timeToApproval": 135000
    }
  ],
  "pagination": {
    "total": 23,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### 3. Submit Bulk Feedback
```http
POST /api/v1/feedback/bulk
```

**Request Body:**
```json
{
  "feedbacks": [
    {
      "contentId": "cnt_123",
      "quickFeedback": {
        "category": "tone_inappropriate",
        "severity": "minor"
      }
    },
    {
      "contentId": "cnt_124",
      "quickFeedback": {
        "category": "length_issue",
        "severity": "major"
      }
    }
  ],
  "commonIssues": ["tone_consistency", "brand_voice"],
  "batchMetadata": {
    "reviewSession": "session_xyz",
    "reviewer": "compliance_team"
  }
}
```

---

## Regeneration APIs

### 1. Trigger Content Regeneration
```http
POST /api/v1/regenerate
```

**Request Body:**
```json
{
  "rejectionId": "rej_abc123def456",
  "strategy": "advanced",
  "urgency": "high",
  "constraints": {
    "maxLength": 500,
    "tone": "professional",
    "includeElements": ["disclaimer", "risk_warning"],
    "excludeTerms": ["guaranteed", "assured"]
  },
  "fallbackOptions": {
    "allowTemplates": true,
    "allowSimilarContent": true,
    "maxProcessingTime": 1500
  }
}
```

**Response (202 Accepted):**
```json
{
  "regenerationId": "regen_xyz789",
  "status": "processing",
  "estimatedTime": 1100,
  "queuePosition": 2,
  "strategy": {
    "primary": "advanced",
    "fallbacks": ["template_based", "similar_content"]
  },
  "websocketChannel": "ws://api/v1/regeneration/regen_xyz789"
}
```

### 2. Get Regeneration Status
```http
GET /api/v1/regenerate/{regenerationId}/status
```

**Response (200 OK):**
```json
{
  "regenerationId": "regen_xyz789",
  "status": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "content": {
      "text": "Mutual fund investments are subject to market risks...",
      "metadata": {
        "wordCount": 485,
        "readingLevel": "10th grade",
        "complianceScore": 0.98
      }
    },
    "strategy": "advanced",
    "processingTime": 1050,
    "modifications": [
      "Added mandatory disclaimer",
      "Removed promotional language",
      "Adjusted tone to professional",
      "Shortened to meet length constraint"
    ],
    "validation": {
      "compliancePassed": true,
      "lengthValid": true,
      "toneAppropriate": true
    }
  },
  "performanceMetrics": {
    "promptOptimizationTime": 120,
    "generationTime": 850,
    "validationTime": 80,
    "cacheHit": false
  }
}
```

### 3. Batch Regeneration
```http
POST /api/v1/regenerate/batch
```

**Request Body:**
```json
{
  "rejectionIds": ["rej_001", "rej_002", "rej_003"],
  "commonStrategy": "template_based",
  "sharedConstraints": {
    "tone": "professional",
    "complianceLevel": "strict"
  },
  "processingMode": "parallel",
  "maxConcurrent": 3
}
```

---

## Pattern Analysis APIs

### 1. Get Rejection Patterns
```http
GET /api/v1/analytics/patterns?timeframe=7d&category=compliance_violation&minConfidence=0.8
```

**Response (200 OK):**
```json
{
  "patterns": [
    {
      "id": "pattern_001",
      "type": "recurring_compliance_issue",
      "category": "compliance_violation",
      "frequency": 47,
      "confidence": 0.89,
      "characteristics": {
        "commonIssues": ["missing_disclaimer", "promotional_language"],
        "affectedContentTypes": ["market_update", "investment_advice"],
        "timeDistribution": {
          "peak_hours": ["09:00-11:00", "14:00-16:00"],
          "peak_days": ["Monday", "Friday"]
        }
      },
      "insights": {
        "rootCause": "Prompt lacks explicit compliance instructions",
        "impact": "15% rejection rate increase",
        "recommendation": "Update system prompt with compliance checklist"
      }
    }
  ],
  "summary": {
    "totalPatterns": 8,
    "highConfidence": 5,
    "actionableInsights": 12,
    "estimatedImpact": {
      "rejectionReduction": "25-30%",
      "timeToApproval": "-40%"
    }
  }
}
```

### 2. Analyze Feedback Sentiment
```http
POST /api/v1/analytics/sentiment
```

**Request Body:**
```json
{
  "feedbackTexts": [
    "This content completely misses the mark on compliance",
    "The tone is too casual for our professional audience",
    "Good attempt but needs minor adjustments"
  ]
}
```

**Response (200 OK):**
```json
{
  "sentiments": [
    {
      "text": "This content completely misses the mark on compliance",
      "score": -0.8,
      "emotion": "frustrated",
      "urgency": "high",
      "actionability": 0.9
    },
    {
      "text": "The tone is too casual for our professional audience",
      "score": -0.4,
      "emotion": "concerned",
      "urgency": "medium",
      "actionability": 0.8
    },
    {
      "text": "Good attempt but needs minor adjustments",
      "score": 0.2,
      "emotion": "constructive",
      "urgency": "low",
      "actionability": 0.7
    }
  ],
  "aggregate": {
    "overallSentiment": -0.33,
    "dominantEmotion": "concerned",
    "averageUrgency": "medium"
  }
}
```

---

## Learning Pipeline APIs

### 1. Trigger Learning Process
```http
POST /api/v1/learning/process
```

**Request Body:**
```json
{
  "timeframe": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-15T23:59:59Z"
  },
  "scope": {
    "categories": ["compliance_violation", "tone_inappropriate"],
    "minSamples": 20,
    "confidenceThreshold": 0.75
  },
  "learningTypes": ["prompt_optimization", "rule_generation", "pattern_detection"],
  "testMode": true
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "learn_job_123",
  "status": "processing",
  "estimatedTime": 180000,
  "scope": {
    "totalRejections": 342,
    "categoriesAnalyzed": 2,
    "timeframeDays": 15
  },
  "progressWebhook": "https://api/v1/webhooks/learning/learn_job_123"
}
```

### 2. Get Learning Insights
```http
GET /api/v1/learning/insights/{jobId}
```

**Response (200 OK):**
```json
{
  "jobId": "learn_job_123",
  "status": "completed",
  "insights": {
    "promptOptimizations": [
      {
        "id": "opt_001",
        "targetPrompt": "system_prompt_v2",
        "modifications": [
          "Add explicit SEBI compliance checklist",
          "Include tone calibration examples",
          "Strengthen disclaimer requirements"
        ],
        "expectedImprovement": {
          "approvalRate": "+15%",
          "complianceScore": "+0.12",
          "regenerationReduction": "-30%"
        },
        "confidence": 0.87
      }
    ],
    "ruleAdditions": [
      {
        "id": "rule_001",
        "type": "compliance",
        "rule": "REQUIRE disclaimer IN last_paragraph",
        "triggerCount": 47,
        "preventedViolations": 41
      }
    ],
    "antiPatterns": [
      {
        "id": "anti_001",
        "pattern": "Using promotional superlatives",
        "frequency": 28,
        "solution": "Replace with factual descriptors",
        "examples": ["best-in-class", "unbeatable", "guaranteed winner"]
      }
    ]
  },
  "metrics": {
    "patternsDetected": 23,
    "insightsGenerated": 45,
    "highConfidenceInsights": 31,
    "estimatedImpact": {
      "rejectionRateReduction": "28%",
      "processingTimeReduction": "35%"
    }
  }
}
```

### 3. Apply Learning Recommendations
```http
POST /api/v1/learning/apply
```

**Request Body:**
```json
{
  "insightIds": ["opt_001", "rule_001"],
  "applicationMode": "test",
  "testDuration": 3600,
  "rollbackOnFailure": true,
  "successCriteria": {
    "minApprovalRate": 0.8,
    "maxRejectionRate": 0.2,
    "complianceScore": 0.95
  }
}
```

---

## Prompt Management APIs

### 1. Get Prompt Versions
```http
GET /api/v1/prompts/system_prompt/versions?limit=5
```

**Response (200 OK):**
```json
{
  "promptKey": "system_prompt",
  "versions": [
    {
      "version": "2.3.1",
      "status": "active",
      "content": "You are a financial content generator...",
      "performance": {
        "uses": 1543,
        "approvalRate": 0.84,
        "avgRegenerations": 1.2,
        "complianceScore": 0.96
      },
      "changes": [
        "Added SEBI compliance section",
        "Updated tone guidelines"
      ],
      "activeSince": "2024-01-10T00:00:00Z"
    },
    {
      "version": "2.3.0",
      "status": "archived",
      "archivedReason": "Lower approval rate"
    }
  ],
  "comparison": {
    "current_vs_previous": {
      "approvalRateChange": "+5%",
      "complianceScoreChange": "+0.02",
      "regenerationChange": "-15%"
    }
  }
}
```

### 2. Create Prompt Version
```http
POST /api/v1/prompts/system_prompt/versions
```

**Request Body:**
```json
{
  "baseVersion": "2.3.1",
  "modifications": [
    {
      "type": "addition",
      "section": "compliance",
      "content": "ALWAYS include the following disclaimer..."
    },
    {
      "type": "modification",
      "section": "tone",
      "content": "Maintain a professional yet approachable tone..."
    }
  ],
  "testConfiguration": {
    "duration": 7200,
    "trafficPercentage": 10,
    "comparisonMetrics": ["approval_rate", "compliance_score", "regeneration_count"]
  },
  "metadata": {
    "author": "learning_system",
    "reason": "Pattern analysis recommendations",
    "ticket": "JIRA-1234"
  }
}
```

### 3. Prompt A/B Testing
```http
POST /api/v1/prompts/test
```

**Request Body:**
```json
{
  "control": {
    "promptKey": "system_prompt",
    "version": "2.3.1"
  },
  "variants": [
    {
      "promptKey": "system_prompt",
      "version": "2.4.0-beta"
    }
  ],
  "testConfig": {
    "duration": 86400,
    "trafficSplit": [50, 50],
    "metrics": ["approval_rate", "regeneration_count", "processing_time"],
    "minimumSampleSize": 100
  }
}
```

---

## WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://api.jarvish.com/v1/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    events: [
      'rejection.received',
      'regeneration.progress',
      'pattern.detected',
      'learning.insight'
    ],
    filters: {
      severity: ['critical', 'major'],
      categories: ['compliance_violation']
    }
  }));
};
```

### Event Types

#### Rejection Events
```json
{
  "type": "rejection.received",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "rejectionId": "rej_123",
    "contentId": "cnt_456",
    "category": "compliance_violation",
    "severity": "critical",
    "advisor": "adv_789"
  }
}
```

#### Regeneration Progress
```json
{
  "type": "regeneration.progress",
  "timestamp": "2024-01-15T10:30:05Z",
  "data": {
    "regenerationId": "regen_123",
    "progress": 65,
    "currentStep": "validation",
    "estimatedTimeRemaining": 500
  }
}
```

#### Pattern Detection
```json
{
  "type": "pattern.detected",
  "timestamp": "2024-01-15T10:35:00Z",
  "data": {
    "patternId": "pat_123",
    "type": "recurring_issue",
    "confidence": 0.92,
    "affectedCount": 15,
    "recommendation": "Update compliance prompt section"
  }
}
```

#### Learning Insights
```json
{
  "type": "learning.insight",
  "timestamp": "2024-01-15T11:00:00Z",
  "data": {
    "insightId": "ins_123",
    "type": "prompt_optimization",
    "impact": "high",
    "recommendation": "Implement suggested prompt changes",
    "expectedImprovement": {
      "approvalRate": "+12%"
    }
  }
}
```

---

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid feedback category provided",
    "details": {
      "field": "quickFeedback.category",
      "provided": "invalid_category",
      "allowed": ["compliance_violation", "tone_inappropriate", ...]
    },
    "timestamp": "2024-01-15T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Common Error Codes
| Code | HTTP Status | Description |
|------|------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `CONTENT_NOT_FOUND` | 404 | Content ID doesn't exist |
| `REGENERATION_TIMEOUT` | 408 | Regeneration exceeded time limit |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Temporary service outage |

### Rate Limiting
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1642255200
```

### Retry Strategy
```json
{
  "error": {
    "code": "SERVICE_BUSY",
    "message": "Service temporarily busy",
    "retry": {
      "after": 5000,
      "maxAttempts": 3,
      "backoff": "exponential"
    }
  }
}
```

---

## API Versioning

All APIs follow semantic versioning. The version is specified in the URL path:

```
/api/v1/...  (current stable)
/api/v2/...  (next version, in beta)
```

Deprecated endpoints include a deprecation header:
```http
X-API-Deprecation-Date: 2024-06-01
X-API-Deprecation-Info: Use /api/v2/content/reject instead
```