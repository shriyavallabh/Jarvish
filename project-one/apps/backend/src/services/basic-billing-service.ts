// Basic Billing Service 
// Simplified billing solution that works without external dependencies

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in paise (INR)
  currency: 'INR';
  interval: 'monthly' | 'yearly';
  features: string[];
  description: string;
  maxGenerations: number;
  maxLints: number;
  priority: 'basic' | 'standard' | 'pro';
}

interface Customer {
  id: string;
  name: string;
  email: string;
  contact: string;
  notes?: Record<string, string>;
}

interface BillingStats {
  totalRevenue: number;
  activeSubscriptions: number;
  failedPayments: number;
  churnRate: number;
}

class BasicBillingService {
  // Subscription Plans Configuration
  private readonly PLANS: Record<string, SubscriptionPlan> = {
    basic: {
      id: 'plan_basic_monthly',
      name: 'Basic Plan',
      price: 299900, // ₹2,999
      currency: 'INR',
      interval: 'monthly',
      features: [
        'AI-powered content generation',
        'SEBI compliance checking',
        'WhatsApp delivery automation',
        '10 content generations/day',
        '20 compliance checks/day',
        'Email support'
      ],
      description: 'Perfect for individual advisors starting with AI content',
      maxGenerations: 10,
      maxLints: 20,
      priority: 'basic'
    },
    standard: {
      id: 'plan_standard_monthly',
      name: 'Standard Plan',
      price: 599900, // ₹5,999
      currency: 'INR',
      interval: 'monthly',
      features: [
        'All Basic features',
        'Multi-language content (Hindi/Marathi)',
        'Advanced analytics',
        '25 content generations/day',
        '50 compliance checks/day',
        'WhatsApp Status format',
        'Priority support'
      ],
      description: 'For growing advisory practices with diverse client base',
      maxGenerations: 25,
      maxLints: 50,
      priority: 'standard'
    },
    pro: {
      id: 'plan_pro_monthly',
      name: 'Pro Plan',
      price: 1199900, // ₹11,999
      currency: 'INR',
      interval: 'monthly',
      features: [
        'All Standard features',
        'Unlimited content generation',
        'Unlimited compliance checks',
        'Branded content overlays',
        'Custom templates',
        'LinkedIn post generation',
        'API access',
        'Dedicated account manager',
        '99.9% delivery SLA'
      ],
      description: 'For established firms requiring enterprise features',
      maxGenerations: -1, // unlimited
      maxLints: -1, // unlimited
      priority: 'pro'
    }
  };

