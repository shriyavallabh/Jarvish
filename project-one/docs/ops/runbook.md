# Operations Runbook - Project One

## Daily Operations Schedule

### 20:30-21:30 IST - Nightly Processing Window
**Pre-render Phase**: All approved content rendered and cached
1. **Queue Status Check**: Verify all pending packs processed
2. **Render Quality Check**: Visual validation, disclaimer verification
3. **Template Validation**: Ensure WhatsApp templates active
4. **Fallback Assignment**: Auto-assign for advisors without approved content
5. **Canary Test**: Send test messages to internal list

### 05:50 IST - Pre-Delivery Checks
1. **System Health**: API, database, storage connectivity
2. **WhatsApp Status**: Quality rating, template availability
3. **Content Ready**: Verify all scheduled packs rendered
4. **Queue Preparation**: Load delivery queue with jitter timing

### 06:00-06:05 IST - Delivery Window (Critical)
**On-Call Active**: DevOps engineer must be available
1. **Fan-out Start**: Begin WhatsApp delivery with rate limiting
2. **Real-time Monitoring**: Track delivery success rates
3. **Auto-retry Logic**: Handle failed sends with exponential backoff
4. **Success Validation**: Confirm >99% delivery rate by 06:05

## Incident Response Procedures

### P0: Critical Delivery Failure (>2% failure rate during delivery)
**Immediate Actions (0-15min):**
1. **Alert Acknowledgment**: Page on-call engineer
2. **Impact Assessment**: Count affected advisors, identify root cause
3. **Communication**: Update status page, notify leadership
4. **Mitigation**: 
   - Switch to backup WhatsApp numbers if rate limited
   - Trigger manual retry for failed deliveries
   - Activate fallback content if render failures

**Resolution Actions (15min-1hr):**
1. **Root Cause Fix**: Address underlying system issue
2. **Recovery Plan**: Complete failed deliveries within SLA window
3. **Advisor Communication**: Proactive notification if delays expected
4. **Post-Incident**: Schedule post-mortem within 24 hours

### P1: AI Service Degradation
**Symptoms**: AI latency >2x normal, high failure rates, cost ceiling breached
1. **Model Fallback**: Activate lighter models or cached responses
2. **Queue Management**: Implement backpressure, batch processing
3. **Cost Controls**: Emergency budget limits, degrade to rules-only
4. **Content Pipeline**: Use fallback packs to maintain delivery schedule

### P1: WhatsApp Quality Drop
**Symptoms**: Quality rating降to Medium/Low, high block rates
1. **Immediate Pause**: Stop non-critical sends, preserve rating
2. **Template Switch**: Rotate to backup template variants
3. **Content Review**: Audit recent content for policy violations
4. **Recovery Plan**: 48-72hr cooldown, gradual volume restoration
5. **Number Rotation**: Activate hot spare numbers if available

### P2: Approval Queue Backup
**Symptoms**: >50 pending items at 21:30 IST
1. **Admin Notification**: Alert primary and backup approvers
2. **Batch Tools**: Enable bulk approval for low-risk content
3. **Fallback Preparation**: Ready evergreen content for affected advisors
4. **Process Optimization**: Review bottlenecks, adjust workflows

## System Maintenance

### Weekly Maintenance (Sundays 02:00-04:00 IST)
1. **Database Maintenance**: Index optimization, query performance review
2. **Storage Cleanup**: Remove expired signed URLs, old render cache
3. **Log Rotation**: Archive and compress log files
4. **Backup Verification**: Test restore procedures, validate integrity
5. **Security Updates**: Apply OS patches, dependency updates

### Monthly Maintenance (First Sunday 01:00-05:00 IST)
1. **DR Testing**: Full disaster recovery drill
2. **Compliance Review**: Policy updates, audit trail validation
3. **Capacity Planning**: Review growth metrics, scale resources
4. **Template Refresh**: Submit new template variants for approval
5. **Fallback Library**: Refresh evergreen content, remove stale packs

## Emergency Contacts & Escalation

### Primary On-Call
- **DevOps Engineer**: +91-XXXXX-XXXXX (PagerDuty)
- **Backup Engineer**: +91-XXXXX-XXXXX
- **Engineering Lead**: +91-XXXXX-XXXXX

### Business Contacts
- **Founder/Admin**: Primary approver, compliance decisions
- **Compliance Officer**: Regulatory incidents, policy violations
- **Customer Success**: Advisor communication, escalation management

### External Vendors
- **WhatsApp Support**: Meta Business Support (Enterprise)
- **Datadog**: Premium support, incident collaboration
- **Cloudflare**: Enterprise support for CDN/storage issues

## Common Troubleshooting

### WhatsApp Delivery Issues
```bash
# Check template status
curl -X GET "https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/message_templates" \
  -H "Authorization: Bearer ACCESS_TOKEN"

# Verify webhook connectivity  
curl -X POST webhook_url -H "X-Hub-Signature: test" -d "test_payload"

# Check quality rating
curl -X GET "https://graph.facebook.com/v18.0/PHONE_NUMBER_ID" \
  -H "Authorization: Bearer ACCESS_TOKEN"
```

### Database Performance Issues
```sql
-- Check slow queries
SELECT query, mean_time, calls, total_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- Check connection pool status
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Monitor lock contention
SELECT blocked_locks.pid, blocked_activity.query 
FROM pg_catalog.pg_locks blocked_locks 
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid;
```

### AI Service Debugging
```bash
# Check API latency
curl -w "@curl-format.txt" -o /dev/null -s "https://api.openai.com/v1/models"

# Monitor token usage
grep "token_count" /var/log/app.log | tail -100

# Check model availability
curl -X GET "https://api.openai.com/v1/models" -H "Authorization: Bearer $OPENAI_API_KEY"
```

## Backup & Recovery Procedures

### Daily Automated Backups
- **Database**: Automated snapshots at 03:00 IST, 30-day retention
- **Configuration**: Git-based version control, automated commits
- **Generated Assets**: Replicated to secondary region (Mumbai → Singapore)

### Recovery Testing
- **Monthly**: Restore database to staging environment
- **Quarterly**: Full system recovery drill with RTO/RPO validation
- **Annual**: Disaster recovery site activation test

### Recovery Procedures (RTO: 60min, RPO: 15min)
1. **Assessment**: Determine scope of failure, data loss window
2. **Notification**: Alert stakeholders, update status page
3. **Recovery**: Restore from most recent consistent backup
4. **Validation**: Verify data integrity, system functionality
5. **Communication**: Confirm service restoration, schedule post-mortem