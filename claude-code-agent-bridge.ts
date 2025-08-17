/**
 * Claude Code Agent Bridge
 * Integrates Project One's 25 agents with Claude Code's native tool system
 */

import { ProjectOneAgentCLI } from './agent-orchestrator';

// Agent definitions for Claude Code integration
const projectOneAgents = {
  // Primary Agents (8)
  'project_one_compliance_ux_researcher': {
    name: 'project_one_compliance_ux_researcher',
    description: '🔎 Compliance UX Researcher (#6366F1) - SEBI compliance + advisor UX workflows',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'UX research task or compliance workflow to analyze'
        },
        context: {
          type: 'string', 
          description: 'Additional context or requirements'
        }
      },
      required: ['task']
    }
  },

  'project_one_fintech_ui_designer': {
    name: 'project_one_fintech_ui_designer', 
    description: '🎨 FinTech UI Designer (#CEA200) - Financial component design systems',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'UI design task or component system to create'
        },
        context: {
          type: 'string',
          description: 'Design requirements or constraints'
        }
      },
      required: ['task']
    }
  },

  'project_one_nextjs_dashboard_developer': {
    name: 'project_one_nextjs_dashboard_developer',
    description: '🧩 Next.js Dashboard Developer (#10B981) - React components for advisors', 
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Frontend development task or dashboard component to build'
        },
        context: {
          type: 'string',
          description: 'Technical requirements or specifications'
        }
      },
      required: ['task']
    }
  },

  'project_one_ai_compliance_engine_dev': {
    name: 'project_one_ai_compliance_engine_dev',
    description: '🛠️ AI Compliance Engine Developer (#0C310C) - Three-stage AI validation',
    parameters: {
      type: 'object', 
      properties: {
        task: {
          type: 'string',
          description: 'AI compliance task or validation system to implement'
        },
        context: {
          type: 'string',
          description: 'Compliance requirements or technical specs'
        }
      },
      required: ['task']
    }
  },

  'project_one_whatsapp_api_specialist': {
    name: 'project_one_whatsapp_api_specialist',
    description: '📩 WhatsApp API Specialist (#0EA5E9) - Business Cloud API integration',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string', 
          description: 'WhatsApp integration task or messaging feature to implement'
        },
        context: {
          type: 'string',
          description: 'API requirements or messaging specifications'
        }
      },
      required: ['task']
    }
  },

  'project_one_analytics_intelligence_dev': {
    name: 'project_one_analytics_intelligence_dev',
    description: '📈 Analytics Intelligence Developer (#3B82F6) - ML-powered insights',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Analytics task or intelligence system to develop'
        },
        context: {
          type: 'string',
          description: 'Data requirements or analytics specifications'
        }
      },
      required: ['task']
    }
  },

  'project_one_sebi_compliance_auditor': {
    name: 'project_one_sebi_compliance_auditor',
    description: '🛡️ SEBI Compliance Auditor (#1E3A8A) - Audit framework & reporting',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Compliance audit task or regulatory requirement to address'
        },
        context: {
          type: 'string',
          description: 'Regulatory context or audit specifications'
        }
      },
      required: ['task']
    }
  },

  'project_one_fallback_system_architect': {
    name: 'project_one_fallback_system_architect',
    description: '⏱️ Fallback System Architect (#F59E0B) - Content curation & continuity',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Fallback system task or content curation requirement'
        },
        context: {
          type: 'string',
          description: 'System requirements or content specifications'
        }
      },
      required: ['task']
    }
  },

  // Key Sub-Agents for Manual Selection
  'project_one_controller': {
    name: 'project_one_controller',
    description: '🎛️ Controller (#0B1F33) - Multi-agent orchestrator for complex tasks',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Complex task requiring multi-agent coordination'
        },
        context: {
          type: 'string',
          description: 'Project context or coordination requirements'
        }
      },
      required: ['task']
    }
  },

  'project_one_whimsy_injector': {
    name: 'project_one_whimsy_injector',
    description: '✨ Whimsy Injector (#D946EF) - Professional micro-interactions',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'UI enhancement task or micro-interaction to design'
        },
        context: {
          type: 'string',
          description: 'Design context or interaction requirements'
        }
      },
      required: ['task']
    }
  },

  'project_one_rapid_prototyper': {
    name: 'project_one_rapid_prototyper',
    description: '⚡ Rapid Prototyper (#06B6D4) - Fast UI spikes & proof-of-concepts',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Prototyping task or proof-of-concept to create'
        },
        context: {
          type: 'string',
          description: 'Prototype requirements or constraints'
        }
      },
      required: ['task']
    }
  },

  'project_one_test_runner': {
    name: 'project_one_test_runner',
    description: '🧪 Test Runner (#D92D20) - Automated testing & quality assurance',
    parameters: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Testing task or quality assurance requirement'
        },
        context: {
          type: 'string',
          description: 'Testing context or quality specifications'
        }
      },
      required: ['task']
    }
  }
};

// Execution function for Claude Code integration
async function executeProjectOneAgent(agentName: string, parameters: any): Promise<string> {
  try {
    console.log(`\n🎛️ Executing Project One Agent: ${agentName}`);
    console.log(`📝 Task: ${parameters.task}`);
    if (parameters.context) {
      console.log(`🔍 Context: ${parameters.context}`);
    }

    // Extract agent ID from tool name
    const agentId = agentName.replace('project_one_', '').replace(/_/g, '-');
    
    // Initialize CLI and execute agent
    const cli = new ProjectOneAgentCLI();
    
    // For manual selection, execute the specific agent
    await cli.handleCommand(`/${agentId}`);
    
    return `✅ ${agentName} executed successfully for task: ${parameters.task}`;
    
  } catch (error) {
    console.error(`❌ Agent execution failed:`, error);
    return `❌ Failed to execute ${agentName}: ${error}`;
  }
}

// Export for Claude Code integration
export { projectOneAgents, executeProjectOneAgent };

// Tool definitions for Claude Code MCP integration
export const claudeCodeToolDefinitions = Object.entries(projectOneAgents).map(([key, config]) => ({
  name: config.name,
  description: config.description,
  inputSchema: config.parameters,
  execute: async (params: any) => executeProjectOneAgent(config.name, params)
}));