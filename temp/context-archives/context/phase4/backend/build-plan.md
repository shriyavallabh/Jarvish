# Backend Build Plan - NestJS Architecture & Implementation 🏗️

## Overview
Comprehensive backend build plan for Project One's NestJS application, including module architecture, database integration, queue systems, AI service integration, and WhatsApp API orchestration.

## Project Architecture & Structure

### NestJS Application Structure
```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root application module
│
├── auth/                        # Authentication module
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── clerk.guard.ts
│   ├── decorators/
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   └── strategies/
│       └── clerk.strategy.ts
│
├── advisors/                    # Advisor management module
│   ├── advisors.module.ts
│   ├── advisors.controller.ts
│   ├── advisors.service.ts
│   ├── dto/
│   │   ├── create-advisor.dto.ts
│   │   ├── update-advisor.dto.ts
│   │   └── advisor-query.dto.ts
│   ├── entities/
│   │   ├── advisor.entity.ts
│   │   └── advisor-profile.entity.ts
│   └── repositories/
│       └── advisors.repository.ts
│
├── content/                     # Content management module  
│   ├── content.module.ts
│   ├── content.controller.ts
│   ├── content.service.ts
│   ├── dto/
│   │   ├── create-content.dto.ts
│   │   ├── update-content.dto.ts
│   │   └── content-query.dto.ts
│   ├── entities/
│   │   ├── content-pack.entity.ts
│   │   └── render-job.entity.ts
│   └── processors/
│       ├── content-generation.processor.ts
│       └── content-approval.processor.ts
│
├── compliance/                  # Compliance engine module
│   ├── compliance.module.ts
│   ├── compliance.controller.ts
│   ├── compliance.service.ts
│   ├── engines/
│   │   ├── rule-engine.ts
│   │   ├── ai-engine.ts
│   │   └── validation-engine.ts
│   ├── rules/
│   │   ├── sebi-rules.ts
│   │   ├── regex-patterns.ts
│   │   └── risk-scoring.ts
│   └── dto/
│       ├── compliance-check.dto.ts
│       └── compliance-result.dto.ts
│
├── whatsapp/                    # WhatsApp integration module
│   ├── whatsapp.module.ts
│   ├── whatsapp.controller.ts
│   ├── whatsapp.service.ts
│   ├── webhooks/
│   │   └── whatsapp-webhook.controller.ts
│   ├── templates/
│   │   └── template.service.ts
│   ├── delivery/
│   │   ├── delivery.service.ts
│   │   └── delivery.processor.ts
│   └── entities/
│       ├── wa-template.entity.ts
│       └── delivery.entity.ts
│
├── ai/                          # AI services module
│   ├── ai.module.ts
│   ├── ai.service.ts
│   ├── providers/
│   │   ├── openai.service.ts
│   │   └── anthropic.service.ts
│   ├── dto/
│   │   ├── generate-content.dto.ts
│   │   └── ai-analysis.dto.ts
│   └── processors/
│       └── ai-generation.processor.ts
│
├── admin/                       # Admin operations module
│   ├── admin.module.ts
│   ├── admin.controller.ts
│   ├── admin.service.ts
│   ├── queue/
│   │   ├── approval-queue.service.ts
│   │   └── queue.controller.ts
│   └── dto/
│       ├── approve-content.dto.ts
│       └── batch-action.dto.ts
│
├── analytics/                   # Analytics & insights module
│   ├── analytics.module.ts
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   ├── processors/
│   │   ├── metrics.processor.ts
│   │   └── insights.processor.ts
│   └── dto/
│       └── analytics-query.dto.ts
│
├── render/                      # Image rendering module
│   ├── render.module.ts
│   ├── render.service.ts
│   ├── providers/
│   │   └── cloudinary.service.ts
│   ├── processors/
│   │   └── render.processor.ts
│   └── dto/
│       └── render-request.dto.ts
│
├── fallback/                    # Fallback system module
│   ├── fallback.module.ts
│   ├── fallback.service.ts
│   ├── entities/
│   │   ├── fallback-policy.entity.ts
│   │   └── fallback-pack.entity.ts
│   └── processors/
│       └── fallback-selection.processor.ts
│
├── audit/                       # Audit & compliance logging
│   ├── audit.module.ts
│   ├── audit.service.ts
│   ├── entities/
│   │   ├── audit-log.entity.ts
│   │   ├── ai-audit-log.entity.ts
│   │   └── compliance-incident.entity.ts
│   └── interceptors/
│       └── audit.interceptor.ts
│
├── common/                      # Shared utilities
│   ├── decorators/
│   │   ├── api-response.decorator.ts
│   │   └── paginate.decorator.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── validation.filter.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── transform.interceptor.ts
│   │   └── timeout.interceptor.ts
│   ├── pipes/
│   │   ├── validation.pipe.ts
│   │   └── parse-object-id.pipe.ts
│   ├── middleware/
│   │   ├── cors.middleware.ts
│   │   └── rate-limit.middleware.ts
│   └── utils/
│       ├── pagination.util.ts
│       ├── crypto.util.ts
│       └── date.util.ts
│
├── database/                    # Database configuration
│   ├── database.module.ts
│   ├── migrations/
│   ├── seeds/
│   └── config/
│       └── database.config.ts
│
├── queues/                      # Queue system configuration
│   ├── queues.module.ts
│   ├── config/
│   │   └── bull.config.ts
│   └── processors/
│       ├── base.processor.ts
│       └── health.processor.ts
│
└── config/                      # Application configuration
    ├── app.config.ts
    ├── auth.config.ts
    ├── ai.config.ts
    ├── whatsapp.config.ts
    └── validation.schema.ts
```

