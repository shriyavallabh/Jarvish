'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Building, User, Phone, MapPin, Briefcase, Globe, Shield, AlertTriangle } from 'lucide-react'
import { SEBIDisclaimers } from '@/components/ui/sebi-disclaimers'

export default function OnboardingPage() {
  const router = useRouter()
  const { userId } = useAuth()
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    businessName: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    euin: '', // SEBI EUIN requirement
    arnNumber: '',
    experience: '',
    specialization: '',
    website: '',
    bio: '',
    sebiRegistrationNumber: '', // SEBI Registration
    nismCertifications: '', // NISM certifications
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Save profile data
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          ...formData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save profile')
      }

      // Update Clerk metadata to mark onboarding as complete
      await user?.update({
        publicMetadata: {
          onboardingCompleted: true,
          role: 'advisor',
        },
      })

      toast.success('Profile completed successfully!')
      router.push('/advisor/dashboard')
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step 3 of 3</span>
            <span className="text-sm text-gray-600">Almost there!</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full" style={{ width: '100%' }}></div>
          </div>
        </div>

        {/* SEBI Compliance Notice */}
        <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Shield className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-blue-900 mb-2">SEBI Registration Verification Required</h2>
              <p className="text-sm text-blue-800 mb-3">
                As per SEBI regulations, all advisors must provide valid registration details and certifications.
              </p>
              <SEBIDisclaimers variant="registration" />
            </div>
          </div>
        </Card>

        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">
              Tell us about yourself and your business to personalize your experience
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* SEBI Registration Information */}
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-amber-800">
                <Shield className="h-5 w-5" />
                SEBI Registration Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="euin">EUIN (Employee Unique Identification Number) *</Label>
                  <Input
                    id="euin"
                    name="euin"
                    value={formData.euin}
                    onChange={handleInputChange}
                    required
                    placeholder="E123456789"
                    className="bg-white"
                  />
                  <p className="text-xs text-amber-700 mt-1">Required as per SEBI guidelines</p>
                </div>
                
                <div>
                  <Label htmlFor="sebiRegistrationNumber">SEBI Registration Number *</Label>
                  <Input
                    id="sebiRegistrationNumber"
                    name="sebiRegistrationNumber"
                    value={formData.sebiRegistrationNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="INH000000001"
                    className="bg-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="nismCertifications">NISM Certifications *</Label>
                <Input
                  id="nismCertifications"
                  name="nismCertifications"
                  value={formData.nismCertifications}
                  onChange={handleInputChange}
                  required
                  placeholder="NISM-Series-V-A, NISM-Series-XV"
                  className="bg-white"
                />
                <p className="text-xs text-amber-700 mt-1">Enter comma-separated certification numbers</p>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building className="h-5 w-5" />
                Business Information
              </h2>
              
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  required
                  placeholder="ABC Financial Advisors"
                />
              </div>
              
              <div>
                <Label htmlFor="arnNumber">ARN Number (Optional)</Label>
                <Input
                  id="arnNumber"
                  name="arnNumber"
                  value={formData.arnNumber}
                  onChange={handleInputChange}
                  placeholder="ARN-123456"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    name="experience"
                    type="number"
                    value={formData.experience}
                    onChange={handleInputChange}
                    placeholder="5"
                  />
                </div>
                
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    placeholder="Mutual Funds, Insurance"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </h2>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123, Main Street"
                />
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    placeholder="Mumbai"
                  />
                </div>
                
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="Maharashtra"
                  />
                </div>
                
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="400001"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Additional Information
              </h2>
              
              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="bio">About Your Business (Optional)</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about your business and the services you offer..."
                  rows={4}
                />
              </div>
            </div>

            {/* SEBI Compliance Acknowledgment */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">SEBI Compliance Acknowledgment</p>
                  <p>By completing this registration, you acknowledge that:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                    <li>You are a SEBI registered investment advisor</li>
                    <li>All provided information is accurate and verified</li>
                    <li>You will comply with SEBI advertising and disclosure guidelines</li>
                    <li>You understand that mutual fund investments are subject to market risks</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-6">
              <p className="text-sm text-gray-500">
                * Required fields - SEBI registration details are mandatory
              </p>
              
              <Button 
                type="submit" 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying & Saving...' : 'Complete SEBI Verification'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}