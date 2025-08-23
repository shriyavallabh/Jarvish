/**
 * Payment Service Unit Tests
 * Testing Razorpay integration and subscription management
 */

import { PaymentService } from '@/lib/services/payment-service';
import { createClient } from '@supabase/supabase-js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Mock external dependencies
jest.mock('@supabase/supabase-js');
jest.mock('razorpay');
jest.mock('crypto');
jest.mock('@/lib/redis', () => ({
  redis: {
    del: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn()
  }
}));

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockSupabase: any;
  let mockRazorpay: any;

  beforeEach(() => {
    // Create reusable mock responses
    const mockSingleResponse = jest.fn();
    const mockUpdateResponse = jest.fn();
    const mockInsertResponse = jest.fn();
    const mockSelectResponse = jest.fn();
    const mockEqResponse = jest.fn();
    
    // Setup the chain for different operations
    mockEqResponse.mockImplementation(() => ({
      single: mockSingleResponse,
      data: [],
      error: null
    }));
    
    mockSelectResponse.mockImplementation(() => ({
      eq: mockEqResponse,
      count: jest.fn(() => ({
        eq: jest.fn(() => ({
          gte: jest.fn(() => ({
            data: null,
            count: 0,
            error: null
          }))
        }))
      })),
      gte: jest.fn(() => ({
        lte: jest.fn(() => ({
          data: [],
          error: null
        }))
      }))
    }));
    
    // Mock Supabase client
    mockSupabase = {
      from: jest.fn((table: string) => ({
        select: mockSelectResponse,
        insert: mockInsertResponse,
        update: jest.fn(() => ({
          eq: mockUpdateResponse
        })),
        upsert: jest.fn(() => ({
          data: { id: 'test_id' },
          error: null
        }))
      })),
      rpc: jest.fn(() => ({
        data: {},
        error: null
      }))
    };
    
    // Store references for test access
    mockSupabase._mockSingle = mockSingleResponse;
    mockSupabase._mockUpdate = mockUpdateResponse;
    mockSupabase._mockInsert = mockInsertResponse;
    mockSupabase._mockSelect = mockSelectResponse;
    mockSupabase._mockEq = mockEqResponse;

    // Mock Razorpay instance
    mockRazorpay = {
      subscriptions: {
        create: jest.fn(),
        fetch: jest.fn(),
        cancel: jest.fn(),
        update: jest.fn(),
        all: jest.fn()
      },
      plans: {
        create: jest.fn(),
        fetch: jest.fn()
      },
      invoices: {
        all: jest.fn(),
        fetch: jest.fn()
      },
      payments: {
        fetch: jest.fn(),
        refund: jest.fn()
      }
    };

    // Mock crypto
    (crypto.createHmac as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('valid_signature')
    });

    // Mock constructors
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    (Razorpay as jest.Mock).mockReturnValue(mockRazorpay);

    // Set up environment variables
    process.env.RAZORPAY_KEY_ID = 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';

    paymentService = new PaymentService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubscription', () => {
    it('should create a subscription for new customer', async () => {
      const advisorId = 'advisor_123';
      const planName = 'STANDARD';
      const email = 'test@example.com';

      mockSupabase._mockSingle.mockResolvedValue({
        data: null,
        error: null
      });

      mockRazorpay.plans.create.mockResolvedValue({
        id: 'plan_123',
        item: {
          amount: 249900
        }
      });

      mockRazorpay.subscriptions.create.mockResolvedValue({
        id: 'sub_123',
        status: 'created',
        short_url: 'https://rzp.io/abc123'
      });

      mockSupabase._mockInsert.mockResolvedValue({
        data: { id: 'db_sub_123' },
        error: null
      });

      const result = await paymentService.createSubscription(
        advisorId,
        planName,
        email
      );

      expect(result).toHaveProperty('subscription_id');
      expect(result).toHaveProperty('payment_link');
      expect(mockRazorpay.subscriptions.create).toHaveBeenCalled();
    });

    it('should handle existing subscription', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'existing_sub',
          status: 'active'
        },
        error: null
      });

      await expect(
        paymentService.createSubscription('advisor_123', 'STANDARD')
      ).rejects.toThrow('Active subscription already exists');
    });

    it('should validate plan type', async () => {
      await expect(
        paymentService.createSubscription('advisor_123', 'INVALID' as any)
      ).rejects.toThrow('Invalid plan type');
    });
  });

  describe('verifyPayment', () => {
    beforeEach(() => {
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_signature')
      });
    });

    it('should verify valid payment signature', async () => {
      const paymentData = {
        razorpay_subscription_id: 'sub_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'valid_signature'
      };

      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'sub_123',
          advisor_id: 'advisor_123',
          plan_type: 'STANDARD'
        },
        error: null
      });

      mockSupabase._mockUpdate.mockResolvedValue({
        data: { status: 'active' },
        error: null
      });

      mockSupabase._mockInsert.mockResolvedValue({
        data: { id: 'pay_123' },
        error: null
      });

      const result = await paymentService.verifyPayment(paymentData);

      expect(result).toEqual({
        success: true,
        subscription_id: 'sub_123'
      });
    });

    it('should reject invalid payment signature', async () => {
      const paymentData = {
        razorpay_subscription_id: 'sub_123',
        razorpay_payment_id: 'pay_123',
        razorpay_signature: 'invalid_signature'
      };

      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('different_signature')
      });

      await expect(
        paymentService.verifyPayment(paymentData)
      ).rejects.toThrow('Invalid payment signature');
    });
  });

  describe('handleWebhook', () => {
    beforeEach(() => {
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('valid_webhook_signature')
      });
    });

    it('should handle subscription activated webhook', async () => {
      const event = {
        event: 'subscription.activated',
        payload: {
          subscription: {
            entity: {
              id: 'sub_123',
              status: 'active',
              current_start: Date.now() / 1000,
              current_end: (Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000,
              notes: {
                advisor_id: 'advisor_123',
                plan_type: 'STANDARD'
              }
            }
          }
        }
      };

      const signature = 'valid_webhook_signature';

      mockSupabase._mockUpdate.mockResolvedValue({
        data: { status: 'active' },
        error: null
      });

      mockSupabase._mockInsert.mockResolvedValue({
        data: { id: 'log_123' },
        error: null
      });

      const result = await paymentService.handleWebhook(event, signature);

      expect(result).toEqual({ processed: true });
    });

    it('should handle subscription cancelled webhook', async () => {
      const event = {
        event: 'subscription.cancelled',
        payload: {
          subscription: {
            entity: {
              id: 'sub_123',
              status: 'cancelled',
              ended_at: Date.now() / 1000,
              notes: {
                advisor_id: 'advisor_123'
              }
            }
          }
        }
      };

      const signature = 'valid_webhook_signature';

      mockSupabase._mockUpdate.mockResolvedValue({
        data: { status: 'cancelled' },
        error: null
      });

      const result = await paymentService.handleWebhook(event, signature);

      expect(result).toEqual({ processed: true });
    });

    it('should reject invalid webhook signature', async () => {
      (crypto.createHmac as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('invalid_signature')
      });

      await expect(
        paymentService.handleWebhook({}, 'wrong_signature')
      ).rejects.toThrow('Invalid webhook signature');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const subscriptionId = 'sub_123';
      const advisorId = 'advisor_123';

      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: subscriptionId,
          advisor_id: advisorId,
          razorpay_subscription_id: 'rzp_sub_123',
          status: 'active'
        },
        error: null
      });

      mockRazorpay.subscriptions.cancel.mockResolvedValue({
        id: 'rzp_sub_123',
        status: 'cancelled'
      });

      mockSupabase._mockUpdate.mockResolvedValue({
        data: { status: 'cancelled' },
        error: null
      });

      const result = await paymentService.cancelSubscription(subscriptionId, advisorId);

      expect(result).toEqual({ success: true });
      expect(mockRazorpay.subscriptions.cancel).toHaveBeenCalledWith('rzp_sub_123');
    });

    it('should handle unauthorized cancellation', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'sub_123',
          advisor_id: 'different_advisor'
        },
        error: null
      });

      await expect(
        paymentService.cancelSubscription('sub_123', 'advisor_123')
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('getInvoices', () => {
    it('should retrieve advisor invoices', async () => {
      const advisorId = 'advisor_123';

      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'sub_123',
          razorpay_subscription_id: 'rzp_sub_123'
        },
        error: null
      });

      const mockInvoices = [
        {
          id: 'inv_1',
          amount: 249900,
          status: 'paid',
          created_at: Date.now() / 1000
        },
        {
          id: 'inv_2',
          amount: 249900,
          status: 'paid',
          created_at: (Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000
        }
      ];

      mockRazorpay.invoices.all.mockResolvedValue({
        items: mockInvoices,
        count: 2
      });

      const result = await paymentService.getInvoices(advisorId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('amount');
      expect(mockRazorpay.invoices.all).toHaveBeenCalled();
    });

    it('should handle missing subscription', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await paymentService.getInvoices('advisor_123');
      expect(result).toEqual([]);
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should return active subscription status', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'sub_123',
          status: 'active',
          plan_type: 'STANDARD',
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        error: null
      });

      const result = await paymentService.getSubscriptionStatus('advisor_123');

      expect(result).toEqual({
        active: true,
        plan: 'STANDARD',
        expires_at: expect.any(Date)
      });
    });

    it('should handle no subscription', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const result = await paymentService.getSubscriptionStatus('advisor_123');

      expect(result).toEqual({
        active: false,
        plan: null,
        expires_at: null
      });
    });
  });

  describe('updatePaymentMethod', () => {
    it('should update payment method successfully', async () => {
      const advisorId = 'advisor_123';
      const paymentMethodId = 'pm_123';

      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'sub_123',
          razorpay_subscription_id: 'rzp_sub_123'
        },
        error: null
      });

      mockRazorpay.subscriptions.update.mockResolvedValue({
        id: 'rzp_sub_123',
        payment_method: paymentMethodId
      });

      const result = await paymentService.updatePaymentMethod(
        advisorId,
        paymentMethodId
      );

      expect(result).toEqual({ success: true });
      expect(mockRazorpay.subscriptions.update).toHaveBeenCalledWith(
        'rzp_sub_123',
        { payment_method: paymentMethodId }
      );
    });
  });

  describe('getPaymentHistory', () => {
    it('should retrieve payment history', async () => {
      const advisorId = 'advisor_123';

      mockSupabase._mockSelect.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          gte: jest.fn().mockReturnValue({
            lte: jest.fn().mockResolvedValue({
              data: [
                {
                  id: 'pay_1',
                  amount: 2499,
                  status: 'completed',
                  created_at: new Date()
                },
                {
                  id: 'pay_2',
                  amount: 2499,
                  status: 'completed',
                  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              ],
              error: null
            })
          })
        })
      });

      const result = await paymentService.getPaymentHistory(advisorId);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('amount', 2499);
    });
  });

  describe('applyPromoCode', () => {
    it('should apply valid promo code', async () => {
      const subscriptionId = 'sub_123';
      const promoCode = 'SAVE20';

      mockSupabase._mockSingle.mockResolvedValueOnce({
        data: {
          code: 'SAVE20',
          discount_percent: 20,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          max_uses: 100,
          uses_count: 10
        },
        error: null
      });

      mockSupabase._mockSingle.mockResolvedValueOnce({
        data: {
          id: subscriptionId,
          razorpay_subscription_id: 'rzp_sub_123'
        },
        error: null
      });

      mockRazorpay.subscriptions.update.mockResolvedValue({
        id: 'rzp_sub_123',
        discount: { percent: 20 }
      });

      const result = await paymentService.applyPromoCode(subscriptionId, promoCode);

      expect(result).toEqual({
        success: true,
        discount: 20
      });
    });

    it('should reject expired promo code', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          code: 'EXPIRED',
          discount_percent: 20,
          valid_until: new Date(Date.now() - 24 * 60 * 60 * 1000),
          max_uses: 100,
          uses_count: 10
        },
        error: null
      });

      await expect(
        paymentService.applyPromoCode('sub_123', 'EXPIRED')
      ).rejects.toThrow('Promo code expired');
    });

    it('should reject overused promo code', async () => {
      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          code: 'MAXED',
          discount_percent: 20,
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          max_uses: 100,
          uses_count: 100
        },
        error: null
      });

      await expect(
        paymentService.applyPromoCode('sub_123', 'MAXED')
      ).rejects.toThrow('Promo code usage limit reached');
    });
  });

  describe('getSubscriptionUsage', () => {
    it('should calculate subscription usage correctly', async () => {
      const advisorId = 'advisor_123';

      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: 'sub_123',
          plan_type: 'STANDARD',
          current_period_start: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          current_period_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
        },
        error: null
      });

      // Mock content count
      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          count: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest.fn().mockResolvedValue({
                count: 75,
                error: null
              })
            })
          })
        })
      });

      const result = await paymentService.getSubscriptionUsage(advisorId);

      expect(result).toEqual({
        plan: 'STANDARD',
        usage: {
          content_created: 75,
          content_limit: 150,
          whatsapp_sent: expect.any(Number),
          whatsapp_limit: 500
        },
        period: {
          start: expect.any(Date),
          end: expect.any(Date)
        }
      });
    });
  });

  describe('refundPayment', () => {
    it('should process refund successfully', async () => {
      const paymentId = 'pay_123';
      const amount = 2499;
      const reason = 'Customer request';

      mockSupabase._mockSingle.mockResolvedValue({
        data: {
          id: paymentId,
          razorpay_payment_id: 'rzp_pay_123',
          amount: amount
        },
        error: null
      });

      mockRazorpay.payments.refund.mockResolvedValue({
        id: 'rfnd_123',
        payment_id: 'rzp_pay_123',
        amount: amount * 100,
        status: 'processed'
      });

      mockSupabase._mockUpdate.mockResolvedValue({
        data: { status: 'refunded' },
        error: null
      });

      const result = await paymentService.refundPayment(paymentId, amount, reason);

      expect(result).toEqual({
        success: true,
        refund_id: 'rfnd_123'
      });
      expect(mockRazorpay.payments.refund).toHaveBeenCalledWith(
        'rzp_pay_123',
        { amount: amount * 100, notes: { reason } }
      );
    });
  });
});