## Core Module Implementation

### 1. Application Bootstrap & Configuration
```typescript
// main.ts - Application entry point
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const logger = new Logger('Bootstrap')

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true }
  }))

  // Global filters  
  app.useGlobalFilters(new HttpExceptionFilter())

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor())

  // CORS configuration
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  // OpenAPI/Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Project One API')
    .setDescription('AI-first B2B SaaS platform for Indian financial advisors')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('advisors', 'Advisor management operations')
    .addTag('content', 'Content creation and management')
    .addTag('compliance', 'SEBI compliance checking')
    .addTag('whatsapp', 'WhatsApp delivery and webhooks')
    .addTag('admin', 'Admin portal operations')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)
  
  logger.log(`🚀 Application running on: http://localhost:${port}`)
  logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`)
}

bootstrap()

// app.module.ts - Root application module
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { ThrottlerModule } from '@nestjs/throttler'

import { AuthModule } from './auth/auth.module'
import { AdvisorsModule } from './advisors/advisors.module'
import { ContentModule } from './content/content.module'
import { ComplianceModule } from './compliance/compliance.module'
import { WhatsappModule } from './whatsapp/whatsapp.module'
import { AiModule } from './ai/ai.module'
import { AdminModule } from './admin/admin.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { RenderModule } from './render/render.module'
import { FallbackModule } from './fallback/fallback.module'
import { AuditModule } from './audit/audit.module'

import { databaseConfig } from './config/database.config'
import { appConfig } from './config/app.config'
import { bullConfig } from './queues/config/bull.config'

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validationSchema: validationSchema,
    }),

    // Database
    TypeOrmModule.forRoot(databaseConfig),

    // Queue system
    BullModule.forRoot(bullConfig),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),

    // Feature modules
    AuthModule,
    AdvisorsModule,
    ContentModule,
    ComplianceModule,
    WhatsappModule,
    AiModule,
    AdminModule,
    AnalyticsModule,
    RenderModule,
    FallbackModule,
    AuditModule,
  ],
})
export class AppModule {}
```

