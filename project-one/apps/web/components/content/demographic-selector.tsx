'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ClientDemographics,
  AGE_GROUPS,
  INCOME_LEVELS,
  REGIONS
} from '@/lib/types/content-personalization';

interface DemographicSelectorProps {
  onDemographicsChange: (demographics: ClientDemographics) => void;
  onPersonalize: () => void;
  initialDemographics?: Partial<ClientDemographics>;
  showAdvancedOptions?: boolean;
}

export const DemographicSelector: React.FC<DemographicSelectorProps> = ({
  onDemographicsChange,
  onPersonalize,
  initialDemographics = {},
  showAdvancedOptions = false
}) => {
  const [demographics, setDemographics] = useState<Partial<ClientDemographics>>({
    ageGroup: 'millennial',
    incomeLevel: 'middle',
    investmentExperience: 'intermediate',
    region: 'west',
    urbanRural: 'urban',
    ...initialDemographics
  });

  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions);

  const handleFieldChange = (field: keyof ClientDemographics, value: any) => {
    const updated = { ...demographics, [field]: value } as ClientDemographics;
    setDemographics(updated);
    onDemographicsChange(updated);
  };

  const handleMultiSelectChange = (field: keyof ClientDemographics, value: string, checked: boolean) => {
    const current = (demographics[field] as string[]) || [];
    const updated = checked 
      ? [...current, value]
      : current.filter(v => v !== value);
    handleFieldChange(field, updated);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Client Demographics</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Age Group */}
        <div className="space-y-2">
          <Label htmlFor="age-group">Age Group *</Label>
          <select
            id="age-group"
            className="w-full p-2 border rounded-md"
            value={demographics.ageGroup}
            onChange={(e) => handleFieldChange('ageGroup', e.target.value)}
          >
            {Object.entries(AGE_GROUPS).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          {showAdvanced && (
            <Input
              type="number"
              placeholder="Exact age (optional)"
              value={demographics.exactAge || ''}
              onChange={(e) => handleFieldChange('exactAge', parseInt(e.target.value))}
              className="mt-2"
            />
          )}
        </div>

        {/* Income Level */}
        <div className="space-y-2">
          <Label htmlFor="income-level">Income Level *</Label>
          <select
            id="income-level"
            className="w-full p-2 border rounded-md"
            value={demographics.incomeLevel}
            onChange={(e) => handleFieldChange('incomeLevel', e.target.value)}
          >
            {Object.entries(INCOME_LEVELS).map(([key, value]) => (
              <option key={key} value={key}>{value.label}</option>
            ))}
          </select>
          {showAdvanced && (
            <Input
              type="number"
              placeholder="Annual income in ₹ (optional)"
              value={demographics.annualIncome || ''}
              onChange={(e) => handleFieldChange('annualIncome', parseInt(e.target.value))}
              className="mt-2"
            />
          )}
        </div>

        {/* Investment Experience */}
        <div className="space-y-2">
          <Label htmlFor="experience">Investment Experience *</Label>
          <select
            id="experience"
            className="w-full p-2 border rounded-md"
            value={demographics.investmentExperience}
            onChange={(e) => handleFieldChange('investmentExperience', e.target.value)}
          >
            <option value="beginner">Beginner (0-2 years)</option>
            <option value="intermediate">Intermediate (3-7 years)</option>
            <option value="advanced">Advanced (8-15 years)</option>
            <option value="expert">Expert (15+ years)</option>
          </select>
          {showAdvanced && (
            <Input
              type="number"
              placeholder="Years of investing (optional)"
              value={demographics.yearsOfInvesting || ''}
              onChange={(e) => handleFieldChange('yearsOfInvesting', parseInt(e.target.value))}
              className="mt-2"
            />
          )}
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region *</Label>
          <select
            id="region"
            className="w-full p-2 border rounded-md"
            value={demographics.region}
            onChange={(e) => handleFieldChange('region', e.target.value)}
          >
            <option value="north">North India</option>
            <option value="south">South India</option>
            <option value="east">East India</option>
            <option value="west">West India</option>
            <option value="northeast">Northeast India</option>
            <option value="central">Central India</option>
          </select>
        </div>

        {/* Urban/Rural */}
        <div className="space-y-2">
          <Label htmlFor="urban-rural">Location Type *</Label>
          <select
            id="urban-rural"
            className="w-full p-2 border rounded-md"
            value={demographics.urbanRural}
            onChange={(e) => handleFieldChange('urbanRural', e.target.value)}
          >
            <option value="urban">Urban</option>
            <option value="semi-urban">Semi-Urban</option>
            <option value="rural">Rural</option>
          </select>
        </div>

        {/* Risk Profile */}
        <div className="space-y-2">
          <Label htmlFor="risk-profile">Risk Profile</Label>
          <select
            id="risk-profile"
            className="w-full p-2 border rounded-md"
            value={demographics.riskProfile || ''}
            onChange={(e) => handleFieldChange('riskProfile', e.target.value)}
          >
            <option value="">Select risk profile</option>
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-700">Advanced Demographics</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                placeholder="e.g., Maharashtra"
                value={demographics.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g., Mumbai"
                value={demographics.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                placeholder="e.g., IT Professional"
                value={demographics.occupation || ''}
                onChange={(e) => handleFieldChange('occupation', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred-language">Preferred Language</Label>
              <select
                id="preferred-language"
                className="w-full p-2 border rounded-md"
                value={demographics.preferredLanguage || ''}
                onChange={(e) => handleFieldChange('preferredLanguage', e.target.value)}
              >
                <option value="">Select language</option>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="mr">Marathi</option>
                <option value="gu">Gujarati</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="bn">Bengali</option>
                <option value="kn">Kannada</option>
                <option value="ml">Malayalam</option>
                <option value="pa">Punjabi</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="marital-status">Marital Status</Label>
              <select
                id="marital-status"
                className="w-full p-2 border rounded-md"
                value={demographics.maritalStatus || ''}
                onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
                <option value="widowed">Widowed</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Has Children</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has-children"
                  checked={demographics.hasChildren || false}
                  onCheckedChange={(checked) => handleFieldChange('hasChildren', checked)}
                />
                <Label htmlFor="has-children" className="font-normal">
                  Yes, has children
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Financial Goals</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Retirement Planning',
                'Child Education',
                'Home Purchase',
                'Wealth Creation',
                'Tax Saving',
                'Emergency Fund',
                'Travel',
                'Marriage'
              ].map(goal => (
                <div key={goal} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal}
                    checked={(demographics.financialGoals || []).includes(goal.toLowerCase().replace(' ', '_'))}
                    onCheckedChange={(checked) => 
                      handleMultiSelectChange('financialGoals', goal.toLowerCase().replace(' ', '_'), checked as boolean)
                    }
                  />
                  <Label htmlFor={goal} className="font-normal text-sm">
                    {goal}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile Completeness Indicator */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Profile Completeness</span>
          <span className="text-sm font-medium">
            {calculateCompleteness(demographics)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${calculateCompleteness(demographics)}%` }}
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end mt-4">
        <Button
          onClick={onPersonalize}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Apply Personalization
        </Button>
      </div>
    </Card>
  );
};

// Helper function to calculate profile completeness
function calculateCompleteness(demographics: Partial<ClientDemographics>): number {
  const requiredFields = ['ageGroup', 'incomeLevel', 'investmentExperience', 'region', 'urbanRural'];
  const optionalFields = ['state', 'city', 'occupation', 'riskProfile', 'preferredLanguage', 
                          'financialGoals', 'hasChildren', 'maritalStatus', 'exactAge', 
                          'annualIncome', 'yearsOfInvesting'];
  
  let score = 0;
  const totalFields = requiredFields.length + optionalFields.length;
  
  requiredFields.forEach(field => {
    if (demographics[field as keyof ClientDemographics]) score += 2;
  });
  
  optionalFields.forEach(field => {
    if (demographics[field as keyof ClientDemographics]) score += 1;
  });
  
  return Math.round((score / (requiredFields.length * 2 + optionalFields.length)) * 100);
}

export default DemographicSelector;