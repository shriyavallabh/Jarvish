// Basic Billing API Routes
// Simplified billing implementation without external dependencies

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import basicBillingService from '../services/basic-billing-service';

const router = Router();

// Request validation schemas
const InvoicePreviewSchema = z.object({
  planId: z.string().min(1),
  promoCode: z.string().optional()
});

const ValidatePromoSchema = z.object({
  promoCode: z.string().min(1)
});

const UsageRequestSchema = z.object({
  customerId: z.string().min(1),
  planId: z.string().min(1)
});

const PlanChangeSchema = z.object({
  currentPlanId: z.string().min(1),
  targetPlanId: z.string().min(1)
});

/**
 * GET /api/billing/plans
 * Get all subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await basicBillingService.getSubscriptionPlans();
    
    res.json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          ...plan,
          priceINR: plan.price / 100, // Convert paise to rupees for display
          priceDisplay: `₹${(plan.price / 100).toLocaleString('en-IN')}`,
          features: plan.features,
          isPopular: plan.priority === 'standard'
        }))
      }
    });

  } catch (error: any) {
    console.error('Error fetching plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans'
    });
  }
});

/**
 * GET /api/billing/plans/:planId
 * Get specific plan details
 */
router.get('/plans/:planId', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    const plan = basicBillingService.getPlanById(planId);
    
    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...plan,
        priceINR: plan.price / 100,
        priceDisplay: `₹${(plan.price / 100).toLocaleString('en-IN')}`,
        isUnlimited: plan.maxGenerations === -1,
        dailyLimits: {
          generations: plan.maxGenerations === -1 ? 'Unlimited' : plan.maxGenerations,
          lints: plan.maxLints === -1 ? 'Unlimited' : plan.maxLints
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan details'
    });
  }
});

/**
 * GET /api/billing/pricing
 * Get pricing information with comparisons
 */
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    const pricing = await basicBillingService.getPlanPricing();
    
    res.json({
      success: true,
      data: {
        pricing,
        currency: 'INR',
        billingCycle: 'monthly',
        taxNote: 'All prices exclude 18% GST',
        promoNote: 'Special discounts available for founding members'
      }
    });

  } catch (error: any) {
    console.error('Error fetching pricing:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pricing information'
    });
  }
});

/**
 * GET /api/billing/comparison
 * Get detailed plan comparison
 */
router.get('/comparison', async (req: Request, res: Response) => {
  try {
    const comparison = await basicBillingService.getSubscriptionComparison();
    
    res.json({
      success: true,
      data: {
        ...comparison,
        note: 'All plans include SEBI compliance checking and WhatsApp delivery',
        upgradeNote: 'Upgrade or downgrade anytime with prorated billing'
      }
    });

  } catch (error: any) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch plan comparison'
    });
  }
});

/**
 * POST /api/billing/invoice-preview
 * Generate invoice preview with discounts
 */
router.post('/invoice-preview', async (req: Request, res: Response) => {
  try {
    const validatedData = InvoicePreviewSchema.parse(req.body);
    
    const invoice = await basicBillingService.generateInvoicePreview(
      validatedData.planId,
      validatedData.promoCode
    );
    
    res.json({
      success: true,
      data: {
        ...invoice,
        baseAmountDisplay: `₹${(invoice.baseAmount / 100).toLocaleString('en-IN')}`,
        discountDisplay: `₹${(invoice.discount / 100).toLocaleString('en-IN')}`,
        taxesDisplay: `₹${(invoice.taxes / 100).toLocaleString('en-IN')}`,
        finalAmountDisplay: `₹${(invoice.finalAmount / 100).toLocaleString('en-IN')}`,
        breakdown: {
          subtotal: invoice.baseAmount - invoice.discount,
          gst: invoice.taxes,
          total: invoice.finalAmount
        }
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error generating invoice preview:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice preview',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/billing/validate-promo
 * Validate promo code
 */
router.post('/validate-promo', async (req: Request, res: Response) => {
  try {
    const validatedData = ValidatePromoSchema.parse(req.body);
    
    const validation = await basicBillingService.validatePromoCode(validatedData.promoCode);
    
    res.json({
      success: true,
      data: {
        ...validation,
        code: validatedData.promoCode.toUpperCase(),
        savings: validation.valid ? `Save ${validation.discountPercentage}%` : null
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error validating promo code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate promo code'
    });
  }
});

/**
 * POST /api/billing/usage
 * Get usage statistics for customer and plan
 */
router.post('/usage', async (req: Request, res: Response) => {
  try {
    const validatedData = UsageRequestSchema.parse(req.body);
    
    const usage = await basicBillingService.calculateUsage(
      validatedData.customerId,
      validatedData.planId
    );
    
    res.json({
      success: true,
      data: {
        ...usage,
        status: usage.usagePercentage > 80 ? 'high' : 
                usage.usagePercentage > 50 ? 'medium' : 'low',
        recommendations: usage.usagePercentage > 90 ? 
          ['Consider upgrading to avoid hitting limits'] :
          usage.usagePercentage < 20 ?
          ['You might consider a lower tier plan'] : 
          []
      }
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error fetching usage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch usage statistics',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/billing/can-change-plan
 * Check if plan change is allowed
 */
router.post('/can-change-plan', async (req: Request, res: Response) => {
  try {
    const validatedData = PlanChangeSchema.parse(req.body);
    
    const changeCheck = await basicBillingService.canChangePlan(
      validatedData.currentPlanId,
      validatedData.targetPlanId
    );
    
    res.json({
      success: true,
      data: changeCheck
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    console.error('Error checking plan change:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check plan change eligibility'
    });
  }
});

/**
 * GET /api/billing/stats
 * Get billing statistics (admin only)
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.query;
    
    const stats = await basicBillingService.getBillingStats(customerId as string);
    
    res.json({
      success: true,
      data: {
        ...stats,
        totalRevenueDisplay: `₹${(stats.totalRevenue / 100).toLocaleString('en-IN')}`,
        metrics: {
          averageRevenuePerUser: stats.activeSubscriptions > 0 ? 
            Math.round(stats.totalRevenue / stats.activeSubscriptions / 100) : 0,
          successRate: Math.round(((stats.activeSubscriptions / (stats.activeSubscriptions + stats.failedPayments)) * 100) * 100) / 100
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching billing stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch billing statistics'
    });
  }
});

/**
 * GET /api/billing/health
 * Check billing service health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const plans = await basicBillingService.getSubscriptionPlans();
    const stats = await basicBillingService.getBillingStats();
    
    res.json({
      success: true,
      data: {
        status: 'healthy',
        totalPlans: plans.length,
        availablePlans: plans.map(p => p.name),
        activeSubscriptions: stats.activeSubscriptions,
        timestamp: new Date().toISOString(),
        features: [
          'Plan management',
          'Pricing calculations',
          'Usage tracking',
          'Promo code validation',
          'Invoice previews'
        ]
      }
    });

  } catch (error: any) {
    console.error('Billing health check failed:', error);
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        error: 'Billing service unavailable',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;