### 2. Content Management Module
```typescript
// content/content.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'

import { ContentController } from './content.controller'
import { ContentService } from './content.service'
import { ContentPack } from './entities/content-pack.entity'
import { RenderJob } from './entities/render-job.entity'
import { ContentGenerationProcessor } from './processors/content-generation.processor'
import { ContentApprovalProcessor } from './processors/content-approval.processor'

import { ComplianceModule } from '../compliance/compliance.module'
import { AiModule } from '../ai/ai.module'
import { RenderModule } from '../render/render.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([ContentPack, RenderJob]),
    BullModule.registerQueue(
      { name: 'content-generation' },
      { name: 'content-approval' },
      { name: 'content-rendering' }
    ),
    ComplianceModule,
    AiModule,
    RenderModule,
  ],
  controllers: [ContentController],
  providers: [
    ContentService,
    ContentGenerationProcessor,
    ContentApprovalProcessor,
  ],
  exports: [ContentService],
})
export class ContentModule {}

// content/content.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { ContentService } from './content.service'
import { CreateContentDto, UpdateContentDto, ContentQueryDto } from './dto'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { User } from '../auth/interfaces/user.interface'

@ApiTags('content')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post()
  @ApiOperation({ summary: 'Create new content pack' })
  @ApiResponse({ status: 201, description: 'Content created successfully' })
  async create(
    @Body() createContentDto: CreateContentDto,
    @CurrentUser() user: User,
  ) {
    return this.contentService.create(createContentDto, user.advisorId)
  }

  @Get()
  @ApiOperation({ summary: 'Get advisor content library' })
  async findAll(
    @Query() query: ContentQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.contentService.findByAdvisor(user.advisorId, query)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get content by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.contentService.findOne(id, user.advisorId)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update content pack' })
  async update(
    @Param('id') id: string,
    @Body() updateContentDto: UpdateContentDto,
    @CurrentUser() user: User,
  ) {
    return this.contentService.update(id, updateContentDto, user.advisorId)
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit content for approval' })
  async submitForApproval(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.contentService.submitForApproval(id, user.advisorId)
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI content' })
  async generateContent(
    @Body() generateDto: { prompt: string; language: string },
    @CurrentUser() user: User,
  ) {
    return this.contentService.generateContent(generateDto, user.advisorId)
  }

  @Post('compliance-check')
  @ApiOperation({ summary: 'Check content compliance' })
  async checkCompliance(@Body() { content }: { content: string }) {
    return this.contentService.checkCompliance(content)
  }
}

// content/content.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { InjectQueue } from '@nestjs/bull'
import { Repository } from 'typeorm'
import { Queue } from 'bull'

import { ContentPack } from './entities/content-pack.entity'
import { CreateContentDto, UpdateContentDto, ContentQueryDto } from './dto'
import { ComplianceService } from '../compliance/compliance.service'
import { AiService } from '../ai/ai.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentPack)
    private contentRepository: Repository<ContentPack>,
    
    @InjectQueue('content-generation')
    private contentGenerationQueue: Queue,
    
    @InjectQueue('content-rendering')
    private contentRenderingQueue: Queue,
    
    private complianceService: ComplianceService,
    private aiService: AiService,
    private auditService: AuditService,
  ) {}

  async create(createContentDto: CreateContentDto, advisorId: string) {
    // Create content pack
    const content = this.contentRepository.create({
      ...createContentDto,
      advisorId,
      status: 'draft',
      contentHash: this.generateContentHash(createContentDto.draftContentJson),
    })

    const savedContent = await this.contentRepository.save(content)

    // Log creation
    await this.auditService.log({
      action: 'content_created',
      entityType: 'content_pack',
      entityId: savedContent.id,
      actorType: 'advisor',
      actorId: advisorId,
      details: { topicFamily: createContentDto.topicFamily },
    })

    // Queue for compliance check if not draft
    if (createContentDto.autoSubmit) {
      await this.queueComplianceCheck(savedContent.id)
    }

    return savedContent
  }

  async findByAdvisor(advisorId: string, query: ContentQueryDto) {
    const queryBuilder = this.contentRepository
      .createQueryBuilder('content')
      .where('content.advisorId = :advisorId', { advisorId })

    // Apply filters
    if (query.status) {
      queryBuilder.andWhere('content.status = :status', { status: query.status })
    }

    if (query.topicFamily) {
      queryBuilder.andWhere('content.topicFamily = :topicFamily', { 
        topicFamily: query.topicFamily 
      })
    }

    if (query.language) {
      queryBuilder.andWhere(':language = ANY(content.languages)', { 
        language: query.language 
      })
    }

    // Pagination
    if (query.page && query.limit) {
      queryBuilder
        .skip((query.page - 1) * query.limit)
        .take(query.limit)
    }

    // Sorting
    queryBuilder.orderBy('content.createdAt', 'DESC')

    const [contents, total] = await queryBuilder.getManyAndCount()

    return {
      contents,
      pagination: {
        total,
        page: query.page || 1,
        limit: query.limit || 20,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
    }
  }

  async submitForApproval(contentId: string, advisorId: string) {
    const content = await this.findOne(contentId, advisorId)
    
    if (content.status !== 'draft') {
      throw new ForbiddenException('Only draft content can be submitted')
    }

    // Update status
    await this.contentRepository.update(contentId, { status: 'pending' })

    // Queue for compliance processing
    await this.queueComplianceCheck(contentId)

    // Log submission
    await this.auditService.log({
      action: 'content_submitted',
      entityType: 'content_pack',
      entityId: contentId,
      actorType: 'advisor',
      actorId: advisorId,
    })

    return { message: 'Content submitted for approval' }
  }

  async generateContent(generateDto: { prompt: string; language: string }, advisorId: string) {
    // Queue AI content generation
    const job = await this.contentGenerationQueue.add('generate-content', {
      prompt: generateDto.prompt,
      language: generateDto.language,
      advisorId,
    })

    return { jobId: job.id, message: 'Content generation started' }
  }

  async checkCompliance(content: string) {
    return this.complianceService.checkContent(content)
  }

  private async queueComplianceCheck(contentId: string) {
    await this.contentGenerationQueue.add('compliance-check', {
      contentId,
    }, {
      priority: 10, // High priority for compliance checks
      attempts: 3,
    })
  }

  private generateContentHash(content: any): string {
    return require('crypto')
      .createHash('sha256')
      .update(JSON.stringify(content))
      .digest('hex')
  }
}
```

