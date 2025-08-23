import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency for Indian financial context
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Get compliance color based on score
 */
export function getComplianceColor(score: number): string {
  if (score >= 90) return "compliance-low"
  if (score >= 75) return "compliance-low"  
  if (score >= 60) return "compliance-medium"
  if (score >= 40) return "compliance-high"
  return "compliance-high"
}

/**
 * Format time remaining until delivery (06:00 IST)
 */
export function getTimeUntilDelivery(): string {
  const now = new Date()
  const target = new Date()
  target.setHours(6, 0, 0, 0)
  
  if (now > target) {
    target.setDate(target.getDate() + 1)
  }
  
  const diff = target.getTime() - now.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/**
 * Generate initials from name for avatar
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  }
  
  if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  }
  
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

/**
 * Validate SEBI ARN/RIA registration format
 */
export function validateRegistrationId(id: string, type: 'ARN' | 'RIA'): boolean {
  if (type === 'ARN') {
    // ARN format: ARN-12345
    return /^ARN-\d{5}$/.test(id)
  }
  
  if (type === 'RIA') {
    // RIA format: INA000012345
    return /^INA\d{9}$/.test(id)
  }
  
  return false
}