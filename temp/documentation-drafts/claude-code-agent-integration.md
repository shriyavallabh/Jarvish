# Claude Code Agent Integration Setup

This document explains how to integrate the Project One 25-agent system with Claude Code's CLI for automatic agent orchestration.

## Quick Setup

### 1. Install Agent Orchestrator
```bash
# Install the orchestrator
npm install --save-dev typescript ts-node js-yaml
```

### 2. Create CLI Integration Script
```typescript
// scripts/agent-cli.ts
import { ProjectOneAgentCLI } from '../agent-orchestrator';

const cli = new ProjectOneAgentCLI();

async function main() {
  const userInput = process.argv.slice(2).join(' ');
  
  if (!userInput) {
    console.log('Usage: npm run agent "your task" or npm run agent /agent-name');
    process.exit(1);
  }

  await cli.handleCommand(userInput);
}

main().catch(console.error);
```

### 3. Add NPM Scripts
```json
// package.json
{
  "scripts": {
    "agent": "ts-node scripts/agent-cli.ts",
    "agents:list": "ts-node scripts/agent-cli.ts /list",
    "agents:help": "ts-node scripts/agent-cli.ts /help"
  }
}
```

## Usage Examples

### Slash Commands (Direct Agent Access)
```bash
# List all available agents with color codes
npm run agent /list

# Execute specific agents directly
npm run agent /fintech-ui-designer
npm run agent /compliance-ux-researcher
npm run agent /nextjs-dashboard-developer
npm run agent /whatsapp-api-specialist
npm run agent /controller

# Get help
npm run agent /help
```

### Natural Language (Auto-Orchestration)
```bash
# Design tasks - Auto-selects design agents
npm run agent "Design a new advisor dashboard"
npm run agent "Create UI components for financial platform"
npm run agent "Research UX flows for compliance"

# Engineering tasks - Auto-selects engineering agents  
npm run agent "Build WhatsApp integration"
npm run agent "Implement backend APIs"
npm run agent "Create React components"

# Complex tasks - Uses controller orchestration
npm run agent "Build complete financial platform"
npm run agent "Implement full SEBI compliance system"
npm run agent "Create end-to-end advisor workflow"
```

## Agent Color System

Each agent has a unique hex color for visual identification:

### Primary Agents (8)
- **🔎 Compliance UX Researcher** - `#6366F1` (Purple)
- **🎨 FinTech UI Designer** - `#CEA200` (Gold)  
- **🧩 Next.js Dashboard Developer** - `#10B981` (Green)
- **🛠️ AI Compliance Engine Dev** - `#0C310C` (Dark Green)
- **📩 WhatsApp API Specialist** - `#0EA5E9` (Blue)
- **📈 Analytics Intelligence Dev** - `#3B82F6` (Blue)
- **🛡️ SEBI Compliance Auditor** - `#1E3A8A` (Dark Blue)
- **⏱️ Fallback System Architect** - `#F59E0B` (Amber)

### Sub-Agents (17)
- **🎛️ Controller** - `#0B1F33` (Navy)
- **🔎 UX Researcher** - `#6366F1` (Purple)
- **🎨 UI Designer** - `#CEA200` (Gold)
- **✨ Whimsy Injector** - `#D946EF` (Magenta)
- **⚡ Rapid Prototyper** - `#06B6D4` (Cyan)
- **🧩 Frontend Developer** - `#10B981` (Green)
- **🛠️ Backend Developer** - `#0C310C` (Dark Green)
- **🧪 Test Runner** - `#D92D20` (Red)
- **🚀 Performance Benchmarker** - `#F79009` (Orange)
- **🗃️ Data Modeler** - `#475569` (Gray)
- **🛡️ Compliance Guard** - `#1E3A8A` (Dark Blue)
- **📩 WhatsApp Template Manager** - `#0EA5E9` (Blue)
- **🖼️ Render Pipeline Architect** - `#8B5CF6` (Purple)
- **⏱️ Scheduler Orchestrator** - `#F59E0B` (Amber)
- **📈 Analytics Intelligence** - `#3B82F6` (Blue)
- **🔐 Security & DPO Advisor** - `#164E63` (Dark Teal)
- **📟 DevOps & Observability** - `#6B7280` (Gray)