### 3. Compliance Engine Module
```typescript
// compliance/compliance.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'

import { ComplianceController } from './compliance.controller'
import { ComplianceService } from './compliance.service'
import { RuleEngine } from './engines/rule-engine'
import { AiEngine } from './engines/ai-engine'
import { ValidationEngine } from './engines/validation-engine'

import { AiModule } from '../ai/ai.module'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [
    ConfigModule,
    AiModule,
    AuditModule,
  ],
  controllers: [ComplianceController],
  providers: [
    ComplianceService,
    RuleEngine,
    AiEngine,
    ValidationEngine,
  ],
  exports: [ComplianceService],
})
export class ComplianceModule {}

// compliance/compliance.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { RuleEngine } from './engines/rule-engine'
import { AiEngine } from './engines/ai-engine'
import { ValidationEngine } from './engines/validation-engine'
import { ComplianceCheckDto, ComplianceResult } from './dto'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger(ComplianceService.name)

  constructor(
    private ruleEngine: RuleEngine,
    private aiEngine: AiEngine,
    private validationEngine: ValidationEngine,
    private auditService: AuditService,
  ) {}

  async checkContent(content: string, advisorId?: string): Promise<ComplianceResult> {
    const startTime = Date.now()
    this.logger.log(`Starting 3-stage compliance check for content length: ${content.length}`)

    try {
      // Stage 1: Rule-based validation
      const stage1Result = await this.ruleEngine.validate(content)
      this.logger.debug(`Stage 1 complete: ${stage1Result.violations.length} violations`)

      // Stage 2: AI analysis (if Stage 1 passes or has minor issues)
      let stage2Result = null
      if (stage1Result.riskScore < 80) {
        stage2Result = await this.aiEngine.analyze(content)
        this.logger.debug(`Stage 2 complete: risk score ${stage2Result.riskScore}`)
      }

      // Stage 3: Final validation and scoring
      const finalResult = await this.validationEngine.validateFinal({
        content,
        stage1Result,
        stage2Result,
      })

      const totalTime = Date.now() - startTime
      this.logger.log(`Compliance check complete in ${totalTime}ms, final score: ${finalResult.riskScore}`)

      // Audit log the compliance check
      if (advisorId) {
        await this.auditService.logComplianceCheck({
          advisorId,
          content: content.substring(0, 100) + '...', // Truncated for privacy
          riskScore: finalResult.riskScore,
          processingTimeMs: totalTime,
          stage1Violations: stage1Result.violations.length,
          stage2Confidence: stage2Result?.confidence || null,
        })
      }

      return finalResult

    } catch (error) {
      this.logger.error(`Compliance check failed: ${error.message}`, error.stack)
      
      // Return high-risk result on error
      return {
        riskScore: 100,
        status: 'error',
        suggestions: ['Content could not be verified for compliance. Please review manually.'],
        violations: ['system_error'],
        confidence: 0,
      }
    }
  }

  async getComplianceHistory(advisorId: string, limit = 50) {
    return this.auditService.getComplianceHistory(advisorId, limit)
  }

  async updateComplianceRules(rules: any, updatedBy: string) {
    // Update rules in rule engine
    await this.ruleEngine.updateRules(rules)
    
    // Log rule update
    await this.auditService.log({
      action: 'compliance_rules_updated',
      entityType: 'system',
      entityId: 'compliance_rules',
      actorType: 'admin',
      actorId: updatedBy,
      details: { rulesCount: Object.keys(rules).length },
    })
  }
}

// compliance/engines/rule-engine.ts
import { Injectable, Logger } from '@nestjs/common'
import { SebiRules } from '../rules/sebi-rules'
import { RegexPatterns } from '../rules/regex-patterns'

export interface RuleValidationResult {
  riskScore: number
  violations: string[]
  suggestions: string[]
}

@Injectable()
export class RuleEngine {
  private readonly logger = new Logger(RuleEngine.name)
  private rules: SebiRules
  private patterns: RegexPatterns

  constructor() {
    this.rules = new SebiRules()
    this.patterns = new RegexPatterns()
  }

  async validate(content: string): Promise<RuleValidationResult> {
    const violations: string[] = []
    const suggestions: string[] = []
    let riskScore = 0

    // Check forbidden terms
    const forbiddenMatches = this.patterns.checkForbiddenTerms(content)
    if (forbiddenMatches.length > 0) {
      violations.push(...forbiddenMatches.map(m => `forbidden_term_${m.type}`))
      suggestions.push(...forbiddenMatches.map(m => `Replace "${m.term}" with compliant alternative`))
      riskScore += forbiddenMatches.length * 30
    }

    // Check guarantee language
    if (this.patterns.hasGuaranteeLanguage(content)) {
      violations.push('guarantee_language')
      suggestions.push('Remove or soften language suggesting guaranteed returns')
      riskScore += 40
    }

    // Check risk disclosure requirements
    if (!this.patterns.hasRiskDisclaimer(content)) {
      violations.push('missing_risk_disclaimer')
      suggestions.push('Add appropriate risk disclosure statement')
      riskScore += 25
    }

    // Check for misleading claims
    const misleadingClaims = this.patterns.checkMisleadingClaims(content)
    if (misleadingClaims.length > 0) {
      violations.push(...misleadingClaims)
      riskScore += misleadingClaims.length * 20
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100)

    this.logger.debug(`Rule engine validation: ${violations.length} violations, risk score: ${riskScore}`)

    return {
      riskScore,
      violations,
      suggestions,
    }
  }

  async updateRules(newRules: any) {
    // Update internal rule definitions
    this.rules = new SebiRules(newRules)
    this.patterns = new RegexPatterns(newRules.patterns)
    
    this.logger.log('Compliance rules updated successfully')
  }
}
```

