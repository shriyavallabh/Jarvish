/**
 * Agent Synchronization Manager
 * Handles message queuing, event coordination, and real-time status updates
 */

import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Event Types for Agent Coordination
interface AgentEvent {
  type: 'agent_started' | 'agent_completed' | 'agent_failed' | 'file_created' | 'dependency_met' | 'phase_complete';
  agentId: string;
  timestamp: Date;
  data: any;
  sessionId: string;
}

interface MessageQueueItem {
  id: string;
  targetAgent: string;
  message: any;
  priority: 'high' | 'normal' | 'low';
  createdAt: Date;
  retryCount: number;
  maxRetries: number;
}

// Agent Synchronization Manager
export class AgentSyncManager extends EventEmitter {
  private messageQueue: Map<string, MessageQueueItem[]> = new Map();
  private fileWatchers: Map<string, string[]> = new Map(); // file -> [agentIds]
  private agentSessions: Map<string, any> = new Map();
  private eventLog: AgentEvent[] = [];
  private syncStateFile: string;

  constructor(syncStateFile: string = 'context/.agent-sync-state.json') {
    super();
    this.syncStateFile = syncStateFile;
    this.ensureDirectoryExists(dirname(syncStateFile));
    this.loadSyncState();
    this.setupEventHandlers();
  }