## Automatic Agent Selection Logic

The system analyzes user input and automatically selects appropriate agents:

### Design Keywords → Design Agents
- "design", "ui", "ux", "interface" → UI/UX agents
- "component", "layout", "wireframe" → UI Designer
- "animation", "interaction" → Whimsy Injector

### Engineering Keywords → Engineering Agents
- "code", "develop", "build" → Frontend/Backend developers
- "react", "nextjs", "dashboard" → Next.js Developer
- "api", "server", "backend" → Backend Developer
- "test", "testing" → Test Runner

### Domain Keywords → Domain Agents
- "compliance", "sebi", "audit" → Compliance agents
- "whatsapp", "message", "template" → WhatsApp agents
- "analytics", "insights", "data" → Analytics agents

### Complex Tasks → Controller Orchestration
- "platform", "system", "complete" → Controller orchestrates multiple agents

## Integration with Claude Code

### Method 1: Direct Tool Integration
```typescript
// In your Claude Code tool configuration
export const projectOneAgentTool = {
  name: "project_one_agents",
  description: "Access Project One's 25 specialized agents",
  parameters: {
    agent_id: { type: "string", description: "Agent ID or task description" },
    context: { type: "string", description: "Additional context" }
  },
  execute: async (params) => {
    const cli = new ProjectOneAgentCLI();
    return await cli.handleCommand(params.agent_id);
  }
};
```

### Method 2: Subprocess Integration  
```typescript
// Execute via subprocess
import { spawn } from 'child_process';

function executeAgent(taskOrAgentId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'agent', taskOrAgentId], {
      cwd: '/path/to/project-one',
      stdio: 'pipe'
    });
    
    let output = '';
    proc.stdout.on('data', (data) => output += data.toString());
    proc.on('close', (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Agent execution failed: ${code}`));
    });
  });
}
```

### Method 3: MCP Server Integration
```typescript
// Create MCP server for agents
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ProjectOneAgentCLI } from './agent-orchestrator';

const server = new Server(
  {
    name: "project-one-agents",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const cli = new ProjectOneAgentCLI();
  const agents = cli.orchestrator.registry.listAllAgents();
  
  return {
    tools: [
      {
        name: "execute_agent",
        description: "Execute Project One specialized agents",
        inputSchema: {
          type: "object",
          properties: {
            agent_id: { type: "string" },
            task: { type: "string" }
          }
        }
      }
    ]
  };
});
```

## Phase-Based Workflow

The system supports 4-phase development workflow:

1. **Phase 1**: UX Research & Compliance Planning
2. **Phase 2**: FinTech UI Design & Brand System  
3. **Phase 3**: Frontend Development & AI Integration
4. **Phase 4**: Backend Services & AI-First Architecture

Each phase has specific agents, dependencies, and quality gates defined in `workflow/chain.yaml`.

## Error Prevention

To prevent the "missing agent access" issue from recurring:

### 1. Always Check Agent Registry
```typescript
// Before creating new agents, check existing registry
const existingAgents = orchestrator.listAgents();
```

### 2. Use Controller for Complex Tasks
```typescript
// For multi-agent coordination, always use controller
await orchestrator.executeTask("complex multi-phase task");
```

### 3. Validate Agent Specifications
```typescript
// Ensure agent specs exist before execution
const agent = registry.getAgent(agentId);
if (!agent) throw new Error(`Agent ${agentId} not found`);
```

### 4. Integration Testing
```bash
# Test agent integration regularly
npm run test:agents
npm run agent /list  # Verify all agents accessible
```

## Monitoring and Debugging

### Agent Execution Logs
```typescript
// Enable detailed logging
process.env.AGENT_LOG_LEVEL = 'debug';
```

### Color Code Validation
```typescript
// Verify color codes are displayed
console.log(`Agent: ${agent.emoji} ${agent.name} (${agent.color})`);
```

### Performance Monitoring  
```typescript
// Track token usage per agent
const tokenUsage = agent.max_tokens_window;
console.log(`Token budget: ${tokenUsage.toLocaleString()}`);
```

This integration ensures that all 25 specialized agents are accessible, properly orchestrated, and proactively invoked based on task requirements.