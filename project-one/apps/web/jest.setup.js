// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock environment variables for testing
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'test_clerk_key'
process.env.CLERK_SECRET_KEY = 'test_clerk_secret'
process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL = '/sign-in'
process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL = '/sign-up'
process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL = '/advisor/dashboard'
process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL = '/onboarding'

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
  currentUser: jest.fn(),
  useAuth: jest.fn(() => ({
    isLoaded: true,
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    isSignedIn: true,
  })),
  useUser: jest.fn(() => ({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      fullName: 'Test User',
      update: jest.fn(),
    },
  })),
  SignIn: jest.fn(() => null),
  SignUp: jest.fn(() => null),
  UserButton: jest.fn(() => null),
  ClerkProvider: ({ children }) => children,
}))

// Mock Clerk server
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() => Promise.resolve({ userId: 'test-user-id' })),
  clerkClient: {
    users: {
      updateUserMetadata: jest.fn(() => Promise.resolve()),
      updateUser: jest.fn(() => Promise.resolve()),
      getUser: jest.fn(() => Promise.resolve({
        id: 'test-user-id',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
      })),
    },
  },
  currentUser: jest.fn(() => Promise.resolve({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
  })),
}))

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}))

// Mock global Request and Response for Next.js API routes FIRST
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this._url = input
      this.method = init?.method || 'GET'
      this.headers = new Headers(init?.headers || {})
      this.body = init?.body
      
      // Make url a readonly property
      Object.defineProperty(this, 'url', {
        get() { return this._url },
        enumerable: true,
        configurable: false
      })
    }
    
    async json() {
      return this.body ? JSON.parse(this.body) : {}
    }
    
    async text() {
      return this.body || ''
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init) {
      this.body = body
      this.ok = !init?.status || (init.status >= 200 && init.status < 300)
      this.status = init?.status || 200
      this.statusText = init?.statusText || 'OK'
      this.headers = new Headers(init?.headers || {})
    }
    
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
    }
    
    async text() {
      return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
    }
    
    // Add static json method for NextResponse
    static json(data, init) {
      const response = new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }
      })
      return response
    }
  }
}

// Mock next/server - must be after global Request/Response
jest.mock('next/server', () => ({
  NextRequest: class NextRequest extends global.Request {
    constructor(input, init) {
      super(input, init)
    }
  },
  NextResponse: {
    json: (data, init) => {
      const response = new global.Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers || {})
        }
      })
      response.json = async () => data
      return response
    }
  }
}))

// Import and setup comprehensive Next.js mocks
const { setupNextMocks } = require('./tests/helpers/next-mocks')
setupNextMocks()

// Global test utilities
global.mockFetch = (data, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    })
  )
}

// Mock crypto for Node.js environment
const crypto = require('crypto')
global.crypto = crypto

// Mock timingSafeEqual for tests
global.timingSafeEqual = crypto.timingSafeEqual

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn()
})

afterAll(() => {
  console.error = originalError
})