/**
 * Jarvish Platform - Financial Projections & Scenario Analysis
 * 24-Month Financial Model with Multiple Growth Scenarios
 */

class FinancialProjections {
  constructor() {
    // Base assumptions
    this.assumptions = {
      initialInvestment: 10000000,  // ₹1 Crore
      monthlyBurnRate: 2000000,     // ₹20 Lakhs initial burn
      
      // Growth scenarios
      scenarios: {
        conservative: {
          name: 'Conservative',
          initialAdvisors: 50,
          monthlyGrowthRate: 0.15,  // 15% MoM
          churnRate: 0.05,           // 5% monthly churn
          pricingMix: { starter: 0.6, professional: 0.3, enterprise: 0.1 }
        },
        moderate: {
          name: 'Moderate',
          initialAdvisors: 100,
          monthlyGrowthRate: 0.25,  // 25% MoM
          churnRate: 0.03,           // 3% monthly churn
          pricingMix: { starter: 0.5, professional: 0.35, enterprise: 0.15 }
        },
        aggressive: {
          name: 'Aggressive',
          initialAdvisors: 150,
          monthlyGrowthRate: 0.35,  // 35% MoM
          churnRate: 0.02,           // 2% monthly churn
          pricingMix: { starter: 0.4, professional: 0.4, enterprise: 0.2 }
        }
      },
      
      // Pricing (from unit economics model)
      pricing: {
        starter: 1999,
        professional: 4999,
        enterprise: 9999
      },
      
      // Variable costs per advisor (optimized)
      costsPerAdvisor: {
        starter: 1159,      // 42% margin
        professional: 1600,  // 68% margin
        enterprise: 2200     // 78% margin
      },
      
      // Fixed costs by scale
      fixedCosts: {
        base: 1000000,  // ₹10L base
        per100Advisors: 100000  // Additional ₹1L per 100 advisors
      }
    };
  }

  /**
   * Calculate monthly metrics for a given scenario
   */
  calculateMonthlyMetrics(scenario, month) {
    const s = this.assumptions.scenarios[scenario];
    
    // Calculate active advisors (compound growth with churn)
    let activeAdvisors = s.initialAdvisors;
    for (let i = 1; i <= month; i++) {
      const newAdvisors = activeAdvisors * s.monthlyGrowthRate;
      const churnedAdvisors = activeAdvisors * s.churnRate;
      activeAdvisors = activeAdvisors + newAdvisors - churnedAdvisors;
      
      // Apply growth decay after 12 months
      if (i > 12) {
        s.monthlyGrowthRate *= 0.95;  // 5% decay in growth rate
      }
    }
    
    activeAdvisors = Math.round(activeAdvisors);
    
    // Calculate revenue by tier
    const revenue = {
      starter: activeAdvisors * s.pricingMix.starter * this.assumptions.pricing.starter,
      professional: activeAdvisors * s.pricingMix.professional * this.assumptions.pricing.professional,
      enterprise: activeAdvisors * s.pricingMix.enterprise * this.assumptions.pricing.enterprise,
      total: 0
    };
    revenue.total = revenue.starter + revenue.professional + revenue.enterprise;
    
    // Calculate variable costs
    const variableCosts = {
      starter: activeAdvisors * s.pricingMix.starter * this.assumptions.costsPerAdvisor.starter,
      professional: activeAdvisors * s.pricingMix.professional * this.assumptions.costsPerAdvisor.professional,
      enterprise: activeAdvisors * s.pricingMix.enterprise * this.assumptions.costsPerAdvisor.enterprise,
      total: 0
    };
    variableCosts.total = variableCosts.starter + variableCosts.professional + variableCosts.enterprise;
    
    // Calculate fixed costs (scales with advisors)
    const fixedCosts = this.assumptions.fixedCosts.base + 
      Math.floor(activeAdvisors / 100) * this.assumptions.fixedCosts.per100Advisors;
    
    // Calculate metrics
    const grossProfit = revenue.total - variableCosts.total;
    const operatingProfit = grossProfit - fixedCosts;
    const grossMargin = (grossProfit / revenue.total) * 100;
    
    return {
      month: month,
      activeAdvisors: activeAdvisors,
      revenue: revenue,
      variableCosts: variableCosts,
      fixedCosts: fixedCosts,
      grossProfit: grossProfit,
      grossMargin: grossMargin,
      operatingProfit: operatingProfit,
      ebitda: operatingProfit  // Simplified - no D&A
    };
  }

