// Compliance API integration
// Real-time compliance checking with the backend service

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface ComplianceCheckRequest {
  content: string;
  language?: 'en' | 'hi' | 'mr';
  contentType?: 'whatsapp' | 'status' | 'linkedin' | 'email';
  advisorId?: string;
  skipCache?: boolean;
}

export interface ComplianceIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
  code?: string;
  location?: string;
}

export interface ComplianceCheckResponse {
  isCompliant: boolean;
  riskScore: number;
  issues: ComplianceIssue[];
  suggestions: string[];
  processingTime: number;
  processedContent?: string;
  stagesCompleted: {
    rules: boolean;
    ai: boolean;
    final: boolean;
  };
}

/**
 * Check content compliance using the three-stage validation system
 */
export async function checkCompliance(
  request: ComplianceCheckRequest
): Promise<ComplianceCheckResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/compliance/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Compliance check failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Compliance check error:', error);
    throw error;
  }
}

/**
 * Generate compliant content
 */
export async function generateCompliantContent(params: {
  topic: string;
  language?: 'en' | 'hi' | 'mr';
  contentType?: 'whatsapp' | 'status' | 'linkedin' | 'email';
  tone?: 'professional' | 'casual' | 'educational';
  includeDisclaimer?: boolean;
  advisorId?: string;
}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/compliance/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Content generation failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Content generation error:', error);
    throw error;
  }
}

/**
 * Get compliance rules
 */
export async function getComplianceRules(language: string = 'en') {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/compliance/rules?language=${language}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch compliance rules');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching compliance rules:', error);
    throw error;
  }
}

/**
 * Auto-fix compliance issues
 */
export async function autoFixContent(content: string, language: string = 'en') {
  try {
    const response = await fetch(`${API_BASE_URL}/api/compliance/fix`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Auto-fix failed');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Auto-fix error:', error);
    throw error;
  }
}

/**
 * Get compliance statistics
 */
export async function getComplianceStats(advisorId?: string) {
  try {
    const url = advisorId
      ? `${API_BASE_URL}/api/compliance/stats?advisorId=${advisorId}`
      : `${API_BASE_URL}/api/compliance/stats`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch compliance stats');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    throw error;
  }
}