import Link from "next/link"
import { ArrowRight, CheckCircle, Shield, Clock, Users, BarChart3, Star, Zap, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/ui/header"
import { mockLandingPageStats } from "@/lib/mock/data"

export default function LandingPage() {
  const stats = mockLandingPageStats

  return (
    <div className="landing-page min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* Skip to main content for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header variant="landing" />

      <main id="main-content">
        {/* Hero Section - Executive Clarity Style */}
        <section className="hero relative overflow-hidden py-20 sm:py-24 lg:py-32" style={{ background: 'linear-gradient(135deg, var(--gray-100) 0%, transparent 50%)', paddingTop: 'calc(80px + var(--spacing-2xl))' }}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23CEA200' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="container relative">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-8 items-center">
              {/* Hero Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge className="inline-flex items-center gap-2 px-4 py-1.5 text-sm font-semibold" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--cta) 100%)', color: 'white', border: 'none' }}>
                    <Zap className="h-3 w-3" />
                    Daily Content at 06:00 IST • SEBI Compliant
                  </Badge>
                  <h1 className="gradient-heading">
                    Automated WhatsApp Content for Financial Advisors
                  </h1>
                  <p className="hero-description" style={{ fontSize: '1.25rem', color: 'var(--gray-600)', lineHeight: '1.7' }}>
                    Wake up to ready-to-send WhatsApp content every morning. AI-powered 
                    SEBI compliance checking, zero silent days guaranteed. Save 2+ hours daily 
                    on content creation.
                  </p>
                </div>

                <div className="hero-actions flex flex-col sm:flex-row gap-4">
                  <Button className="btn-premium group" size="lg">
                    <span>Try 14 Days Free</span>
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button variant="outline" className="btn-gold" size="lg">
                    See WhatsApp Demo
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="trust-indicators flex gap-8 pt-8" style={{ borderTop: '1px solid var(--gray-200)' }}>
                  <div className="trust-item">
                    <div className="trust-value">{stats.advisors}+</div>
                    <div className="trust-label">MFDs & RIAs</div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-value">2.5M</div>
                    <div className="trust-label">WhatsApp Messages</div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-value">Zero</div>
                    <div className="trust-label">Silent Days</div>
                  </div>
                  <div className="trust-item">
                    <div className="trust-value">99%</div>
                    <div className="trust-label">Delivery SLA</div>
                  </div>
                </div>
              </div>

              {/* Hero Visual Dashboard */}
              <div className="hero-visual">
                <div className="dashboard-preview professional-card">
                  <div className="space-y-6">
                    {/* Preview Header */}
                    <div className="preview-header flex gap-2 mb-4">
                      <div className="preview-dot"></div>
                      <div className="preview-dot"></div>
                      <div className="preview-dot"></div>
                    </div>
                    <div className="preview-content grid gap-4">
                      <div className="professional-card" style={{ padding: '1rem' }}>
                        <div className="preview-stat" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--cta)' }}>06:00</div>
                        <div className="preview-label" style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>Daily WhatsApp Delivery</div>
                      </div>
                      <div className="professional-card" style={{ padding: '1rem' }}>
                        <div className="preview-stat" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--cta)' }}>100%</div>
                        <div className="preview-label" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>SEBI Compliant</div>
                      </div>
                      <div className="professional-card" style={{ padding: '1rem' }}>
                        <div className="preview-stat" style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--cta)' }}>2.5 hrs</div>
                        <div className="preview-label" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Time Saved Daily</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Journey Timeline Section */}
        <section className="journey-section py-20 relative" style={{ background: 'linear-gradient(135deg, var(--bg) 0%, var(--gray-100) 100%)' }}>
          <div className="container-executive">
            <div className="text-center space-y-4 mb-16">
              <Badge className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, var(--gold) 0%, var(--cta) 100%)', color: 'white', border: 'none' }}>
                YOUR JOURNEY
              </Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">From Setup to Scale in 30 Days</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Follow our proven path to transform your advisory practice with automated WhatsApp content delivery
              </p>
            </div>

            <div className="journey-timeline" style={{ marginTop: 'var(--spacing-2xl)', position: 'relative' }}>
              <div className="timeline-progress">
                <div className="progress-line"></div>
              </div>
              <div className="timeline-steps grid gap-8 md:grid-cols-2 lg:grid-cols-4" style={{ position: 'relative', zIndex: 2 }}>
              {[
                {
                  step: "1",
                  title: "Quick Setup",
                  description: "Connect WhatsApp, verify credentials, customize your brand",
                  duration: "Day 0-3",
                  status: "completed" as const
                },
                {
                  step: "2", 
                  title: "First Campaign",
                  description: "Launch AI-powered content with compliance checking",
                  duration: "Day 4-7",
                  status: "completed" as const
                },
                {
                  step: "3",
                  title: "Optimize",
                  description: "Analyze performance and refine your strategy", 
                  duration: "Day 8-21",
                  status: "completed" as const
                },
                {
                  step: "4",
                  title: "Scale",
                  description: "Expand reach and watch your practice grow",
                  duration: "Day 22-30", 
                  status: "pending" as const
                }
              ].map((step, index) => (
                <div key={index} className="timeline-step text-center">
                  <div className={`step-circle ${step.status === 'completed' ? 'active' : ''}`}>
                    <span className="step-number" style={{ fontSize: '1.5rem', fontWeight: '700', color: step.status === 'completed' ? 'var(--cta)' : 'var(--gold)' }}>
                      {step.step}
                    </span>
                  </div>
                  <div className="step-content">
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: '700', marginBottom: 'var(--spacing-xs)', color: 'var(--ink)' }}>
                      {step.title}
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-sm)', lineHeight: '1.5' }}>
                      {step.description}
                    </p>
                    <div className="step-duration" style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600', 
                      color: step.status === 'completed' ? 'var(--cta)' : 'var(--gold)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      padding: '4px 12px',
                      background: step.status === 'completed' ? 'rgba(12, 49, 12, 0.1)' : 'rgba(206, 162, 0, 0.1)',
                      borderRadius: '100px',
                      display: 'inline-block'
                    }}>
                      {step.duration}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="features py-20" style={{ background: 'var(--gray-100)' }}>
          <div className="container-executive">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold sm:text-4xl">Built for Indian Financial Advisors</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Complete WhatsApp content automation with AI-powered SEBI compliance. 
                Perfect for MFDs and RIAs who want professional, compliant communication.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: "clock",
                  title: "06:00 IST Auto-Delivery",
                  description: "Wake up to fresh, compliant content in your WhatsApp every morning. Ready-to-forward images and captions for your clients.",
                  color: "blue"
                },
                {
                  icon: "robot",
                  title: "3-Stage AI Compliance",
                  description: "Advanced AI checks every word against SEBI guidelines. Rules → AI Evaluation → Final Verification for zero violations.",
                  color: "green"
                },
                {
                  icon: "check",
                  title: "Zero Silent Days",
                  description: "Pre-approved fallback content ensures you never miss a day. Automatic evergreen content when fresh content isn't ready.",
                  color: "green"
                },
                {
                  icon: "badge",
                  title: "Your Brand on Images", 
                  description: "Pro tier adds your logo, name, and registration number to every image. Professional branding with compliance-safe placement.",
                  color: "amber"
                },
                {
                  icon: "globe",
                  title: "Multi-Language Support",
                  description: "Content in English, Hindi, and Marathi. AI-powered translation with proper financial terminology and local compliance.",
                  color: "blue"
                },
                {
                  icon: "list",
                  title: "ARN/RIA Ready",
                  description: "Built for Indian MFDs and RIAs. Automatic AMFI, SEBI compliance footers and registration number integration.",
                  color: "green"
                }
              ].map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon" style={{ 
                    width: '48px', 
                    height: '48px', 
                    background: 'linear-gradient(135deg, var(--gold) 0%, var(--cta) 100%)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginBottom: 'var(--spacing-md)',
                    color: 'var(--bg)'
                  }}>
                    {feature.icon === 'clock' && <Clock className="h-6 w-6" />}
                    {feature.icon === 'robot' && <Shield className="h-6 w-6" />}
                    {feature.icon === 'check' && <CheckCircle className="h-6 w-6" />}
                    {feature.icon === 'badge' && <Star className="h-6 w-6" />}
                    {feature.icon === 'globe' && <MessageSquare className="h-6 w-6" />}
                    {feature.icon === 'list' && <BarChart3 className="h-6 w-6" />}
                  </div>
                  <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{feature.title}</h3>
                  <p className="feature-description" style={{ color: 'var(--gray-600)', lineHeight: '1.6' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="pricing py-20" style={{ background: 'var(--bg)' }}>
          <div className="container-executive">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold sm:text-4xl">Save 2+ Hours Daily with Automated Content</h2>
              <p className="text-lg text-muted-foreground">
                ROI Calculator: Manual content creation costs ₹12,000+ in time monthly. 
                Our automation pays for itself in the first week.
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {[
                {
                  name: "Basic - MFDs",
                  price: "₹2,999",
                  period: "/month",
                  features: [
                    "15 daily content packs/month",
                    "06:00 IST WhatsApp delivery",
                    "AI compliance checking",
                    "1 language (EN/HI/MR)",
                    "Zero silent days guarantee"
                  ],
                  cta: "Start 14-Day Trial",
                  variant: "outline" as const
                },
                {
                  name: "Standard - MFDs & RIAs",
                  price: "₹5,999", 
                  period: "/month",
                  featured: true,
                  features: [
                    "30 daily content packs/month",
                    "2 languages (EN/HI/MR)",
                    "3 team seats included",
                    "Advanced AI personalization",
                    "Priority WhatsApp delivery",
                    "Performance analytics"
                  ],
                  cta: "Start 14-Day Trial",
                  variant: "default" as const
                },
                {
                  name: "Pro - Multi-Brand",
                  price: "₹11,999",
                  period: "/month", 
                  features: [
                    "60 daily content packs/month",
                    "All 3 languages (EN/HI/MR)",
                    "Your brand on images",
                    "5 team seats + API access",
                    "Custom content colorway",
                    "Dedicated support manager"
                  ],
                  cta: "Contact Sales",
                  variant: "outline" as const
                }
              ].map((plan, index) => (
                <div key={index} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                  <div className="pricing-tier" style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--ink)', marginBottom: 'var(--spacing-sm)' }}>
                    {plan.name}
                  </div>
                  <div className="pricing-amount" style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-md)' }}>
                    <span className="pricing-value" style={{ fontSize: '3rem', fontWeight: '700', color: 'var(--ink)', lineHeight: '1' }}>
                      {plan.price}
                    </span>
                    <span className="pricing-period" style={{ color: 'var(--gray-500)' }}>{plan.period}</span>
                  </div>
                  <ul className="pricing-features" style={{ listStyle: 'none', marginBottom: 'var(--spacing-lg)' }}>
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} style={{ 
                        padding: 'var(--spacing-sm) 0', 
                        borderBottom: '1px solid var(--gray-100)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        color: 'var(--gray-600)'
                      }}>
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        <span style={{ fontSize: '0.875rem' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    variant={plan.featured ? 'premium' : 'outline'} 
                    className="w-full" 
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section py-20" style={{ background: 'linear-gradient(135deg, var(--ink) 0%, #162B42 100%)', color: 'var(--bg)' }}>
          <div className="container-executive text-center space-y-8">
            <h2 className="text-3xl font-bold sm:text-4xl">Never Miss Another Content Day</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              Join 500+ MFDs and RIAs who wake up to fresh, compliant WhatsApp content 
              every morning at 06:00 IST. Zero violations, zero silent days.
            </p>
            <div className="cta-actions flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="btn-gold" size="lg">
                Try 14 Days Free
              </Button>
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="lg">
                See WhatsApp Demo
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t" style={{ background: 'var(--gray-100)', borderTop: '1px solid var(--gray-200)' }}>
        <div className="container-executive">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="footer-logo" style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', fontWeight: '900', color: 'var(--ink)' }}>
                Jarvish
              </div>
              <p className="text-sm text-muted-foreground">
                Automated WhatsApp content platform for Indian financial advisors. 
                SEBI compliant, ARN/RIA ready, delivering fresh content at 06:00 IST daily.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#features" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="#pricing" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Security</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Roadmap</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Compliance</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">SEBI Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 mt-8 border-t">
            <p className="text-sm text-muted-foreground">
              © 2024 Jarvish. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}