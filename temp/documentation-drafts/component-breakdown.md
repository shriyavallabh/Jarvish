# Component Breakdown - Technical Implementation Guide

## Executive Summary
Detailed component-level breakdown for the Financial Advisor Content Platform, providing implementation specifications for frontend components, backend services, database schemas, and integration points.

## Frontend Component Architecture

### Component Hierarchy
```
App
├── Layouts
│   ├── PublicLayout
│   ├── AdvisorLayout
│   └── AdminLayout
├── Pages
│   ├── Landing
│   ├── Auth (Login/Register)
│   ├── AdvisorDashboard
│   ├── AdminDashboard
│   └── ErrorPages
└── Components
    ├── UI (Base Components)
    ├── Features (Business Logic)
    ├── Shared (Common)
    └── FinTech (Domain Specific)
```

## UI Component Library (shadcn/ui Foundation)

### Base Components
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        // Custom variants for FinTech
        compliance: 'bg-green-600 text-white hover:bg-green-700',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700',
        premium: 'bg-gradient-to-r from-purple-600 to-blue-600 text-white',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean
  loadingText?: string
}

export function Button({ 
  className, 
  variant, 
  size, 
  loading, 
  loadingText,
  children,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Spinner className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : children}
    </button>
  )
}
```

### Card Component System
```typescript
// components/ui/card.tsx
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
}

// Specialized Cards
// components/features/metric-card.tsx
interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon?: React.ReactNode
}

