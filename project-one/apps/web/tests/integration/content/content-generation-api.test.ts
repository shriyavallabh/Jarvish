import { createMocks } from 'node-mocks-http';
import { NextRequest, NextResponse } from 'next/server';
import { POST as generateContent } from '../../../app/api/ai/generate-content/route';

// Mock authentication
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id'
  })),
  currentUser: jest.fn(() => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }]
  }))
}));

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                content: 'Test content with disclaimer. Market risks apply.',
                title: 'Test Title',
                category: 'educational',
                language: 'en',
                risk_score: 20,
                compliance_notes: [],
                disclaimers: ['Market risks apply'],
                hashtags: ['#Finance']
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('Content Generation API Integration Tests', () => {
  describe('POST /api/ai/generate-content', () => {
    it('should generate SEBI-compliant content successfully', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'educational',
          language: 'en',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('isCompliant');
      expect(data).toHaveProperty('riskScore');
      expect(data.content).toContain('disclaimer');
      expect(data.content).toContain('risks');
    });

    it('should handle multi-language content generation', async () => {
      const languages = ['en', 'hi', 'mixed'];
      
      for (const language of languages) {
        const { req } = createMocks({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            advisorId: 'advisor-123',
            contentType: 'educational',
            language,
            advisorProfile: {
              name: 'Test Advisor',
              euin: 'E123456',
              specialization: 'Mutual Funds'
            }
          }
        });

        const response = await generateContent(req as unknown as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toHaveProperty('language', language);
      }
    });

    it('should validate request parameters', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          // Missing required fields
          contentType: 'educational'
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('advisorId is required');
    });

    it('should enforce rate limiting', async () => {
      const requests = [];
      
      // Make 11 requests (limit is 10)
      for (let i = 0; i < 11; i++) {
        const { req } = createMocks({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            advisorId: 'advisor-rate-limit',
            contentType: 'educational',
            language: 'en',
            advisorProfile: {
              name: 'Test Advisor',
              euin: 'E123456',
              specialization: 'Mutual Funds'
            }
          }
        });
        
        requests.push(generateContent(req as unknown as NextRequest));
      }

      const responses = await Promise.all(requests);
      const lastResponse = responses[10];
      const data = await lastResponse.json();

      expect(lastResponse.status).toBe(429);
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('limit exceeded');
    });

    it('should handle three-stage compliance validation', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'investment_tips',
          language: 'en',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Equity'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('complianceStatus');
      expect(data.complianceStatus).toHaveProperty('stage1');
      expect(data.complianceStatus).toHaveProperty('stage2');
      expect(data.complianceStatus).toHaveProperty('stage3');
      expect(data.complianceStatus).toHaveProperty('finalScore');
    });

    it('should include audit trail information', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'educational',
          language: 'en',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('auditLog');
      expect(data.auditLog).toHaveProperty('timestamp');
      expect(data.auditLog).toHaveProperty('contentHash');
      expect(data.auditLog).toHaveProperty('advisorId');
      expect(data.auditLog).toHaveProperty('complianceChecks');
    });

    it('should handle content customization based on advisor tier', async () => {
      const tiers = ['basic', 'standard', 'pro'];
      
      for (const tier of tiers) {
        const { req } = createMocks({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            advisorId: 'advisor-123',
            contentType: 'educational',
            language: 'en',
            advisorProfile: {
              name: 'Test Advisor',
              euin: 'E123456',
              specialization: 'Mutual Funds',
              tier
            }
          }
        });

        const response = await generateContent(req as unknown as NextRequest);
        const data = await response.json();

        expect(response.status).toBe(200);
        
        if (tier === 'pro') {
          expect(data).toHaveProperty('advancedFeatures');
          expect(data.advancedFeatures).toHaveProperty('customBranding');
        }
      }
    });

    it('should generate content with proper formatting for WhatsApp', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'educational',
          language: 'en',
          platform: 'whatsapp',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content.length).toBeLessThanOrEqual(1024);
      expect(data).toHaveProperty('formattedForWhatsApp', true);
      expect(data.content).not.toContain('<html>');
      expect(data.content).not.toContain('<br>');
    });

    it('should handle seasonal content generation', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'seasonal',
          language: 'en',
          seasonalContext: 'diwali',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Tax Planning'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contentType).toBe('seasonal');
      expect(data.content.toLowerCase()).toContain('diwali');
      expect(data).toHaveProperty('seasonalTags');
    });

    it('should handle promotional content with compliance checks', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'promotional',
          language: 'en',
          promotionDetails: {
            type: 'new_fund_offer',
            fundName: 'Test Equity Fund'
          },
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.contentType).toBe('promotional');
      expect(data.content).not.toContain('guaranteed');
      expect(data.content).not.toContain('assured');
      expect(data.content).toContain('subject to market risks');
      expect(data).toHaveProperty('promotionalCompliance', true);
    });

    it('should handle API timeout gracefully', async () => {
      // Mock timeout scenario
      jest.setTimeout(5000);
      
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-timeout',
          contentType: 'educational',
          language: 'en',
          forceTimeout: true, // Special flag to trigger timeout in test
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('isFallback', true);
      expect(data).toHaveProperty('content');
      expect(data.content).toContain('market risks');
    });

    it('should track performance metrics', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'educational',
          language: 'en',
          includeMetrics: true,
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('performanceMetrics');
      expect(data.performanceMetrics).toHaveProperty('generationTime');
      expect(data.performanceMetrics).toHaveProperty('complianceCheckTime');
      expect(data.performanceMetrics).toHaveProperty('totalTime');
      expect(data.performanceMetrics.totalTime).toBeLessThan(3000);
    });

    it('should handle bulk content generation requests', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          bulkRequest: true,
          advisors: [
            {
              advisorId: 'advisor-1',
              contentType: 'educational',
              language: 'en'
            },
            {
              advisorId: 'advisor-2',
              contentType: 'market_updates',
              language: 'hi'
            },
            {
              advisorId: 'advisor-3',
              contentType: 'seasonal',
              language: 'mixed'
            }
          ],
          commonProfile: {
            specialization: 'Mutual Funds'
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('results');
      expect(data.results).toHaveLength(3);
      expect(data.results[0].language).toBe('en');
      expect(data.results[1].language).toBe('hi');
      expect(data.results[2].language).toBe('mixed');
    });

    it('should validate EUIN in generated content', async () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          advisorId: 'advisor-123',
          contentType: 'investment_tips',
          language: 'en',
          advisorProfile: {
            name: 'Test Advisor',
            euin: 'E123456',
            specialization: 'Equity',
            includeEUIN: true
          }
        }
      });

      const response = await generateContent(req as unknown as NextRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toContain('E123456');
      expect(data).toHaveProperty('euinIncluded', true);
    });
  });
});