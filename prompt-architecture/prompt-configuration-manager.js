/**
 * Prompt Configuration Management System
 * 
 * Handles advisor-specific configurations, versioning,
 * and dynamic updates with rollback capabilities
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class PromptConfigurationManager extends EventEmitter {
  constructor(database, cache) {
    super();
    this.db = database;
    this.cache = cache;
    this.configHistory = new Map();
    this.activeConfigs = new Map();
    this.rollbackStack = new Map();
  }

  /**
   * Initialize configuration for new advisor
   */
  async initializeAdvisorConfig(advisorId, initialConfig) {
    const config = {
      id: this.generateConfigId(advisorId),
      advisorId,
      version: '1.0.0',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Core configuration sections
      profile: {
        businessName: initialConfig.businessName,
        advisorName: initialConfig.advisorName,
        sebiNumber: initialConfig.sebiNumber,
        experience: initialConfig.experience || '5+ years',
        specializations: initialConfig.specializations || [],
        certifications: initialConfig.certifications || []
      },

      // Branding configuration
      branding: {
        tone: initialConfig.tone || 'professional-friendly',
        voice: {
          attributes: initialConfig.voiceAttributes || ['trustworthy', 'knowledgeable'],
          personality: initialConfig.personality || 'educator',
          humor: initialConfig.humorLevel || 'minimal'
        },
        visual: {
          primaryColor: initialConfig.primaryColor,
          secondaryColor: initialConfig.secondaryColor,
          logoUrl: initialConfig.logoUrl,
          watermarkPosition: initialConfig.watermarkPosition || 'bottom-right'
        },
        language: {
          primary: initialConfig.primaryLanguage || 'english',
          secondary: initialConfig.secondaryLanguage || 'hindi',
          mixing: initialConfig.languageMixing || 'moderate' // none, minimal, moderate, heavy
        }
      },

      // Content preferences
      contentPreferences: {
        topics: {
          preferred: initialConfig.preferredTopics || [],
          avoided: initialConfig.avoidedTopics || [],
          expertise: initialConfig.expertiseAreas || []
        },
        formats: {
          preferred: initialConfig.preferredFormats || ['tips', 'analysis', 'education'],
          disabled: initialConfig.disabledFormats || []
        },
        length: {
          short: { min: 50, max: 150 },
          medium: { min: 150, max: 500 },
          long: { min: 500, max: 1500 }
        },
        frequency: {
          daily: initialConfig.dailyPostCount || 3,
          weekly: initialConfig.weeklyPostCount || 20,
          peakHours: initialConfig.peakHours || [9, 18, 21]
        }
      },

      // Platform-specific settings
      platforms: {
        whatsapp: {
          enabled: initialConfig.whatsappEnabled !== false,
          businessAccount: initialConfig.whatsappBusiness || false,
          broadcastLists: initialConfig.broadcastLists || [],
          autoResponder: initialConfig.autoResponder || false,
          formatting: {
            useEmojis: initialConfig.whatsappEmojis !== false,
            useBold: true,
            useItalic: false,
            lineBreaks: 'double'
          },
          templates: initialConfig.whatsappTemplates || {}
        },
        linkedin: {
          enabled: initialConfig.linkedinEnabled !== false,
          profileUrl: initialConfig.linkedinProfile,
          companyPage: initialConfig.linkedinCompany,
          publishArticles: initialConfig.linkedinArticles || false,
          hashtagStrategy: initialConfig.hashtagStrategy || 'moderate',
          connectionStrategy: initialConfig.connectionStrategy || 'quality',
          templates: initialConfig.linkedinTemplates || {}
        },
        instagram: {
          enabled: initialConfig.instagramEnabled || false,
          handle: initialConfig.instagramHandle,
          reelsEnabled: initialConfig.reelsEnabled || false,
          storiesEnabled: initialConfig.storiesEnabled || true,
          templates: initialConfig.instagramTemplates || {}
        }
      },

      // Compliance settings
      compliance: {
        strictMode: initialConfig.strictCompliance || true,
        disclaimerStyle: initialConfig.disclaimerStyle || 'standard',
        customDisclaimer: initialConfig.customDisclaimer,
        riskWarningLevel: initialConfig.riskWarningLevel || 'moderate',
        autoReject: {
          guaranteedReturns: true,
          unregisteredProducts: true,
          misleadingClaims: true,
          excessivePromises: true
        },
        additionalRules: initialConfig.complianceRules || []
      },

      // AI behavior settings
      aiBehavior: {
        creativity: initialConfig.creativityLevel || 0.5,
        formality: initialConfig.formalityLevel || 0.7,
        technicalDepth: initialConfig.technicalLevel || 0.6,
        analogyUsage: initialConfig.useAnalogies || true,
        storytelling: initialConfig.useStories || true,
        dataVisualization: initialConfig.preferVisuals || true,
        citeSources: initialConfig.citeSources || true
      },

      // Performance optimization
      optimization: {
        cacheStrategy: initialConfig.cacheStrategy || 'aggressive',
        preGenerate: initialConfig.preGenerate || true,
        batchSize: initialConfig.batchSize || 10,
        parallelGeneration: initialConfig.parallelGeneration || 3,
        qualityThreshold: initialConfig.qualityThreshold || 0.7
      },

      // Webhook and integrations
      integrations: {
        webhooks: initialConfig.webhooks || [],
        crm: initialConfig.crmIntegration,
        analytics: initialConfig.analyticsIntegration,
        calendar: initialConfig.calendarIntegration,
        email: initialConfig.emailIntegration
      },

      // Feature flags
      features: {
        autoScheduling: initialConfig.autoScheduling || true,
        contentCalendar: initialConfig.contentCalendar || true,
        abTesting: initialConfig.abTesting || false,
        multiVariant: initialConfig.multiVariant || false,
        autoTranslate: initialConfig.autoTranslate || false,
        voiceGeneration: initialConfig.voiceGeneration || false,
        videoGeneration: initialConfig.videoGeneration || false
      }
    };

    // Store in database
    await this.saveConfiguration(config);
    
    // Cache for quick access
    this.activeConfigs.set(advisorId, config);
    
    // Initialize history
    this.configHistory.set(advisorId, [config]);
    
    // Emit event
    this.emit('configInitialized', { advisorId, config });
    
    return config;
  }

  /**
   * Update advisor configuration with versioning
   */
  async updateConfiguration(advisorId, updates, reason = 'Manual update') {
    const currentConfig = await this.getConfiguration(advisorId);
    if (!currentConfig) {
      throw new Error(`No configuration found for advisor ${advisorId}`);
    }

    // Create new version
    const newVersion = this.incrementVersion(currentConfig.version);
    
    // Deep merge updates with current config
    const updatedConfig = {
      ...this.deepMerge(currentConfig, updates),
      version: newVersion,
      updatedAt: new Date(),
      updateReason: reason,
      previousVersion: currentConfig.version
    };

    // Validate configuration
    const validation = await this.validateConfiguration(updatedConfig);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    // Add to rollback stack
    this.addToRollbackStack(advisorId, currentConfig);
    
    // Save new configuration
    await this.saveConfiguration(updatedConfig);
    
    // Update cache
    this.activeConfigs.set(advisorId, updatedConfig);
    
    // Update history
    const history = this.configHistory.get(advisorId) || [];
    history.push(updatedConfig);
    this.configHistory.set(advisorId, history);
    
    // Emit update event
    this.emit('configUpdated', { 
      advisorId, 
      oldVersion: currentConfig.version,
      newVersion,
      changes: this.diffConfigs(currentConfig, updatedConfig)
    });
    
    return updatedConfig;
  }

  /**
   * Rollback to previous configuration version
   */
  async rollbackConfiguration(advisorId, targetVersion = null) {
    const rollbackStack = this.rollbackStack.get(advisorId) || [];
    
    if (rollbackStack.length === 0) {
      throw new Error('No previous configurations available for rollback');
    }

    let targetConfig;
    
    if (targetVersion) {
      // Find specific version
      const history = this.configHistory.get(advisorId) || [];
      targetConfig = history.find(c => c.version === targetVersion);
      
      if (!targetConfig) {
        throw new Error(`Version ${targetVersion} not found in history`);
      }
    } else {
      // Use last config from rollback stack
      targetConfig = rollbackStack.pop();
      this.rollbackStack.set(advisorId, rollbackStack);
    }

    // Create rollback version
    const rollbackVersion = `${targetConfig.version}-rollback-${Date.now()}`;
    targetConfig.version = rollbackVersion;
    targetConfig.updatedAt = new Date();
    targetConfig.updateReason = `Rollback to version ${targetConfig.version}`;

    // Save rollback configuration
    await this.saveConfiguration(targetConfig);
    
    // Update cache
    this.activeConfigs.set(advisorId, targetConfig);
    
    // Emit rollback event
    this.emit('configRolledBack', { 
      advisorId, 
      rolledBackTo: targetConfig.version 
    });
    
    return targetConfig;
  }

  /**
   * Get configuration with caching
   */
  async getConfiguration(advisorId) {
    // Check cache first
    if (this.activeConfigs.has(advisorId)) {
      return this.activeConfigs.get(advisorId);
    }

    // Check Redis cache
    const cached = await this.cache.get(`config:${advisorId}`);
    if (cached) {
      const config = JSON.parse(cached);
      this.activeConfigs.set(advisorId, config);
      return config;
    }

    // Load from database
    const config = await this.loadConfiguration(advisorId);
    if (config) {
      // Cache in memory and Redis
      this.activeConfigs.set(advisorId, config);
      await this.cache.setex(
        `config:${advisorId}`, 
        3600, // 1 hour TTL
        JSON.stringify(config)
      );
    }

    return config;
  }

  /**
   * Validate configuration against schema
   */
  async validateConfiguration(config) {
    const errors = [];

    // Required fields validation
    if (!config.advisorId) errors.push('Advisor ID is required');
    if (!config.profile?.sebiNumber) errors.push('SEBI number is required');
    if (!config.profile?.advisorName) errors.push('Advisor name is required');

    // Compliance validation
    if (config.compliance?.strictMode && !config.compliance?.customDisclaimer) {
      if (!config.compliance?.disclaimerStyle) {
        errors.push('Disclaimer style must be specified in strict mode');
      }
    }

    // Platform validation
    const enabledPlatforms = Object.entries(config.platforms || {})
      .filter(([_, settings]) => settings.enabled);
    
    if (enabledPlatforms.length === 0) {
      errors.push('At least one platform must be enabled');
    }

    // AI behavior validation
    const aiBehavior = config.aiBehavior || {};
    if (aiBehavior.creativity < 0 || aiBehavior.creativity > 1) {
      errors.push('Creativity level must be between 0 and 1');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Deep merge configuration objects
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          output[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  }

  /**
   * Calculate configuration differences
   */
  diffConfigs(oldConfig, newConfig) {
    const changes = [];
    
    const compareObjects = (old, new_, path = '') => {
      for (const key in new_) {
        const currentPath = path ? `${path}.${key}` : key;
        
        if (!(key in old)) {
          changes.push({ type: 'added', path: currentPath, value: new_[key] });
        } else if (typeof new_[key] === 'object' && !Array.isArray(new_[key])) {
          compareObjects(old[key], new_[key], currentPath);
        } else if (JSON.stringify(old[key]) !== JSON.stringify(new_[key])) {
          changes.push({ 
            type: 'modified', 
            path: currentPath, 
            oldValue: old[key], 
            newValue: new_[key] 
          });
        }
      }
      
      for (const key in old) {
        if (!(key in new_)) {
          const currentPath = path ? `${path}.${key}` : key;
          changes.push({ type: 'removed', path: currentPath, value: old[key] });
        }
      }
    };
    
    compareObjects(oldConfig, newConfig);
    return changes;
  }

  /**
   * Database operations
   */
  async saveConfiguration(config) {
    const query = `
      INSERT INTO advisor_configurations 
      (advisor_id, version, config_data, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (advisor_id, version) 
      DO UPDATE SET 
        config_data = $3,
        updated_at = $6
    `;
    
    await this.db.query(query, [
      config.advisorId,
      config.version,
      JSON.stringify(config),
      config.status || 'active',
      config.createdAt,
      config.updatedAt
    ]);
  }

  async loadConfiguration(advisorId) {
    const query = `
      SELECT config_data 
      FROM advisor_configurations 
      WHERE advisor_id = $1 
        AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const result = await this.db.query(query, [advisorId]);
    return result.rows[0]?.config_data;
  }

  /**
   * Utility methods
   */
  generateConfigId(advisorId) {
    return `config_${advisorId}_${Date.now()}`;
  }

  incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
  }

  addToRollbackStack(advisorId, config) {
    const stack = this.rollbackStack.get(advisorId) || [];
    stack.push(config);
    
    // Keep only last 10 versions for rollback
    if (stack.length > 10) {
      stack.shift();
    }
    
    this.rollbackStack.set(advisorId, stack);
  }

  /**
   * Bulk operations
   */
  async bulkUpdateConfigurations(updates, reason = 'Bulk update') {
    const results = [];
    
    for (const { advisorId, changes } of updates) {
      try {
        const result = await this.updateConfiguration(advisorId, changes, reason);
        results.push({ advisorId, success: true, version: result.version });
      } catch (error) {
        results.push({ advisorId, success: false, error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Export/Import configurations
   */
  async exportConfiguration(advisorId) {
    const config = await this.getConfiguration(advisorId);
    const history = this.configHistory.get(advisorId) || [];
    
    return {
      current: config,
      history: history.slice(-10), // Last 10 versions
      exported: new Date(),
      version: '1.0'
    };
  }

  async importConfiguration(advisorId, exportData) {
    // Validate export format
    if (!exportData.current || !exportData.version) {
      throw new Error('Invalid export format');
    }

    // Import as new configuration
    const imported = {
      ...exportData.current,
      advisorId,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      updateReason: 'Imported configuration'
    };

    await this.saveConfiguration(imported);
    this.activeConfigs.set(advisorId, imported);
    
    return imported;
  }
}

module.exports = PromptConfigurationManager;