export function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {change !== undefined && (
            <div className={cn(
              'flex items-center text-sm',
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            )}>
              {trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> :
               trend === 'down' ? <TrendingDown className="h-4 w-4 mr-1" /> :
               <Minus className="h-4 w-4 mr-1" />}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
```

## Feature Components

### Content Creation Components
```typescript
// components/features/content-creator/ContentCreator.tsx
interface ContentCreatorProps {
  onSave: (content: ContentPack) => Promise<void>
  initialData?: Partial<ContentPack>
}

export function ContentCreator({ onSave, initialData }: ContentCreatorProps) {
  const [step, setStep] = useState(1)
  const [content, setContent] = useState<ContentData>({
    type: 'whatsapp',
    language: 'en',
    topic: '',
    caption: '',
    ...initialData
  })
  
  const { checkCompliance, riskScore, isChecking } = useComplianceCheck()
  const { generateContent, isGenerating } = useAIGeneration()
  
  const steps = [
    { id: 1, name: 'Topic Selection', component: TopicSelector },
    { id: 2, name: 'AI Generation', component: AIGenerator },
    { id: 3, name: 'Content Editing', component: ContentEditor },
    { id: 4, name: 'Compliance Review', component: ComplianceReview },
    { id: 5, name: 'Preview & Submit', component: PreviewSubmit },
  ]
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <StepIndicator currentStep={step} steps={steps} />
      </div>
      
      {/* Dynamic Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {step === 1 && (
          <TopicSelector
            value={content.topic}
            onChange={(topic) => setContent({ ...content, topic })}
            onNext={() => setStep(2)}
          />
        )}
        
        {step === 2 && (
          <AIGenerator
            topic={content.topic}
            language={content.language}
            onGenerate={async () => {
              const generated = await generateContent({
                topic: content.topic,
                language: content.language,
                type: content.type
              })
              setContent({ ...content, ...generated })
              setStep(3)
            }}
            isGenerating={isGenerating}
          />
        )}
        
        {step === 3 && (
          <ContentEditor
            content={content}
            onChange={setContent}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        
        {step === 4 && (
          <ComplianceReview
            content={content.caption}
            riskScore={riskScore}
            isChecking={isChecking}
            onApprove={() => setStep(5)}
            onEdit={() => setStep(3)}
          />
        )}
        
        {step === 5 && (
          <PreviewSubmit
            content={content}
            onSubmit={() => onSave(content)}
            onBack={() => setStep(4)}
          />
        )}
      </div>
    </div>
  )
}
```

### WhatsApp Preview Component
```typescript
// components/features/whatsapp-preview/WhatsAppPreview.tsx
interface WhatsAppPreviewProps {
  content: {
    caption: string
    mediaUrl?: string
    language: string
  }
  advisorInfo: {
    name: string
    logo?: string
    registrationNumber: string
  }
  showBranding?: boolean
}

export function WhatsAppPreview({ content, advisorInfo, showBranding }: WhatsAppPreviewProps) {
  return (
    <div className="max-w-sm mx-auto">
      {/* WhatsApp Phone Frame */}
      <div className="bg-gray-100 rounded-3xl p-4 shadow-xl">
        {/* Status Bar */}
        <div className="flex justify-between items-center mb-2 text-xs text-gray-600">
          <span>9:41 AM</span>
          <div className="flex space-x-1">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <Battery className="h-3 w-3" />
          </div>
        </div>
        
        {/* Chat Header */}
        <div className="bg-green-600 text-white p-3 rounded-t-lg flex items-center">
          <ArrowLeft className="h-5 w-5 mr-3" />
          <div className="flex-1">
            <p className="font-semibold">{advisorInfo.name}</p>
            <p className="text-xs opacity-75">Online</p>
          </div>
          <MoreVertical className="h-5 w-5" />
        </div>
        
        {/* Chat Content */}
        <div className="bg-[url('/whatsapp-bg.png')] bg-cover min-h-[400px] p-4">
          {/* Message Bubble */}
          <div className="bg-white rounded-lg p-3 shadow-sm max-w-[80%] ml-auto">
            {content.mediaUrl && (
              <div className="mb-2 rounded-lg overflow-hidden">
                <img 
                  src={content.mediaUrl} 
                  alt="Content" 
                  className="w-full h-auto"
                />
                {showBranding && advisorInfo.logo && (
                  <div className="absolute bottom-2 right-2 bg-white/90 p-1 rounded">
                    <img 
                      src={advisorInfo.logo} 
                      alt="Logo" 
                      className="h-8 w-auto"
                    />
                  </div>
                )}
              </div>
            )}
            
            <p className="text-sm text-gray-800 whitespace-pre-wrap">
              {content.caption}
            </p>
            
            {/* Compliance Footer */}
            <p className="text-xs text-gray-500 mt-2 pt-2 border-t">
              {advisorInfo.name} | ARN: {advisorInfo.registrationNumber}
              <br />
              Mutual fund investments are subject to market risks.
            </p>
            
            {/* Message Time */}
            <div className="flex items-center justify-end mt-1 space-x-1">
              <span className="text-xs text-gray-500">9:41 AM</span>
              <CheckCheck className="h-4 w-4 text-blue-500" />
            </div>
          </div>
        </div>
        
        {/* Input Bar */}
        <div className="bg-white p-3 rounded-b-lg flex items-center">
          <Paperclip className="h-5 w-5 text-gray-500 mr-3" />
          <input 
            type="text" 
            placeholder="Type a message"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm"
            disabled
          />
          <Mic className="h-5 w-5 text-gray-500 ml-3" />
        </div>
      </div>
    </div>
  )
}
```

### Compliance Meter Component
```typescript
// components/features/compliance-meter/ComplianceMeter.tsx
interface ComplianceMeterProps {
  score: number // 0-100
  showDetails?: boolean
  recommendations?: string[]
  animate?: boolean
}

export function ComplianceMeter({ 
  score, 
  showDetails, 
  recommendations,
  animate = true 
}: ComplianceMeterProps) {
  const getColorClass = (score: number) => {
    if (score < 25) return 'bg-green-500'
    if (score < 50) return 'bg-yellow-500'
    if (score < 75) return 'bg-orange-500'
    return 'bg-red-500'
  }
  
  const getStatusText = (score: number) => {
    if (score < 25) return 'Excellent Compliance'
    if (score < 50) return 'Good Compliance'
    if (score < 75) return 'Needs Review'
    return 'High Risk'
  }
  
  return (
    <div className="space-y-4">
      {/* Meter Visual */}
      <div className="relative">
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={cn(
              'h-full transition-all duration-1000 ease-out',
              getColorClass(score),
              animate && 'animate-slide-in'
            )}
            style={{ width: `${score}%` }}
          />
        </div>
        
        {/* Score Indicator */}
        <div 
          className="absolute top-10 transition-all duration-1000"
          style={{ left: `${score}%`, transform: 'translateX(-50%)' }}
        >
          <div className="bg-gray-800 text-white text-xs rounded px-2 py-1">
            {score}/100
          </div>
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800 mx-auto" />
        </div>
      </div>
      
      {/* Status Text */}
      <div className="text-center mt-8">
        <p className={cn(
          'font-semibold text-lg',
          score < 50 ? 'text-green-600' : score < 75 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {getStatusText(score)}
        </p>
      </div>
      
      {/* Recommendations */}
      {showDetails && recommendations && recommendations.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h4 className="font-medium mb-2 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2 text-yellow-600" />
            Compliance Recommendations
          </h4>
          <ul className="space-y-1">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start">
                <span className="text-yellow-600 mr-2">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
```

## Backend Service Components

### Core Service Architecture
```typescript
// services/base.service.ts
export abstract class BaseService<T> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly cache: CacheService,
    protected readonly logger: Logger
  ) {}
  
  async findAll(options?: FindOptions): Promise<T[]> {
    const cacheKey = this.getCacheKey('all', options)
    const cached = await this.cache.get(cacheKey)
    
    if (cached) {
      this.logger.debug('Cache hit', { cacheKey })
      return cached
    }
    
    const result = await this.repository.findAll(options)
    await this.cache.set(cacheKey, result, 300) // 5 min TTL
    
    return result
  }
  
  async findById(id: string): Promise<T | null> {
    const cacheKey = this.getCacheKey('id', id)
    const cached = await this.cache.get(cacheKey)
    
    if (cached) return cached
    
    const result = await this.repository.findById(id)
    if (result) {
      await this.cache.set(cacheKey, result, 600) // 10 min TTL
    }
    
    return result
  }
  
  async create(data: Partial<T>): Promise<T> {
    const result = await this.repository.create(data)
    await this.invalidateCache()
    this.logger.info('Entity created', { id: result.id })
    return result
  }
  
  async update(id: string, data: Partial<T>): Promise<T> {
    const result = await this.repository.update(id, data)
    await this.invalidateCache(id)
    this.logger.info('Entity updated', { id })
    return result
  }
  
  async delete(id: string): Promise<void> {
    await this.repository.delete(id)
    await this.invalidateCache(id)
    this.logger.info('Entity deleted', { id })
  }
  
  protected abstract getCacheKey(type: string, identifier?: any): string
  protected abstract invalidateCache(id?: string): Promise<void>
}
```

### Content Service Implementation
```typescript
// services/content.service.ts
export class ContentService extends BaseService<ContentPack> {
  constructor(
    repository: ContentRepository,
    cache: CacheService,
    logger: Logger,
    private readonly aiService: AIService,
    private readonly complianceService: ComplianceService,
    private readonly storageService: StorageService
  ) {
    super(repository, cache, logger)
  }
  
  async createContent(advisorId: string, data: CreateContentDto): Promise<ContentPack> {
    // 1. Generate content if requested
    if (data.generateContent) {
      const generated = await this.aiService.generateContent({
        topic: data.topic,
        language: data.language,
        type: data.type,
        tone: data.tone
      })
      data.caption = generated.caption
      data.hashtags = generated.hashtags
    }
    
    // 2. Check compliance
    const complianceResult = await this.complianceService.check(data.caption)
    
    // 3. Generate media assets
    const mediaAssets = await this.generateMediaAssets(data, advisorId)
    
    // 4. Create content pack
    const contentPack = await this.repository.create({
      advisorId,
      title: data.title,
      type: data.type,
      languages: [data.language],
      captions: { [data.language]: data.caption },
      mediaAssets,
      complianceScore: complianceResult.score,
      complianceFlags: complianceResult.flags,
      status: complianceResult.score < 50 ? 'DRAFT' : 'PENDING',
      metadata: {
        generatedBy: data.generateContent ? 'AI' : 'MANUAL',
        aiModel: data.generateContent ? 'gpt-4' : null,
        createdAt: new Date()
      }
    })
    
    // 5. Queue for approval if needed
    if (contentPack.status === 'PENDING') {
      await this.queueForApproval(contentPack)
    }
    
    return contentPack
  }
  
  private async generateMediaAssets(
    data: CreateContentDto, 
    advisorId: string
  ): Promise<MediaAssets> {
    const advisor = await this.advisorService.findById(advisorId)
    
    const assets: MediaAssets = {}
    
    // Generate WhatsApp image (1200x628)
    if (data.type === 'whatsapp' || data.type === 'multi') {
      assets.whatsapp = await this.generateImage({
        template: 'whatsapp-post',
        dimensions: { width: 1200, height: 628 },
        content: data.caption,
        branding: advisor.tier === 'PRO' ? advisor.brandingAssets : null
      })
    }
    
    // Generate Status image (1080x1920)
    if (data.type === 'status' || data.type === 'multi') {
      assets.status = await this.generateImage({
        template: 'whatsapp-status',
        dimensions: { width: 1080, height: 1920 },
        content: data.caption,
        branding: advisor.tier === 'PRO' ? advisor.brandingAssets : null
      })
    }
    
    // Generate LinkedIn image (1200x627)
    if (data.type === 'linkedin' || data.type === 'multi') {
      assets.linkedin = await this.generateImage({
        template: 'linkedin-post',
        dimensions: { width: 1200, height: 627 },
        content: data.caption,
        branding: advisor.tier === 'PRO' ? advisor.brandingAssets : null
      })
    }
    
    return assets
  }
  
  private async generateImage(params: ImageGenerationParams): Promise<string> {
    // Use Cloudinary or similar service for dynamic image generation
    const imageUrl = await this.storageService.generateDynamicImage({
      template: params.template,
      width: params.dimensions.width,
      height: params.dimensions.height,
      text: params.content.substring(0, 100),
      overlay: params.branding?.logo,
      backgroundColor: params.branding?.primaryColor || '#0EA5E9',
      textColor: '#FFFFFF',
      disclaimerText: 'Mutual fund investments are subject to market risks'
    })
    
    return imageUrl
  }
  
  protected getCacheKey(type: string, identifier?: any): string {
    return `content:${type}:${identifier || 'all'}`
  }
  
  protected async invalidateCache(id?: string): Promise<void> {
    if (id) {
      await this.cache.delete(`content:id:${id}`)
    }
    await this.cache.delete('content:all:*')
  }
}
```

### AI Service Implementation
```typescript
// services/ai.service.ts
export class AIService {
  private openai: OpenAI
  private cache: CacheService
  private rateLimiter: RateLimiter
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    this.cache = new CacheService()
    this.rateLimiter = new RateLimiter({
      tokensPerMinute: 90000,
      requestsPerMinute: 60
    })
  }
  
  async generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
    // Check cache first
    const cacheKey = `ai:generate:${JSON.stringify(params)}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached
    
    // Rate limiting
    await this.rateLimiter.acquire()
    
    try {
      const prompt = this.buildPrompt(params)
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(params.type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      })
      
      const result = this.parseAIResponse(completion.choices[0].message.content)
      
      // Cache for 1 hour
      await this.cache.set(cacheKey, result, 3600)
      
      // Track usage
      await this.trackUsage({
        advisorId: params.advisorId,
        model: 'gpt-4',
        tokens: completion.usage.total_tokens,
        cost: this.calculateCost(completion.usage)
      })
      
      return result
    } catch (error) {
      // Fallback to GPT-3.5 if GPT-4 fails
      if (error.status === 429 || error.status === 503) {
        return this.generateWithFallback(params)
      }
      throw error
    }
  }
  
  async checkCompliance(content: string): Promise<ComplianceResult> {
    const prompt = `
      Analyze the following financial content for SEBI compliance issues.
      Score from 0 (perfect) to 100 (severe violations).
      
      Check for:
      1. Misleading claims or guarantees
      2. Missing risk disclaimers
      3. Unsubstantiated performance claims
      4. Inappropriate advice
      5. Regulatory violations
      
      Content: ${content}
      
      Return JSON: {
        "score": number,
        "violations": string[],
        "suggestions": string[],
        "requiresHumanReview": boolean
      }
    `
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster model for compliance
      messages: [
        { role: 'system', content: 'You are a SEBI compliance expert.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Lower temperature for consistency
      max_tokens: 500,
      response_format: { type: 'json_object' }
    })
    
    return JSON.parse(completion.choices[0].message.content)
  }
  
  private buildPrompt(params: GenerateContentParams): string {
    const templates = {
      whatsapp: `
        Create a WhatsApp message for financial advisors about ${params.topic}.
        Language: ${params.language}
        Tone: Professional yet approachable
        Length: 100-150 words
        Include: Key points, actionable advice, appropriate disclaimer
        Format: Plain text suitable for WhatsApp
      `,
      linkedin: `
        Create a LinkedIn post for financial advisors about ${params.topic}.
        Language: ${params.language}
        Tone: Professional and insightful
        Length: 150-200 words
        Include: Industry insights, thought leadership, hashtags
        Format: Engaging LinkedIn post with 3-5 relevant hashtags
      `,
      educational: `
        Create educational content about ${params.topic}.
        Language: ${params.language}
        Tone: Informative and easy to understand
        Length: 200-250 words
        Include: Key concepts, examples, takeaways
        Format: Educational content with clear structure
      `
    }
    
    return templates[params.type] || templates.whatsapp
  }
  
  private getSystemPrompt(type: string): string {
    return `
      You are an expert financial content creator for Indian financial advisors.
      You have deep knowledge of SEBI regulations, mutual funds, and investment products.
      Always ensure content is compliant, accurate, and valuable.
      Never make guarantees about returns or give specific investment advice.
      Always include appropriate risk disclaimers.
      Focus on education and awareness rather than promotion.
    `
  }
}
```

### WhatsApp Service Implementation
```typescript
// services/whatsapp.service.ts
export class WhatsAppService {
  private client: WhatsAppCloudAPI
  private queue: Queue
  
  constructor() {
    this.client = new WhatsAppCloudAPI({
      phoneNumberId: process.env.WA_PHONE_NUMBER_ID,
      accessToken: process.env.WA_ACCESS_TOKEN,
      businessAccountId: process.env.WA_BUSINESS_ACCOUNT_ID
    })
    
    this.queue = new Queue('whatsapp-delivery', {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
      }
    })
    
    this.setupQueueProcessor()
  }
  
  async scheduleDelivery(
    contentPack: ContentPack, 
    advisors: Advisor[]
  ): Promise<void> {
    const jobs = advisors.map(advisor => ({
      name: 'send-content',
      data: {
        contentPackId: contentPack.id,
        advisorId: advisor.id,
        phoneNumber: advisor.whatsappNumber,
        scheduledFor: contentPack.scheduledFor || new Date()
      },
      opts: {
        delay: this.calculateDelay(contentPack.scheduledFor),
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000 // 1 minute
        }
      }
    }))
    
    await this.queue.addBulk(jobs)
  }
  
  private setupQueueProcessor() {
    const worker = new Worker('whatsapp-delivery', 
      async (job) => {
        const { contentPackId, advisorId, phoneNumber } = job.data
        
        try {
          // Fetch content and advisor data
          const [content, advisor] = await Promise.all([
            this.contentService.findById(contentPackId),
            this.advisorService.findById(advisorId)
          ])
          
          // Send WhatsApp message
          const message = await this.sendMessage({
            to: phoneNumber,
            type: 'template',
            template: {
              name: 'daily_content_v1',
              language: { code: advisor.languagePreferences[0] },
              components: [
                {
                  type: 'header',
                  parameters: [
                    {
                      type: 'image',
                      image: { link: content.mediaAssets.whatsapp }
                    }
                  ]
                },
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: content.captions[advisor.languagePreferences[0]] }
                  ]
                }
              ]
            }
          })
          
          // Track delivery
          await this.trackDelivery({
            messageId: message.messages[0].id,
            contentPackId,
            advisorId,
            status: 'SENT'
          })
          
          return { success: true, messageId: message.messages[0].id }
        } catch (error) {
          this.logger.error('WhatsApp delivery failed', { error, job: job.data })
          throw error
        }
      },
      {
        connection: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT
        },
        concurrency: 10 // Process 10 messages simultaneously
      }
    )
    
    worker.on('completed', (job) => {
      this.logger.info('WhatsApp message sent', { jobId: job.id })
    })
    
    worker.on('failed', (job, err) => {
      this.logger.error('WhatsApp delivery failed', { jobId: job.id, error: err })
    })
  }
  
  async handleWebhook(payload: WhatsAppWebhookPayload): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload)) {
      throw new Error('Invalid webhook signature')
    }
    
    // Process status updates
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await this.processMessageStatus(change.value)
        }
      }
    }
  }
  
  private async processMessageStatus(value: any): Promise<void> {
    const { statuses } = value
    
    for (const status of statuses) {
      await this.updateDeliveryStatus({
        messageId: status.id,
        status: status.status.toUpperCase(),
        timestamp: new Date(status.timestamp * 1000)
      })
      
      // Send analytics event
      await this.analytics.track({
        event: 'whatsapp_status_update',
        properties: {
          messageId: status.id,
          status: status.status,
          recipientId: status.recipient_id
        }
      })
    }
  }
}
```

## Database Component Design

### Repository Pattern Implementation
```typescript
// repositories/base.repository.ts
export abstract class BaseRepository<T> {
  constructor(
    protected readonly prisma: PrismaClient,
    protected readonly modelName: string
  ) {}
  
  async findAll(options?: FindOptions): Promise<T[]> {
    return this.prisma[this.modelName].findMany({
      where: options?.where,
      orderBy: options?.orderBy || { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
      include: options?.include
    })
  }
  
  async findById(id: string, include?: any): Promise<T | null> {
    return this.prisma[this.modelName].findUnique({
      where: { id },
      include
    })
  }
  
  async create(data: any): Promise<T> {
    return this.prisma[this.modelName].create({
      data,
      include: this.defaultInclude()
    })
  }
  
  async update(id: string, data: any): Promise<T> {
    return this.prisma[this.modelName].update({
      where: { id },
      data,
      include: this.defaultInclude()
    })
  }
  
  async delete(id: string): Promise<void> {
    await this.prisma[this.modelName].delete({
      where: { id }
    })
  }
  
  async count(where?: any): Promise<number> {
    return this.prisma[this.modelName].count({ where })
  }
  
  protected abstract defaultInclude(): any
}

// repositories/content.repository.ts
export class ContentRepository extends BaseRepository<ContentPack> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'contentPack')
  }
  
  async findByAdvisor(advisorId: string, options?: FindOptions): Promise<ContentPack[]> {
    return this.prisma.contentPack.findMany({
      where: {
        advisorId,
        ...options?.where
      },
      orderBy: options?.orderBy || { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      include: this.defaultInclude()
    })
  }
  
  async findPendingApproval(): Promise<ContentPack[]> {
    return this.prisma.contentPack.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'asc' // FIFO for approval queue
      },
      include: {
        advisor: true,
        complianceChecks: true
      }
    })
  }
  
  async findScheduledForDelivery(date: Date): Promise<ContentPack[]> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    return this.prisma.contentPack.findMany({
      where: {
        status: 'APPROVED',
        scheduledFor: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        advisor: true,
        deliveries: true
      }
    })
  }
  
  protected defaultInclude() {
    return {
      complianceChecks: {
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  }
}
```

## Integration Components

### API Gateway Middleware Stack
```typescript
// middleware/api-gateway.ts
export class APIGateway {
  private app: Express
  
  constructor() {
    this.app = express()
    this.setupMiddleware()
    this.setupRoutes()
    this.setupErrorHandling()
  }
  
  private setupMiddleware() {
    // Request ID generation
    this.app.use((req, res, next) => {
      req.id = uuidv4()
      res.setHeader('X-Request-ID', req.id)
      next()
    })
    
    // Request logging
    this.app.use(morgan(':method :url :status :response-time ms - :res[content-length]'))
    
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        }
      }
    }))
    
    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(','),
      credentials: true
    }))
    
    // Rate limiting
    this.app.use('/api/', rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: req.rateLimit.resetTime
        })
      }
    }))
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }))
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }))
    
    // Authentication
    this.app.use('/api/', clerkAuth())
    
    // Request validation
    this.app.use('/api/', (req, res, next) => {
      // Sanitize inputs
      req.body = this.sanitizeObject(req.body)
      req.query = this.sanitizeObject(req.query)
      req.params = this.sanitizeObject(req.params)
      next()
    })
  }
  
  private setupRoutes() {
    // Health checks
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date() })
    })
    
    // API routes
    this.app.use('/api/v1/auth', authRouter)
    this.app.use('/api/v1/advisors', advisorRouter)
    this.app.use('/api/v1/content', contentRouter)
    this.app.use('/api/v1/ai', aiRouter)
    this.app.use('/api/v1/whatsapp', whatsappRouter)
    this.app.use('/api/v1/analytics', analyticsRouter)
    this.app.use('/api/v1/admin', adminRouter)
    
    // Webhook endpoints
    this.app.use('/webhooks/whatsapp', whatsappWebhookRouter)
    this.app.use('/webhooks/payment', paymentWebhookRouter)
  }
  
  private setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found`,
        requestId: req.id
      })
    })
    
    // Global error handler
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      const status = err.status || 500
      const message = err.message || 'Internal Server Error'
      
      // Log error
      logger.error('API Error', {
        requestId: req.id,
        error: err,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        user: req.auth?.userId
      })
      
      // Send error response
      res.status(status).json({
        error: status >= 500 ? 'Internal Server Error' : message,
        message: status >= 500 ? 'An error occurred processing your request' : message,
        requestId: req.id,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      })
    })
  }
  
  private sanitizeObject(obj: any): any {
    if (!obj) return obj
    
    const sanitized = {}
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // Remove potential XSS
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .trim()
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value)
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }
}
```

## Performance Optimization Components

### Caching Layer Implementation
```typescript
// services/cache.service.ts
export class CacheService {
  private redis: Redis
  private localCache: Map<string, { value: any, expiry: number }>
  
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    })
    
    this.localCache = new Map()
    
    // Clear expired local cache entries every minute
    setInterval(() => this.clearExpiredLocal(), 60000)
  }
  
  async get<T>(key: string): Promise<T | null> {
    // Check local cache first (L1)
    const local = this.localCache.get(key)
    if (local && local.expiry > Date.now()) {
      return local.value
    }
    
    // Check Redis (L2)
    try {
      const value = await this.redis.get(key)
      if (value) {
        const parsed = JSON.parse(value)
        // Store in local cache for 60 seconds
        this.localCache.set(key, {
          value: parsed,
          expiry: Date.now() + 60000
        })
        return parsed
      }
    } catch (error) {
      logger.error('Cache get error', { key, error })
    }
    
    return null
  }
  
  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      // Set in Redis
      await this.redis.setex(key, ttl, JSON.stringify(value))
      
      // Set in local cache
      this.localCache.set(key, {
        value,
        expiry: Date.now() + (ttl * 1000)
      })
    } catch (error) {
      logger.error('Cache set error', { key, error })
    }
  }
  
  async delete(pattern: string): Promise<void> {
    // Clear from local cache
    for (const key of this.localCache.keys()) {
      if (key.match(pattern)) {
        this.localCache.delete(key)
      }
    }
    
    // Clear from Redis
    const keys = await this.redis.keys(pattern)
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
  
  private clearExpiredLocal() {
    const now = Date.now()
    for (const [key, entry] of this.localCache.entries()) {
      if (entry.expiry <= now) {
        this.localCache.delete(key)
      }
    }
  }
}
```

## Monitoring & Observability Components

### Metrics Collection
```typescript
// monitoring/metrics.ts
export class MetricsCollector {
  private metrics: Map<string, any>
  