### 4. WhatsApp Integration Module
```typescript
// whatsapp/whatsapp.module.ts
import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { HttpModule } from '@nestjs/axios'

import { WhatsappController } from './whatsapp.controller'
import { WhatsappService } from './whatsapp.service'
import { WhatsappWebhookController } from './webhooks/whatsapp-webhook.controller'
import { TemplateService } from './templates/template.service'
import { DeliveryService } from './delivery/delivery.service'
import { DeliveryProcessor } from './delivery/delivery.processor'

import { WaTemplate } from './entities/wa-template.entity'
import { Delivery } from './entities/delivery.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([WaTemplate, Delivery]),
    BullModule.registerQueue({ name: 'whatsapp-delivery' }),
    HttpModule,
  ],
  controllers: [
    WhatsappController,
    WhatsappWebhookController,
  ],
  providers: [
    WhatsappService,
    TemplateService,
    DeliveryService,
    DeliveryProcessor,
  ],
  exports: [WhatsappService, DeliveryService],
})
export class WhatsappModule {}

// whatsapp/whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { firstValueFrom } from 'rxjs'

import { Delivery } from './entities/delivery.entity'
import { DeliveryService } from './delivery/delivery.service'

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name)
  private readonly apiUrl: string
  private readonly accessToken: string
  private readonly phoneNumberId: string

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private deliveryService: DeliveryService,
    @InjectRepository(Delivery)
    private deliveryRepository: Repository<Delivery>,
  ) {
    this.apiUrl = 'https://graph.facebook.com/v18.0'
    this.accessToken = configService.get('WHATSAPP_ACCESS_TOKEN')
    this.phoneNumberId = configService.get('WHATSAPP_PHONE_NUMBER_ID')
  }

  async sendTemplateMessage(
    recipientPhone: string,
    templateName: string,
    templateParams: string[],
    mediaUrl?: string,
  ) {
    try {
      const messagePayload = {
        messaging_product: 'whatsapp',
        to: recipientPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en'
          },
          components: [
            ...(mediaUrl ? [{
              type: 'header',
              parameters: [{
                type: 'image',
                image: { link: mediaUrl }
              }]
            }] : []),
            {
              type: 'body',
              parameters: templateParams.map(param => ({
                type: 'text',
                text: param
              }))
            }
          ]
        }
      }

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.apiUrl}/${this.phoneNumberId}/messages`,
          messagePayload,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
      )

      this.logger.log(`WhatsApp message sent successfully: ${response.data.messages[0].id}`)
      
      return {
        messageId: response.data.messages[0].id,
        status: 'sent',
      }

    } catch (error) {
      this.logger.error(`Failed to send WhatsApp message: ${error.message}`, error.stack)
      throw error
    }
  }

  async processWebhook(webhookData: any) {
    const entry = webhookData.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value

    if (value?.statuses) {
      // Process delivery status updates
      for (const status of value.statuses) {
        await this.updateDeliveryStatus(status.id, status.status, status.timestamp)
      }
    }

    if (value?.messages) {
      // Process incoming messages (if needed)
      this.logger.log('Received incoming WhatsApp message')
    }

    return { status: 'ok' }
  }

  private async updateDeliveryStatus(messageId: string, status: string, timestamp: string) {
    const delivery = await this.deliveryRepository.findOne({
      where: { messageId }
    })

    if (!delivery) {
      this.logger.warn(`Delivery not found for message ID: ${messageId}`)
      return
    }

    const updates: Partial<Delivery> = { status }

    switch (status) {
      case 'sent':
        updates.sentAt = new Date(parseInt(timestamp) * 1000)
        break
      case 'delivered':
        updates.deliveredAt = new Date(parseInt(timestamp) * 1000)
        break
      case 'read':
        updates.readAt = new Date(parseInt(timestamp) * 1000)
        break
      case 'failed':
        updates.errorMessage = 'Delivery failed'
        break
    }

    await this.deliveryRepository.update(delivery.id, updates)
    
    this.logger.log(`Updated delivery ${delivery.id} to status: ${status}`)
  }

  async getQualityRating(): Promise<{ rating: string; status: string }> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.apiUrl}/${this.phoneNumberId}?fields=quality_rating`,
          {
            headers: {
              'Authorization': `Bearer ${this.accessToken}`,
            },
          }
        )
      )

      return {
        rating: response.data.quality_rating?.rating || 'unknown',
        status: response.data.quality_rating?.status || 'unknown',
      }

    } catch (error) {
      this.logger.error(`Failed to get quality rating: ${error.message}`)
      return { rating: 'unknown', status: 'error' }
    }
  }
}
```

