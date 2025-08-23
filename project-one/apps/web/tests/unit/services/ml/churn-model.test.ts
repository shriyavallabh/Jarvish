/**
 * Churn Prediction Model Tests
 * Tests for ML-powered advisor churn prediction
 */

import { ChurnPredictionModel } from '@/lib/services/ml/churn-model';
import { createClient } from '@supabase/supabase-js';
import * as tf from '@tensorflow/tfjs';
import { redis } from '@/lib/redis';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null
          })),
          gte: jest.fn(() => ({
            lte: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      })),
      insert: jest.fn(() => ({
        data: {},
        error: null
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null
        }))
      }))
    }))
  }))
}));

jest.mock('@tensorflow/tfjs');
jest.mock('@/lib/redis', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    expire: jest.fn(),
    del: jest.fn()
  }
}));

describe('ChurnPredictionModel', () => {
  let churnModel: ChurnPredictionModel;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    churnModel = new ChurnPredictionModel();
    mockSupabase = createClient('', '');
  });

  describe('predictChurn', () => {
    it('should predict churn probability for an advisor', async () => {
      const advisorId = 'advisor-123';
      
      // Mock advisor data
      const mockAdvisorData = {
        id: advisorId,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days old
        last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        subscription_tier: 'PRO',
        total_content_created: 150,
        average_engagement_rate: 0.65
      };

      // Mock activity data
      const mockActivityData = {
        login_frequency: 0.85,
        content_creation_rate: 0.75,
        engagement_trend: 'increasing',
        feature_usage: {
          content_composer: 0.9,
          analytics: 0.7,
          whatsapp_delivery: 0.95
        }
      };

      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockAdvisorData,
                error: null
              }))
            }))
          }))
        })
        .mockReturnValueOnce({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                lte: jest.fn(() => ({
                  data: [mockActivityData],
                  error: null
                }))
              }))
            }))
          }))
        });

      // Mock TensorFlow model prediction
      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => [0.25]) // 25% churn probability
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      const prediction = await churnModel.predictChurn(advisorId);

      expect(prediction).toBeDefined();
      expect(prediction.advisor_id).toBe(advisorId);
      expect(prediction.churn_probability).toBeGreaterThanOrEqual(0);
      expect(prediction.churn_probability).toBeLessThanOrEqual(1);
      expect(prediction.risk_level).toBeDefined();
      expect(prediction.risk_factors).toBeInstanceOf(Array);
      expect(prediction.retention_actions).toBeInstanceOf(Array);
    });

    it('should classify risk levels correctly', async () => {
      const testCases = [
        { probability: 0.15, expectedLevel: 'low' },
        { probability: 0.45, expectedLevel: 'medium' },
        { probability: 0.75, expectedLevel: 'high' },
        { probability: 0.92, expectedLevel: 'critical' }
      ];

      for (const testCase of testCases) {
        const mockModel = {
          predict: jest.fn(() => ({
            dataSync: jest.fn(() => [testCase.probability])
          }))
        };
        (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

        const prediction = await churnModel.predictChurn('advisor-123');
        expect(prediction.risk_level).toBe(testCase.expectedLevel);
      }
    });

    it('should use cached predictions when available', async () => {
      const advisorId = 'advisor-123';
      const cachedPrediction = {
        advisor_id: advisorId,
        churn_probability: 0.3,
        risk_level: 'medium',
        predicted_at: new Date()
      };

      (redis.get as jest.Mock).mockResolvedValue(JSON.stringify(cachedPrediction));

      const prediction = await churnModel.predictChurn(advisorId);

      expect(redis.get).toHaveBeenCalledWith(`churn:${advisorId}`);
      expect(prediction.advisor_id).toBe(advisorId);
      expect(prediction.churn_probability).toBe(0.3);
    });
  });

  describe('identifyRiskFactors', () => {
    it('should identify engagement-related risk factors', async () => {
      const advisorMetrics = {
        login_frequency: 0.2, // Low
        content_creation_rate: 0.15, // Very low
        engagement_rate: 0.35, // Below average
        last_login_days: 15,
        subscription_days_remaining: 5
      };

      const riskFactors = await churnModel.identifyRiskFactors(advisorMetrics);

      expect(riskFactors).toContain('Low login frequency (20% of average)');
      expect(riskFactors).toContain('Declining content creation');
      expect(riskFactors).toContain('Below average engagement rates');
      expect(riskFactors).toContain('No login in 15+ days');
      expect(riskFactors).toContain('Subscription expiring soon');
    });

    it('should identify feature usage risk factors', async () => {
      const advisorMetrics = {
        feature_usage: {
          content_composer: 0.1,
          analytics: 0.05,
          whatsapp_delivery: 0.2
        },
        support_tickets: 5,
        failed_deliveries: 10
      };

      const riskFactors = await churnModel.identifyRiskFactors(advisorMetrics);

      expect(riskFactors).toContain('Minimal feature utilization');
      expect(riskFactors).toContain('High support ticket volume');
      expect(riskFactors).toContain('Delivery failures impacting experience');
    });
  });

  describe('generateRetentionActions', () => {
    it('should generate actions for high-risk advisors', async () => {
      const riskLevel = 'high';
      const riskFactors = [
        'Low login frequency',
        'Declining content creation',
        'Subscription expiring soon'
      ];

      const actions = await churnModel.generateRetentionActions(riskLevel, riskFactors);

      expect(actions).toContain('Immediate personal outreach from success team');
      expect(actions).toContain('Offer 1-on-1 training session');
      expect(actions).toContain('Provide discount on renewal');
      expect(actions.length).toBeGreaterThan(3);
    });

    it('should generate actions for medium-risk advisors', async () => {
      const riskLevel = 'medium';
      const riskFactors = ['Below average engagement'];

      const actions = await churnModel.generateRetentionActions(riskLevel, riskFactors);

      expect(actions).toContain('Send best practices guide');
      expect(actions).toContain('Invite to webinar');
      expect(actions.length).toBeGreaterThan(2);
    });

    it('should generate minimal actions for low-risk advisors', async () => {
      const riskLevel = 'low';
      const riskFactors = [];

      const actions = await churnModel.generateRetentionActions(riskLevel, riskFactors);

      expect(actions).toContain('Continue regular engagement');
      expect(actions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('trainModel', () => {
    it('should train the model with historical data', async () => {
      const trainingData = [
        {
          features: [0.8, 0.7, 30, 0.65, 1],
          churned: false
        },
        {
          features: [0.2, 0.1, 90, 0.25, 0],
          churned: true
        }
      ];

      // Mock TensorFlow operations
      const mockModel = {
        compile: jest.fn(),
        fit: jest.fn(() => ({
          history: { loss: [0.5, 0.3, 0.2] }
        })),
        save: jest.fn()
      };

      (tf.sequential as jest.Mock).mockReturnValue(mockModel);
      (tf.layers.dense as jest.Mock).mockReturnValue({});
      (tf.tensor2d as jest.Mock).mockReturnValue({});

      const result = await churnModel.trainModel(trainingData);

      expect(result.success).toBe(true);
      expect(result.metrics).toBeDefined();
      expect(mockModel.compile).toHaveBeenCalled();
      expect(mockModel.fit).toHaveBeenCalled();
    });

    it('should handle training errors gracefully', async () => {
      (tf.sequential as jest.Mock).mockImplementation(() => {
        throw new Error('Training failed');
      });

      const result = await churnModel.trainModel([]);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Training failed');
    });
  });

  describe('batchPredict', () => {
    it('should predict churn for multiple advisors', async () => {
      const advisorIds = ['advisor-1', 'advisor-2', 'advisor-3'];
      
      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => [0.2, 0.5, 0.8])
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            data: advisorIds.map(id => ({
              id,
              created_at: new Date(),
              last_login: new Date()
            })),
            error: null
          }))
        }))
      }));

      const predictions = await churnModel.batchPredict(advisorIds);

      expect(predictions).toHaveLength(3);
      expect(predictions[0].churn_probability).toBe(0.2);
      expect(predictions[1].churn_probability).toBe(0.5);
      expect(predictions[2].churn_probability).toBe(0.8);
    });

    it('should handle batch prediction errors', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            data: null,
            error: new Error('Database error')
          }))
        }))
      }));

      await expect(churnModel.batchPredict(['advisor-1'])).rejects.toThrow('Database error');
    });
  });

  describe('getChurnTrends', () => {
    it('should calculate churn trends over time', async () => {
      const mockHistoricalData = [
        { month: '2024-01', churn_rate: 0.05, total_advisors: 100 },
        { month: '2024-02', churn_rate: 0.04, total_advisors: 110 },
        { month: '2024-03', churn_rate: 0.06, total_advisors: 105 }
      ];

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          gte: jest.fn(() => ({
            order: jest.fn(() => ({
              data: mockHistoricalData,
              error: null
            }))
          }))
        }))
      }));

      const trends = await churnModel.getChurnTrends(3);

      expect(trends.average_churn_rate).toBeCloseTo(0.05, 2);
      expect(trends.trend_direction).toBeDefined();
      expect(trends.monthly_data).toHaveLength(3);
    });
  });

  describe('updateModelWeights', () => {
    it('should update model weights based on feedback', async () => {
      const feedbackData = [
        {
          advisor_id: 'advisor-1',
          predicted_churn: 0.7,
          actual_churned: true
        },
        {
          advisor_id: 'advisor-2',
          predicted_churn: 0.3,
          actual_churned: false
        }
      ];

      const mockModel = {
        getWeights: jest.fn(() => [
          { dataSync: jest.fn(() => [0.5, 0.3, 0.2]) }
        ]),
        setWeights: jest.fn(),
        save: jest.fn()
      };

      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      const result = await churnModel.updateModelWeights(feedbackData);

      expect(result.success).toBe(true);
      expect(result.accuracy_improvement).toBeDefined();
      expect(mockModel.setWeights).toHaveBeenCalled();
    });
  });

  describe('exportPredictions', () => {
    it('should export predictions in CSV format', async () => {
      const predictions = [
        {
          advisor_id: 'advisor-1',
          churn_probability: 0.25,
          risk_level: 'low',
          predicted_at: new Date('2024-01-15')
        },
        {
          advisor_id: 'advisor-2',
          churn_probability: 0.75,
          risk_level: 'high',
          predicted_at: new Date('2024-01-15')
        }
      ];

      const csv = await churnModel.exportPredictions(predictions, 'csv');

      expect(csv).toContain('advisor_id,churn_probability,risk_level,predicted_at');
      expect(csv).toContain('advisor-1,0.25,low');
      expect(csv).toContain('advisor-2,0.75,high');
    });

    it('should export predictions in JSON format', async () => {
      const predictions = [
        {
          advisor_id: 'advisor-1',
          churn_probability: 0.25,
          risk_level: 'low'
        }
      ];

      const json = await churnModel.exportPredictions(predictions, 'json');
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(1);
      expect(parsed[0].advisor_id).toBe('advisor-1');
    });
  });

  describe('getModelMetrics', () => {
    it('should return current model performance metrics', async () => {
      const mockMetrics = {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.88,
        f1_score: 0.85,
        auc_roc: 0.91,
        last_trained: new Date(),
        total_predictions: 1500
      };

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              single: jest.fn(() => ({
                data: mockMetrics,
                error: null
              }))
            }))
          }))
        }))
      }));

      const metrics = await churnModel.getModelMetrics();

      expect(metrics.accuracy).toBe(0.85);
      expect(metrics.precision).toBe(0.82);
      expect(metrics.recall).toBe(0.88);
      expect(metrics.f1_score).toBe(0.85);
      expect(metrics.auc_roc).toBe(0.91);
    });
  });

  describe('caching behavior', () => {
    it('should cache individual predictions', async () => {
      const advisorId = 'advisor-123';
      
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: advisorId },
              error: null
            }))
          }))
        }))
      }));

      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => [0.3])
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      await churnModel.predictChurn(advisorId);

      expect(redis.set).toHaveBeenCalled();
      expect(redis.expire).toHaveBeenCalledWith(
        `churn:${advisorId}`,
        86400 // 24 hours
      );
    });

    it('should invalidate cache after model update', async () => {
      await churnModel.invalidateAllCaches();

      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('performance requirements', () => {
    it('should complete single prediction within 500ms', async () => {
      const startTime = Date.now();
      
      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => [0.5])
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: { id: 'advisor-123' },
              error: null
            }))
          }))
        }))
      }));

      await churnModel.predictChurn('advisor-123');
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(500);
    });

    it('should handle batch of 100 predictions within 5 seconds', async () => {
      const startTime = Date.now();
      const advisorIds = Array(100).fill(null).map((_, i) => `advisor-${i}`);
      
      const mockModel = {
        predict: jest.fn(() => ({
          dataSync: jest.fn(() => Array(100).fill(0.5))
        }))
      };
      (tf.loadLayersModel as jest.Mock).mockResolvedValue(mockModel);

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          in: jest.fn(() => ({
            data: advisorIds.map(id => ({ id })),
            error: null
          }))
        }))
      }));

      await churnModel.batchPredict(advisorIds);
      
      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000);
    });
  });
});