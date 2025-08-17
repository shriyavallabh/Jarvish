"use strict";
/**
 * Project One Agent Orchestrator
 * Provides CLI slash command access to all 25 agents with automatic orchestration
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskAnalyzer = exports.AgentRegistry = exports.AgentOrchestrator = exports.ProjectOneAgentCLI = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const yaml = __importStar(require("js-yaml"));
// Agent Registry - All 25 agents with their specifications
class AgentRegistry {
    constructor() {
        this.agents = new Map();
        this.primaryAgents = new Map();
        this.subAgents = new Map();
        this.loadRegistry();
        this.loadWorkflow();
        this.initializeAgents();
    }
    loadRegistry() {
        try {
            const registryPath = (0, path_1.join)(process.cwd(), 'workflow', 'registry.yaml');
            const registryContent = (0, fs_1.readFileSync)(registryPath, 'utf8');
            const registry = yaml.load(registryContent);
            // Load agents from registry
            for (const [agentId, config] of Object.entries(registry.agents)) {
                this.agents.set(agentId, config);
            }
        }
        catch (error) {
            console.error('Failed to load agent registry:', error);
        }
    }
    loadWorkflow() {
        try {
            const workflowPath = (0, path_1.join)(process.cwd(), 'workflow', 'chain.yaml');
            const workflowContent = (0, fs_1.readFileSync)(workflowPath, 'utf8');
            this.workflow = yaml.load(workflowContent);
        }
        catch (error) {
            console.error('Failed to load workflow chain:', error);
        }
    }
    initializeAgents() {
        // Primary Agents (8) - from project-one/agents/
        this.primaryAgents.set('compliance-ux-researcher', {
            name: 'Compliance UX Researcher',
            color: '#6366F1',
            emoji: '🔎',
            path: 'design/compliance-ux-researcher.md',
            max_tokens_window: 180000
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
    getAgent(agentId) {
        return this.primaryAgents.get(agentId) || this.subAgents.get(agentId) || this.agents.get(agentId);
    }
    // List all available agents
    listAllAgents() {
        return {
            primary: this.primaryAgents,
            sub: this.subAgents
        };
    }
    // Get agents by phase
    getAgentsByPhase(phase) {
        if (!this.workflow?.phases?.[phase])
            return [];
        const phaseConfig = this.workflow.phases[phase];
        return phaseConfig.steps.map((step) => {
            const agentId = step.agent.split('/').pop();
            return agentId ? this.getAgent(agentId) : null;
        }).filter(Boolean);
    }
}
exports.AgentRegistry = AgentRegistry;
// Task Analysis Engine - Determines which agents to invoke based on user input
class TaskAnalyzer {
    constructor(registry) {
        this.registry = registry;
    }
    analyzeTask(userInput) {
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
    isDesignTask(input) {
        const designKeywords = ['design', 'ui', 'ux', 'interface', 'component', 'layout', 'wireframe', 'prototype', 'mockup', 'visual', 'aesthetic', 'brand'];
        return designKeywords.some(keyword => input.includes(keyword));
    }
    isEngineeringTask(input) {
        const engineeringKeywords = ['code', 'develop', 'build', 'implement', 'frontend', 'backend', 'api', 'database', 'server', 'deploy', 'test'];
        return engineeringKeywords.some(keyword => input.includes(keyword));
    }
    isAIComplianceTask(input) {
        const aiComplianceKeywords = ['ai', 'compliance', 'sebi', 'regulation', 'audit', 'policy', 'validation', 'risk'];
        return aiComplianceKeywords.some(keyword => input.includes(keyword));
    }
    isComplexTask(input) {
        const complexKeywords = ['platform', 'system', 'architecture', 'end-to-end', 'full', 'complete', 'entire', 'comprehensive'];
        return complexKeywords.some(keyword => input.includes(keyword));
    }
}
exports.TaskAnalyzer = TaskAnalyzer;
// Agent Orchestrator - Main orchestration engine
class AgentOrchestrator {
    constructor() {
        this.registry = new AgentRegistry();
        this.analyzer = new TaskAnalyzer(this.registry);
    }
    // Main entry point for task execution
    async executeTask(userInput) {
        console.log('🎛️ Controller analyzing task...');
        const analysis = this.analyzer.analyzeTask(userInput);
        console.log(`📊 Analysis: ${analysis.reasoning}`);
        console.log(`🎯 Strategy: ${analysis.orchestrationStrategy}`);
        const selectedAgents = analysis.recommendedAgents
            .map(agentId => this.registry.getAgent(agentId))
            .filter(Boolean);
        const colorCodes = selectedAgents.map(agent => agent.color);
        // Display agent selection with colors
        console.log('\n🤖 Selected Agents:');
        selectedAgents.forEach(agent => {
            console.log(`${agent.emoji} ${agent.name} (${agent.color})`);
        });
        const executionPlan = this.createExecutionPlan(selectedAgents, analysis.orchestrationStrategy);
        return {
            selectedAgents,
            executionPlan,
            colorCodes
        };
    }
    createExecutionPlan(agents, strategy) {
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
    listAgents() {
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
    // Execute specific agent by slash command
    async executeAgent(agentId, context) {
        const agent = this.registry.getAgent(agentId);
        if (!agent) {
            console.log(`❌ Agent '${agentId}' not found. Use /list to see available agents.`);
            return;
        }
        console.log(`\n${agent.emoji} Executing ${agent.name}...`);
        console.log(`🎨 Color: ${agent.color}`);
        console.log(`🧠 Max Tokens: ${agent.max_tokens_window?.toLocaleString() || 'Default'}`);
        if (context) {
            console.log(`📝 Context: ${context}`);
        }
        // Here you would integrate with your actual agent execution system
        // For now, we'll simulate the execution
        console.log(`✅ ${agent.name} execution completed successfully!`);
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
// CLI Interface
class ProjectOneAgentCLI {
    constructor() {
        this.orchestrator = new AgentOrchestrator();
    }
    // Handle slash commands
    async handleCommand(input) {
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
        }
        else {
            // Regular task - let controller analyze and orchestrate
            await this.orchestrator.executeTask(input);
        }
    }
    showHelp() {
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
exports.ProjectOneAgentCLI = ProjectOneAgentCLI;
exports.default = ProjectOneAgentCLI;
