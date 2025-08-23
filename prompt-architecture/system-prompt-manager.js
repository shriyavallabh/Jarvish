/**
 * System Prompt Manager - Advisor Configuration Layer
 * Manages persistent advisor preferences and branding
 */

class SystemPromptManager {
  constructor() {
    this.advisorProfiles = new Map();
    this.versionHistory = new Map();
    this.learningEngine = null;
  }

  /**
   * Core System Prompt Structure
   */
  createAdvisorProfile(advisorId, config) {
    const systemPrompt = {
      id: advisorId,
      version: '1.0.0',
      createdAt: new Date(),
      
      // Personal Branding
      branding: {
        name: config.name,
        designation: config.designation,
        firm: config.firm,
        tagline: config.tagline,
        uniqueSellingProposition: config.usp,
        brandPersonality: config.brandPersonality || 'professional',
        visualIdentity: {
          primaryColor: config.primaryColor,
          logo: config.logoUrl,
          preferredImageStyle: config.imageStyle
        }
      },

      // Communication Style
      voice: {
        tone: config.tone || 'professional-friendly',
        formalityLevel: config.formality || 'medium',
        humorLevel: config.humor || 'minimal',
        empathyLevel: config.empathy || 'high',
        technicalDepth: config.technicality || 'balanced',
        languagePreferences: {
          primary: config.primaryLanguage || 'English',
          secondary: config.secondaryLanguages || [],
          regionalDialects: config.dialects || [],
          avoidJargon: config.avoidJargon || false
        },
        sentenceStructure: {
          preferShort: config.shortSentences || false,
          useQuestions: config.rhetorical || true,
          bulletPoints: config.useBullets || true,
          emojis: config.useEmojis || 'minimal'
        }
      },

      // Platform Adaptations
      platforms: {
        whatsapp: {
          enabled: true,
          maxLength: 1024,
          formatting: 'markdown-lite',
          mediaPreference: 'images',
          broadcastTiming: config.whatsappTiming || 'morning',
          personalizedGreeting: config.whatsappGreeting,
          signOff: config.whatsappSignOff
        },
        linkedin: {
          enabled: config.linkedinEnabled || false,
          postLength: 'medium',
          hashtagStrategy: 'moderate',
          mentionStrategy: 'selective',
          contentMix: {
            educational: 40,
            market_updates: 30,
            thought_leadership: 20,
            promotional: 10
          }
        },
        email: {
          enabled: config.emailEnabled || false,
          subjectLineStyle: 'informative',
          preheaderStrategy: 'summary',
          ctaPlacement: 'multiple'
        }
      },

      // Compliance & Risk
      compliance: {
        riskTolerance: config.riskTolerance || 'moderate',
        disclaimerLevel: config.disclaimerLevel || 'standard',
        regulatoryFramework: config.regulatory || 'SEBI',
        mandatoryDisclosures: config.disclosures || [],
        restrictedTopics: config.restricted || [],
        preApprovalRequired: config.preApproval || false,
        archivingRequirements: config.archiving || true
      },

      // Client Segmentation
      targeting: {
        primarySegments: config.primarySegments || ['retail'],
        demographicFocus: {
          ageGroups: config.ageGroups || ['25-45'],
          incomeLevel: config.incomeLevel || 'middle-high',
          investmentExperience: config.experience || 'intermediate',
          riskProfile: config.clientRisk || 'moderate'
        },
        psychographicTraits: {
          goals: config.clientGoals || ['wealth-creation', 'retirement'],
          concerns: config.clientConcerns || ['market-volatility', 'inflation'],
          interests: config.clientInterests || ['equity', 'mutual-funds']
        },
        geographicFocus: {
          cities: config.cities || ['tier-1'],
          regions: config.regions || ['urban'],
          languages: config.regionalLanguages || ['English', 'Hindi']
        }
      },

      // Learning Preferences
      optimization: {
        enableLearning: config.enableLearning !== false,
        performanceMetrics: {
          primaryKPI: config.primaryKPI || 'engagement',
          secondaryKPIs: config.secondaryKPIs || ['reach', 'conversions'],
          trackingPeriod: config.trackingPeriod || 30
        },
        adaptationSpeed: config.adaptationSpeed || 'moderate',
        experimentationLevel: config.experimentLevel || 'conservative',
        feedbackIntegration: config.feedbackIntegration || true
      },

      // Content Preferences
      contentStyle: {
        preferredFormats: config.formats || ['insights', 'tips', 'analysis'],
        avoidFormats: config.avoidFormats || ['memes', 'controversial'],
        dataVisualization: config.useCharts || true,
        storytelling: config.useStories || 'occasional',
        caseStudies: config.useCaseStudies || true,
        educationalDepth: config.educationLevel || 'intermediate'
      }
    };

    this.advisorProfiles.set(advisorId, systemPrompt);
    this.saveVersion(advisorId, systemPrompt);
    return systemPrompt;
  }

