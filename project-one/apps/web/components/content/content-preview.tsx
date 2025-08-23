'use client';

import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

interface ContentPreviewProps {
  content: {
    content: string;
    title: string;
    contentType: string;
    language: string;
    isCompliant: boolean;
    complianceScore: number;
    riskScore: number;
    metadata?: {
      generatedAt: string;
      expiresAt: string;
    };
    complianceStatus?: {
      stage1: boolean;
      stage2: boolean;
      stage3: boolean;
      finalScore: number;
    };
    auditLog?: {
      timestamp: string;
      contentHash: string;
      complianceChecks: any[];
    };
    performanceMetrics?: {
      generationTime: number;
      complianceCheckTime: number;
      totalTime: number;
    };
  };
  onClose: () => void;
  onSave: () => void;
  onSchedule: () => void;
  onRegenerate: () => void;
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  content,
  onClose,
  onSave,
  onSchedule,
  onRegenerate
}) => {
  const [editedContent, setEditedContent] = useState(content.content);
  const [isEditing, setIsEditing] = useState(false);
  const [showComplianceDetails, setShowComplianceDetails] = useState(false);

  const getRiskLevelBadge = (riskScore: number) => {
    if (riskScore <= 30) {
      return <Badge className="bg-green-500">Low Risk</Badge>;
    } else if (riskScore <= 70) {
      return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    } else {
      return <Badge className="bg-red-500">High Risk</Badge>;
    }
  };

  const getComplianceStatusIcon = (passed: boolean) => {
    return passed ? '✅' : '❌';
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      // Re-validate edited content
      const response = await fetch('/api/compliance/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
          contentType: content.contentType,
          language: content.language
        })
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const validationResult = await response.json();
      
      if (validationResult.isCompliant) {
        content.content = editedContent;
        setIsEditing(false);
        toast.success('Content updated and validated');
      } else {
        toast.error('Edited content failed compliance check');
      }
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Failed to validate edited content');
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editedContent || content.content);
    toast.success('Content copied to clipboard');
  };

  const formatForWhatsApp = (text: string) => {
    // Add WhatsApp formatting
    let formatted = text;
    
    // Bold headers
    formatted = formatted.replace(/^#\s+(.+)$/gm, '*$1*');
    
    // Italic for disclaimers
    formatted = formatted.replace(/(Disclaimer:|Note:)(.+)$/gm, '_$1$2_');
    
    return formatted;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{content.title || 'Content Preview'}</h2>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{content.contentType}</Badge>
                  <Badge variant="outline">
                    {content.language === 'hi' ? 'हिंदी' : 
                     content.language === 'mixed' ? 'Mixed' : 'English'}
                  </Badge>
                  {getRiskLevelBadge(content.riskScore)}
                  {content.isCompliant ? (
                    <Badge className="bg-green-500">Compliant</Badge>
                  ) : (
                    <Badge className="bg-red-500">Non-Compliant</Badge>
                  )}
                </div>
              </div>
              <Button variant="ghost" onClick={onClose}>✕</Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Main Content */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Generated Content</h3>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopyToClipboard}>
                      📋 Copy
                    </Button>
                    {!isEditing && (
                      <Button size="sm" variant="outline" onClick={handleEdit}>
                        ✏️ Edit
                      </Button>
                    )}
                  </div>
                </div>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={10}
                      className="w-full font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{editedContent || content.content}</pre>
                  </div>
                )}
              </div>

              {/* Compliance Status */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold">Compliance Check Results</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowComplianceDetails(!showComplianceDetails)}
                  >
                    {showComplianceDetails ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Stage 1: Rules</p>
                      <p className="text-2xl">
                        {getComplianceStatusIcon(content.complianceStatus?.stage1 || false)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Stage 2: AI</p>
                      <p className="text-2xl">
                        {getComplianceStatusIcon(content.complianceStatus?.stage2 || false)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Stage 3: Final</p>
                      <p className="text-2xl">
                        {getComplianceStatusIcon(content.complianceStatus?.stage3 || false)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compliance Score:</span>
                    <span className="font-bold text-lg">{content.complianceScore}%</span>
                  </div>
                  
                  {showComplianceDetails && content.auditLog?.complianceChecks && (
                    <div className="mt-4 space-y-2">
                      {content.auditLog.complianceChecks.map((check: any, index: number) => (
                        <div key={index} className="text-sm bg-white p-2 rounded">
                          <p className="font-medium">{check.name}</p>
                          {check.violations && check.violations.length > 0 && (
                            <ul className="text-red-600 ml-4 mt-1">
                              {check.violations.map((v: string, i: number) => (
                                <li key={i}>• {v}</li>
                              ))}
                            </ul>
                          )}
                          {check.suggestions && check.suggestions.length > 0 && (
                            <ul className="text-blue-600 ml-4 mt-1">
                              {check.suggestions.map((s: string, i: number) => (
                                <li key={i}>💡 {s}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Metrics */}
              {content.performanceMetrics && (
                <div>
                  <h3 className="font-semibold mb-2">Performance Metrics</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">AI Generation</p>
                        <p className="font-medium">
                          {(content.performanceMetrics.generationTime / 1000).toFixed(2)}s
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Compliance Check</p>
                        <p className="font-medium">
                          {(content.performanceMetrics.complianceCheckTime / 1000).toFixed(2)}s
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Time</p>
                        <p className="font-medium">
                          {(content.performanceMetrics.totalTime / 1000).toFixed(2)}s
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp Preview */}
              <div>
                <h3 className="font-semibold mb-2">WhatsApp Preview</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-sm">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {formatForWhatsApp(editedContent || content.content)}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="outline" onClick={onRegenerate}>
                  🔄 Regenerate
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button variant="outline" onClick={onSave}>
                  💾 Save as Draft
                </Button>
                <Button 
                  onClick={onSchedule}
                  disabled={!content.isCompliant}
                  className="bg-green-600 hover:bg-green-700"
                >
                  📅 Schedule Delivery
                </Button>
              </div>
            </div>
            
            {!content.isCompliant && (
              <p className="text-sm text-red-600 mt-2 text-right">
                ⚠️ Content must be compliant before scheduling
              </p>
            )}
          </div>
        </Card>
      </div>
    </Dialog>
  );
};

export default ContentPreview;