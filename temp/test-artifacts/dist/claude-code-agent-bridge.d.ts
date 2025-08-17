/**
 * Claude Code Agent Bridge
 * Integrates Project One's 25 agents with Claude Code's native tool system
 */
declare const projectOneAgents: {
    project_one_compliance_ux_researcher: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_fintech_ui_designer: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_nextjs_dashboard_developer: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_ai_compliance_engine_dev: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_whatsapp_api_specialist: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_analytics_intelligence_dev: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_sebi_compliance_auditor: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_fallback_system_architect: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_controller: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_whimsy_injector: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_rapid_prototyper: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
    project_one_test_runner: {
        name: string;
        description: string;
        parameters: {
            type: string;
            properties: {
                task: {
                    type: string;
                    description: string;
                };
                context: {
                    type: string;
                    description: string;
                };
            };
            required: string[];
        };
    };
};
declare function executeProjectOneAgent(agentName: string, parameters: any): Promise<string>;
export { projectOneAgents, executeProjectOneAgent };
export declare const claudeCodeToolDefinitions: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    } | {
        type: string;
        properties: {
            task: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    execute: (params: any) => Promise<string>;
}[];
