'use client';

import { useAuthStore } from '@/lib/store/auth-store';
import { useContentStore } from '@/lib/store/content-store';
import { useApi, useApiMutation } from '@/lib/hooks/use-api';
import { useComplianceCheck } from '@/lib/hooks/use-compliance';
import { useForm } from '@/lib/hooks/use-form';
import { loginSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export function StateTestComponent() {
  const [testText, setTestText] = useState('');
  
  // Auth Store Test
  const { user, isAuthenticated, login, logout, sendOtp } = useAuthStore();
  
  // Content Store Test
  const { contents, fetchContents, isLoading: contentLoading } = useContentStore();
  
  // API Hook Test
  const { data: apiData, isLoading: apiLoading } = useApi('/test', {
    enabled: false, // Disable auto-fetch for testing
  });
  
  // Compliance Check Test
  const { riskScore, flags, isChecking } = useComplianceCheck(
    testText,
    'market_update',
    'en',
    { enabled: testText.length > 10 }
  );
  
  // Form Test
  const form = useForm({
    schema: loginSchema,
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
    },
  });

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">State Management Test Suite</h1>
      
      {/* Auth Store Test */}
      <Card>
        <CardHeader>
          <CardTitle>Auth Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>User: {user ? user.name : 'None'}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => sendOtp('9876543210')}
              variant="outline"
              size="sm"
            >
              Test Send OTP
            </Button>
            <Button 
              onClick={() => login({ phone: '9876543210', otp: '123456' })}
              variant="outline"
              size="sm"
            >
              Test Login
            </Button>
            <Button 
              onClick={logout}
              variant="outline"
              size="sm"
            >
              Test Logout
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Content Store Test */}
      <Card>
        <CardHeader>
          <CardTitle>Content Store</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>Contents Count: {contents.length}</p>
            <p>Loading: {contentLoading ? 'Yes' : 'No'}</p>
          </div>
          <Button 
            onClick={() => fetchContents()}
            variant="outline"
            size="sm"
          >
            Fetch Contents
          </Button>
        </CardContent>
      </Card>
      
      {/* Compliance Check Test */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter text to check compliance..."
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
          />
          <div>
            <p>Checking: {isChecking ? 'Yes' : 'No'}</p>
            <p>Risk Score: {riskScore || 'N/A'}</p>
            <p>Flags: {flags.length}</p>
          </div>
        </CardContent>
      </Card>
      
      {/* Form Test */}
      <Card>
        <CardHeader>
          <CardTitle>Form Validation</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit} className="space-y-4">
            <Input
              {...form.register('phone')}
              placeholder="Enter phone number"
            />
            {form.formState.errors.phone && (
              <p className="text-sm text-red-500">
                {form.formState.errors.phone.message}
              </p>
            )}
            <Button type="submit" disabled={form.isSubmitting}>
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}