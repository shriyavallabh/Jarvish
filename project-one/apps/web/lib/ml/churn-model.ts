/**
 * Churn Prediction Machine Learning Model
 * Implements Random Forest-like ensemble for churn prediction
 * Epic: E08-US-002
 */

// Types
export interface ModelFeatures {
  // Activity features
  days_since_login: number;
  login_frequency_30d: number;
  content_created_30d: number;
  content_created_60d: number;
  messages_sent_30d: number;
  messages_sent_60d: number;
  
  // Engagement features
  avg_engagement_rate: number;
  engagement_trend: number; // Positive or negative trend
  read_rate: number;
  response_rate: number;
  
  // Compliance features
  compliance_score: number;
  compliance_violations: number;
  rejection_rate: number;
  
  // Support features
  support_tickets_30d: number;
  unresolved_tickets: number;
  avg_resolution_time: number;
  sentiment_score: number; // From ticket analysis
  
  // Subscription features
  subscription_tier_numeric: number; // 0=Free, 1=Basic, 2=Standard, 3=Pro
  days_since_subscription: number;
  payment_failures: number;
  tier_downgrades: number;
  
  // Usage pattern features
  feature_adoption_score: number;
  whatsapp_usage: number;
  ai_content_usage: number;
  template_usage: number;
  
  // Time-based features
  account_age_days: number;
  last_content_days_ago: number;
  last_message_days_ago: number;
  active_days_last_30: number;
  
  // Behavioral features
  content_velocity_change: number; // Rate of change in content creation
  engagement_velocity_change: number;
  login_pattern_consistency: number;
  usage_pattern_consistency: number;
}

export interface ChurnPredictionResult {
  probability: number; // 0-1 probability of churn
  risk_score: number; // 0-100 risk score
  confidence: number; // Model confidence in prediction
  feature_importance: Record<string, number>;
  risk_factors: string[];
}

/**
 * Decision Tree Node for Random Forest
 */
class DecisionNode {
  feature: string | null = null;
  threshold: number | null = null;
  left: DecisionNode | null = null;
  right: DecisionNode | null = null;
  value: number | null = null; // Leaf node value

  isLeaf(): boolean {
    return this.value !== null;
  }
}

/**
 * Simple Decision Tree for ensemble
 */
class DecisionTree {
  private root: DecisionNode | null = null;
  private maxDepth: number;
  private minSamplesSplit: number;

  constructor(maxDepth: number = 10, minSamplesSplit: number = 5) {
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
  }

  /**
   * Fit the tree with training data
   */
  fit(features: ModelFeatures[], labels: number[]): void {
    this.root = this.buildTree(features, labels, 0);
  }

  /**
   * Build tree recursively
   */
  private buildTree(
    features: ModelFeatures[],
    labels: number[],
    depth: number
  ): DecisionNode {
    const node = new DecisionNode();

    // Check stopping criteria
    if (
      depth >= this.maxDepth ||
      features.length < this.minSamplesSplit ||
      this.isPure(labels)
    ) {
      node.value = this.calculateLeafValue(labels);
      return node;
    }

    // Find best split
    const bestSplit = this.findBestSplit(features, labels);
    
    if (!bestSplit) {
      node.value = this.calculateLeafValue(labels);
      return node;
    }

    // Apply split
    node.feature = bestSplit.feature;
    node.threshold = bestSplit.threshold;

    const { leftFeatures, leftLabels, rightFeatures, rightLabels } = 
      this.applySplit(features, labels, bestSplit.feature, bestSplit.threshold);

    // Recursively build subtrees
    node.left = this.buildTree(leftFeatures, leftLabels, depth + 1);
    node.right = this.buildTree(rightFeatures, rightLabels, depth + 1);

    return node;
  }

