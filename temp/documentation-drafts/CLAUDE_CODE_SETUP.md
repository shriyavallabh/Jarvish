# Claude Code Integration Setup

This guide will make all 25 Project One agents appear in Claude Code's dropdown menu.

## 🚀 Quick Setup (2 Steps)

### Step 1: Copy MCP Configuration

Copy the configuration to Claude Code's settings directory:

**On macOS:**
```bash
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**If the directory doesn't exist, create it first:**
```bash
mkdir -p ~/Library/Application\ Support/Claude/
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 2: Restart Claude Code

1. **Quit Claude Code completely** (Cmd+Q)
2. **Reopen Claude Code**
3. **Check the dropdown** - you should now see all Project One agents!

## ✅ Verification

After restart, you should see these agents in the Claude Code dropdown:

### Primary Agents (8):
- 🔎 **project_one_compliance_ux_researcher** - SEBI compliance + advisor UX workflows  
- 🎨 **project_one_fintech_ui_designer** - Financial component design systems
- 🧩 **project_one_nextjs_dashboard_developer** - React components for advisors
- 🛠️ **project_one_ai_compliance_engine_dev** - Three-stage AI validation
- 📩 **project_one_whatsapp_api_specialist** - Business Cloud API integration  
- 📈 **project_one_analytics_intelligence_dev** - ML-powered insights
- 🛡️ **project_one_sebi_compliance_auditor** - Audit framework & reporting
- ⏱️ **project_one_fallback_system_architect** - Content curation & continuity

### Key Sub-Agents (4):
- 🎛️ **project_one_controller** - Multi-agent orchestrator for complex tasks
- ✨ **project_one_whimsy_injector** - Professional micro-interactions
- ⚡ **project_one_rapid_prototyper** - Fast UI spikes & proof-of-concepts  
- 🧪 **project_one_test_runner** - Automated testing & quality assurance

## 🎯 Usage

### Manual Selection (Dropdown):
1. **Type "/" in Claude Code**
2. **See all Project One agents in dropdown**
3. **Select the agent you want**
4. **Provide task and context**

### Natural Language (Automatic):
Just describe your task and Claude will auto-select the best agents:
- "Design advisor dashboard" → Auto-selects UI/UX agents
- "Build WhatsApp integration" → Auto-selects WhatsApp specialist  
- "Create compliance system" → Auto-selects compliance agents

## 🔧 How It Works

The setup creates an **MCP (Model Context Protocol) server** that:

1. **Exposes all 25 agents** as native Claude Code tools
2. **Shows proper descriptions** with emojis and color codes
3. **Handles execution** by bridging to your npm-based system
4. **Provides both manual and automatic** agent selection

## 🐛 Troubleshooting

### Agents Don't Appear in Dropdown:

1. **Check file location:**
   ```bash
   ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. **Verify configuration:**
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

3. **Check MCP server path:**
   ```bash
   ls -la /Users/shriyavallabh/Desktop/Jarvish/project-one/dist/mcp-server.js
   ```

4. **Restart Claude Code completely** (Cmd+Q then reopen)

### MCP Server Errors:

1. **Rebuild the project:**
   ```bash
   cd /Users/shriyavallabh/Desktop/Jarvish/project-one
   npm run build
   ```

2. **Test MCP server manually:**
   ```bash
   node dist/mcp-server.js
   ```

### Alternative: Direct Tool Import

If MCP doesn't work, you can use the direct npm commands:

```bash
npm run agents:list           # See all agents
npm run agent /fintech-ui-designer  # Execute specific agent
npm run agent "Design dashboard"     # Natural language
```

## 🎉 Success Indicators

When working correctly, you should see:

✅ **Dropdown shows Project One agents** with proper emojis and descriptions  
✅ **Agent selection works** for manual execution  
✅ **Color codes display** when agents execute  
✅ **Natural language processing** still works via controller  
✅ **Both systems work** - dropdown selection AND automatic orchestration

## 📍 File Locations

- **MCP Configuration**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **MCP Server**: `/Users/shriyavallabh/Desktop/Jarvish/project-one/dist/mcp-server.js`
- **Agent Bridge**: `/Users/shriyavallabh/Desktop/Jarvish/project-one/claude-code-agent-bridge.ts`
- **NPM Scripts**: Available in `/Users/shriyavallabh/Desktop/Jarvish/project-one/package.json`

This gives you **both manual dropdown selection AND automatic agent orchestration** - exactly what you wanted!