  /**
   * Get all available subscription plans
   */
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Object.values(this.PLANS);
  }

  /**
   * Get plan by ID
   */
  getPlanById(planId: string): SubscriptionPlan | null {
    return Object.values(this.PLANS).find(plan => plan.id === planId) || null;
  }

  /**
   * Get plan pricing information
   */
  async getPlanPricing(): Promise<Array<{
    planId: string;
    name: string;
    priceINR: number;
    priceUSD: number;
    savings: string;
    features: string[];
    recommended?: boolean;
  }>> {
    const plans = await this.getSubscriptionPlans();
    
    return plans.map(plan => ({
      planId: plan.id,
      name: plan.name,
      priceINR: plan.price / 100,
      priceUSD: Math.round((plan.price / 100) * 0.012), // Approximate conversion
      savings: plan.priority === 'pro' ? '25% vs Standard' : 
               plan.priority === 'standard' ? '15% vs Basic' : '0%',
      features: plan.features,
      recommended: plan.priority === 'standard'
    }));
  }

  /**
   * Calculate plan usage limits
   */
  async calculateUsage(customerId: string, planId: string): Promise<{
    generationsUsed: number;
    lintsUsed: number;
    generationsRemaining: number;
    lintsRemaining: number;
    resetDate: Date;
    usagePercentage: number;
  }> {
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error('Invalid plan');
    }

    // Mock usage data - this would come from database in production
    const mockGenerationsUsed = Math.floor(Math.random() * (plan.maxGenerations === -1 ? 50 : plan.maxGenerations));
    const mockLintsUsed = Math.floor(Math.random() * (plan.maxLints === -1 ? 100 : plan.maxLints));

    return {
      generationsUsed: mockGenerationsUsed,
      lintsUsed: mockLintsUsed,
      generationsRemaining: plan.maxGenerations === -1 ? -1 : Math.max(0, plan.maxGenerations - mockGenerationsUsed),
      lintsRemaining: plan.maxLints === -1 ? -1 : Math.max(0, plan.maxLints - mockLintsUsed),
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      usagePercentage: plan.maxGenerations === -1 ? 0 : Math.round((mockGenerationsUsed / plan.maxGenerations) * 100)
    };
  }

  /**
   * Get billing statistics
   */
  async getBillingStats(customerId?: string): Promise<BillingStats> {
    // Mock billing statistics - this would come from database in production
    return {
      totalRevenue: 1250000, // ₹12,500 in paise
      activeSubscriptions: 47,
      failedPayments: 3,
      churnRate: 5.2
    };
  }

  /**
   * Get subscription tier comparison
   */
  async getSubscriptionComparison(): Promise<{
    plans: SubscriptionPlan[];
    comparison: Record<string, string[]>;
  }> {
    const plans = await this.getSubscriptionPlans();
    
    const comparison = {
      'Content Generation': [
        '10 generations/day',
        '25 generations/day', 
        'Unlimited generations'
      ],
      'Compliance Checks': [
        '20 checks/day',
        '50 checks/day',
        'Unlimited checks'
      ],
      'Languages': [
        'English only',
        'English + Hindi + Marathi',
        'English + Hindi + Marathi'
      ],
      'Formats': [
        'WhatsApp Post',
        'WhatsApp + Status',
        'WhatsApp + Status + LinkedIn'
      ],
      'Branding': [
        'Standard templates',
        'Basic customization',
        'Full branding + logo overlays'
      ],
      'Support': [
        'Email support',
        'Priority email support',
        'Dedicated account manager'
      ],
      'Analytics': [
        'Basic metrics',
        'Advanced analytics',
        'Advanced analytics + API'
      ]
    };

    return { plans, comparison };
  }

  /**
   * Check if user can upgrade/downgrade
   */
  async canChangePlan(currentPlanId: string, targetPlanId: string): Promise<{
    canChange: boolean;
    reason?: string;
    recommendation?: string;
  }> {
    const currentPlan = this.getPlanById(currentPlanId);
    const targetPlan = this.getPlanById(targetPlanId);

    if (!currentPlan || !targetPlan) {
      return {
        canChange: false,
        reason: 'Invalid plan selection'
      };
    }

    if (currentPlan.id === targetPlan.id) {
      return {
        canChange: false,
        reason: 'Already subscribed to this plan'
      };
    }

    // Check if downgrade
    const planOrder = ['basic', 'standard', 'pro'];
    const currentIndex = planOrder.indexOf(currentPlan.priority);
    const targetIndex = planOrder.indexOf(targetPlan.priority);

    if (targetIndex < currentIndex) {
      return {
        canChange: true,
        reason: 'Downgrade available',
        recommendation: 'Changes will take effect at the end of current billing cycle'
      };
    } else {
      return {
        canChange: true,
        reason: 'Upgrade available',
        recommendation: 'Upgrade takes effect immediately with prorated billing'
      };
    }
  }

  /**
   * Generate invoice preview
   */
  async generateInvoicePreview(planId: string, promoCode?: string): Promise<{
    planName: string;
    baseAmount: number;
    discount: number;
    discountPercentage: number;
    taxes: number;
    finalAmount: number;
    currency: string;
    validUntil: Date;
  }> {
    const plan = this.getPlanById(planId);
    if (!plan) {
      throw new Error('Invalid plan');
    }

    let discount = 0;
    let discountPercentage = 0;

    // Apply promo codes
    if (promoCode) {
      switch (promoCode.toUpperCase()) {
        case 'FOUNDING100':
          discountPercentage = 50;
          break;
        case 'EARLY25':
          discountPercentage = 25;
          break;
        case 'SAVE15':
          discountPercentage = 15;
          break;
        default:
          // Invalid promo code - no discount
          break;
      }
    }

    discount = Math.round((plan.price * discountPercentage) / 100);
    const discountedAmount = plan.price - discount;
    const taxes = Math.round(discountedAmount * 0.18); // 18% GST
    const finalAmount = discountedAmount + taxes;

    return {
      planName: plan.name,
      baseAmount: plan.price,
      discount,
      discountPercentage,
      taxes,
      finalAmount,
      currency: plan.currency,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) // Valid for 24 hours
    };
  }

  /**
   * Validate promo code
   */
  async validatePromoCode(promoCode: string): Promise<{
    valid: boolean;
    discountPercentage: number;
    description: string;
    expiresAt?: Date;
  }> {
    const validPromoCodes = {
      'FOUNDING100': {
        valid: true,
        discountPercentage: 50,
        description: 'Founding 100 Members - 50% off for 3 months',
        expiresAt: new Date('2025-12-31')
      },
      'EARLY25': {
        valid: true,
        discountPercentage: 25,
        description: 'Early Bird Special - 25% off first month',
        expiresAt: new Date('2025-10-31')
      },
      'SAVE15': {
        valid: true,
        discountPercentage: 15,
        description: 'Save 15% on any plan',
        expiresAt: new Date('2025-11-30')
      }
    };

    const promo = validPromoCodes[promoCode.toUpperCase() as keyof typeof validPromoCodes];
    
    if (!promo) {
      return {
        valid: false,
        discountPercentage: 0,
        description: 'Invalid promo code'
      };
    }

    return promo;
  }
}

export default new BasicBillingService();