  /**
   * Generate 24-month projection for a scenario
   */
  generateProjection(scenario) {
    const projection = [];
    let cumulativeCashFlow = -this.assumptions.initialInvestment;
    let breakEvenMonth = null;
    let cashFlowPositiveMonth = null;
    
    for (let month = 1; month <= 24; month++) {
      const metrics = this.calculateMonthlyMetrics(scenario, month);
      
      // Track cumulative cash flow
      cumulativeCashFlow += metrics.operatingProfit;
      metrics.cumulativeCashFlow = cumulativeCashFlow;
      
      // Track milestones
      if (!breakEvenMonth && metrics.operatingProfit > 0) {
        breakEvenMonth = month;
      }
      if (!cashFlowPositiveMonth && cumulativeCashFlow > 0) {
        cashFlowPositiveMonth = month;
      }
      
      projection.push(metrics);
    }
    
    return {
      scenario: this.assumptions.scenarios[scenario].name,
      projection: projection,
      milestones: {
        breakEvenMonth: breakEvenMonth,
        cashFlowPositiveMonth: cashFlowPositiveMonth,
        finalAdvisors: projection[23].activeAdvisors,
        finalMonthlyRevenue: projection[23].revenue.total,
        finalEBITDA: projection[23].ebitda,
        totalCashBurn: Math.min(0, Math.min(...projection.map(m => m.cumulativeCashFlow)))
      }
    };
  }

  /**
   * Calculate key SaaS metrics
   */
  calculateSaaSMetrics(projection) {
    const lastMonth = projection[projection.length - 1];
    const firstMonth = projection[0];
    
    // MRR and ARR
    const mrr = lastMonth.revenue.total;
    const arr = mrr * 12;
    
    // CAC (simplified - marketing cost per advisor)
    const cac = 2500;  // From unit economics model
    
    // LTV (average revenue per user * average lifetime)
    const arpu = mrr / lastMonth.activeAdvisors;
    const avgChurnRate = 0.03;  // Average across scenarios
    const avgLifetimeMonths = 1 / avgChurnRate;
    const ltv = arpu * avgLifetimeMonths;
    
    // LTV/CAC ratio
    const ltvCacRatio = ltv / cac;
    
    // Payback period
    const avgGrossMargin = 0.65;  // 65% gross margin
    const paybackMonths = cac / (arpu * avgGrossMargin);
    
    // Growth rate
    const monthlyGrowthRate = Math.pow(lastMonth.activeAdvisors / firstMonth.activeAdvisors, 1/23) - 1;
    
    // Rule of 40 (growth rate + profit margin)
    const profitMargin = (lastMonth.ebitda / lastMonth.revenue.total) * 100;
    const ruleOf40 = (monthlyGrowthRate * 100) + profitMargin;
    
    return {
      mrr: mrr,
      arr: arr,
      arpu: arpu,
      cac: cac,
      ltv: ltv,
      ltvCacRatio: ltvCacRatio,
      paybackMonths: paybackMonths,
      monthlyGrowthRate: monthlyGrowthRate * 100,
      ruleOf40: ruleOf40,
      grossMargin: lastMonth.grossMargin
    };
  }

