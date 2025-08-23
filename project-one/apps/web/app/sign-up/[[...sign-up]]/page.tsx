import { SignUp } from '@clerk/nextjs'
import { SEBIDisclaimers } from '@/components/ui/sebi-disclaimers'
import { Shield } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        {/* SEBI Registration Notice */}
        <div className="mb-6 max-w-md">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 text-blue-600 mb-2">
              <Shield className="h-5 w-5" />
              <span className="font-semibold">SEBI Compliant Registration</span>
            </div>
            <p className="text-sm text-gray-600">
              For SEBI registered investment advisors only
            </p>
          </div>
          <SEBIDisclaimers variant="registration" />
        </div>

        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-sm normal-case',
              footerActionLink: 'text-blue-600 hover:text-blue-700',
            },
          }}
        />
        
        {/* Additional SEBI Compliance Footer */}
        <div className="mt-6 max-w-md">
          <div className="text-xs text-gray-600 text-center p-4 bg-gray-50 rounded-lg border">
            <p className="mb-2">
              <strong>SEBI Registration Verification:</strong> During onboarding, you will be required to provide:
            </p>
            <ul className="text-left space-y-1 mb-2">
              <li>• Valid EUIN: AR1234567890 (Employee Unique Identification Number)</li>
              <li>• SEBI registration certificate</li>
              <li>• Required NISM certifications</li>
            </ul>
            <p className="text-amber-700 font-medium mb-2">
              Only SEBI registered advisors can access this platform.
            </p>
            <div className="border-t pt-2 mt-2 text-xs text-gray-600">
              <p><strong>Investment Advisory Disclaimer:</strong> This is for educational purposes only and should not be considered as investment advice.</p>
              <p><strong>Risk Warning:</strong> Mutual fund investments are subject to market risks. Please read all scheme-related documents carefully before investing.</p>
              <p><strong>Data Privacy:</strong> Your data is protected as per Digital Personal Data Protection Act 2023.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}