  constructor() {
    this.metrics = new Map()
    this.setupMetrics()
  }
  
  private setupMetrics() {
    // API metrics
    this.registerHistogram('api_request_duration', {
      help: 'API request duration in milliseconds',
      labelNames: ['method', 'route', 'status']
    })
    
    // Business metrics
    this.registerCounter('content_created', {
      help: 'Total content packs created',
      labelNames: ['type', 'language', 'tier']
    })
    
    this.registerCounter('whatsapp_messages_sent', {
      help: 'Total WhatsApp messages sent',
      labelNames: ['status', 'template']
    })
    
    this.registerGauge('compliance_risk_score', {
      help: 'Current compliance risk score',
      labelNames: ['advisor_id']
    })
    
    // System metrics
    this.registerGauge('memory_usage', {
      help: 'Memory usage in MB'
    })
    
    this.registerGauge('active_connections', {
      help: 'Number of active connections',
      labelNames: ['type']
    })
  }
  
  recordAPIRequest(method: string, route: string, status: number, duration: number) {
    this.metrics.get('api_request_duration').observe(
      { method, route, status: status.toString() },
      duration
    )
  }
  
  recordContentCreated(type: string, language: string, tier: string) {
    this.metrics.get('content_created').inc({ type, language, tier })
  }
  
