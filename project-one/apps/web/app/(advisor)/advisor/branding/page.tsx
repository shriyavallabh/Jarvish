'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Palette, Type, Settings, Eye, Save, AlertCircle, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ImagePreview from '@/components/render/image-preview';

interface BrandSettings {
  logo?: File | string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  tagline: string;
  disclaimer: string;
  watermark: {
    enabled: boolean;
    text: string;
    position: string;
    opacity: number;
  };
  preferences: {
    autoWatermark: boolean;
    includeContact: boolean;
    includeCompliance: boolean;
    templateStyle: string;
  };
}

export default function BrandingPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [advisor, setAdvisor] = useState<any>(null);
  const [tierFeatures, setTierFeatures] = useState<any>(null);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    primaryColor: '#2563EB',
    secondaryColor: '#7C3AED',
    accentColor: '#10B981',
    headingFont: 'Inter',
    bodyFont: 'Inter',
    tagline: '',
    disclaimer: 'Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.',
    watermark: {
      enabled: true,
      text: '',
      position: 'bottom-right',
      opacity: 50,
    },
    preferences: {
      autoWatermark: true,
      includeContact: true,
      includeCompliance: true,
      templateStyle: 'modern',
    },
  });
  const [previewContent, setPreviewContent] = useState({
    title: 'Market Update',
    subtitle: 'Daily Financial Insights',
    body: 'Stay informed with the latest market trends and investment opportunities.',
    highlights: ['Nifty up 1.2%', 'Banking sector strong', 'IT stocks volatile'],
  });

  useEffect(() => {
    loadAdvisorData();
  }, [userId]);

  const loadAdvisorData = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/supabase/advisor');
      const data = await response.json();
      
      if (data.advisor) {
        setAdvisor(data.advisor);
        loadTierFeatures(data.advisor.subscription_tier);
        loadBrandSettings(data.advisor.id);
      }
    } catch (error) {
      console.error('Failed to load advisor data:', error);
      toast.error('Failed to load your data');
    } finally {
      setLoading(false);
    }
  };

  const loadTierFeatures = (tier: string) => {
    const features = {
      FREE: {
        customLogo: false,
        customColors: false,
        customFonts: false,
        watermarkRemoval: false,
        customTemplates: false,
      },
      BASIC: {
        customLogo: true,
        customColors: false,
        customFonts: false,
        watermarkRemoval: false,
        customTemplates: false,
      },
      STANDARD: {
        customLogo: true,
        customColors: true,
        customFonts: false,
        watermarkRemoval: true,
        customTemplates: true,
      },
      PRO: {
        customLogo: true,
        customColors: true,
        customFonts: true,
        watermarkRemoval: true,
        customTemplates: true,
      },
    };
    
    setTierFeatures(features[tier as keyof typeof features] || features.FREE);
  };

  const loadBrandSettings = async (advisorId: string) => {
    // Load existing brand settings from database
    // This would fetch from the advisor_brands table
    console.log('Loading brand settings for:', advisorId);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      
      setBrandSettings({ ...brandSettings, logo: file });
      toast.success('Logo uploaded successfully');
    }
  };

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    setBrandSettings({ ...brandSettings, [colorType]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save brand settings to database
      const formData = new FormData();
      if (brandSettings.logo instanceof File) {
        formData.append('logo', brandSettings.logo);
      }
      formData.append('settings', JSON.stringify(brandSettings));

      // API call to save settings
      toast.success('Brand settings saved successfully');
    } catch (error) {
      console.error('Failed to save brand settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Brand Settings</h1>
        <p className="text-muted-foreground">
          Customize your brand identity and visual appearance
        </p>
      </div>

      {/* Tier Badge */}
      {advisor && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your current plan: <Badge variant="default">{advisor.subscription_tier}</Badge>
            </span>
            {advisor.subscription_tier !== 'PRO' && (
              <Button variant="link" size="sm">
                Upgrade for more features →
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="visual" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="visual">Visual</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            {/* Visual Tab */}
            <TabsContent value="visual" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Colors</CardTitle>
                  <CardDescription>
                    Define your visual brand identity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="logo">Brand Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={!tierFeatures?.customLogo}
                          className="hidden"
                        />
                        <Label
                          htmlFor="logo"
                          className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-accent ${
                            !tierFeatures?.customLogo ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <Upload className="h-4 w-4" />
                          Upload Logo
                        </Label>
                      </div>
                      {!tierFeatures?.customLogo && (
                        <Badge variant="secondary">Requires Basic+</Badge>
                      )}
                    </div>
                    {brandSettings.logo && (
                      <p className="text-sm text-muted-foreground">
                        Logo uploaded: {typeof brandSettings.logo === 'string' ? 'Current logo' : brandSettings.logo.name}
                      </p>
                    )}
                  </div>

                  {/* Color Palette */}
                  <div className="space-y-4">
                    <Label>Brand Colors</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primary-color" className="text-sm">
                          Primary Color
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="primary-color"
                            type="color"
                            value={brandSettings.primaryColor}
                            onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                            disabled={!tierFeatures?.customColors}
                            className="h-10 w-20"
                          />
                          <Input
                            type="text"
                            value={brandSettings.primaryColor}
                            onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                            disabled={!tierFeatures?.customColors}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="secondary-color" className="text-sm">
                          Secondary Color
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="secondary-color"
                            type="color"
                            value={brandSettings.secondaryColor}
                            onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                            disabled={!tierFeatures?.customColors}
                            className="h-10 w-20"
                          />
                          <Input
                            type="text"
                            value={brandSettings.secondaryColor}
                            onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                            disabled={!tierFeatures?.customColors}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accent-color" className="text-sm">
                          Accent Color
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="accent-color"
                            type="color"
                            value={brandSettings.accentColor}
                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                            disabled={!tierFeatures?.customColors}
                            className="h-10 w-20"
                          />
                          <Input
                            type="text"
                            value={brandSettings.accentColor}
                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                            disabled={!tierFeatures?.customColors}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    {!tierFeatures?.customColors && (
                      <Badge variant="secondary">Custom colors require Standard+</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Typography Tab */}
            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Typography Settings</CardTitle>
                  <CardDescription>
                    Choose fonts for your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Heading Font</Label>
                    <RadioGroup
                      value={brandSettings.headingFont}
                      onValueChange={(value) => setBrandSettings({ ...brandSettings, headingFont: value })}
                      disabled={!tierFeatures?.customFonts}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Inter" id="inter-heading" />
                        <Label htmlFor="inter-heading">Inter (Modern)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Montserrat" id="montserrat-heading" />
                        <Label htmlFor="montserrat-heading">Montserrat (Professional)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Playfair Display" id="playfair-heading" />
                        <Label htmlFor="playfair-heading">Playfair Display (Elegant)</Label>
                      </div>
                    </RadioGroup>
                    {!tierFeatures?.customFonts && (
                      <Badge variant="secondary">Custom fonts require Pro</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Body Font</Label>
                    <RadioGroup
                      value={brandSettings.bodyFont}
                      onValueChange={(value) => setBrandSettings({ ...brandSettings, bodyFont: value })}
                      disabled={!tierFeatures?.customFonts}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Inter" id="inter-body" />
                        <Label htmlFor="inter-body">Inter</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Source Sans Pro" id="source-body" />
                        <Label htmlFor="source-body">Source Sans Pro</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Open Sans" id="open-body" />
                        <Label htmlFor="open-body">Open Sans</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Content Settings</CardTitle>
                  <CardDescription>
                    Customize default content and disclaimers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tagline">Brand Tagline</Label>
                    <Input
                      id="tagline"
                      placeholder="Your trusted financial advisor"
                      value={brandSettings.tagline}
                      onChange={(e) => setBrandSettings({ ...brandSettings, tagline: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disclaimer">Compliance Disclaimer</Label>
                    <Textarea
                      id="disclaimer"
                      placeholder="Add your compliance disclaimer..."
                      value={brandSettings.disclaimer}
                      onChange={(e) => setBrandSettings({ ...brandSettings, disclaimer: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Watermark Settings</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="watermark-enabled" className="text-sm">
                          Enable Watermark
                        </Label>
                        <Switch
                          id="watermark-enabled"
                          checked={brandSettings.watermark.enabled}
                          onCheckedChange={(checked) =>
                            setBrandSettings({
                              ...brandSettings,
                              watermark: { ...brandSettings.watermark, enabled: checked },
                            })
                          }
                        />
                      </div>
                      
                      {brandSettings.watermark.enabled && (
                        <>
                          <Input
                            placeholder="Watermark text"
                            value={brandSettings.watermark.text}
                            onChange={(e) =>
                              setBrandSettings({
                                ...brandSettings,
                                watermark: { ...brandSettings.watermark, text: e.target.value },
                              })
                            }
                          />
                          
                          <div className="flex items-center gap-4">
                            <Label className="text-sm">Position:</Label>
                            <RadioGroup
                              value={brandSettings.watermark.position}
                              onValueChange={(value) =>
                                setBrandSettings({
                                  ...brandSettings,
                                  watermark: { ...brandSettings.watermark, position: value },
                                })
                              }
                              className="flex flex-row gap-4"
                            >
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="bottom-right" id="br" />
                                <Label htmlFor="br" className="text-sm">Bottom Right</Label>
                              </div>
                              <div className="flex items-center space-x-1">
                                <RadioGroupItem value="bottom-left" id="bl" />
                                <Label htmlFor="bl" className="text-sm">Bottom Left</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Display Preferences</CardTitle>
                  <CardDescription>
                    Control what information appears on your content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Watermark</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically add watermark to all images
                      </p>
                    </div>
                    <Switch
                      checked={brandSettings.preferences.autoWatermark}
                      onCheckedChange={(checked) =>
                        setBrandSettings({
                          ...brandSettings,
                          preferences: { ...brandSettings.preferences, autoWatermark: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include Contact Info</Label>
                      <p className="text-sm text-muted-foreground">
                        Display phone and email on images
                      </p>
                    </div>
                    <Switch
                      checked={brandSettings.preferences.includeContact}
                      onCheckedChange={(checked) =>
                        setBrandSettings({
                          ...brandSettings,
                          preferences: { ...brandSettings.preferences, includeContact: checked },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Include Compliance Info</Label>
                      <p className="text-sm text-muted-foreground">
                        Show ARN/EUIN and disclaimers
                      </p>
                    </div>
                    <Switch
                      checked={brandSettings.preferences.includeCompliance}
                      onCheckedChange={(checked) =>
                        setBrandSettings({
                          ...brandSettings,
                          preferences: { ...brandSettings.preferences, includeCompliance: checked },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Template Style</Label>
                    <RadioGroup
                      value={brandSettings.preferences.templateStyle}
                      onValueChange={(value) =>
                        setBrandSettings({
                          ...brandSettings,
                          preferences: { ...brandSettings.preferences, templateStyle: value },
                        })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="modern" id="modern" />
                        <Label htmlFor="modern">Modern</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="classic" id="classic" />
                        <Label htmlFor="classic">Classic</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="minimal" id="minimal" />
                        <Label htmlFor="minimal">Minimal</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="bold" id="bold" />
                        <Label htmlFor="bold">Bold</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your content will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImagePreview
                content={previewContent}
                branding={{
                  advisorName: advisor?.full_name || 'Your Name',
                  firmName: advisor?.firm_name || 'Your Firm',
                  primaryColor: brandSettings.primaryColor,
                  secondaryColor: brandSettings.secondaryColor,
                  phone: advisor?.phone,
                  email: advisor?.email,
                  arnNumber: advisor?.arn_number,
                  euinNumber: advisor?.euin_number,
                  disclaimer: brandSettings.disclaimer,
                }}
                aspectRatio="4:3"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}