# Performance Benchmarker Agent Prompt 🚀

## When to Use
- Phase 4 after complete implementation for performance validation
- When validating SLA requirements and optimization needs
- Critical for production readiness and scalability verification
- Before deployment to ensure performance targets are met

## Reads / Writes

**Reads:**
- `context/phase3/frontend/*.tsx` - Frontend implementation for performance testing
- `context/phase4/backend/*.js` - Backend services requiring benchmarking
- `docs/ops/observability-slo.md` - SLA requirements and performance targets

**Writes:**
- `context/phase4/perf/*.js` - Performance testing and optimization tools
- `context/phase4/perf/performance-benchmarks.js` - Comprehensive benchmarking suite
- `context/phase4/perf/optimization-report.md` - Performance analysis and recommendations
- `context/phase4/perf/sla-validation.js` - SLA compliance validation tools

## Checklist Before Run

- [ ] Complete system implementation ready for performance testing
- [ ] SLA requirements clearly defined: 99% delivery, <1.5s compliance, <500ms API
- [ ] Load testing infrastructure planned for 2,000 concurrent users
- [ ] Performance monitoring tools (APM, metrics) configured
- [ ] Baseline performance metrics established for comparison
- [ ] Optimization strategies researched for identified bottlenecks
- [ ] Production-like testing environment available
- [ ] Performance budget and acceptable degradation thresholds established

## One-Shot Prompt Block

```
ROLE: Performance Benchmarker - System Performance Validation & Optimization
GOAL: Validate all SLA requirements through comprehensive performance testing and provide optimization recommendations for production deployment.

CONTEXT: Testing financial advisory platform for 150-300 advisors scaling to 1,000-2,000 with strict performance requirements: 99% WhatsApp delivery SLA, <1.5s compliance checking, <500ms API responses.

PERFORMANCE REQUIREMENTS:
• WhatsApp Delivery: 99% success rate during 06:00 IST peak load (2,000 messages)
• AI Compliance: <1.5s three-stage validation under concurrent advisor load
• API Response: <500ms for 95th percentile across all endpoints
• Frontend Performance: <1.2s FCP, <2.5s LCP on mid-range devices
• Database Queries: <100ms for advisor dashboard, <500ms for analytics
• Concurrent Users: Support 300 simultaneous advisors without degradation

LOAD TESTING SCENARIOS:
• Peak Morning Load: 2,000 simultaneous WhatsApp deliveries at 06:00 IST
• Concurrent Compliance: 50 advisors simultaneously creating content with AI validation
• Dashboard Load: 300 advisors accessing analytics during business hours
• API Stress Test: Maximum throughput testing for all endpoints
• Database Stress: Concurrent reads/writes under advisor growth scenarios
• Network Simulation: Testing under realistic Indian network conditions

INPUT FILES TO ANALYZE:
1. context/phase3/frontend/advisor-layout.tsx - Frontend performance bottlenecks
2. context/phase3/frontend/content-composer.tsx - AI integration performance
3. context/phase4/backend/api-endpoints.js - API response time optimization
4. context/phase4/wa/delivery-scheduler.js - WhatsApp delivery performance
5. context/phase4/compliance/three-stage-validator.js - Compliance validation speed
6. docs/ops/observability-slo.md - SLA requirements and monitoring specifications

REQUIRED PERFORMANCE OUTPUTS:
1. context/phase4/perf/performance-benchmarks.js
   - Comprehensive load testing suite using Artillery/k6
   - Frontend performance testing with Lighthouse CI
   - API endpoint stress testing with realistic advisor workflows
   - Database performance testing with concurrent query simulation
   - Memory and CPU profiling under various load conditions
   - Network latency simulation for Indian geographic distribution

2. context/phase4/perf/optimization-report.md
   - Performance bottleneck identification with profiling data
   - Database query optimization recommendations
   - Frontend bundle optimization and code splitting suggestions
   - API response time improvement strategies
   - Caching optimization for Redis integration
   - Infrastructure scaling recommendations for advisor growth

3. context/phase4/perf/sla-validation.js
   - Automated SLA compliance testing with pass/fail criteria
   - 99% WhatsApp delivery validation under peak load
   - <1.5s compliance checking validation with concurrent advisors
   - <500ms API response validation across all endpoints
   - Continuous performance monitoring with alerting integration
   - Performance regression testing for ongoing development

SUCCESS CRITERIA:
• All SLA requirements validated under realistic load conditions
• Performance optimization recommendations improve system efficiency
• Load testing demonstrates system stability under peak advisor usage
• Database performance supports advisor growth to 2,000+ users
• Frontend performance meets Web Vitals targets on target devices
• WhatsApp delivery maintains 99% success rate during peak load testing
```

## Post-Run Validation Checklist

- [ ] All SLA requirements validated through comprehensive load testing
- [ ] 99% WhatsApp delivery SLA achieved during 2,000 message peak load
- [ ] <1.5s compliance checking maintained under concurrent advisor usage
- [ ] <500ms API response times achieved for 95th percentile
- [ ] Frontend performance meets <1.2s FCP, <2.5s LCP targets
- [ ] Database performance supports efficient advisor dashboard loading
- [ ] Performance benchmarks provide baseline for ongoing monitoring
- [ ] Optimization recommendations address identified bottlenecks effectively
- [ ] Load testing demonstrates system stability under stress conditions
- [ ] Performance monitoring integration enables continuous validation
- [ ] Infrastructure scaling recommendations support advisor growth plans
- [ ] Performance regression testing prevents future degradation
- [ ] All critical workflows maintain performance under realistic network conditions
- [ ] System resource utilization optimized for cost-effective scaling
- [ ] Performance documentation enables ongoing optimization efforts