  recordWhatsAppMessage(status: string, template: string) {
    this.metrics.get('whatsapp_messages_sent').inc({ status, template })
  }
  
  updateComplianceScore(advisorId: string, score: number) {
    this.metrics.get('compliance_risk_score').set({ advisor_id: advisorId }, score)
  }
  
  async collectSystemMetrics() {
    // Memory usage
    const memUsage = process.memoryUsage()
    this.metrics.get('memory_usage').set(memUsage.heapUsed / 1024 / 1024)
    
    // Database connections
    const dbPool = await this.prisma.$metrics.json()
    this.metrics.get('active_connections').set(
      { type: 'database' },
      dbPool.counters.find(c => c.key === 'prisma_pool_connections_open')?.value || 0
    )
  }
}
```

## Conclusion

This comprehensive component breakdown provides:

1. **Frontend Components**: Complete UI library with shadcn/ui foundation and FinTech-specific components
2. **Backend Services**: Modular service architecture with proper separation of concerns
3. **Database Layer**: Repository pattern with optimized queries and caching
4. **Integration Points**: Well-defined API gateway and third-party service integrations
5. **Performance**: Multi-layer caching and optimization strategies
6. **Monitoring**: Comprehensive metrics and observability

The architecture supports:
- Rapid development with reusable components
- Scalability to 2,000+ advisors
- Sub-second response times
- 99.9% uptime SLA
- Complete SEBI and DPDP compliance

Each component is designed for maintainability, testability, and performance, ensuring a robust foundation for the MVP and future growth.