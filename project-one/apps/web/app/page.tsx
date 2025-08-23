'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle, Clock, MessageSquare, Shield, Sparkles, TrendingUp, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SEBIDisclaimers, InlineComplianceText } from '@/components/ui/sebi-disclaimers'

export default function LandingPage() {
  return (
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
              <Link href="/sign-in">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Fresh content delivered daily at 6 AM</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            Wake Up to Ready-Made
            <br />
            WhatsApp Content
          </h1>
          
          <p className="text-xl text-gray-600 mb-4 max-w-3xl mx-auto">
            SEBI-compliant financial content delivered to your dashboard every morning. 
            No more content creation stress. Focus on what matters - your clients.
          </p>
          
          <div className="mb-6 max-w-2xl mx-auto">
            <InlineComplianceText type="advisory" />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/pricing">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8">
                Start 7-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>No credit card required</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>500+ Advisors</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span>10,000+ Messages Sent</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>100% SEBI Compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">One Subscription, Endless Value</h2>
            <p className="text-xl text-gray-600">Everything you need for just ₹499/month</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 rounded-lg p-3 w-fit mb-4">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Daily Content at 6 AM</h3>
              <p className="text-gray-600">
                Fresh, relevant content delivered to your dashboard every morning. 
                Ready to share with your clients instantly.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 rounded-lg p-3 w-fit mb-4">
                <Sparkles className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered & Compliant</h3>
              <p className="text-gray-600 mb-2">
                Every piece of content is reviewed by our AI for SEBI compliance. 
                Share with confidence, without compliance worries.
              </p>
              <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded">
                <InlineComplianceText type="risk" />
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="bg-green-100 rounded-lg p-3 w-fit mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multi-Language Support</h3>
              <p className="text-gray-600">
                Content available in English, Hindi, and Marathi. 
                Connect with clients in their preferred language.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in minutes</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your account in seconds' },
              { step: '2', title: 'Subscribe', desc: 'Choose your plan and pay securely' },
              { step: '3', title: 'Complete Profile', desc: 'Add your business details' },
              { step: '4', title: 'Receive Content', desc: 'Get daily content at 6 AM' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEBI Compliance Section */}
      <section className="py-12 px-4 bg-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-blue-600" />
              SEBI Regulatory Compliance
            </h2>
            <p className="text-gray-700 mb-6">
              All content and services are designed to meet SEBI regulatory requirements for financial advisory services in India.
            </p>
          </div>
          <SEBIDisclaimers variant="landing" className="max-w-4xl mx-auto" />
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <div className="text-5xl font-bold mb-2">₹499</div>
          <p className="text-xl mb-8">per month</p>
          
          <div className="grid md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto mb-8">
            {[
              'Daily content delivery at 6 AM',
              'SEBI-compliant messaging',
              'Multi-language support',
              'WhatsApp-ready formats',
              'Unlimited downloads',
              'Email support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <Link href="/pricing">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Jarvish</h3>
              <p className="text-sm text-gray-600">
                Empowering financial advisors with daily, compliant content.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/pricing" className="hover:text-blue-600">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-blue-600">Features</Link></li>
                <li><Link href="/how-it-works" className="hover:text-blue-600">How it Works</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/contact" className="hover:text-blue-600">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-blue-600">FAQ</Link></li>
                <li><Link href="/help" className="hover:text-blue-600">Help Center</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-blue-600">Terms of Service</Link></li>
                <li><Link href="/compliance" className="hover:text-blue-600">Compliance</Link></li>
              </ul>
            </div>
          </div>
          
          <SEBIDisclaimers variant="footer" />
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-gray-600">
            © 2024 Jarvish. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}