  /**
   * Update System Prompt with Learning
   */
  async updateSystemPrompt(advisorId, updates, reason) {
    const current = this.advisorProfiles.get(advisorId);
    if (!current) throw new Error('Advisor profile not found');

    const newVersion = this.incrementVersion(current.version);
    const updated = {
      ...current,
      ...updates,
      version: newVersion,
      updatedAt: new Date(),
      updateReason: reason
    };

    this.advisorProfiles.set(advisorId, updated);
    this.saveVersion(advisorId, updated);

    // Trigger learning engine
    if (this.learningEngine) {
      await this.learningEngine.analyzeUpdate(advisorId, current, updated);
    }

    return updated;
  }

  /**
   * Generate Platform-Specific System Context
   */
  getPlatformContext(advisorId, platform) {
    const profile = this.advisorProfiles.get(advisorId);
    if (!profile) return null;

    const baseContext = {
      brand: profile.branding,
      voice: profile.voice,
      compliance: profile.compliance,
      targeting: profile.targeting
    };

    const platformConfig = profile.platforms[platform];
    if (!platformConfig || !platformConfig.enabled) return null;

    // Platform-specific adaptations
    switch (platform) {
      case 'whatsapp':
        return {
          ...baseContext,
          constraints: {
            maxLength: platformConfig.maxLength,
            formatting: platformConfig.formatting,
            mediaSupport: true
          },
          style: {
            greeting: platformConfig.personalizedGreeting,
            signOff: platformConfig.signOff,
            emojiUsage: profile.voice.sentenceStructure.emojis
          }
        };

      case 'linkedin':
        return {
          ...baseContext,
          constraints: {
            postLength: platformConfig.postLength,
            hashtagLimit: 5,
            mentionLimit: 3
          },
          strategy: {
            contentMix: platformConfig.contentMix,
            hashtagStrategy: platformConfig.hashtagStrategy
          }
        };

      default:
        return baseContext;
    }
  }

  /**
   * Version Control
   */
  saveVersion(advisorId, prompt) {
    if (!this.versionHistory.has(advisorId)) {
      this.versionHistory.set(advisorId, []);
    }
    
    const history = this.versionHistory.get(advisorId);
    history.push({
      version: prompt.version,
      timestamp: new Date(),
      snapshot: JSON.parse(JSON.stringify(prompt))
    });

    // Keep only last 10 versions
    if (history.length > 10) {
      history.shift();
    }
  }

  rollbackVersion(advisorId, version) {
    const history = this.versionHistory.get(advisorId);
    if (!history) return null;

    const versionData = history.find(h => h.version === version);
    if (!versionData) return null;

    this.advisorProfiles.set(advisorId, versionData.snapshot);
    return versionData.snapshot;
  }

  /**
   * Bulk Operations
   */
  async bulkUpdate(advisorIds, updates, reason) {
    const results = [];
    for (const advisorId of advisorIds) {
      try {
        const updated = await this.updateSystemPrompt(advisorId, updates, reason);
        results.push({ advisorId, success: true, data: updated });
      } catch (error) {
        results.push({ advisorId, success: false, error: error.message });
      }
    }
    return results;
  }

  /**
   * Export/Import for Scaling
   */
  exportProfile(advisorId) {
    const profile = this.advisorProfiles.get(advisorId);
    if (!profile) return null;

    return {
      profile: profile,
      history: this.versionHistory.get(advisorId) || []
    };
  }

  importProfile(advisorId, data) {
    this.advisorProfiles.set(advisorId, data.profile);
    if (data.history) {
      this.versionHistory.set(advisorId, data.history);
    }
    return true;
  }

  /**
   * Performance Analytics Integration
   */
  getPerformanceContext(advisorId) {
    const profile = this.advisorProfiles.get(advisorId);
    if (!profile) return null;

    return {
      optimizationEnabled: profile.optimization.enableLearning,
      metrics: profile.optimization.performanceMetrics,
      adaptationSpeed: profile.optimization.adaptationSpeed,
      experimentationLevel: profile.optimization.experimentationLevel
    };
  }

  incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
  }
}

module.exports = SystemPromptManager;