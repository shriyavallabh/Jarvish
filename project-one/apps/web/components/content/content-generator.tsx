'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import ContentPreview from './content-preview';
import { toast } from 'sonner';

interface ContentGeneratorProps {
  advisorProfile: {
    name: string;
    euin: string;
    specialization: string;
    tier?: 'basic' | 'standard' | 'pro';
  };
  onGenerate?: (content: any) => void;
}

type ContentType = 'educational' | 'market_updates' | 'seasonal' | 'promotional';
type Language = 'en' | 'hi' | 'mixed';

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ 
  advisorProfile,
  onGenerate 
}) => {
  const [contentType, setContentType] = useState<ContentType>('educational');
  const [language, setLanguage] = useState<Language>('en');
  const [topic, setTopic] = useState('');
  const [customization, setCustomization] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  const contentTypeOptions = [
    { value: 'educational', label: 'Educational Content' },
    { value: 'market_updates', label: 'Market Updates' },
    { value: 'seasonal', label: 'Seasonal/Festival' },
    { value: 'promotional', label: 'Promotional' }
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'हिंदी (Hindi)' },
    { value: 'mixed', label: 'Mixed (English + Hindi)' }
  ];

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic for content generation');
      return;
    }

    setIsGenerating(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advisorId: advisorProfile.euin,
          contentType,
          language,
          topic,
          customization,
          advisorProfile,
          platform: 'whatsapp'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      setGenerationTime(Date.now() - startTime);
      setGeneratedContent(data);
      setShowPreview(true);
      
      if (onGenerate) {
        onGenerate(data);
      }

      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [topic, contentType, language, customization, advisorProfile, onGenerate]);

  const handleSaveContent = useCallback(async () => {
    if (!generatedContent) return;

    try {
      const response = await fetch('/api/content/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generatedContent,
          advisorId: advisorProfile.euin,
          status: 'draft'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      toast.success('Content saved to drafts');
      setShowPreview(false);
      setGeneratedContent(null);
      setTopic('');
      setCustomization('');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save content');
    }
  }, [generatedContent, advisorProfile.euin]);

  const handleScheduleContent = useCallback(async () => {
    if (!generatedContent) return;

    try {
      const response = await fetch('/api/content/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...generatedContent,
          advisorId: advisorProfile.euin,
          scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
        })
      });

      if (!response.ok) {
        throw new Error('Failed to schedule content');
      }

      toast.success('Content scheduled for delivery');
      setShowPreview(false);
      setGeneratedContent(null);
      setTopic('');
      setCustomization('');
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule content');
    }
  }, [generatedContent, advisorProfile.euin]);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">AI Content Generator</h2>
        
        <div className="space-y-4">
          {/* Content Type Selection */}
          <div>
            <Label htmlFor="content-type">Content Type</Label>
            <Select
              id="content-type"
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="w-full"
            >
              {contentTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Language Selection */}
          <div>
            <Label htmlFor="language">Language</Label>
            <Select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Topic Input */}
          <div>
            <Label htmlFor="topic">Topic / Theme</Label>
            <Input
              id="topic"
              type="text"
              placeholder="e.g., Tax saving with ELSS, SIP benefits, Market outlook"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Customization */}
          <div>
            <Label htmlFor="customization">Additional Instructions (Optional)</Label>
            <Textarea
              id="customization"
              placeholder="Any specific points to include, tone preferences, or target audience details"
              value={customization}
              onChange={(e) => setCustomization(e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          {/* Advisor Info Display */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Generating as:</p>
            <p className="font-medium">{advisorProfile.name}</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">EUIN: {advisorProfile.euin}</Badge>
              <Badge variant="outline">{advisorProfile.specialization}</Badge>
              {advisorProfile.tier && (
                <Badge variant={advisorProfile.tier === 'pro' ? 'default' : 'outline'}>
                  {advisorProfile.tier.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>

          {/* Generation Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-2">⚡</span>
                Generating Content...
              </>
            ) : (
              'Generate Content'
            )}
          </Button>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={33} className="h-2" />
              <p className="text-sm text-gray-600 text-center">
                Running SEBI compliance checks...
              </p>
            </div>
          )}

          {/* Performance Metric */}
          {generationTime && (
            <div className="text-center">
              <p className="text-sm text-green-600">
                ✓ Generated in {(generationTime / 1000).toFixed(2)} seconds
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Content Preview Modal */}
      {showPreview && generatedContent && (
        <ContentPreview
          content={generatedContent}
          onClose={() => setShowPreview(false)}
          onSave={handleSaveContent}
          onSchedule={handleScheduleContent}
          onRegenerate={handleGenerate}
        />
      )}

      {/* Quick Templates */}
      {advisorProfile.tier === 'pro' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Templates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setContentType('educational');
                setTopic('Benefits of Systematic Investment Plans');
              }}
            >
              SIP Benefits
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setContentType('seasonal');
                setTopic('Diwali financial planning tips');
              }}
            >
              Diwali Special
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setContentType('market_updates');
                setTopic('Weekly market outlook and opportunities');
              }}
            >
              Market Update
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setContentType('educational');
                setTopic('Tax saving through ELSS mutual funds');
              }}
            >
              Tax Saving
            </Button>
          </div>
        </Card>
      )}

      {/* Recent Generations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Generations</h3>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">
            <p>No recent content generated</p>
            <p className="text-xs mt-1">Your generated content will appear here</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ContentGenerator;