## Queue System Architecture

### BullMQ Queue Configuration
```typescript
// queues/config/bull.config.ts
import { BullModuleOptions } from '@nestjs/bull'

export const bullConfig: BullModuleOptions = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB) || 0,
  },
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 100,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
}

// Queue definitions with priorities
export const QUEUE_PRIORITIES = {
  CRITICAL: 10,    // Delivery failures, compliance violations
  HIGH: 7,         // Content approval, compliance checks  
  NORMAL: 5,       // Content generation, rendering
  LOW: 2,          // Analytics, cleanup tasks
}

// Queue names
export const QUEUES = {
  CONTENT_GENERATION: 'content-generation',
  CONTENT_APPROVAL: 'content-approval',
  WHATSAPP_DELIVERY: 'whatsapp-delivery',
  IMAGE_RENDERING: 'image-rendering',
  COMPLIANCE_CHECK: 'compliance-check',
  ANALYTICS_PROCESSING: 'analytics-processing',
  FALLBACK_SELECTION: 'fallback-selection',
} as const
```

### Queue Processors Implementation
```typescript
// content/processors/content-generation.processor.ts
import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'

import { AiService } from '../../ai/ai.service'
import { ContentService } from '../content.service'
import { ComplianceService } from '../../compliance/compliance.service'

@Processor('content-generation')
export class ContentGenerationProcessor {
  private readonly logger = new Logger(ContentGenerationProcessor.name)

  constructor(
    private aiService: AiService,
    private contentService: ContentService,
    private complianceService: ComplianceService,
  ) {}

  @Process('generate-content')
  async handleContentGeneration(job: Job) {
    const { prompt, language, advisorId } = job.data
    
    this.logger.log(`Processing content generation job ${job.id} for advisor ${advisorId}`)

    try {
      // Step 1: Generate AI content
      const generatedContent = await this.aiService.generateContent({
        prompt,
        language,
        advisorId,
      })

      // Step 2: Run initial compliance check
      const complianceResult = await this.complianceService.checkContent(
        generatedContent.text,
        advisorId
      )

      // Step 3: Create content pack
      const contentPack = await this.contentService.create({
        topicFamily: this.extractTopicFromPrompt(prompt),
        languages: [language],
        draftContentJson: {
          [language]: generatedContent,
        },
        aiRiskScore: complianceResult.riskScore,
        aiSuggestions: complianceResult.suggestions,
        complianceReasons: complianceResult.violations,
      }, advisorId)

      this.logger.log(`Content generation completed for job ${job.id}`)

      return {
        contentId: contentPack.id,
        riskScore: complianceResult.riskScore,
        suggestions: complianceResult.suggestions,
      }

    } catch (error) {
      this.logger.error(`Content generation failed for job ${job.id}: ${error.message}`, error.stack)
      throw error
    }
  }

  @Process('compliance-check')
  async handleComplianceCheck(job: Job) {
    const { contentId } = job.data
    
    this.logger.log(`Processing compliance check for content ${contentId}`)

    try {
      const content = await this.contentService.findOne(contentId)
      const contentText = this.extractTextFromContent(content.draftContentJson)
      
      const complianceResult = await this.complianceService.checkContent(
        contentText,
        content.advisorId
      )

      // Update content with compliance results
      await this.contentService.update(contentId, {
        aiRiskScore: complianceResult.riskScore,
        aiSuggestions: complianceResult.suggestions,
        complianceReasons: complianceResult.violations,
        status: complianceResult.riskScore < 50 ? 'approved' : 'pending',
      })

      // If approved, queue for rendering
      if (complianceResult.riskScore < 50) {
        await this.queueRendering(contentId)
      }

      return complianceResult

    } catch (error) {
      this.logger.error(`Compliance check failed for content ${contentId}: ${error.message}`)
      throw error
    }
  }

  private extractTopicFromPrompt(prompt: string): string {
    // Simple topic extraction logic
    if (prompt.includes('market') || prompt.includes('nifty') || prompt.includes('sensex')) {
      return 'market_update'
    }
    if (prompt.includes('sip') || prompt.includes('systematic')) {
      return 'sip_education'  
    }
    if (prompt.includes('tax') || prompt.includes('80c')) {
      return 'tax_planning'
    }
    return 'general'
  }

  private extractTextFromContent(contentJson: any): string {
    // Extract text content for compliance checking
    return Object.values(contentJson)
      .map((content: any) => content.text || content.body || '')
      .join(' ')
  }

  private async queueRendering(contentId: string) {
    // Queue for image rendering (implemented in render module)
    // This would add job to 'image-rendering' queue
  }
}
```

