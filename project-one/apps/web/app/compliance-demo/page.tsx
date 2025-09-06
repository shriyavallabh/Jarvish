'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RealTimeComplianceChecker from '@/components/compliance/real-time-checker';
import { Shield, AlertTriangle, CheckCircle, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SAMPLE_CONTENTS = {
  compliant: {
    title: 'Compliant Content',
    text: 'Mutual funds can help you build wealth over the long term through systematic investment plans (SIPs). Remember that mutual fund investments are subject to market risks. Please read all scheme documents carefully before investing.',
    type: 'compliant'
  },
  nonCompliant: {
    title: 'Non-Compliant Content',
    text: 'Invest in our mutual fund scheme for guaranteed returns of 15% annually! This risk-free investment will double your money in just 5 years. Act now!',
    type: 'non-compliant'
  },
  partiallyCompliant: {
    title: 'Partially Compliant',
    text: 'Our mutual fund has delivered excellent returns of 18% last year. This is the best time to invest and grow your wealth quickly.',
    type: 'partial'
  }
};

export default function ComplianceDemo() {
  const [content, setContent] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [contentType, setContentType] = useState<'whatsapp' | 'status' | 'linkedin' | 'email'>('whatsapp');
  const [complianceScore, setComplianceScore] = useState<number>(0);
  const [isCompliant, setIsCompliant] = useState<boolean>(false);

  const handleComplianceUpdate = (compliant: boolean, score: number) => {
    setIsCompliant(compliant);
    setComplianceScore(score);
  };

  const handleAutoFix = (fixedContent: string) => {
    setContent(fixedContent);
    toast.success('Content has been auto-fixed');
  };

  const loadSampleContent = (sample: keyof typeof SAMPLE_CONTENTS) => {
    setContent(SAMPLE_CONTENTS[sample].text);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(content);
    toast.success('Content copied to clipboard');
  };

  const clearContent = () => {
    setContent('');
    setComplianceScore(0);
    setIsCompliant(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">Three-Stage AI Compliance Validation</h1>
                <p className="text-sm text-gray-600">Real-time SEBI compliance checking with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isCompliant ? 'default' : 'destructive'} className="text-lg px-3 py-1">
                Score: {complianceScore}%
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Content Input */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Content Editor</h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyContent}
                    disabled={!content}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearContent}
                    disabled={!content}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              {/* Settings */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="status">Status</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              {/* Content Textarea */}
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your financial content here to check SEBI compliance..."
                rows={10}
                className="w-full mb-4"
              />

              {/* Sample Content Buttons */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Load Sample Content:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadSampleContent('compliant')}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Compliant
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadSampleContent('partiallyCompliant')}
                    className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Partial
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => loadSampleContent('nonCompliant')}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Non-Compliant
                  </Button>
                </div>
              </div>
            </Card>

            {/* Validation Stages Info */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Three-Stage Validation Process</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 rounded-full p-2 mt-1">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Hard Rules Check</h4>
                    <p className="text-sm text-gray-600">
                      Validates against SEBI prohibited terms, mandatory disclaimers, and regulatory requirements
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <span className="text-purple-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">AI Evaluation</h4>
                    <p className="text-sm text-gray-600">
                      GPT-4 analyzes context, tone, and subtle compliance issues that rules might miss
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 rounded-full p-2 mt-1">
                    <span className="text-green-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Final Verification</h4>
                    <p className="text-sm text-gray-600">
                      Cross-checks AI suggestions against rules and generates final compliance score
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Compliance Results */}
          <div className="space-y-6">
            {/* Real-time Compliance Checker */}
            <RealTimeComplianceChecker
              content={content}
              language={language}
              contentType={contentType}
              onComplianceUpdate={handleComplianceUpdate}
              onAutoFix={handleAutoFix}
              autoCheck={true}
              showAutoFix={true}
            />

            {/* Compliance Guidelines */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">SEBI Compliance Guidelines</h3>
              <Tabs defaultValue="prohibited" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="prohibited">Prohibited</TabsTrigger>
                  <TabsTrigger value="mandatory">Mandatory</TabsTrigger>
                  <TabsTrigger value="best">Best Practices</TabsTrigger>
                </TabsList>
                
                <TabsContent value="prohibited" className="mt-4 space-y-2">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Guaranteed returns or assured performance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Risk-free investment claims</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Selective or misleading performance data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Creating urgency or FOMO</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-600 mt-1">✗</span>
                      <span>Comparing with FDs without disclaimers</span>
                    </li>
                  </ul>
                </TabsContent>
                
                <TabsContent value="mandatory" className="mt-4 space-y-2">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Market risk disclaimer for mutual funds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Past performance disclaimer</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Advisor EUIN/ARN number</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Read scheme documents carefully</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span>Educational framing for content</span>
                    </li>
                  </ul>
                </TabsContent>
                
                <TabsContent value="best" className="mt-4 space-y-2">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">★</span>
                      <span>Use professional, clear language</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">★</span>
                      <span>Balance risks and benefits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">★</span>
                      <span>Limit promotional language</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">★</span>
                      <span>Include educational value</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">★</span>
                      <span>Avoid excessive capitalization</span>
                    </li>
                  </ul>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}