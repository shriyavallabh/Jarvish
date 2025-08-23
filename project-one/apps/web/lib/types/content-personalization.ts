/**
 * Content Personalization Types
 * Defines interfaces for client demographic profiling and content adaptation
 */

export interface ClientDemographics {
  // Age-based segmentation
  ageGroup: 'gen-z' | 'millennial' | 'gen-x' | 'boomer' | 'senior';
  exactAge?: number;
  
  // Income level segmentation
  incomeLevel: 'low' | 'middle' | 'upper-middle' | 'high' | 'ultra-high';
  annualIncome?: number; // in INR
  
  // Investment experience
  investmentExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  yearsOfInvesting?: number;
  
  // Regional context
  region: 'north' | 'south' | 'east' | 'west' | 'northeast' | 'central';
  state?: string;
  city?: string;
  urbanRural: 'urban' | 'semi-urban' | 'rural';
  
  // Additional profiling
  occupation?: string;
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  preferredLanguage?: 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'bn' | 'kn' | 'ml' | 'pa';
  financialGoals?: string[];
  hasChildren?: boolean;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';
}

export interface PersonalizationContext {
  demographics: ClientDemographics;
  contentType: string;
  currentContext?: {
    marketCondition?: 'bullish' | 'bearish' | 'volatile' | 'stable';
    season?: string;
    recentEvents?: string[];
  };
  preferences?: {
    contentLength?: 'brief' | 'standard' | 'detailed';
    visualPreference?: 'text' | 'visual' | 'mixed';
    communicationStyle?: 'formal' | 'conversational' | 'simple';
  };
}

export interface ContentVariant {
  ageGroup: string;
  content: string;
  tone: string;
  examples: string[];
  culturalReferences?: string[];
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface PersonalizationRules {
  ageGroupRules: Record<string, {
    tone: string;
    examples: string[];
    avoidTopics?: string[];
    preferredTopics?: string[];
    languageStyle: string;
  }>;
  
  incomeLevelRules: Record<string, {
    investmentRange: { min: number; max: number };
    productFocus: string[];
    riskConsiderations: string[];
    taxImplications?: string[];
  }>;
  
  experienceRules: Record<string, {
    technicalDepth: 'basic' | 'intermediate' | 'advanced';
    jargonLevel: 'minimal' | 'moderate' | 'technical';
    educationalContent: boolean;
    assumptions: string[];
  }>;
  
  regionalRules: Record<string, {
    culturalNuances: string[];
    localExamples: string[];
    festivalsAndEvents: string[];
    regionalProducts?: string[];
    languageMix?: { primary: string; secondary?: string };
  }>;
}

export interface PersonalizedContent {
  originalContent: string;
  personalizedContent: string;
  personalizationFactors: {
    ageAdaptation: boolean;
    incomeAdaptation: boolean;
    experienceAdaptation: boolean;
    regionalAdaptation: boolean;
  };
  adaptations: {
    factor: string;
    originalText?: string;
    adaptedText: string;
    reason: string;
  }[];
  metadata: {
    targetDemographic: ClientDemographics;
    personalizationScore: number; // 0-100
    readabilityScore: number;
    culturalRelevance: number;
    timestamp: string;
  };
  complianceCheck: {
    maintained: boolean;
    warnings?: string[];
  };
}

export interface PersonalizationMetrics {
  totalPersonalizations: number;
  averagePersonalizationScore: number;
  demographicDistribution: Record<string, number>;
  popularAdaptations: {
    type: string;
    count: number;
    effectiveness: number;
  }[];
  performanceMetrics: {
    avgProcessingTime: number;
    p95ProcessingTime: number;
    cacheHitRate: number;
  };
}

export interface PersonalizationConfig {
  enableAgeAdaptation: boolean;
  enableIncomeAdaptation: boolean;
  enableExperienceAdaptation: boolean;
  enableRegionalAdaptation: boolean;
  
  adaptationWeights: {
    age: number;
    income: number;
    experience: number;
    regional: number;
  };
  
  minPersonalizationScore: number;
  maxAdaptations: number;
  cacheEnabled: boolean;
  cacheTTL: number; // in milliseconds
  
  complianceOverride: boolean; // Always maintain SEBI compliance
}

export interface PersonalizationRequest {
  content: string;
  contentType: string;
  demographics: ClientDemographics;
  config?: Partial<PersonalizationConfig>;
  language: 'en' | 'hi' | 'mixed';
  advisorId: string;
  preserveCompliance: boolean;
}

export interface PersonalizationResponse {
  success: boolean;
  personalizedContent?: PersonalizedContent;
  error?: string;
  processingTime: number;
  cacheHit: boolean;
}

// Age group mappings
export const AGE_GROUPS = {
  'gen-z': { range: [18, 25], label: 'Gen Z (18-25)' },
  'millennial': { range: [26, 40], label: 'Millennial (26-40)' },
  'gen-x': { range: [41, 55], label: 'Gen X (41-55)' },
  'boomer': { range: [56, 70], label: 'Baby Boomer (56-70)' },
  'senior': { range: [71, 100], label: 'Senior (71+)' }
} as const;

// Income level mappings (in INR per annum)
export const INCOME_LEVELS = {
  'low': { range: [0, 500000], label: 'Low Income (<5L)' },
  'middle': { range: [500001, 1500000], label: 'Middle Income (5L-15L)' },
  'upper-middle': { range: [1500001, 5000000], label: 'Upper Middle (15L-50L)' },
  'high': { range: [5000001, 20000000], label: 'High Income (50L-2Cr)' },
  'ultra-high': { range: [20000001, Infinity], label: 'Ultra High (>2Cr)' }
} as const;

// Regional mappings
export const REGIONS = {
  'north': ['Delhi', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Himachal Pradesh', 'Uttarakhand', 'Jammu and Kashmir'],
  'south': ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Kerala'],
  'east': ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'],
  'west': ['Maharashtra', 'Gujarat', 'Rajasthan', 'Goa'],
  'northeast': ['Assam', 'Meghalaya', 'Manipur', 'Nagaland', 'Tripura', 'Arunachal Pradesh', 'Mizoram', 'Sikkim'],
  'central': ['Madhya Pradesh', 'Chhattisgarh']
} as const;

// Default personalization config
export const DEFAULT_PERSONALIZATION_CONFIG: PersonalizationConfig = {
  enableAgeAdaptation: true,
  enableIncomeAdaptation: true,
  enableExperienceAdaptation: true,
  enableRegionalAdaptation: true,
  
  adaptationWeights: {
    age: 0.25,
    income: 0.25,
    experience: 0.30,
    regional: 0.20
  },
  
  minPersonalizationScore: 60,
  maxAdaptations: 10,
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour
  
  complianceOverride: true
};