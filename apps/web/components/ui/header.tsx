import * as React from "react"
import Link from "next/link"
import { Bell, User, Shield, TrendingUp, Sparkles } from "lucide-react"
import { Button } from "./button"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"
import { Badge } from "./badge"
import { NotificationCenter } from "./notification-center"
import { cn } from "@/lib/utils"

interface HeaderProps {
  variant?: 'landing' | 'admin' | 'advisor'
  user?: {
    name: string
    avatar?: string
    tier?: 'basic' | 'premium' | 'elite'
  }
  className?: string
}

export function Header({ variant = 'landing', user, className }: HeaderProps) {
  if (variant === 'landing') {
    return (
      <header className={cn(
        "nav-executive",
        className
      )}>
        <div className="container-executive">
          <div className="nav-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-md) 0' }}>
            <Link href="/" className="logo-executive">
              Jarvish
              <span className="logo-badge">SEBI</span>
            </Link>
          
            <nav className="nav-links hidden md:flex items-center" style={{ gap: 'var(--spacing-lg)' }}>
              <Link href="#features" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem', transition: 'var(--transition)' }} className="hover:text-ink">
                Features
              </Link>
              <Link href="#pricing" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem', transition: 'var(--transition)' }} className="hover:text-ink">
                Pricing
              </Link>
              <Link href="#about" style={{ color: 'var(--gray-600)', textDecoration: 'none', fontWeight: '500', fontSize: '0.95rem', transition: 'var(--transition)' }} className="hover:text-ink">
                About
              </Link>
          
              <a href="#" className="btn btn-secondary" style={{ fontSize: '0.95rem' }}>Sign In</a>
              <a href="#" className="btn btn-primary">Start Free Trial</a>
            </nav>
            
            <div className="mobile-menu">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </header>
    )
  }

  if (variant === 'admin' || variant === 'advisor') {
    const isPremium = user?.tier === 'premium' || user?.tier === 'elite'
    
    return (
      <header className={cn(
        "premium-header sticky top-0 z-50",
        className
      )}>
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 flex items-center justify-center font-bold text-xl shadow-xl">
                {variant === 'admin' ? <Shield className="h-6 w-6" /> : <TrendingUp className="h-6 w-6" />}
              </div>
              {isPremium && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
              )}
            </div>
            <div>
              <div className="font-bold text-lg text-white">
                {variant === 'admin' ? 'Admin Control Center' : 'Advisor Dashboard'}
              </div>
              <div className="text-xs text-amber-400 uppercase tracking-wider font-semibold">
                {variant === 'admin' ? 'Elite Admin Access' : `${user?.tier?.toUpperCase() || 'BASIC'} TIER`}
              </div>
            </div>
          </div>

          {variant === 'advisor' && (
            <nav className="hidden lg:flex items-center space-x-8">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Content Suite
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Client Portfolio
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Analytics
              </Button>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                Branding
              </Button>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {variant === 'admin' && (
              <div className="flex items-center space-x-2 bg-white/10 rounded-md px-3 py-1 text-sm">
                <span>Window: <span className="text-yellow-400">20:30 - 21:30 IST</span></span>
              </div>
            )}
            
            <NotificationCenter className="text-white hover:bg-white/10" />

            {user && (
              <div className="flex items-center space-x-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <Avatar className="h-9 w-9 ring-2 ring-amber-400/50">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900 font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <div className="font-semibold text-sm">{user.name}</div>
                  <div className="text-xs text-amber-400">{user.tier?.toUpperCase()}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  return null
}