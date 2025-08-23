#!/usr/bin/env node

/**
 * MCP Server for Project One Agents
 * Exposes all 25 agents to Claude Code as native tools
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { claudeCodeToolDefinitions, executeProjectOneAgent } from './claude-code-agent-bridge.js';

const server = new Server(
  {
    name: 'project-one-agents',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all available Project One agents
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: claudeCodeToolDefinitions
  };
});

// Execute Project One agents
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const result = await executeProjectOneAgent(name, args || {});
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Project One MCP Server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});