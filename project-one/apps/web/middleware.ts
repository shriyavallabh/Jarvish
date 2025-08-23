import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { PerformanceTimer } from '@/lib/monitoring/middleware'
import { trackApiRequest, performanceBenchmark } from '@/lib/monitoring/metrics-collector'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/pricing',
  '/api/webhooks/(.*)',
  '/api/health',
  '/api/metrics',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

// Define admin routes
const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
])

// Define advisor routes
const isAdvisorRoute = createRouteMatcher([
  '/advisor(.*)',
])

// Define onboarding route
const isOnboardingRoute = createRouteMatcher([
  '/onboarding(.*)',
])

// Monitoring paths to exclude
const excludeFromMonitoring = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
]

export default clerkMiddleware(async (auth, req) => {
  // Start performance timer
  const timer = new PerformanceTimer()
  
  // Add correlation ID for request tracing
  const correlationId = req.headers.get('x-correlation-id') || uuidv4()
  const requestId = uuidv4()
  
  // Get auth details
  const { userId, sessionClaims } = await auth()
  timer.mark('auth-complete')
  
  // Create response with monitoring headers
  const addMonitoringHeaders = (response: NextResponse) => {
    response.headers.set('x-correlation-id', correlationId)
    response.headers.set('x-request-id', requestId)
    response.headers.set('x-response-time', `${timer.measure('total')}ms`)
    
    // Add user context if available
    if (userId) {
      response.headers.set('x-user-id', userId)
    }
    
    return response
  }
  
  // Log request if not excluded
  const shouldLog = !excludeFromMonitoring.some(path => req.nextUrl.pathname.startsWith(path))
  if (shouldLog && process.env.NODE_ENV === 'production') {
    console.log('Request:', {
      correlationId,
      requestId,
      path: req.nextUrl.pathname,
      method: req.method,
      userId,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.ip
    })
  }
  
  // Allow public routes
  if (isPublicRoute(req)) {
    return addMonitoringHeaders(NextResponse.next())
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return addMonitoringHeaders(NextResponse.redirect(signInUrl))
  }

  // Check if user has completed onboarding
  const hasCompletedOnboarding = sessionClaims?.metadata?.onboardingCompleted
  const userRole = sessionClaims?.metadata?.role

  // Force onboarding if not completed (except for onboarding route itself)
  if (!hasCompletedOnboarding && !isOnboardingRoute(req)) {
    return addMonitoringHeaders(NextResponse.redirect(new URL('/onboarding', req.url)))
  }

  // Role-based access control
  if (isAdminRoute(req) && userRole !== 'admin') {
    return addMonitoringHeaders(NextResponse.redirect(new URL('/advisor/dashboard', req.url)))
  }

  if (isAdvisorRoute(req) && userRole !== 'advisor' && userRole !== 'admin') {
    return addMonitoringHeaders(NextResponse.redirect(new URL('/', req.url)))
  }

  return addMonitoringHeaders(NextResponse.next())
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    // Include service worker
    '/sw.js',
  ],
}

// Note: Performance monitoring cleanup cannot be done in Edge Runtime
// as process events are not available in Edge Runtime environment