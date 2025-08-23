'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Zap, Clock, MessageSquare, Shield, Users, Globe, Headphones, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import Script from 'next/script'
import { SEBIDisclaimers, InlineComplianceText } from '@/components/ui/sebi-disclaimers'

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PricingPage() {
  const router = useRouter()
  const { isSignedIn, userId } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!isSignedIn) {
      router.push('/sign-up')
      return
    }

    setIsLoading(true)

    try {
      // Create order on backend
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 499,
          currency: 'INR',
          userId: userId,
        }),
      })

      const order = await response.json()

      if (!order.id) {
        throw new Error('Failed to create order')
      }

      // Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Jarvish',
        description: 'Monthly Subscription - ₹499',
        order_id: order.id,
        handler: async function (response: any) {
          // Verify payment on backend
          const verifyResponse = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: userId,
            }),
          })

          const result = await verifyResponse.json()

          if (result.success) {
            toast.success('Payment successful! Redirecting to onboarding...')
            router.push('/onboarding')
          } else {
            toast.error('Payment verification failed. Please contact support.')
          }
        },
        prefill: {
          email: '', // Will be filled from Clerk user data
        },
        theme: {
          color: '#2563eb',
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Navigation */}
        <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Jarvish
                </h1>
              </div>
              <div className="flex items-center gap-4">
                {!isSignedIn ? (
                  <>
                    <Button variant="ghost" onClick={() => router.push('/sign-in')}>
                      Sign In
                    </Button>
                    <Button onClick={() => router.push('/sign-up')}>
                      Sign Up
                    </Button>
                  </>
                ) : (
                  <Button variant="ghost" onClick={() => router.push('/advisor/dashboard')}>
                    Dashboard
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              Start your 7-day free trial. No credit card required.
            </p>
            <div className="mb-6">
              <InlineComplianceText type="advisory" />
            </div>
          </div>
        </section>

        {/* Pricing Card */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 shadow-xl border-2 border-blue-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-4">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">MOST POPULAR</span>
                </div>
                
                <h2 className="text-3xl font-bold mb-2">Professional Plan</h2>
                <div className="flex items-baseline justify-center gap-2 mb-4">
                  <span className="text-5xl font-bold">₹499</span>
                  <span className="text-gray-600">/month</span>
                </div>
                
                <p className="text-gray-600 mb-4">
                  Everything you need to engage clients daily
                </p>
                
                {/* SEBI Compliance Notice for Pricing */}
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-amber-800">
                      <strong>SEBI Compliance Notice:</strong> Service intended for SEBI registered investment advisors. 
                      <InlineComplianceText type="risk" />
                    </div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Start 7-Day Free Trial'}
                </Button>
                
                <p className="text-sm text-gray-500 mt-4">
                  Cancel anytime. No questions asked.
                </p>
              </div>

              <div className="border-t pt-6">
                {/* SEBI Disclaimers for Pricing */}
                <div className="mb-6">
                  <SEBIDisclaimers variant="pricing" />
                </div>
                
                <h3 className="font-semibold mb-6 text-center">Everything included:</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { icon: Clock, text: 'Daily content at 6 AM IST' },
                    { icon: Shield, text: 'SEBI-compliant messaging' },
                    { icon: Globe, text: 'Multi-language support (EN, HI, MR)' },
                    { icon: MessageSquare, text: 'WhatsApp-ready formats' },
                    { icon: Users, text: 'Unlimited client sharing' },
                    { icon: CheckCircle, text: 'Pre-approved content library' },
                    { icon: Zap, text: 'AI-powered personalization' },
                    { icon: Headphones, text: 'Priority email support' },
                  ].map((feature) => (
                    <div key={feature.text} className="flex items-start gap-3">
                      <div className="bg-green-100 rounded-full p-1 mt-0.5">
                        <feature.icon className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-gray-700">{feature.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* FAQ Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="font-semibold mb-2">How does the free trial work?</h3>
                  <p className="text-gray-600">
                    You get 7 days of full access to all features. No credit card required to start. 
                    You'll only be charged after the trial ends if you choose to continue.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="font-semibold mb-2">What time is content delivered?</h3>
                  <p className="text-gray-600">
                    Fresh content is delivered to your dashboard every morning at 6:00 AM IST, 
                    giving you time to review and share with clients before market hours.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
                  <p className="text-gray-600">
                    Yes! You can cancel your subscription anytime from your dashboard. 
                    You'll continue to have access until the end of your billing period.
                  </p>
                </div>
                
                <div className="bg-white rounded-lg p-6 shadow">
                  <h3 className="font-semibold mb-2">Is the content SEBI compliant?</h3>
                  <p className="text-gray-600 mb-3">
                    Absolutely. All content is reviewed by our AI compliance engine and human experts 
                    to ensure 100% SEBI compliance. Share with confidence.
                  </p>
                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
                    <strong>SEBI Advisory:</strong> Content is designed for educational purposes. 
                    <InlineComplianceText type="risk" />
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="mt-16 text-center">
              <div className="inline-flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  <span>SSL Secured</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>SEBI Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>500+ Happy Advisors</span>
                </div>
              </div>
              
              {/* Additional SEBI Footer Notice */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
                <div className="text-xs text-gray-700 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <strong>Regulatory Compliance</strong>
                  </div>
                  <p className="mb-1">
                    <strong>EUIN Required:</strong> All advisors must provide valid EUIN as per SEBI regulations.
                  </p>
                  <p>
                    <strong>Risk Disclosure:</strong> Mutual fund investments are subject to market risks. 
                    Please read all scheme-related documents carefully before investing.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}