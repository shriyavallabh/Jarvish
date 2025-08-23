/**
 * Project One Agent Orchestrator
 * Provides CLI slash command access to all 25 agents with automatic orchestration
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';
import { globalModelSelector } from './model-selector';
import type { ModelSelectionCriteria, QueryAnalysis } from './model-selector';

// Agent Configuration Types
interface AgentConfig {
  name: string;
  path?: string;
  color: string;
  emoji: string;
  reads?: string[];
  writes?: string[];
  max_tokens_window?: number;
  wave?: number;
  mode?: 'parallel' | 'serial';
  // Model selection configuration
  preferredModel?: string;
  modelStrategy?: 'quality' | 'speed' | 'cost' | 'balanced';
  allowModelFallback?: boolean;
  maxCostPerExecution?: number;
}

interface WorkflowPhase {
  name: string;
  description: string;
  duration_estimate: string;
  mode: string;
  steps: AgentStep[];
  gate: {
    requires: string[];
    validates: string[];
  };
}

interface AgentStep {
  agent: string;
  reads: string[];
  writes: string[];
  mode: string;
  max_tokens_window: number;
  wave?: number;
  wait_for?: string[];
}

// Agent Registry - All 25 agents with their specifications
class AgentRegistry {
  private agents: Map<string, AgentConfig> = new Map();
  private primaryAgents: Map<string, AgentConfig> = new Map();
  private subAgents: Map<string, AgentConfig> = new Map();
  private workflow: any;

  constructor() {
    this.loadRegistry();
    this.loadWorkflow();
    this.initializeAgents();
  }

  private loadRegistry() {
    try {
      const registryPath = join(process.cwd(), 'workflow', 'registry.yaml');
      const registryContent = readFileSync(registryPath, 'utf8');
      const registry = yaml.load(registryContent) as any;
      
      // Load agents from registry
      for (const [agentId, config] of Object.entries(registry.agents)) {
        this.agents.set(agentId, config as AgentConfig);
      }
    } catch (error) {
      console.error('Failed to load agent registry:', error);
    }
  }

  private loadWorkflow() {
    try {
      const workflowPath = join(process.cwd(), 'workflow', 'chain.yaml');
      const workflowContent = readFileSync(workflowPath, 'utf8');
      this.workflow = yaml.load(workflowContent);
    } catch (error) {
      console.error('Failed to load workflow chain:', error);
    }
  }

  private initializeAgents() {
    // Primary Agents (8) - from project-one/agents/
    this.primaryAgents.set('compliance-ux-researcher', {
      name: 'Compliance UX Researcher',
      color: '#6366F1',
      emoji: '🔎',
      path: 'design/compliance-ux-researcher.md',
      max_tokens_window: 180000,
      modelStrategy: 'quality', // High-quality research requires Opus
      allowModelFallback: true,
      maxCostPerExecution: 0.50 // $0.50 per execution
    });

    this.primaryAgents.set('fintech-ui-designer', {
      name: 'FinTech UI Designer', 
      color: '#CEA200',
      emoji: '🎨',
      path: 'design/fintech-ui-designer.md',
      max_tokens_window: 160000
    });

    this.primaryAgents.set('nextjs-dashboard-developer', {
      name: 'Next.js Dashboard Developer',
      color: '#10B981',
      emoji: '🧩', 
      path: 'eng/nextjs-dashboard-developer.md',
      max_tokens_window: 190000
    });

    this.primaryAgents.set('ai-compliance-engine-dev', {
      name: 'AI Compliance Engine Developer',
      color: '#0C310C',
      emoji: '🛠️',
      path: 'eng/ai-compliance-engine-dev.md',
      max_tokens_window: 180000
    });

    this.primaryAgents.set('whatsapp-api-specialist', {
      name: 'WhatsApp API Specialist',
      color: '#0EA5E9', 
      emoji: '📩',
      path: 'eng/whatsapp-api-specialist.md',
      max_tokens_window: 170000
    });

    this.primaryAgents.set('analytics-intelligence-dev', {
      name: 'Analytics Intelligence Developer',
      color: '#3B82F6',
      emoji: '📈',
      path: 'domain/analytics-intelligence-dev.md',
      max_tokens_window: 190000
    });

    this.primaryAgents.set('sebi-compliance-auditor', {
      name: 'SEBI Compliance Auditor',
      color: '#1E3A8A',
      emoji: '🛡️',
      path: 'domain/sebi-compliance-auditor.md', 
      max_tokens_window: 150000
    });

    this.primaryAgents.set('fallback-system-architect', {
      name: 'Fallback System Architect',
      color: '#F59E0B',
      emoji: '⏱️',
      path: 'domain/fallback-system-architect.md',
      max_tokens_window: 140000
    });

    // Sub-Agents (17) - from project-one/prompts/agents/
    this.subAgents.set('controller', {
      name: 'Controller',
      color: '#0B1F33',
      emoji: '🎛️',
      path: 'prompts/agents/controller.md',
      max_tokens_window: 200000
    });

    this.subAgents.set('ux-researcher', {
      name: 'UX Researcher',
      color: '#6366F1', 
      emoji: '🔎',
      path: 'prompts/agents/design-ux-researcher.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('ui-designer', {
      name: 'UI Designer',
      color: '#CEA200',
      emoji: '🎨',
      path: 'prompts/agents/design-ui-designer.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('whimsy-injector', {
      name: 'Whimsy Injector',
      color: '#D946EF',
      emoji: '✨',
      path: 'prompts/agents/design-whimsy-injector.md',
      max_tokens_window: 80000
    });

    this.subAgents.set('rapid-prototyper', {
      name: 'Rapid Prototyper',
      color: '#06B6D4',
      emoji: '⚡',
      path: 'prompts/agents/eng-rapid-prototyper.md', 
      max_tokens_window: 120000
    });

    this.subAgents.set('frontend-dev', {
      name: 'Frontend Developer',
      color: '#10B981',
      emoji: '🧩',
      path: 'prompts/agents/eng-frontend-dev.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('backend-dev', {
      name: 'Backend Developer', 
      color: '#0C310C',
      emoji: '🛠️',
      path: 'prompts/agents/eng-backend-dev.md',
      max_tokens_window: 200000
    });

    this.subAgents.set('test-runner', {
      name: 'Test Runner',
      color: '#D92D20',
      emoji: '🧪',
      path: 'prompts/agents/eng-test-runner.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('perf-benchmarker', {
      name: 'Performance Benchmarker', 
      color: '#F79009',
      emoji: '🚀',
      path: 'prompts/agents/eng-perf-benchmarker.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('data-modeler', {
      name: 'Data Modeler',
      color: '#475569',
      emoji: '🗃️',
      path: 'prompts/agents/domain-data-modeler.md',
      max_tokens_window: 100000
    });

    this.subAgents.set('compliance-guard', {
      name: 'Compliance Guard',
      color: '#1E3A8A', 
      emoji: '🛡️',
      path: 'prompts/agents/domain-compliance-guard.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('wa-template-manager', {
      name: 'WhatsApp Template Manager',
      color: '#0EA5E9',
      emoji: '📩',
      path: 'prompts/agents/domain-wa-template-manager.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('render-pipeline-architect', {
      name: 'Render Pipeline Architect',
      color: '#8B5CF6',
      emoji: '🖼️',
      path: 'prompts/agents/domain-render-pipeline-architect.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('scheduler-orchestrator', {
      name: 'Scheduler Orchestrator',
      color: '#F59E0B',
      emoji: '⏱️',
      path: 'prompts/agents/domain-scheduler-orchestrator.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('analytics-intelligence', {
      name: 'Analytics Intelligence',
      color: '#3B82F6',
      emoji: '📈',
      path: 'prompts/agents/domain-analytics-intelligence.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('security-dpo-advisor', {
      name: 'Security & DPO Advisor',
      color: '#164E63',
      emoji: '🔐', 
      path: 'prompts/agents/domain-security-dpo-advisor.md',
      max_tokens_window: 150000
    });

    this.subAgents.set('devops-observability', {
      name: 'DevOps & Observability',
      color: '#6B7280',
      emoji: '📟',
      path: 'prompts/agents/ops-devops-observability.md',
      max_tokens_window: 150000
    });
  }

  // Get agent by ID from either primary or sub-agents
  getAgent(agentId: string): AgentConfig | undefined {
    return this.primaryAgents.get(agentId) || this.subAgents.get(agentId) || this.agents.get(agentId);
  }

  // List all available agents
  listAllAgents(): { primary: Map<string, AgentConfig>, sub: Map<string, AgentConfig> } {
    return {
      primary: this.primaryAgents,
      sub: this.subAgents
    };
  }

  // Get agents by phase
  getAgentsByPhase(phase: string): AgentConfig[] {
    if (!this.workflow?.phases?.[phase]) return [];
    
    const phaseConfig = this.workflow.phases[phase];
    return phaseConfig.steps.map((step: AgentStep) => {
      const agentId = step.agent.split('/').pop();
      return agentId ? this.getAgent(agentId) : null;
    }).filter(Boolean) as AgentConfig[];
  }
}

// Task Analysis Engine - Determines which agents to invoke based on user input
class TaskAnalyzer {
  private registry: AgentRegistry;

  constructor(registry: AgentRegistry) {
    this.registry = registry;
  }

  analyzeTask(userInput: string): {
    recommendedAgents: string[];
    phase: string | null;
    reasoning: string;
    orchestrationStrategy: 'single' | 'parallel' | 'sequential' | 'controller';
  } {
    const input = userInput.toLowerCase();
    
    // Check for WhatsApp/Communication tasks first (high priority)
    if (input.includes('whatsapp') || input.includes('messaging') || input.includes('message') || input.includes('template')) {
      return {
        recommendedAgents: ['whatsapp-api-specialist', 'wa-template-manager'],
        phase: 'phase4',
        reasoning: 'WhatsApp integration and messaging work detected',
        orchestrationStrategy: 'parallel'
      };
    }

    // Check for engineering tasks early (before design tasks)
    if (this.isEngineeringTask(input)) {
      if (input.includes('frontend') || input.includes('react') || input.includes('nextjs') || (input.includes('dashboard') && (input.includes('develop') || input.includes('implement') || input.includes('build')))) {
        return {
          recommendedAgents: ['nextjs-dashboard-developer', 'frontend-dev'],
          phase: 'phase3',
          reasoning: 'Frontend development work detected',
          orchestrationStrategy: 'parallel'
        };
      }
      if (input.includes('backend') || input.includes('api') || input.includes('server')) {
        return {
          recommendedAgents: ['backend-dev'],
          phase: 'phase4',
          reasoning: 'Backend development work detected',
          orchestrationStrategy: 'single'
        };
      }
      if (input.includes('test') || input.includes('testing')) {
        return {
          recommendedAgents: ['test-runner'],
          phase: 'phase4',
          reasoning: 'Testing tasks detected',
          orchestrationStrategy: 'single'
        };
      }
    }

    // Check for combined design + compliance tasks
    if (this.isDesignTask(input) && (input.includes('compliance') || input.includes('sebi'))) {
      if (input.includes('dashboard') || input.includes('ui') || input.includes('interface')) {
        return {
          recommendedAgents: ['fintech-ui-designer', 'compliance-ux-researcher', 'sebi-compliance-auditor'],
          phase: 'phase2',
          reasoning: 'Design task with compliance requirements detected',
          orchestrationStrategy: 'parallel'
        };
      }
      return {
        recommendedAgents: ['compliance-ux-researcher', 'sebi-compliance-auditor'],
        phase: 'phase1',
        reasoning: 'UX design with compliance requirements detected',
        orchestrationStrategy: 'parallel'
      };
    }
    
    // Pure design tasks
    if (this.isDesignTask(input)) {
      if (input.includes('dashboard') || input.includes('interface') || input.includes('ui')) {
        return {
          recommendedAgents: ['fintech-ui-designer', 'ui-designer'],
          phase: 'phase2',
          reasoning: 'UI design and dashboard interface work detected',
          orchestrationStrategy: 'parallel'
        };
      }
      if (input.includes('ux') || input.includes('user') || input.includes('flow')) {
        return {
          recommendedAgents: ['compliance-ux-researcher', 'ux-researcher'],
          phase: 'phase1',
          reasoning: 'UX research and user flow design detected',
          orchestrationStrategy: 'parallel'
        };
      }
      if (input.includes('component') || input.includes('design system')) {
        return {
          recommendedAgents: ['fintech-ui-designer', 'ui-designer'],
          phase: 'phase2', 
          reasoning: 'UI component and design system work detected',
          orchestrationStrategy: 'parallel'
        };
      }
      if (input.includes('animation') || input.includes('interaction') || input.includes('micro')) {
        return {
          recommendedAgents: ['whimsy-injector'],
          phase: 'phase2',
          reasoning: 'Micro-interactions and animation work detected',
          orchestrationStrategy: 'single'
        };
      }
      // General design task
      return {
        recommendedAgents: ['fintech-ui-designer', 'compliance-ux-researcher'],
        phase: 'phase2',
        reasoning: 'General design work detected',
        orchestrationStrategy: 'parallel'
      };
    }


    // Pure compliance tasks (only if no design detected)
    if (this.isAIComplianceTask(input) && !this.isDesignTask(input)) {
      return {
        recommendedAgents: ['ai-compliance-engine-dev', 'sebi-compliance-auditor', 'compliance-guard'],
        phase: 'phase4',
        reasoning: 'AI compliance and regulatory work detected',
        orchestrationStrategy: 'parallel'
      };
    }

    // WhatsApp/Communication tasks
    if (input.includes('whatsapp') || input.includes('message') || input.includes('template')) {
      return {
        recommendedAgents: ['whatsapp-api-specialist', 'wa-template-manager'],
        phase: 'phase4',
        reasoning: 'WhatsApp integration work detected',
        orchestrationStrategy: 'parallel'
      };
    }

    // Analytics tasks
    if (input.includes('analytics') || input.includes('insights') || input.includes('data')) {
      return {
        recommendedAgents: ['analytics-intelligence-dev', 'analytics-intelligence'],
        phase: 'phase4',
        reasoning: 'Analytics and data intelligence work detected',
        orchestrationStrategy: 'single'
      };
    }

    // Complex multi-phase tasks - Use controller
    if (this.isComplexTask(input)) {
      return {
        recommendedAgents: ['controller'],
        phase: null,
        reasoning: 'Complex multi-phase task requiring orchestration',
        orchestrationStrategy: 'controller'
      };
    }

    // Default: Let controller decide
    return {
      recommendedAgents: ['controller'],
      phase: null,
      reasoning: 'Task analysis inconclusive, delegating to controller for orchestration',
      orchestrationStrategy: 'controller'
    };
  }

  private isDesignTask(input: string): boolean {
    const designKeywords = ['design', 'ui', 'ux', 'interface', 'component', 'layout', 'wireframe', 'prototype', 'mockup', 'visual', 'aesthetic', 'brand'];
    return designKeywords.some(keyword => input.includes(keyword));
  }

  private isEngineeringTask(input: string): boolean {
    const engineeringKeywords = ['code', 'develop', 'build', 'implement', 'frontend', 'backend', 'api', 'database', 'server', 'deploy', 'test'];
    return engineeringKeywords.some(keyword => input.includes(keyword));
  }

  private isAIComplianceTask(input: string): boolean {
    const aiComplianceKeywords = ['ai', 'compliance', 'sebi', 'regulation', 'audit', 'policy', 'validation', 'risk'];
    return aiComplianceKeywords.some(keyword => input.includes(keyword));
  }

  private isComplexTask(input: string): boolean {
    const complexKeywords = ['platform', 'system', 'architecture', 'end-to-end', 'full', 'complete', 'entire', 'comprehensive'];
    return complexKeywords.some(keyword => input.includes(keyword));
  }
}

// Agent State Management
interface AgentState {
  agentId: string;
  status: 'idle' | 'running' | 'waiting' | 'completed' | 'failed';
  currentTask?: string;
  dependencies: string[];
  outputs: string[];
  startTime?: Date;
  endTime?: Date;
  errorCount: number;
}

// Execution Context for Agent Coordination
interface ExecutionContext {
  sessionId: string;
  phase: string;
  availableFiles: Set<string>;
  runningAgents: Map<string, AgentState>;
  completedOutputs: Set<string>;
  blockedAgents: Map<string, string[]>; // agentId -> required files
}

// Agent Orchestrator - Main orchestration engine
class AgentOrchestrator {
  private registry: AgentRegistry;
  private analyzer: TaskAnalyzer;
  private executionContext: ExecutionContext;
  private dependencyGraph: Map<string, string[]>;

  constructor() {
    this.registry = new AgentRegistry();
    this.analyzer = new TaskAnalyzer(this.registry);
    this.executionContext = this.initializeContext();
    this.dependencyGraph = this.buildDependencyGraph();
  }

  private initializeContext(): ExecutionContext {
    return {
      sessionId: `session_${Date.now()}`,
      phase: 'phase1',
      availableFiles: new Set(),
      runningAgents: new Map(),
      completedOutputs: new Set(),
      blockedAgents: new Map()
    };
  }

  private buildDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Phase 1 → Phase 2 dependencies
    graph.set('design/fintech-ui-designer', [
      'context/phase1/ux-flows/advisor-onboarding-journey.md',
      'context/phase1/ux-flows/content-composer-workflow.md',
      'context/phase1/compliance-patterns.md'
    ]);
    
    // Phase 2 → Phase 3 dependencies  
    graph.set('eng/nextjs-dashboard-developer', [
      'context/phase2/design-system/tokens.js',
      'context/phase2/design-system/components.md',
      'context/phase2/financial-components/advisor-dashboard.md'
    ]);
    
    // Phase 4 wave dependencies
    graph.set('eng/ai-compliance-engine-dev', ['context/phase4/backend/build-plan.md']);
    graph.set('eng/whatsapp-api-specialist', ['context/phase4/backend/build-plan.md']);
    graph.set('domain/sebi-compliance-auditor', ['context/phase4/compliance-engine/three-stage-validator.js']);
    
    return graph;
  }

  // Agent State Management Methods
  updateAgentState(agentId: string, status: AgentState['status'], task?: string): void {
    const currentState = this.executionContext.runningAgents.get(agentId) || {
      agentId,
      status: 'idle',
      dependencies: this.dependencyGraph.get(agentId) || [],
      outputs: [],
      errorCount: 0
    };
    
    currentState.status = status;
    if (task) currentState.currentTask = task;
    if (status === 'running') currentState.startTime = new Date();
    if (status === 'completed' || status === 'failed') currentState.endTime = new Date();
    
    this.executionContext.runningAgents.set(agentId, currentState);
    
    // Log state changes for debugging
    console.log(`🔄 Agent ${agentId} -> ${status}${task ? ` (${task})` : ''}`);
  }
  
  // Check if agent can start (all dependencies met)
  canAgentStart(agentId: string): boolean {
    const dependencies = this.dependencyGraph.get(agentId) || [];
    return dependencies.every(file => this.executionContext.availableFiles.has(file));
  }
  
  // Mark file as available and check if any agents can be unblocked
  notifyFileAvailable(filePath: string): string[] {
    this.executionContext.availableFiles.add(filePath);
    console.log(`📄 File available: ${filePath}`);
    
    const unblockedAgents: string[] = [];
    
    // Check which blocked agents can now start
    for (const [agentId, requiredFiles] of this.executionContext.blockedAgents) {
      if (requiredFiles.includes(filePath) && this.canAgentStart(agentId)) {
        unblockedAgents.push(agentId);
        this.executionContext.blockedAgents.delete(agentId);
        this.updateAgentState(agentId, 'idle'); // Ready to start
      }
    }
    
    return unblockedAgents;
  }
  
  // Get agents ready to execute in current phase
  getReadyAgents(phase: string): string[] {
    const phaseAgents = this.getAgentsByPhase(phase).map(agent => {
      // Extract agent ID from potential path
      return agent.path ? agent.path.split('/').pop()?.replace('.md', '') || '' : '';
    }).filter(Boolean);
    
    return phaseAgents.filter(agentId => {
      const state = this.executionContext.runningAgents.get(agentId);
      return (!state || state.status === 'idle') && this.canAgentStart(agentId);
    });
  }
  
  // Execute agents with proper dependency management
  async executeWithDependencies(phase: string): Promise<void> {
    console.log(`🎯 Starting phase ${phase} with dependency management`);
    
    const readyAgents = this.getReadyAgents(phase);
    console.log(`✅ Ready to start: ${readyAgents.join(', ')}`);
    
    // Start all ready agents in parallel
    const promises = readyAgents.map(agentId => this.executeAgentWithMonitoring(agentId));
    
    // Wait for completion and handle new dependencies
    await Promise.allSettled(promises);
    
    // Check if any agents were unblocked
    const newlyReady = this.getReadyAgents(phase);
    if (newlyReady.length > 0) {
      console.log(`🔓 New agents ready: ${newlyReady.join(', ')}`);
      await this.executeWithDependencies(phase); // Recursive execution
    }
  }
  
  // Execute single agent with monitoring
  private async executeAgentWithMonitoring(agentId: string): Promise<void> {
    try {
      this.updateAgentState(agentId, 'running');
      
      // Simulate agent execution (replace with actual Claude Code integration)
      await this.simulateAgentExecution(agentId);
      
      this.updateAgentState(agentId, 'completed');
      
      // Mark expected outputs as available
      const outputs = this.getExpectedOutputs(agentId);
      outputs.forEach(output => {
        this.notifyFileAvailable(output);
      });
      
    } catch (error) {
      this.updateAgentState(agentId, 'failed');
      console.error(`❌ Agent ${agentId} failed:`, error);
      
      // Increment error count and potentially retry
      const state = this.executionContext.runningAgents.get(agentId)!;
      state.errorCount++;
      
      if (state.errorCount < 3) {
        console.log(`🔄 Retrying agent ${agentId} (attempt ${state.errorCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * state.errorCount)); // Backoff
        await this.executeAgentWithMonitoring(agentId);
      }
    }
  }
  
  // Get expected outputs for an agent (from workflow definition)
  private getExpectedOutputs(agentId: string): string[] {
    // This would be loaded from workflow/chain.yaml in production
    const outputMap: Record<string, string[]> = {
      'compliance-ux-researcher': [
        'context/phase1/ux-flows/advisor-onboarding-journey.md',
        'context/phase1/ux-flows/content-composer-workflow.md',
        'context/phase1/compliance-patterns.md'
      ],
      'fintech-ui-designer': [
        'context/phase2/design-system/tokens.js',
        'context/phase2/design-system/components.md',
        'context/phase2/financial-components/advisor-dashboard.md'
      ],
      'nextjs-dashboard-developer': [
        'context/phase3/dashboard-app/advisor-layout.tsx',
        'context/phase3/dashboard-app/content-composer.tsx'
      ]
    };
    
    return outputMap[agentId] || [];
  }
  
  // Execute agent with dynamic model selection
  private async executeAgentWithModelSelection(agentId: string, taskPrompt: string = ''): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    
    console.log(`🤖 Executing ${agent.name} with dynamic model selection...`);
    
    // Analyze the query complexity
    const queryAnalysis = globalModelSelector.analyzeQuery(taskPrompt, '', agentId);
    
    // Define selection criteria based on agent config
    const criteria: ModelSelectionCriteria = {
      agentId,
      taskType: this.getAgentTaskType(agentId),
      qualityPriority: agent.modelStrategy || 'balanced',
      fallbackRequired: agent.allowModelFallback !== false,
      maxBudget: agent.maxCostPerExecution,
      maxLatency: this.getMaxLatencyForAgent(agentId)
    };
    
    // Select optimal model
    const modelSelection = globalModelSelector.selectModel(criteria, queryAnalysis);
    
    console.log(`🧠 Model Selection for ${agent.name}:`);
    console.log(`   Primary: ${modelSelection.primaryModel}`);
    console.log(`   Reasoning: ${modelSelection.reasoning}`);
    console.log(`   Est. Cost: $${modelSelection.estimatedCost.toFixed(4)}`);
    console.log(`   Est. Latency: ${modelSelection.estimatedLatency}ms`);
    
    // Execute with selected model (with fallback)
    let success = false;
    let lastError: any;
    
    const modelsToTry = [modelSelection.primaryModel, ...modelSelection.fallbackModels];
    
    for (const modelId of modelsToTry) {
      try {
        await this.executeWithSpecificModel(agent, modelId, queryAnalysis.estimatedTokens);
        success = true;
        
        // Record successful usage
        globalModelSelector.recordUsage(modelId, queryAnalysis.estimatedTokens);
        globalModelSelector.updateAgentPreference(agentId, modelId, 'good');
        
        console.log(`✅ ${agent.name} completed successfully with ${modelId}`);
        break;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${modelId} failed for ${agent.name}, trying fallback...`);
        
        // Record poor performance
        globalModelSelector.updateAgentPreference(agentId, modelId, 'poor');
        
        // If this was a quota issue, don't try other models of same type
        if (error instanceof Error && error.message.includes('quota')) {
          continue;
        }
      }
    }
    
    if (!success) {
      throw new Error(`All models failed for ${agentId}: ${lastError?.message}`);
    }
  }
  
  private async executeWithSpecificModel(agent: AgentConfig, modelId: string, estimatedTokens: number): Promise<void> {
    // Check if model is available
    if (!globalModelSelector.isModelAvailable(modelId, estimatedTokens)) {
      throw new Error(`Model ${modelId} quota exceeded`);
    }
    
    // Simulate execution with specific model
    const modelConfig = globalModelSelector['models'].get(modelId);
    if (!modelConfig) throw new Error(`Model ${modelId} not found`);
    
    // Simulate processing time based on model latency
    const executionTime = modelConfig.avgLatency + Math.random() * 1000;
    
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Simulate token usage (would be actual API call in production)
    const actualTokens = Math.floor(estimatedTokens * (0.8 + Math.random() * 0.4)); // ±20% variance
    
    console.log(`   📊 Used ${actualTokens} tokens with ${modelConfig.name}`);
  }
  
  private getAgentTaskType(agentId: string): string {
    const taskTypeMap: Record<string, string> = {
      'compliance-ux-researcher': 'research_analysis',
      'fintech-ui-designer': 'creative_design', 
      'nextjs-dashboard-developer': 'code_generation',
      'ai-compliance-engine-dev': 'complex_engineering',
      'whatsapp-api-specialist': 'api_integration',
      'sebi-compliance-auditor': 'regulatory_analysis',
      'analytics-intelligence-dev': 'data_analysis',
      'fallback-system-architect': 'system_design'
    };
    
    return taskTypeMap[agentId] || 'general_task';
  }
  
  private getMaxLatencyForAgent(agentId: string): number {
    // Urgent agents have lower latency tolerance
    const urgentAgents = ['whatsapp-api-specialist', 'test-runner', 'whimsy-injector'];
    return urgentAgents.includes(agentId) ? 5000 : 15000; // 5s vs 15s (adjusted for Opus/Sonnet)
  }
  
  // Simulate agent execution (replace with actual implementation)
  private async simulateAgentExecution(agentId: string): Promise<void> {
    // Use the new model selection execution
    await this.executeAgentWithModelSelection(agentId, `Execute ${agentId} task`);
  }

  // Main entry point for task execution
  async executeTask(userInput: string): Promise<{
    selectedAgents: AgentConfig[];
    executionPlan: string;
    colorCodes: string[];
  }> {
    console.log('🎛️ Controller analyzing task...');
    
    const analysis = this.analyzer.analyzeTask(userInput);
    console.log(`📊 Analysis: ${analysis.reasoning}`);
    console.log(`🎯 Strategy: ${analysis.orchestrationStrategy}`);
    
    const selectedAgents = analysis.recommendedAgents
      .map(agentId => this.registry.getAgent(agentId))
      .filter(Boolean) as AgentConfig[];

    const colorCodes = selectedAgents.map(agent => agent.color);
    
    // Display agent selection with colors
    console.log('\n🤖 Selected Agents:');
    selectedAgents.forEach(agent => {
      const canStart = this.canAgentStart(agent.name.toLowerCase().replace(/\s+/g, '-'));
      const status = canStart ? '✅' : '⏸️';
      console.log(`${status} ${agent.emoji} ${agent.name} (${agent.color})`);
    });

    const executionPlan = this.createExecutionPlan(selectedAgents, analysis.orchestrationStrategy);
    
    return {
      selectedAgents,
      executionPlan,
      colorCodes
    };
  }

  // Phase-based execution with dependency management
  async executePhase(phase: string): Promise<void> {
    console.log(`🚀 Starting ${phase} with proper dependency coordination`);
    
    this.executionContext.phase = phase;
    await this.executeWithDependencies(phase);
    
    // Validate phase completion
    const isComplete = await this.validatePhaseCompletion(phase);
    if (!isComplete) {
      throw new Error(`Phase ${phase} validation failed`);
    }
    
    console.log(`✅ Phase ${phase} completed successfully`);
  }
  
  // Validate that all required outputs for a phase are available
  private async validatePhaseCompletion(phase: string): Promise<boolean> {
    const requiredFiles = this.getPhaseRequiredOutputs(phase);
    const missingFiles = requiredFiles.filter(file => !this.executionContext.availableFiles.has(file));
    
    if (missingFiles.length > 0) {
      console.error(`❌ Phase ${phase} missing files:`, missingFiles);
      return false;
    }
    
    return true;
  }
  
  // Get required outputs for phase completion
  private getPhaseRequiredOutputs(phase: string): string[] {
    const phaseOutputs: Record<string, string[]> = {
      'phase1': [
        'context/phase1/plan/sprint-plan.md',
        'context/phase1/ux-flows/content-composer-workflow.md',
        'context/phase1/compliance-patterns.md'
      ],
      'phase2': [
        'context/phase2/design-system/tokens.js',
        'context/phase2/design-system/components.md',
        'context/phase2/financial-components/advisor-dashboard.md'
      ],
      'phase3': [
        'context/phase3/dashboard-app/advisor-layout.tsx',
        'context/phase3/dashboard-app/content-composer.tsx'
      ],
      'phase4': [
        'context/phase4/compliance-engine/three-stage-validator.js',
        'context/phase4/whatsapp-integration/delivery-scheduler.js'
      ]
    };
    
    return phaseOutputs[phase] || [];
  }
  
  // Get current system status
  getSystemStatus(): { 
    phase: string;
    runningAgents: number;
    completedFiles: number;
    blockedAgents: number;
    errors: number;
  } {
    const runningCount = Array.from(this.executionContext.runningAgents.values())
      .filter(state => state.status === 'running').length;
      
    const blockedCount = this.executionContext.blockedAgents.size;
    
    const errorCount = Array.from(this.executionContext.runningAgents.values())
      .reduce((sum, state) => sum + state.errorCount, 0);
    
    return {
      phase: this.executionContext.phase,
      runningAgents: runningCount,
      completedFiles: this.executionContext.availableFiles.size,
      blockedAgents: blockedCount,
      errors: errorCount
    };
  }

  private createExecutionPlan(agents: AgentConfig[], strategy: string): string {
    let plan = `\n📋 Execution Plan (${strategy.toUpperCase()}):\n`;
    
    switch (strategy) {
      case 'single':
        plan += `→ Execute ${agents[0]?.name} individually\n`;
        break;
      case 'parallel':
        plan += `→ Execute ${agents.map(a => a.name).join(' + ')} in parallel\n`;
        break;
      case 'sequential':
        plan += `→ Execute agents sequentially:\n`;
        agents.forEach((agent, i) => {
          plan += `  ${i + 1}. ${agent.name}\n`;
        });
        break;
      case 'controller':
        plan += `→ Controller will orchestrate optimal agent selection and execution\n`;
        break;
    }
    
    return plan;
  }

  // CLI Slash Commands
  listAgents(): void {
    const { primary, sub } = this.registry.listAllAgents();
    
    console.log('\n🎛️ PROJECT ONE AGENT ECOSYSTEM\n');
    
    console.log('📦 PRIMARY AGENTS (8):');
    primary.forEach((agent, id) => {
      console.log(`  /${id} - ${agent.emoji} ${agent.name} (${agent.color})`);
    });
    
    console.log('\n🔧 SUB-AGENTS (17):');
    sub.forEach((agent, id) => {
      console.log(`  /${id} - ${agent.emoji} ${agent.name} (${agent.color})`);
    });
    
    console.log('\n💡 Usage: /agent-name or let controller auto-select based on your task');
  }

  // Execute specific agent by slash command with dependency checking
  async executeAgent(agentId: string, context?: string): Promise<void> {
    const agent = this.registry.getAgent(agentId);
    
    if (!agent) {
      console.log(`❌ Agent '${agentId}' not found. Use /list to see available agents.`);
      return;
    }

    // Check if agent can start (dependencies met)
    if (!this.canAgentStart(agentId)) {
      const dependencies = this.dependencyGraph.get(agentId) || [];
      const missingFiles = dependencies.filter(file => !this.executionContext.availableFiles.has(file));
      
      console.log(`⏸️ Agent '${agentId}' blocked. Missing dependencies:`);
      missingFiles.forEach(file => console.log(`  • ${file}`));
      
      // Add to blocked queue
      this.executionContext.blockedAgents.set(agentId, missingFiles);
      this.updateAgentState(agentId, 'waiting');
      return;
    }

    console.log(`\n${agent.emoji} Executing ${agent.name}...`);
    console.log(`🎨 Color: ${agent.color}`);
    console.log(`🧠 Max Tokens: ${agent.max_tokens_window?.toLocaleString() || 'Default'}`);
    
    if (context) {
      console.log(`📝 Context: ${context}`);
    }

    // Execute with monitoring
    await this.executeAgentWithMonitoring(agentId);
  }
}

// CLI Interface
export class ProjectOneAgentCLI {
  private orchestrator: AgentOrchestrator;

  constructor() {
    this.orchestrator = new AgentOrchestrator();
  }

  // Handle slash commands
  async handleCommand(input: string): Promise<void> {
    if (input.startsWith('/')) {
      const [command, ...args] = input.slice(1).split(' ');
      
      switch (command) {
        case 'list':
        case 'agents':
          this.orchestrator.listAgents();
          break;
          
        case 'help':
          this.showHelp();
          break;
          
        default:
          // Try to execute as agent ID
          await this.orchestrator.executeAgent(command, args.join(' '));
          break;
      }
    } else {
      // Regular task - let controller analyze and orchestrate
      await this.orchestrator.executeTask(input);
    }
  }

  private showHelp(): void {
    console.log(`
🎛️ PROJECT ONE AGENT CLI

SLASH COMMANDS:
  /list                    - Show all available agents
  /help                    - Show this help message
  /[agent-name]           - Execute specific agent directly
  
EXAMPLES:
  /fintech-ui-designer    - Execute FinTech UI Designer
  /controller             - Execute Controller orchestrator
  /compliance-ux-researcher - Execute UX research with compliance focus

NATURAL LANGUAGE:
  "Design a new advisor dashboard"     → Auto-selects UI/UX agents
  "Implement WhatsApp integration"     → Auto-selects WhatsApp specialist
  "Build complete financial platform" → Uses controller orchestration

AGENT COLORS:
  Each agent has a unique color code for visual identification
  Colors are displayed when agents are selected or executed

PHASES:
  Phase 1: UX Research & Compliance Planning
  Phase 2: FinTech UI Design & Brand System  
  Phase 3: Frontend Development & AI Integration
  Phase 4: Backend Services & AI-First Architecture

The controller automatically determines the best agents and execution strategy for your task.
    `);
  }
}

// Export for integration
export { AgentOrchestrator, AgentRegistry, TaskAnalyzer };
export default ProjectOneAgentCLI;