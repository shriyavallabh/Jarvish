/**
 * Comprehensive Next.js mocks for testing
 */

// Mock NextResponse implementation
export const mockNextResponse = {
  json: jest.fn((data: any, init?: ResponseInit) => ({
    ok: !init?.status || (init.status >= 200 && init.status < 300),
    status: init?.status || 200,
    statusText: init?.statusText || 'OK',
    headers: new Headers(init?.headers || {}),
    json: async () => data,
    text: async () => JSON.stringify(data),
    body: data,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => mockNextResponse.json(data, init),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([JSON.stringify(data)]),
    formData: async () => new FormData(),
  })),
  
  redirect: jest.fn((url: string) => ({
    status: 307,
    headers: new Headers({ Location: url }),
    ok: false,
    statusText: 'Temporary Redirect',
    json: async () => ({}),
    text: async () => '',
    body: null,
    bodyUsed: false,
    redirected: true,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => mockNextResponse.redirect(url),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([]),
    formData: async () => new FormData(),
  })),
  
  error: jest.fn(() => ({
    status: 500,
    statusText: 'Internal Server Error',
    ok: false,
    headers: new Headers(),
    json: async () => ({ error: 'Internal Server Error' }),
    text: async () => 'Internal Server Error',
    body: null,
    bodyUsed: false,
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => mockNextResponse.error(),
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([]),
    formData: async () => new FormData(),
  })),
}

// Mock NextRequest implementation
export class MockNextRequest {
  url: string
  method: string
  headers: Headers
  private _body: any
  nextUrl: URL
  cookies: Map<string, string>
  
  constructor(input: string | Request, init?: RequestInit) {
    if (typeof input === 'string') {
      this.url = input
      this.nextUrl = new URL(input.startsWith('http') ? input : `http://localhost:3000${input}`)
    } else {
      this.url = input.url
      this.nextUrl = new URL(input.url)
    }
    
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers || {})
    this._body = init?.body
    this.cookies = new Map()
  }
  
  async json() {
    if (typeof this._body === 'string') {
      return JSON.parse(this._body)
    }
    return this._body || {}
  }
  
  async text() {
    if (typeof this._body === 'string') {
      return this._body
    }
    return JSON.stringify(this._body || '')
  }
  
  async formData() {
    return new FormData()
  }
  
  async arrayBuffer() {
    return new ArrayBuffer(0)
  }
  
  clone() {
    return new MockNextRequest(this.url, {
      method: this.method,
      headers: this.headers,
      body: this._body,
    })
  }
}

// Mock auth function
export const mockAuth = jest.fn(() => Promise.resolve({ userId: 'test-user-id' }))

// Mock clerkClient
export const mockClerkClient = {
  users: {
    updateUserMetadata: jest.fn(() => Promise.resolve()),
    updateUser: jest.fn(() => Promise.resolve()),
    getUser: jest.fn(() => Promise.resolve({
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
      publicMetadata: {},
      privateMetadata: {},
      unsafeMetadata: {},
    })),
    createUser: jest.fn(() => Promise.resolve({
      id: 'new-user-id',
      emailAddresses: [{ emailAddress: 'new@example.com' }],
    })),
    deleteUser: jest.fn(() => Promise.resolve()),
    getUserList: jest.fn(() => Promise.resolve([])),
  },
  sessions: {
    getSession: jest.fn(() => Promise.resolve({
      id: 'session-id',
      userId: 'test-user-id',
    })),
    revokeSession: jest.fn(() => Promise.resolve()),
  },
  emails: {
    createEmail: jest.fn(() => Promise.resolve()),
  },
}

// Mock currentUser function
export const mockCurrentUser = jest.fn(() => Promise.resolve({
  id: 'test-user-id',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'Test',
  lastName: 'User',
  fullName: 'Test User',
}))

// Setup all mocks
export function setupNextMocks() {
  // Mock next/server
  jest.mock('next/server', () => ({
    NextRequest: MockNextRequest,
    NextResponse: mockNextResponse,
  }))
  
  // Mock Clerk server
  jest.mock('@clerk/nextjs/server', () => ({
    auth: mockAuth,
    clerkClient: mockClerkClient,
    currentUser: mockCurrentUser,
  }))
  
  return {
    mockNextResponse,
    MockNextRequest,
    mockAuth,
    mockClerkClient,
    mockCurrentUser,
  }
}

// Helper to create mock API request
export function createMockRequest(
  url: string,
  options: {
    method?: string
    body?: any
    headers?: Record<string, string>
    searchParams?: Record<string, string>
  } = {}
) {
  const fullUrl = url.startsWith('http') 
    ? url 
    : `http://localhost:3000${url}`
  
  const urlWithParams = options.searchParams
    ? `${fullUrl}?${new URLSearchParams(options.searchParams).toString()}`
    : fullUrl
  
  return new MockNextRequest(urlWithParams, {
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: options.headers,
  })
}

// Helper to test API routes
export async function testApiRoute(
  handler: Function,
  request: any,
  expectedStatus: number = 200
) {
  const response = await handler(request)
  expect(response.status).toBe(expectedStatus)
  return response
}