## Database Configuration & Migrations

### TypeORM Configuration
```typescript
// database/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_NAME', 'project_one'),
  
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  
  synchronize: false, // Never use in production
  migrationsRun: true,
  logging: configService.get('NODE_ENV') === 'development' ? 'all' : ['error'],
  
  ssl: configService.get('NODE_ENV') === 'production' ? {
    rejectUnauthorized: false
  } : false,
  
  // Connection pool settings
  extra: {
    connectionLimit: 20,
    acquireTimeoutMillis: 60000,
    timeout: 60000,
    reconnect: true,
  },
})

// Example migration
// database/migrations/001-initial-schema.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm'

export class InitialSchema1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create advisors table
    await queryRunner.createTable(new Table({
      name: 'advisors',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'status', type: 'varchar', default: "'pending'" },
        { name: 'tier', type: 'varchar', default: "'basic'" },
        { name: 'type', type: 'varchar' },
        { name: 'sebi_reg_no', type: 'varchar', isUnique: true },
        { name: 'company_name', type: 'varchar' },
        { name: 'email', type: 'varchar', isUnique: true },
        { name: 'wa_business_phone', type: 'varchar', isNullable: true, isUnique: true },
        { name: 'health_score', type: 'int', default: 0 },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
    }))

    // Create indexes
    await queryRunner.createIndex('advisors', new Index('idx_advisors_status', ['status']))
    await queryRunner.createIndex('advisors', new Index('idx_advisors_tier', ['tier']))
    await queryRunner.createIndex('advisors', new Index('idx_advisors_health_score', ['health_score']))
    
    // Create content_packs table
    await queryRunner.createTable(new Table({
      name: 'content_packs',
      columns: [
        { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
        { name: 'advisor_id', type: 'uuid' },
        { name: 'topic_family', type: 'varchar' },
        { name: 'languages', type: 'text[]' },
        { name: 'draft_content_json', type: 'jsonb' },
        { name: 'ai_risk_score', type: 'int', default: 0 },
        { name: 'status', type: 'varchar', default: "'draft'" },
        { name: 'schedule_date', type: 'date', isNullable: true },
        { name: 'content_hash', type: 'varchar' },
        { name: 'created_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
      ],
      foreignKeys: [
        {
          columnNames: ['advisor_id'],
          referencedTableName: 'advisors',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        },
      ],
    }))

    // Additional tables would follow...
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('content_packs')
    await queryRunner.dropTable('advisors')
  }
}
```