  /**
   * Generate comprehensive financial report
   */
  generateFinancialReport() {
    console.log('='.repeat(80));
    console.log('JARVISH PLATFORM - 24-MONTH FINANCIAL PROJECTIONS');
    console.log('='.repeat(80));
    
    const scenarios = ['conservative', 'moderate', 'aggressive'];
    const projections = {};
    
    // Generate projections for each scenario
    scenarios.forEach(scenario => {
      projections[scenario] = this.generateProjection(scenario);
    });
    
    // 1. Executive Summary
    console.log('\n1. EXECUTIVE SUMMARY');
    console.log('-'.repeat(60));
    
    scenarios.forEach(scenario => {
      const p = projections[scenario];
      console.log(`\n${p.scenario.toUpperCase()} SCENARIO:`);
      console.log(`  Break-even Month: ${p.milestones.breakEvenMonth || 'Not within 24 months'}`);
      console.log(`  Cash Flow Positive: Month ${p.milestones.cashFlowPositiveMonth || 'Not within 24 months'}`);
      console.log(`  Advisors at Month 24: ${p.milestones.finalAdvisors.toLocaleString('en-IN')}`);
      console.log(`  MRR at Month 24: ₹${(p.milestones.finalMonthlyRevenue / 100000).toFixed(2)}L`);
      console.log(`  Monthly EBITDA: ₹${(p.milestones.finalEBITDA / 100000).toFixed(2)}L`);
      console.log(`  Total Cash Required: ₹${(-p.milestones.totalCashBurn / 100000).toFixed(2)}L`);
    });
    
    // 2. Monthly Progression (Moderate Scenario)
    console.log('\n\n2. MONTHLY PROGRESSION - MODERATE SCENARIO');
    console.log('-'.repeat(60));
    
    const moderateProj = projections.moderate.projection;
    
    console.log('\nQUARTERLY SNAPSHOTS:');
    [3, 6, 9, 12, 15, 18, 21, 24].forEach(month => {
      const m = moderateProj[month - 1];
      console.log(`\nMonth ${month}:`);
      console.log(`  Active Advisors: ${m.activeAdvisors}`);
      console.log(`  MRR: ₹${(m.revenue.total / 100000).toFixed(2)}L`);
      console.log(`  Gross Margin: ${m.grossMargin.toFixed(1)}%`);
      console.log(`  Operating Profit: ₹${(m.operatingProfit / 100000).toFixed(2)}L`);
      console.log(`  Cumulative Cash: ₹${(m.cumulativeCashFlow / 100000).toFixed(2)}L`);
    });
    
    // 3. SaaS Metrics
    console.log('\n\n3. KEY SAAS METRICS (Month 24)');
    console.log('-'.repeat(60));
    
    scenarios.forEach(scenario => {
      const metrics = this.calculateSaaSMetrics(projections[scenario].projection);
      console.log(`\n${scenario.toUpperCase()}:`);
      console.log(`  MRR: ₹${(metrics.mrr / 100000).toFixed(2)}L`);
      console.log(`  ARR: ₹${(metrics.arr / 10000000).toFixed(2)}Cr`);
      console.log(`  ARPU: ₹${metrics.arpu.toFixed(0)}`);
      console.log(`  CAC: ₹${metrics.cac}`);
      console.log(`  LTV: ₹${metrics.ltv.toFixed(0)}`);
      console.log(`  LTV/CAC: ${metrics.ltvCacRatio.toFixed(1)}x`);
      console.log(`  Payback: ${metrics.paybackMonths.toFixed(1)} months`);
      console.log(`  Growth Rate: ${metrics.monthlyGrowthRate.toFixed(1)}% MoM`);
      console.log(`  Rule of 40: ${metrics.ruleOf40.toFixed(1)}`);
    });
    
    // 4. Revenue Mix Analysis
    console.log('\n\n4. REVENUE MIX ANALYSIS (Month 24)');
    console.log('-'.repeat(60));
    
    scenarios.forEach(scenario => {
      const lastMonth = projections[scenario].projection[23];
      const s = this.assumptions.scenarios[scenario];
      console.log(`\n${scenario.toUpperCase()}:`);
      console.log(`  Starter (${s.pricingMix.starter * 100}%): ₹${(lastMonth.revenue.starter / 100000).toFixed(2)}L`);
      console.log(`  Professional (${s.pricingMix.professional * 100}%): ₹${(lastMonth.revenue.professional / 100000).toFixed(2)}L`);
      console.log(`  Enterprise (${s.pricingMix.enterprise * 100}%): ₹${(lastMonth.revenue.enterprise / 100000).toFixed(2)}L`);
      console.log(`  Total MRR: ₹${(lastMonth.revenue.total / 100000).toFixed(2)}L`);
    });
    
    // 5. Funding Requirements
    console.log('\n\n5. FUNDING REQUIREMENTS & RUNWAY');
    console.log('-'.repeat(60));
    
    scenarios.forEach(scenario => {
      const p = projections[scenario];
      const maxCashBurn = Math.abs(p.milestones.totalCashBurn);
      const bufferMultiple = 1.5;  // 50% buffer
      const recommendedRaise = maxCashBurn * bufferMultiple;
      
      console.log(`\n${scenario.toUpperCase()}:`);
      console.log(`  Max Cash Burn: ₹${(maxCashBurn / 10000000).toFixed(2)}Cr`);
      console.log(`  Recommended Raise: ₹${(recommendedRaise / 10000000).toFixed(2)}Cr`);
      console.log(`  Runway at current burn: ${Math.round(recommendedRaise / 2000000)} months`);
      console.log(`  Break-even runway: ${p.milestones.breakEvenMonth || '>24'} months`);
    });
    
    // 6. Sensitivity Analysis
    console.log('\n\n6. SENSITIVITY ANALYSIS');
    console.log('-'.repeat(60));
    
    const baseCase = projections.moderate.projection[23];
    const sensitivities = [
      { factor: 'Pricing +10%', impact: baseCase.revenue.total * 0.1 },
      { factor: 'Pricing -10%', impact: -baseCase.revenue.total * 0.1 },
      { factor: 'Churn +1%', impact: -baseCase.revenue.total * 0.05 },
      { factor: 'CAC +₹500', impact: -500 * baseCase.activeAdvisors / 12 },
      { factor: 'Variable Costs +10%', impact: -baseCase.variableCosts.total * 0.1 }
    ];
    
    console.log('\nImpact on Monthly EBITDA:');
    sensitivities.forEach(s => {
      const newEBITDA = baseCase.ebitda + s.impact;
      const percentChange = (s.impact / baseCase.ebitda) * 100;
      console.log(`  ${s.factor}: ₹${(s.impact / 100000).toFixed(2)}L (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`);
    });
    
    // 7. Investment Returns
    console.log('\n\n7. INVESTMENT RETURNS ANALYSIS');
    console.log('-'.repeat(60));
    
    scenarios.forEach(scenario => {
      const p = projections[scenario];
      const month24Revenue = p.projection[23].revenue.total;
      const annualizedRevenue = month24Revenue * 12;
      
      // Assuming 5x revenue multiple for SaaS
      const valuationMultiple = 5;
      const estimatedValuation = annualizedRevenue * valuationMultiple;
      const initialInvestment = 15000000;  // ₹1.5 Cr recommended raise
      const roi = ((estimatedValuation - initialInvestment) / initialInvestment) * 100;
      
      console.log(`\n${scenario.toUpperCase()}:`);
      console.log(`  Month 24 ARR: ₹${(annualizedRevenue / 10000000).toFixed(2)}Cr`);
      console.log(`  Valuation (5x ARR): ₹${(estimatedValuation / 10000000).toFixed(2)}Cr`);
      console.log(`  ROI on ₹1.5Cr: ${roi.toFixed(0)}%`);
      console.log(`  IRR (24 months): ${(Math.pow(estimatedValuation / initialInvestment, 1/2) - 1) * 100}%`);
    });
    
    // 8. Risk Factors
    console.log('\n\n8. KEY RISK FACTORS & MITIGATIONS');
    console.log('-'.repeat(60));
    
    const risks = [
      {
        risk: 'Higher than expected churn',
        probability: 'Medium',
        impact: 'High',
        mitigation: 'Focus on advisor success, proactive support, product stickiness'
      },
      {
        risk: 'Slower growth adoption',
        probability: 'Medium',
        impact: 'Medium',
        mitigation: 'Aggressive referral program, content marketing, partnerships'
      },
      {
        risk: 'Regulatory changes',
        probability: 'Low',
        impact: 'High',
        mitigation: 'Compliance-first approach, legal advisory board'
      },
      {
        risk: 'AI cost increases',
        probability: 'Low',
        impact: 'Medium',
        mitigation: 'Multi-model strategy, self-hosted options, volume agreements'
      },
      {
        risk: 'Competition from incumbents',
        probability: 'High',
        impact: 'Medium',
        mitigation: 'First-mover advantage, network effects, superior UX'
      }
    ];
    
    risks.forEach(r => {
      console.log(`\n${r.risk}:`);
      console.log(`  Probability: ${r.probability}`);
      console.log(`  Impact: ${r.impact}`);
      console.log(`  Mitigation: ${r.mitigation}`);
    });
    
    // 9. Recommendations
    console.log('\n\n9. STRATEGIC RECOMMENDATIONS');
    console.log('-'.repeat(60));
    
    console.log('\nPRICING STRATEGY:');
    console.log('  - Launch with introductory pricing (20% discount for first 500 advisors)');
    console.log('  - Annual plans with 2 months free (improve cash flow)');
    console.log('  - Enterprise custom pricing above 10 seats');
    
    console.log('\nGROWTH STRATEGY:');
    console.log('  - Focus on Professional tier (best unit economics)');
    console.log('  - Aggressive referral program (₹500-1000 per successful referral)');
    console.log('  - Content marketing targeting "financial advisor productivity"');
    console.log('  - Strategic partnerships with advisor associations');
    
    console.log('\nCOST OPTIMIZATION:');
    console.log('  - Implement tiered AI model usage (GPT-4 for 30%, GPT-3.5 for 70%)');
    console.log('  - Negotiate volume discounts with OpenAI/Anthropic at 1000+ advisors');
    console.log('  - Optimize WhatsApp message types (reduce marketing messages)');
    console.log('  - Automate support with AI chatbot (reduce support costs by 40%)');
    
    console.log('\nFUNDING RECOMMENDATION:');
    console.log('  - Raise ₹1.5-2 Crore seed round');
    console.log('  - Target break-even in 12-15 months');
    console.log('  - Series A at 2500+ advisors (₹10-15 Cr)');
    
    console.log('\n' + '='.repeat(80));
    console.log('END OF FINANCIAL PROJECTIONS');
    console.log('='.repeat(80));
  }
}

// Run the financial projections
const projections = new FinancialProjections();
projections.generateFinancialReport();

// Export for use in other modules
module.exports = FinancialProjections;