  /**
   * Find best feature and threshold to split on
   */
  private findBestSplit(
    features: ModelFeatures[],
    labels: number[]
  ): { feature: string; threshold: number } | null {
    let bestGini = Infinity;
    let bestFeature: string | null = null;
    let bestThreshold: number | null = null;

    const featureNames = Object.keys(features[0]);

    for (const feature of featureNames) {
      const values = features.map(f => (f as any)[feature]).sort((a, b) => a - b);
      const uniqueValues = [...new Set(values)];

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const threshold = (uniqueValues[i] + uniqueValues[i + 1]) / 2;
        const gini = this.calculateGiniImpurity(features, labels, feature, threshold);

        if (gini < bestGini) {
          bestGini = gini;
          bestFeature = feature;
          bestThreshold = threshold;
        }
      }
    }

    if (bestFeature && bestThreshold !== null) {
      return { feature: bestFeature, threshold: bestThreshold };
    }

    return null;
  }

  /**
   * Calculate Gini impurity for a split
   */
  private calculateGiniImpurity(
    features: ModelFeatures[],
    labels: number[],
    feature: string,
    threshold: number
  ): number {
    const leftIndices: number[] = [];
    const rightIndices: number[] = [];

    features.forEach((f, i) => {
      if ((f as any)[feature] <= threshold) {
        leftIndices.push(i);
      } else {
        rightIndices.push(i);
      }
    });

    if (leftIndices.length === 0 || rightIndices.length === 0) {
      return Infinity;
    }

    const leftLabels = leftIndices.map(i => labels[i]);
    const rightLabels = rightIndices.map(i => labels[i]);

    const leftGini = this.gini(leftLabels);
    const rightGini = this.gini(rightLabels);

    const n = labels.length;
    const weightedGini = 
      (leftLabels.length / n) * leftGini + 
      (rightLabels.length / n) * rightGini;

    return weightedGini;
  }

  /**
   * Calculate Gini index
   */
  private gini(labels: number[]): number {
    if (labels.length === 0) return 0;

    const counts = labels.reduce((acc, label) => {
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    let gini = 1;
    const n = labels.length;

    for (const count of Object.values(counts)) {
      const p = count / n;
      gini -= p * p;
    }

    return gini;
  }

  /**
   * Check if labels are pure (all same class)
   */
  private isPure(labels: number[]): boolean {
    return new Set(labels).size === 1;
  }

  /**
   * Calculate leaf value (probability)
   */
  private calculateLeafValue(labels: number[]): number {
    if (labels.length === 0) return 0.5;
    const positiveCount = labels.filter(l => l === 1).length;
    return positiveCount / labels.length;
  }

  /**
   * Apply split to data
   */
  private applySplit(
    features: ModelFeatures[],
    labels: number[],
    splitFeature: string,
    threshold: number
  ) {
    const leftFeatures: ModelFeatures[] = [];
    const leftLabels: number[] = [];
    const rightFeatures: ModelFeatures[] = [];
    const rightLabels: number[] = [];

    features.forEach((f, i) => {
      if ((f as any)[splitFeature] <= threshold) {
        leftFeatures.push(f);
        leftLabels.push(labels[i]);
      } else {
        rightFeatures.push(f);
        rightLabels.push(labels[i]);
      }
    });

    return { leftFeatures, leftLabels, rightFeatures, rightLabels };
  }

  /**
   * Predict probability for single sample
   */
  predict(features: ModelFeatures): number {
    if (!this.root) return 0.5;
    return this.predictNode(features, this.root);
  }

  /**
   * Traverse tree for prediction
   */
  private predictNode(features: ModelFeatures, node: DecisionNode): number {
    if (node.isLeaf()) {
      return node.value || 0.5;
    }

    if (!node.feature || node.threshold === null) {
      return 0.5;
    }

    const featureValue = (features as any)[node.feature];

    if (featureValue <= node.threshold) {
      return node.left ? this.predictNode(features, node.left) : 0.5;
    } else {
      return node.right ? this.predictNode(features, node.right) : 0.5;
    }
  }
}

/**
 * Random Forest Ensemble for Churn Prediction
 */
export class ChurnPredictionModel {
  private trees: DecisionTree[] = [];
  private nEstimators: number;
  private maxDepth: number;
  private featureImportance: Record<string, number> = {};
  private trained: boolean = false;

  constructor(nEstimators: number = 100, maxDepth: number = 10) {
    this.nEstimators = nEstimators;
    this.maxDepth = maxDepth;
  }

  /**
   * Train the model with historical data
   */
  train(features: ModelFeatures[], labels: number[]): void {
    this.trees = [];
    this.featureImportance = {};

    // Train multiple trees with bootstrapped samples
    for (let i = 0; i < this.nEstimators; i++) {
      const { sampledFeatures, sampledLabels } = this.bootstrap(features, labels);
      
      const tree = new DecisionTree(this.maxDepth);
      tree.fit(sampledFeatures, sampledLabels);
      this.trees.push(tree);
    }

    // Calculate feature importance
    this.calculateFeatureImportance(features, labels);
    this.trained = true;
  }

  /**
   * Bootstrap sampling for ensemble diversity
   */
  private bootstrap(
    features: ModelFeatures[],
    labels: number[]
  ): { sampledFeatures: ModelFeatures[]; sampledLabels: number[] } {
    const n = features.length;
    const sampledFeatures: ModelFeatures[] = [];
    const sampledLabels: number[] = [];

    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      sampledFeatures.push(features[idx]);
      sampledLabels.push(labels[idx]);
    }

    return { sampledFeatures, sampledLabels };
  }

  /**
   * Calculate feature importance using permutation
   */
  private calculateFeatureImportance(features: ModelFeatures[], labels: number[]): void {
    const baseScore = this.score(features, labels);
    const featureNames = Object.keys(features[0]);

    for (const feature of featureNames) {
      // Permute feature values
      const permutedFeatures = this.permuteFeature(features, feature);
      const permutedScore = this.score(permutedFeatures, labels);
      
      // Importance is drop in performance
      this.featureImportance[feature] = Math.max(0, baseScore - permutedScore);
    }

    // Normalize importance scores
    const totalImportance = Object.values(this.featureImportance).reduce((a, b) => a + b, 0);
    if (totalImportance > 0) {
      for (const feature in this.featureImportance) {
        this.featureImportance[feature] /= totalImportance;
      }
    }
  }

  /**
   * Permute a feature's values randomly
   */
  private permuteFeature(features: ModelFeatures[], featureName: string): ModelFeatures[] {
    const permuted = features.map(f => ({ ...f }));
    const values = permuted.map(f => (f as any)[featureName]);
    
    // Fisher-Yates shuffle
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }

    permuted.forEach((f, i) => {
      (f as any)[featureName] = values[i];
    });

    return permuted;
  }

  /**
   * Calculate model accuracy score
   */
  private score(features: ModelFeatures[], labels: number[]): number {
    let correct = 0;

    for (let i = 0; i < features.length; i++) {
      const prediction = this.predictProbability(features[i]) > 0.5 ? 1 : 0;
      if (prediction === labels[i]) {
        correct++;
      }
    }

    return correct / features.length;
  }

  /**
   * Predict churn probability for a single advisor
   */
  predict(features: ModelFeatures): ChurnPredictionResult {
    if (!this.trained) {
      // Use rule-based fallback if model not trained
      return this.ruleBasedPrediction(features);
    }

    const probability = this.predictProbability(features);
    const riskScore = Math.round(probability * 100);
    const confidence = this.calculateConfidence(features);
    const riskFactors = this.identifyRiskFactors(features);

    return {
      probability,
      risk_score: riskScore,
      confidence,
      feature_importance: this.featureImportance,
      risk_factors: riskFactors
    };
  }

  /**
   * Get probability from ensemble
   */
  private predictProbability(features: ModelFeatures): number {
    if (this.trees.length === 0) {
      return this.ruleBasedProbability(features);
    }

    const predictions = this.trees.map(tree => tree.predict(features));
    return predictions.reduce((a, b) => a + b, 0) / predictions.length;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(features: ModelFeatures): number {
    if (this.trees.length === 0) return 0.5;

    const predictions = this.trees.map(tree => tree.predict(features));
    const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    
    // Calculate standard deviation
    const variance = predictions.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / predictions.length;
    const std = Math.sqrt(variance);
    
    // Lower std means higher confidence
    const confidence = Math.max(0, Math.min(1, 1 - (std * 2)));
    return confidence;
  }

  /**
   * Identify top risk factors
   */
  private identifyRiskFactors(features: ModelFeatures): string[] {
    const riskFactors: string[] = [];

    // Critical activity indicators
    if (features.days_since_login > 14) {
      riskFactors.push('No login for more than 2 weeks');
    }
    
    if (features.content_created_30d === 0) {
      riskFactors.push('No content created in last 30 days');
    }
    
    if (features.messages_sent_30d === 0) {
      riskFactors.push('No messages sent in last 30 days');
    }

    // Engagement decline
    if (features.engagement_trend < -0.3) {
      riskFactors.push('Significant engagement decline (>30%)');
    }

    // Support issues
    if (features.support_tickets_30d > 3) {
      riskFactors.push('Multiple support tickets indicate frustration');
    }

    // Payment issues
    if (features.payment_failures > 0) {
      riskFactors.push('Payment failures detected');
    }

    // Compliance problems
    if (features.compliance_score < 70) {
      riskFactors.push('Low compliance score');
    }

    // Usage pattern changes
    if (features.content_velocity_change < -0.5) {
      riskFactors.push('Content creation velocity dropped >50%');
    }

    return riskFactors.slice(0, 5); // Return top 5 factors
  }

  /**
   * Rule-based fallback prediction
   */
  private ruleBasedPrediction(features: ModelFeatures): ChurnPredictionResult {
    const probability = this.ruleBasedProbability(features);
    const riskScore = Math.round(probability * 100);
    const riskFactors = this.identifyRiskFactors(features);

    return {
      probability,
      risk_score: riskScore,
      confidence: 0.7, // Lower confidence for rule-based
      feature_importance: this.getDefaultFeatureImportance(),
      risk_factors: riskFactors
    };
  }

  /**
   * Calculate probability using rules
   */
  private ruleBasedProbability(features: ModelFeatures): number {
    let riskScore = 0;
    let maxScore = 0;

    // Activity scoring (40 points)
    maxScore += 40;
    if (features.days_since_login > 14) riskScore += 40;
    else if (features.days_since_login > 7) riskScore += 20;
    else if (features.days_since_login > 3) riskScore += 10;

    // Content creation (20 points)
    maxScore += 20;
    if (features.content_created_30d === 0) riskScore += 20;
    else if (features.content_created_30d < 5) riskScore += 10;

    // Engagement (20 points)
    maxScore += 20;
    if (features.avg_engagement_rate < 30) riskScore += 20;
    else if (features.avg_engagement_rate < 50) riskScore += 10;

    // Support issues (10 points)
    maxScore += 10;
    if (features.support_tickets_30d > 3) riskScore += 10;
    else if (features.support_tickets_30d > 1) riskScore += 5;

    // Payment/Subscription (10 points)
    maxScore += 10;
    if (features.payment_failures > 0) riskScore += 10;
    if (features.tier_downgrades > 0) riskScore += 5;

    return Math.min(0.95, riskScore / maxScore);
  }

  /**
   * Get default feature importance
   */
  private getDefaultFeatureImportance(): Record<string, number> {
    return {
      days_since_login: 0.25,
      content_created_30d: 0.15,
      engagement_trend: 0.15,
      messages_sent_30d: 0.10,
      support_tickets_30d: 0.10,
      payment_failures: 0.08,
      compliance_score: 0.07,
      avg_engagement_rate: 0.05,
      feature_adoption_score: 0.05
    };
  }

  /**
   * Serialize model for storage
   */
  serialize(): string {
    return JSON.stringify({
      nEstimators: this.nEstimators,
      maxDepth: this.maxDepth,
      featureImportance: this.featureImportance,
      trained: this.trained
      // Note: Trees would need custom serialization in production
    });
  }

  /**
   * Load model from serialized data
   */
  static deserialize(data: string): ChurnPredictionModel {
    const parsed = JSON.parse(data);
    const model = new ChurnPredictionModel(parsed.nEstimators, parsed.maxDepth);
    model.featureImportance = parsed.featureImportance;
    model.trained = parsed.trained;
    // Note: Would need to deserialize trees in production
    return model;
  }
}

// Export singleton instance
export const churnModel = new ChurnPredictionModel();