  private ensureDirectoryExists(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  private loadSyncState(): void {
    try {
      if (existsSync(this.syncStateFile)) {
        const state = JSON.parse(readFileSync(this.syncStateFile, 'utf8'));
        this.fileWatchers = new Map(state.fileWatchers || []);
        this.agentSessions = new Map(state.agentSessions || []);
        console.log('🔄 Loaded sync state from disk');
      }
    } catch (error) {
      console.warn('⚠️ Failed to load sync state:', error);
    }
  }

  private saveSyncState(): void {
    try {
      const state = {
        fileWatchers: Array.from(this.fileWatchers.entries()),
        agentSessions: Array.from(this.agentSessions.entries()),
        lastSaved: new Date().toISOString()
      };
      writeFileSync(this.syncStateFile, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('❌ Failed to save sync state:', error);
    }
  }

  private setupEventHandlers(): void {
    // File creation notifications
    this.on('file_created', (event: AgentEvent) => {
      this.handleFileCreated(event.data.filePath, event.agentId);
    });

    // Agent completion notifications
    this.on('agent_completed', (event: AgentEvent) => {
      this.handleAgentCompleted(event.agentId, event.data.outputs);
    });

    // Dependency resolution
    this.on('dependency_met', (event: AgentEvent) => {
      this.handleDependencyMet(event.data.filePath);
    });

    // Auto-save state periodically
    setInterval(() => this.saveSyncState(), 30000); // Every 30 seconds
  }

  // Register file watchers for agent dependencies
  registerFileDependency(filePath: string, agentId: string): void {
    if (!this.fileWatchers.has(filePath)) {
      this.fileWatchers.set(filePath, []);
    }
    
    const watchers = this.fileWatchers.get(filePath)!;
    if (!watchers.includes(agentId)) {
      watchers.push(agentId);
      console.log(`👀 Agent ${agentId} watching for ${filePath}`);
    }
  }

  // Notify when file is created/updated
  notifyFileCreated(filePath: string, creatorAgent: string): string[] {
    const event: AgentEvent = {
      type: 'file_created',
      agentId: creatorAgent,
      timestamp: new Date(),
      data: { filePath },
      sessionId: this.getCurrentSessionId()
    };

    this.emit('file_created', event);
    this.eventLog.push(event);

    return this.handleFileCreated(filePath, creatorAgent);
  }

  private handleFileCreated(filePath: string, creatorAgent: string): string[] {
    const waitingAgents = this.fileWatchers.get(filePath) || [];
    const notifiedAgents: string[] = [];

    console.log(`📄 File created: ${filePath} by ${creatorAgent}`);
    
    waitingAgents.forEach(agentId => {
      if (agentId !== creatorAgent) {
        this.notifyAgent(agentId, {
          type: 'dependency_ready',
          filePath,
          createdBy: creatorAgent
        });
        notifiedAgents.push(agentId);
      }
    });

    // Remove watchers for this file (dependency met)
    this.fileWatchers.delete(filePath);

    return notifiedAgents;
  }

  // Send message to specific agent
  notifyAgent(targetAgent: string, message: any, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    if (!this.messageQueue.has(targetAgent)) {
      this.messageQueue.set(targetAgent, []);
    }

    const queueItem: MessageQueueItem = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      targetAgent,
      message,
      priority,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    const queue = this.messageQueue.get(targetAgent)!;
    
    // Insert based on priority
    if (priority === 'high') {
      queue.unshift(queueItem);
    } else {
      queue.push(queueItem);
    }

    console.log(`📨 Message queued for ${targetAgent}: ${message.type}`);
    
    // Emit event for real-time processing
    this.emit('message_queued', { targetAgent, message });
  }

  // Get pending messages for agent
  getMessagesForAgent(agentId: string): MessageQueueItem[] {
    const messages = this.messageQueue.get(agentId) || [];
    
    // Clear the queue after retrieval
    this.messageQueue.set(agentId, []);
    
    console.log(`📮 Retrieved ${messages.length} messages for ${agentId}`);
    
    return messages.sort((a, b) => {
      // Sort by priority then timestamp
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // Agent session management
  startAgentSession(agentId: string, metadata: any = {}): string {
    const sessionId = `${agentId}_${Date.now()}`;
    
    this.agentSessions.set(sessionId, {
      agentId,
      startTime: new Date(),
      status: 'running',
      metadata,
      outputs: []
    });

    const event: AgentEvent = {
      type: 'agent_started',
      agentId,
      timestamp: new Date(),
      data: { sessionId, metadata },
      sessionId
    };

    this.emit('agent_started', event);
    this.eventLog.push(event);

    console.log(`🚀 Started session ${sessionId} for ${agentId}`);
    return sessionId;
  }

  completeAgentSession(sessionId: string, outputs: string[] = []): void {
    const session = this.agentSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ Session ${sessionId} not found`);
      return;
    }

    session.endTime = new Date();
    session.status = 'completed';
    session.outputs = outputs;

    const event: AgentEvent = {
      type: 'agent_completed',
      agentId: session.agentId,
      timestamp: new Date(),
      data: { sessionId, outputs },
      sessionId
    };

    this.emit('agent_completed', event);
    this.eventLog.push(event);

    console.log(`✅ Completed session ${sessionId} for ${session.agentId}`);
    
    // Notify dependent agents
    outputs.forEach(filePath => {
      this.notifyFileCreated(filePath, session.agentId);
    });
  }

  failAgentSession(sessionId: string, error: string): void {
    const session = this.agentSessions.get(sessionId);
    if (!session) return;

    session.endTime = new Date();
    session.status = 'failed';
    session.error = error;

    const event: AgentEvent = {
      type: 'agent_failed',
      agentId: session.agentId,
      timestamp: new Date(),
      data: { sessionId, error },
      sessionId
    };

    this.emit('agent_failed', event);
    this.eventLog.push(event);

    console.error(`❌ Failed session ${sessionId} for ${session.agentId}: ${error}`);
  }

  private handleAgentCompleted(agentId: string, outputs: string[]): void {
    console.log(`🎯 Agent ${agentId} completed with outputs:`, outputs);
    
    // Process each output file
    outputs.forEach(filePath => {
      this.handleFileCreated(filePath, agentId);
    });
  }

  private handleDependencyMet(filePath: string): void {
    console.log(`🔗 Dependency met: ${filePath}`);
  }

  // Get current session ID (latest)
  private getCurrentSessionId(): string {
    const sessions = Array.from(this.agentSessions.entries());
    if (sessions.length === 0) return 'default_session';
    
    const latest = sessions.reduce((latest, [sessionId, session]) => {
      return session.startTime > latest.startTime ? session : latest;
    }, sessions[0][1]);

    return Array.from(this.agentSessions.entries())
      .find(([_, session]) => session === latest)?.[0] || 'default_session';
  }

  // Get sync status report
  getSyncStatus(): {
    activeAgents: number;
    pendingMessages: number;
    fileWatchers: number;
    recentEvents: number;
    completedSessions: number;
  } {
    const activeSessions = Array.from(this.agentSessions.values())
      .filter(session => session.status === 'running').length;

    const totalPendingMessages = Array.from(this.messageQueue.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    const recentEvents = this.eventLog.filter(
      event => Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
    ).length;

    const completedSessions = Array.from(this.agentSessions.values())
      .filter(session => session.status === 'completed').length;

    return {
      activeAgents: activeSessions,
      pendingMessages: totalPendingMessages,
      fileWatchers: this.fileWatchers.size,
      recentEvents,
      completedSessions
    };
  }

  // Get event history for debugging
  getEventHistory(agentId?: string, limit: number = 50): AgentEvent[] {
    let events = [...this.eventLog];
    
    if (agentId) {
      events = events.filter(event => event.agentId === agentId);
    }
    
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Clear old data
  cleanup(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    // Clean old events
    this.eventLog = this.eventLog.filter(event => event.timestamp > cutoff);
    
    // Clean old sessions
    for (const [sessionId, session] of this.agentSessions) {
      if (session.endTime && session.endTime < cutoff) {
        this.agentSessions.delete(sessionId);
      }
    }
    
    console.log(`🧹 Cleaned up data older than ${maxAgeHours} hours`);
    this.saveSyncState();
  }
}

// Global sync manager instance
export const globalSyncManager = new AgentSyncManager();