#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const agent_orchestrator_1 = require("../agent-orchestrator");
async function main() {
    const userInput = process.argv.slice(2).join(' ');
    if (!userInput) {
        console.log(`
🎛️ PROJECT ONE AGENT CLI

Usage Examples:
  npm run agent "Design advisor dashboard"     # Natural language
  npm run agent /list                         # Show all agents
  npm run agent /fintech-ui-designer         # Execute specific agent
  npm run agent /controller                  # Use orchestrator
  npm run agent /help                        # Show help

Quick Commands:
  npm run agents:list                        # List all agents  
  npm run agents:help                        # Show help
`);
        process.exit(1);
    }
    try {
        const cli = new agent_orchestrator_1.ProjectOneAgentCLI();
        await cli.handleCommand(userInput);
    }
    catch (error) {
        console.error('❌ Agent execution failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    main().catch(console.error);
}
