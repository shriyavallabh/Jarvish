/**
 * Project One Agent Orchestrator
 * Provides CLI slash command access to all 25 agents with automatic orchestration
 */
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
}
declare class AgentRegistry {
    private agents;
    private primaryAgents;
    private subAgents;
    private workflow;
    constructor();
    private loadRegistry;
    private loadWorkflow;
    private initializeAgents;
    getAgent(agentId: string): AgentConfig | undefined;
    listAllAgents(): {
        primary: Map<string, AgentConfig>;
        sub: Map<string, AgentConfig>;
    };
    getAgentsByPhase(phase: string): AgentConfig[];
}
declare class TaskAnalyzer {
    private registry;
    constructor(registry: AgentRegistry);
    analyzeTask(userInput: string): {
        recommendedAgents: string[];
        phase: string | null;
        reasoning: string;
        orchestrationStrategy: 'single' | 'parallel' | 'sequential' | 'controller';
    };
    private isDesignTask;
    private isEngineeringTask;
    private isAIComplianceTask;
    private isComplexTask;
}
declare class AgentOrchestrator {
    private registry;
    private analyzer;
    constructor();
    executeTask(userInput: string): Promise<{
        selectedAgents: AgentConfig[];
        executionPlan: string;
        colorCodes: string[];
    }>;
    private createExecutionPlan;
    listAgents(): void;
    executeAgent(agentId: string, context?: string): Promise<void>;
}
export declare class ProjectOneAgentCLI {
    private orchestrator;
    constructor();
    handleCommand(input: string): Promise<void>;
    private showHelp;
}
export { AgentOrchestrator, AgentRegistry, TaskAnalyzer };
export default ProjectOneAgentCLI;
