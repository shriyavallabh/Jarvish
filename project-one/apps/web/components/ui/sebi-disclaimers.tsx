'use client'

import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Shield, AlertTriangle, FileText } from 'lucide-react'

interface SEBIDisclaimerProps {
  variant?: 'landing' | 'pricing' | 'footer' | 'registration'
  className?: string
}

export function SEBIDisclaimers({ variant = 'landing', className = '' }: SEBIDisclaimerProps) {
  const baseDisclaimers = {
    mutualFundRisk: "Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.",
    investmentAdvisory: "This is for educational purposes only and should not be considered as investment advice. Past performance is not indicative of future results.",
    sebiCompliance: "All content is SEBI compliant and reviewed for regulatory adherence.",
    dataPrivacy: "Your data is protected as per Digital Personal Data Protection Act 2023.",
    euinDisplay: "EUIN: AR1234567890 (Advisory Representative Unique Identification Number as per SEBI requirements)"
  }

  const renderLandingDisclaimers = () => (
    <div className={`space-y-4 ${className}`}>
      {/* Main Risk Disclaimer */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-sm text-orange-800 font-medium">
          <strong>Investment Risk Disclosure:</strong> {baseDisclaimers.mutualFundRisk}
        </AlertDescription>
      </Alert>

      {/* SEBI Compliance Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>SEBI Compliance:</strong> {baseDisclaimers.sebiCompliance}
        </AlertDescription>
      </Alert>

      {/* Educational Disclaimer */}
      <Alert className="border-gray-200 bg-gray-50">
        <Info className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-sm text-gray-700">
          <strong>Educational Content:</strong> {baseDisclaimers.investmentAdvisory}
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderPricingDisclaimers = () => (
    <div className={`space-y-3 ${className}`}>
      {/* Risk Warning for Financial Service */}
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-xs text-red-800 font-medium">
          <strong>Risk Warning:</strong> {baseDisclaimers.mutualFundRisk}
        </AlertDescription>
      </Alert>

      {/* EUIN Notice */}
      <Alert className="border-purple-200 bg-purple-50">
        <FileText className="h-4 w-4 text-purple-600" />
        <AlertDescription className="text-xs text-purple-800">
          <strong>EUIN Disclosure:</strong> {baseDisclaimers.euinDisplay}
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderFooterDisclaimers = () => (
    <div className={`space-y-2 text-xs text-gray-600 ${className}`}>
      <div className="border-t border-gray-200 pt-4">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Shield className="h-3 w-3" />
          SEBI Regulatory Compliance
        </h4>
        <div className="space-y-1">
          <p><strong>Risk Disclosure:</strong> {baseDisclaimers.mutualFundRisk}</p>
          <p><strong>Advisory Notice:</strong> {baseDisclaimers.investmentAdvisory}</p>
          <p><strong>EUIN:</strong> {baseDisclaimers.euinDisplay}</p>
          <p><strong>Data Privacy:</strong> {baseDisclaimers.dataPrivacy}</p>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-gray-500">
            Jarvish Technologies Pvt Ltd | SEBI Registered Investment Advisor | 
            Registration No: To be assigned upon regulatory approval
          </p>
        </div>
      </div>
    </div>
  )

  const renderRegistrationDisclaimers = () => (
    <div className={`space-y-3 ${className}`}>
      {/* Mandatory SEBI Notice */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800">
          <strong>SEBI Registration Required:</strong> As per SEBI regulations, all investment advisors must be registered. 
          Please ensure you have valid EUIN and required certifications.
        </AlertDescription>
      </Alert>

      {/* Data Protection Notice */}
      <Alert className="border-green-200 bg-green-50">
        <Info className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-sm text-green-800">
          <strong>Data Protection:</strong> {baseDisclaimers.dataPrivacy}
        </AlertDescription>
      </Alert>
    </div>
  )

  switch (variant) {
    case 'pricing':
      return renderPricingDisclaimers()
    case 'footer':
      return renderFooterDisclaimers()
    case 'registration':
      return renderRegistrationDisclaimers()
    default:
      return renderLandingDisclaimers()
  }
}

// Utility component for inline compliance text
export function InlineComplianceText({ type }: { type: 'risk' | 'advisory' | 'euin' }) {
  const texts = {
    risk: "Mutual fund investments are subject to market risks.",
    advisory: "This is educational content only, not investment advice.",
    euin: "EUIN required for advisor identification"
  }

  return (
    <span className="text-xs text-gray-600 italic">
      {texts[type]}
    </span>
  )
}

export default SEBIDisclaimers