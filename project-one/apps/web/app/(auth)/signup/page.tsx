"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight, Shield, MessageSquare, Clock, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    euin: "",
    firmName: "",
    password: "",
    confirmPassword: "",
    whatsappConsent: false,
    marketingConsent: true,
    newsletterConsent: true,
    termsAccepted: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (!formData.whatsappConsent) {
      setError("WhatsApp consent is required to use Hubix services");
      return;
    }
    
    if (!formData.termsAccepted) {
      setError("Please accept the terms and conditions");
      return;
    }
    
    setLoading(true);
    
    try {
      // Call signup API with consent data
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          consentMetadata: {
            ip: "auto-detect", // Server will get actual IP
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            consentText: "I agree to receive daily investment insights via WhatsApp at 06:00 IST"
          }
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Signup failed");
      }
      
      // Redirect to dashboard
      router.push("/advisor/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            Start Your Free Trial
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Join 1,000+ financial advisors using Hubix for AI-powered content
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Daily insights will be sent to this number
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="euin">EUIN/ARN Number *</Label>
                  <Input
                    id="euin"
                    type="text"
                    placeholder="E123456"
                    value={formData.euin}
                    onChange={(e) => setFormData({...formData, euin: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firmName">Firm Name</Label>
                  <Input
                    id="firmName"
                    type="text"
                    placeholder="ABC Financial Advisory"
                    value={formData.firmName}
                    onChange={(e) => setFormData({...formData, firmName: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min 8 characters"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    minLength={8}
                  />
                </div>
              </div>
            </div>
            
            {/* WhatsApp Consent Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                WhatsApp Delivery Consent
              </h3>
              
              {/* Main WhatsApp Consent - REQUIRED */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="whatsappConsent"
                    checked={formData.whatsappConsent}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, whatsappConsent: checked as boolean})
                    }
                    className="mt-1"
                    required
                  />
                  <div className="space-y-2">
                    <Label htmlFor="whatsappConsent" className="text-sm font-medium cursor-pointer">
                      I agree to receive daily investment insights via WhatsApp *
                    </Label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Messages will be delivered daily at 06:00 IST
                      </p>
                      <p className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        SEBI-compliant content ready to share with clients
                      </p>
                      <p>Reply STOP anytime to unsubscribe</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Optional Marketing Preferences */}
              <div className="space-y-3">
                <p className="text-sm font-medium">Optional Preferences:</p>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="marketingConsent"
                    checked={formData.marketingConsent}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, marketingConsent: checked as boolean})
                    }
                  />
                  <div>
                    <Label htmlFor="marketingConsent" className="text-sm cursor-pointer">
                      Receive promotional offers and product updates
                    </Label>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="newsletterConsent"
                    checked={formData.newsletterConsent}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, newsletterConsent: checked as boolean})
                    }
                  />
                  <div>
                    <Label htmlFor="newsletterConsent" className="text-sm cursor-pointer">
                      Weekly newsletter with market insights and tips
                    </Label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={formData.termsAccepted}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, termsAccepted: checked as boolean})
                  }
                  required
                />
                <Label htmlFor="terms" className="text-sm cursor-pointer">
                  I accept the{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Start Free 14-Day Trial"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-center text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </div>
          <div className="text-xs text-center text-muted-foreground">
            By signing up, you agree to receive WhatsApp messages from Hubix.
            Your data is stored securely and never shared with third parties.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}