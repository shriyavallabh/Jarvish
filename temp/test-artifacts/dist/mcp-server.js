#!/usr/bin/env node
"use strict";
/**
 * MCP Server for Project One Agents
 * Exposes all 25 agents to Claude Code as native tools
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const claude_code_agent_bridge_js_1 = require("./claude-code-agent-bridge.js");
const server = new index_js_1.Server({
    name: 'project-one-agents',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// List all available Project One agents
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: claude_code_agent_bridge_js_1.claudeCodeToolDefinitions
    };
});
// Execute Project One agents
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        const result = await (0, claude_code_agent_bridge_js_1.executeProjectOneAgent)(name, args || {});
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    }
    catch (error) {
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
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Project One MCP Server running');
}
main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
});