## API Documentation & OpenAPI Integration

### OpenAPI Schema Definitions
```typescript
// Auto-generated OpenAPI documentation with decorators
// Example from content.controller.ts

@ApiTags('content')
@ApiBearerAuth()
export class ContentController {
  @Post()
  @ApiOperation({ 
    summary: 'Create new content pack',
    description: 'Creates a new content pack with AI generation and compliance checking'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Content created successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: ['draft', 'pending', 'approved'] },
        aiRiskScore: { type: 'number', minimum: 0, maximum: 100 },
        createdAt: { type: 'string', format: 'date-time' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createContentDto: CreateContentDto) {
    // Implementation
  }
}

// OpenAPI configuration for different environments
// main.ts - Swagger setup
const config = new DocumentBuilder()
  .setTitle('Project One API')
  .setDescription(`
    AI-first B2B SaaS platform for Indian financial advisors.
    
    ## Authentication
    All endpoints require Bearer token authentication via Clerk.
    
    ## Rate Limiting
    - Standard endpoints: 100 requests/minute
    - AI generation: 20 requests/minute  
    - Webhook endpoints: No limit
    
    ## Error Handling
    All errors follow RFC 7807 Problem Details standard.
  `)
  .setVersion('1.0')
  .setContact(
    'Project One Support', 
    'https://projectone.ai/support',
    'support@projectone.ai'
  )
  .addBearerAuth()
  .addServer('http://localhost:3001', 'Development')
  .addServer('https://api.projectone.ai', 'Production')
  .build()
```

This comprehensive backend build plan provides a complete architecture for implementing Project One's NestJS application with proper module organization, queue systems, database integration, and API documentation.