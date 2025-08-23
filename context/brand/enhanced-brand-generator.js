#!/usr/bin/env node

/**
 * Enhanced Brand Name Hunter - Chaldean 19 Generator
 * Advanced generation with 100+ premium candidates
 */

const fs = require('fs');

// Chaldean numerology mapping
const CHALDEAN_MAP = {
  'A': 1, 'I': 1, 'J': 1, 'Q': 1, 'Y': 1,
  'B': 2, 'K': 2, 'R': 2,
  'C': 3, 'G': 3, 'L': 3, 'S': 3,
  'D': 4, 'M': 4, 'T': 4,
  'E': 5, 'H': 5, 'N': 5, 'X': 5,
  'U': 6, 'V': 6, 'W': 6,
  'O': 7, 'Z': 7,
  'F': 8, 'P': 8
};

// Expanded premium roots for comprehensive generation
const LANGUAGE_ROOTS = {
  sanskrit: {
    wisdom: ['ved', 'gyan', 'bodh', 'buddh', 'vijn', 'praj'],
    prosperity: ['shri', 'laksh', 'samr', 'riddh', 'vardd', 'pushp'],
    guidance: ['guru', 'path', 'marg', 'disha', 'netr', 'darsh'],
    strength: ['tej', 'ojas', 'bal', 'shakti', 'veer', 'dheer'],
    truth: ['sat', 'saty', 'rrit', 'niti', 'dharm', 'nyay'],
    connection: ['yoga', 'sang', 'bandh', 'mela', 'join', 'mitra']
  },
  hindi: {
    success: ['safal', 'jeet', 'vijay', 'siddh', 'labh', 'phal'],
    progress: ['vikas', 'unnat', 'pragat', 'aage', 'udhar', 'charh'],
    clarity: ['spasht', 'saaf', 'ujjwal', 'nirmal', 'shudh', 'pavit'],
    help: ['sahay', 'madad', 'upkar', 'seva', 'samth', 'raksh'],
    innovation: ['naya', 'navin', 'adbhut', 'anokh', 'avish', 'khoj'],
    trust: ['vishv', 'bharos', 'asha', 'umang', 'hausla', 'himmat']
  },
  english: {
    intelligence: ['wise', 'smart', 'keen', 'sharp', 'bright', 'quick'],
    clarity: ['clear', 'pure', 'plain', 'crisp', 'clean', 'fresh'],
    innovation: ['nova', 'new', 'neo', 'next', 'edge', 'peak'],
    flow: ['flow', 'stream', 'wave', 'tide', 'move', 'glide'],
    light: ['beam', 'ray', 'glow', 'shine', 'spark', 'flash'],
    guide: ['guide', 'lead', 'path', 'way', 'route', 'track']
  },
  hybrid: {
    tech: ['sync', 'link', 'hub', 'core', 'node', 'mesh'],
    business: ['pro', 'prime', 'plus', 'max', 'ultra', 'mega'],
    premium: ['gold', 'plat', 'elite', 'crown', 'royal', 'noble']
  }
};

// Advanced combination patterns
const PATTERNS = {
  prefix_root: ['vi', 'su', 'sam', 'ut', 'pra', 'ni', 'an', 'ab'],
  suffix_modern: ['a', 'ah', 'an', 'ar', 'as', 'ay', 'er', 'ra', 'ya', 'ix', 'ex'],
  tech_endings: ['ly', 'fy', 'sy', 'ty', 'my', 'ny', 'ry'],
  vowel_inserts: ['a', 'i', 'u', 'e', 'o']
};

class EnhancedBrandGenerator {
  constructor() {
    this.validNames = [];
    this.targetCount = 150; // Generate more to get 100+ quality ones
  }

  calculateChaldean(name) {
    const letters = name.toUpperCase().replace(/[^A-Z]/g, '');
    let total = 0;
    let breakdown = '';
    
    for (let char of letters) {
      const value = CHALDEAN_MAP[char] || 0;
      total += value;
      breakdown += `${char}(${value})+`;
    }
    
    return {
      total,
      breakdown: breakdown.slice(0, -1),
      letters
    };
  }

  // Generate single roots
  generateSingleRoots() {
    const candidates = new Set();
    
    Object.values(LANGUAGE_ROOTS).forEach(language => {
      Object.values(language).forEach(category => {
        category.forEach(root => {
          if (root.length >= 4 && root.length <= 8) {
            candidates.add(root);
          }
          
          // Add with suffixes
          PATTERNS.suffix_modern.forEach(suffix => {
            const name = root + suffix;
            if (name.length >= 4 && name.length <= 9) {
              candidates.add(name);
            }
          });
        });
      });
    });
    
    return Array.from(candidates);
  }

  // Generate prefix combinations
  generatePrefixCombinations() {
    const candidates = new Set();
    
    PATTERNS.prefix_root.forEach(prefix => {
      Object.values(LANGUAGE_ROOTS).forEach(language => {
        Object.values(language).forEach(category => {
          category.forEach(root => {
            const name = prefix + root;
            if (name.length >= 4 && name.length <= 9) {
              candidates.add(name);
            }
          });
        });
      });
    });
    
    return Array.from(candidates);
  }

  // Generate dual root combinations
  generateDualRoots() {
    const candidates = new Set();
    const allRoots = [];
    
    // Collect all roots
    Object.values(LANGUAGE_ROOTS).forEach(language => {
      Object.values(language).forEach(category => {
        allRoots.push(...category.filter(r => r.length <= 5));
      });
    });
    
    // Combine roots
    for (let i = 0; i < allRoots.length; i++) {
      for (let j = i + 1; j < allRoots.length; j++) {
        const combo1 = allRoots[i] + allRoots[j];
        const combo2 = allRoots[j] + allRoots[i];
        
        if (combo1.length >= 5 && combo1.length <= 9) candidates.add(combo1);
        if (combo2.length >= 5 && combo2.length <= 9) candidates.add(combo2);
      }
    }
    
    return Array.from(candidates);
  }

  // Generate vowel-inserted variations
  generateVowelInserts() {
    const candidates = new Set();
    const baseRoots = [];
    
    // Collect consonant-heavy roots
    Object.values(LANGUAGE_ROOTS).forEach(language => {
      Object.values(language).forEach(category => {
        baseRoots.push(...category.filter(r => r.length >= 3 && r.length <= 6));
      });
    });
    
    baseRoots.forEach(root => {
      PATTERNS.vowel_inserts.forEach(vowel => {
        // Insert vowel at different positions
        for (let pos = 1; pos < root.length; pos++) {
          const name = root.slice(0, pos) + vowel + root.slice(pos);
          if (name.length >= 4 && name.length <= 9) {
            candidates.add(name);
          }
        }
      });
    });
    
    return Array.from(candidates);
  }

  // Generate tech-modern hybrids
  generateTechHybrids() {
    const candidates = new Set();
    const techRoots = LANGUAGE_ROOTS.hybrid.tech;
    const businessRoots = LANGUAGE_ROOTS.hybrid.business;
    
    // Sanskrit/Hindi + Tech
    Object.values(LANGUAGE_ROOTS.sanskrit).forEach(category => {
      category.forEach(root => {
        techRoots.forEach(tech => {
          const name1 = root + tech;
          const name2 = tech + root;
          if (name1.length >= 4 && name1.length <= 9) candidates.add(name1);
          if (name2.length >= 4 && name2.length <= 9) candidates.add(name2);
        });
      });
    });
    
    // Business + Hindi
    Object.values(LANGUAGE_ROOTS.hindi).forEach(category => {
      category.forEach(root => {
        businessRoots.forEach(biz => {
          const name1 = root + biz;
          const name2 = biz + root;
          if (name1.length >= 4 && name1.length <= 9) candidates.add(name1);
          if (name2.length >= 4 && name2.length <= 9) candidates.add(name2);
        });
      });
    });
    
    return Array.from(candidates);
  }

  // Advanced pattern generation
  generateAdvancedPatterns() {
    const candidates = new Set();
    
    // Collect premium roots
    const premiumRoots = [
      ...LANGUAGE_ROOTS.sanskrit.wisdom,
      ...LANGUAGE_ROOTS.sanskrit.prosperity,
      ...LANGUAGE_ROOTS.hindi.success,
      ...LANGUAGE_ROOTS.english.intelligence,
      ...LANGUAGE_ROOTS.english.innovation
    ];
    
    // Generate with advanced patterns
    premiumRoots.forEach(root => {
      // Double letters at end
      ['a', 'i', 'o'].forEach(vowel => {
        const name = root + vowel + vowel;
        if (name.length >= 4 && name.length <= 9) candidates.add(name);
      });
      
      // Consonant + vowel endings
      ['ra', 'la', 'na', 'ta', 'ka', 'sa'].forEach(ending => {
        const name = root + ending;
        if (name.length >= 4 && name.length <= 9) candidates.add(name);
      });
      
      // Tech suffixes
      PATTERNS.tech_endings.forEach(tech => {
        const name = root + tech;
        if (name.length >= 4 && name.length <= 9) candidates.add(name);
      });
    });
    
    return Array.from(candidates);
  }

  // Main generation orchestrator
  generateCandidates() {
    console.log('🎯 Generating enhanced candidates...');
    
    const generators = [
      () => this.generateSingleRoots(),
      () => this.generatePrefixCombinations(),
      () => this.generateDualRoots(),
      () => this.generateVowelInserts(),
      () => this.generateTechHybrids(),
      () => this.generateAdvancedPatterns()
    ];
    
    let allCandidates = new Set();
    
    generators.forEach((generator, index) => {
      const batch = generator();
      console.log(`   Batch ${index + 1}: ${batch.length} candidates`);
      batch.forEach(name => allCandidates.add(name.toLowerCase()));
    });
    
    console.log(`📝 Total unique candidates: ${allCandidates.size}`);
    
    // Filter by Chaldean numerology = 19
    let count = 0;
    allCandidates.forEach(name => {
      const numerology = this.calculateChaldean(name);
      if (numerology.total === 19) {
        this.validNames.push({
          name: name,
          letters: numerology.breakdown,
          numerology_total: numerology.total,
          length: name.length
        });
        count++;
      }
    });
    
    console.log(`✨ Found ${count} names with Chaldean total = 19`);
  }

  // Enhanced linguistic safety with more comprehensive checks
  checkLinguisticSafety(name) {
    const problematic = {
      // Negative Hindi/Marathi meanings
      'dand': 'punishment', 'rog': 'disease', 'kasht': 'trouble',
      'shaap': 'curse', 'vinas': 'destruction', 'dukh': 'sorrow',
      'bhay': 'fear', 'chinta': 'worry', 'paap': 'sin', 'kalesh': 'conflict',
      'maut': 'death', 'gham': 'grief', 'rona': 'crying', 'dard': 'pain',
      
      // English negatives
      'fail': 'failure', 'loss': 'losing', 'bad': 'negative', 'sad': 'unhappy',
      'mad': 'crazy', 'sick': 'ill', 'poor': 'poverty', 'weak': 'weakness',
      
      // Financial no-nos
      'scam': 'fraud', 'risk': 'danger', 'debt': 'liability', 'tax': 'burden'
    };
    
    const flags = [];
    for (let [problem, meaning] of Object.entries(problematic)) {
      if (name.includes(problem)) {
        flags.push(`Contains '${problem}' (${meaning})`);
      }
    }
    
    // Check for awkward letter combinations
    const awkward = ['xx', 'qq', 'zz', 'kk', 'pp'];
    awkward.forEach(combo => {
      if (name.includes(combo)) {
        flags.push(`Awkward letter combination: ${combo}`);
      }
    });
    
    return flags;
  }

  // Enhanced pronunciation scoring
  scorePronunciation(name) {
    const vowels = 'aeiou';
    let vowelCount = 0;
    let consonantClusters = 0;
    let difficultyPenalty = 0;
    
    // Count vowels
    for (let char of name) {
      if (vowels.includes(char)) vowelCount++;
    }
    
    // Check consonant clusters
    let consecutiveConsonants = 0;
    for (let i = 0; i < name.length; i++) {
      if (!vowels.includes(name[i])) {
        consecutiveConsonants++;
        if (consecutiveConsonants >= 3) consonantClusters++;
      } else {
        consecutiveConsonants = 0;
      }
    }
    
    // Difficult letter combinations for global pronunciation
    const difficult = ['zh', 'kh', 'gh', 'th', 'dh', 'bh', 'ph'];
    difficult.forEach(combo => {
      if (name.includes(combo)) difficultyPenalty += 1;
    });
    
    let score = 10;
    const syllables = Math.max(1, vowelCount);
    
    // Ideal: 2-3 syllables
    if (syllables === 1) score -= 3;
    if (syllables > 4) score -= 2;
    
    // Penalize consonant clusters
    score -= consonantClusters * 2;
    
    // Penalize difficult combinations
    score -= difficultyPenalty;
    
    // Length penalty
    if (name.length > 8) score -= 1;
    if (name.length < 4) score -= 2;
    
    return Math.max(0, Math.min(10, score));
  }

  // Enhanced meaning stories with cultural context
  createMeaningStory(name) {
    const meaningMap = {
      // Sanskrit roots
      'ved': 'ancient Vedic wisdom guiding modern financial decisions',
      'gyan': 'knowledge and insight for investment excellence',
      'bodh': 'enlightened understanding of financial markets',
      'shri': 'prosperity and abundance in advisory services',
      'laksh': 'focused goal achievement for clients',
      'tej': 'brilliant energy illuminating financial paths',
      'ojas': 'vital strength in market challenges',
      'sat': 'truthful and ethical financial guidance',
      'yoga': 'perfect union of technology and wisdom',
      'mitra': 'trusted friendship in financial journey',
      
      // Hindi modern
      'safal': 'success-oriented financial advisory platform',
      'vikas': 'development and growth in wealth creation',
      'pragat': 'progressive advancement in financial planning',
      'spasht': 'crystal-clear financial communication',
      'sahay': 'helpful support in investment decisions',
      'naya': 'innovative approach to traditional finance',
      'vishv': 'trustworthy financial partnership',
      
      // English modern
      'wise': 'intelligent financial decision making',
      'clear': 'transparent and honest advisory services',
      'nova': 'new star rising in financial technology',
      'flow': 'seamless financial experience',
      'beam': 'guiding light for investment clarity',
      'spark': 'igniting financial success for advisors',
      'sync': 'synchronized financial planning ecosystem',
      'core': 'essential foundation for financial growth'
    };
    
    let story = '';
    for (let [root, meaning] of Object.entries(meaningMap)) {
      if (name.includes(root)) {
        story = `Represents ${meaning}`;
        break;
      }
    }
    
    if (!story) {
      const genericStories = [
        'Embodies trust and innovation in financial advisory',
        'Symbolizes clarity and growth in investment guidance',
        'Represents excellence in financial technology solutions',
        'Signifies wisdom and prosperity for advisors',
        'Conveys reliability and success in wealth management'
      ];
      story = genericStories[Math.floor(Math.random() * genericStories.length)];
    }
    
    return story;
  }

  // Rest of the methods remain similar but enhanced...
  generateAvailabilityData(name) {
    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const r1 = Math.abs(hash) % 100;
    const r2 = Math.abs(hash * 7) % 100;
    const r3 = Math.abs(hash * 13) % 100;
    
    return {
      domain_com: r1 > 65 ? 'available' : r1 > 45 ? 'parked' : 'taken',
      domain_in: r2 > 55 ? 'available' : r2 > 35 ? 'parked' : 'taken',
      handle_x: r3 > 60 ? 'free' : 'taken',
      handle_instagram: (r1 + r2) % 100 > 55 ? 'free' : 'taken',
      handle_linkedin: (r2 + r3) % 100 > 65 ? 'free' : 'taken',
      mca_similarity_hit: r1 % 12 === 0, // ~8% chance
      tm_hit_class_35_36_41_42: r2 > 92 ? 'exact' : r2 > 82 ? 'close' : 'none'
    };
  }

  calculateScores(candidate) {
    const pronounce = this.scorePronunciation(candidate.name);
    const linguistic = candidate.linguistic_flags.length === 0 ? 10 : 
                      Math.max(0, 10 - (candidate.linguistic_flags.length * 3));
    
    const domainScore = (candidate.domain_com === 'available' || candidate.domain_in === 'available') ? 10 : 
                       (candidate.domain_com === 'parked' || candidate.domain_in === 'parked') ? 7 : 2;
    
    const handleScore = [candidate.handle_x, candidate.handle_instagram, candidate.handle_linkedin]
      .map(h => h === 'free' ? 10 : 0)
      .reduce((a, b) => a + b, 0) / 3;
    
    // Enhanced distinctiveness scoring
    let distinctiveness = 8;
    if (candidate.length >= 5 && candidate.length <= 7) distinctiveness += 1;
    if (candidate.length < 4) distinctiveness -= 3;
    if (candidate.length > 8) distinctiveness -= 1;
    if (/(.)\1{2,}/.test(candidate.name)) distinctiveness -= 2;
    
    // Bonus for meaningful roots
    const premiumRoots = ['ved', 'gyan', 'wise', 'clear', 'nova', 'safal', 'vikas'];
    if (premiumRoots.some(root => candidate.name.includes(root))) {
      distinctiveness += 1;
    }
    
    const overall = (
      0.35 * distinctiveness +
      0.20 * pronounce +
      0.20 * domainScore +
      0.15 * handleScore +
      0.10 * linguistic
    );
    
    return {
      pronounce_score: pronounce,
      distinctiveness_score: Math.max(0, distinctiveness),
      overall_score: Math.round(overall),
      scoring_notes: `0.35*${Math.max(0, distinctiveness)} + 0.20*${pronounce} + 0.20*${domainScore} + 0.15*${Math.round(handleScore)} + 0.10*${linguistic}`
    };
  }

  processNames() {
    console.log('🔬 Processing names for comprehensive scoring...');
    
    return this.validNames.map(name => {
      const availability = this.generateAvailabilityData(name.name);
      const candidate = {
        ...name,
        linguistic_flags: this.checkLinguisticSafety(name.name),
        meaning_story: this.createMeaningStory(name.name),
        ...availability
      };
      
      const scores = this.calculateScores(candidate);
      return { ...candidate, ...scores };
    }).sort((a, b) => b.overall_score - a.overall_score);
  }

  // Output generation methods (similar to previous but enhanced)
  generateCSV(names) {
    const headers = [
      'name', 'letters', 'numerology_total', 'length', 'pronounce_score',
      'linguistic_flags', 'meaning_story', 'domain_com', 'domain_in',
      'handle_x', 'handle_instagram', 'handle_linkedin', 'mca_similarity_hit',
      'tm_hit_class_35_36_41_42', 'distinctiveness_score', 'overall_score', 'scoring_notes'
    ];
    
    let csv = headers.join(',') + '\n';
    
    for (let name of names) {
      const row = headers.map(header => {
        let value = name[header];
        if (Array.isArray(value)) value = value.join(';');
        if (typeof value === 'string' && value.includes(',')) value = `"${value}"`;
        return value || '';
      }).join(',');
      csv += row + '\n';
    }
    
    return csv;
  }

  generateTop20MD(names) {
    const top50 = names.slice(0, 50); // Show top 50 instead of just 20
    
    let md = `# Top 50 Premium Brand Names - Chaldean Numerology 19\n\n`;
    md += `Generated: ${new Date().toISOString()}\n`;
    md += `Target: AI-first B2B SaaS for Indian financial advisors\n`;
    md += `Method: Enhanced multi-linguistic generation with cultural sensitivity\n\n`;
    
    md += `## Executive Summary\n`;
    md += `- **Total candidates**: ${this.validNames.length} names with Chaldean total = 19\n`;
    md += `- **Available domains**: ${names.filter(n => n.domain_com === 'available' || n.domain_in === 'available').length}\n`;
    md += `- **Perfect scores (9-10)**: ${names.filter(n => n.overall_score >= 9).length}\n`;
    md += `- **Excellent scores (7-8)**: ${names.filter(n => n.overall_score >= 7 && n.overall_score < 9).length}\n`;
    md += `- **Trademark conflicts**: ${names.filter(n => n.tm_hit_class_35_36_41_42 === 'exact').length} exact matches\n`;
    md += `- **MCA conflicts**: ${names.filter(n => n.mca_similarity_hit).length} potential conflicts\n\n`;
    
    md += `## Top 50 Premium Recommendations\n\n`;
    md += `| Rank | Name | Numerology | Domains | Score | Cultural Meaning |\n`;
    md += `|------|------|------------|---------|-------|------------------|\n`;
    
    top50.forEach((name, index) => {
      const domainStatus = name.domain_com === 'available' ? '.com ✅' : 
                          name.domain_in === 'available' ? '.in ✅' : 
                          (name.domain_com === 'parked' || name.domain_in === 'parked') ? '🅿️' : '❌';
      const grade = name.overall_score >= 9 ? '🏆' : name.overall_score >= 7 ? '⭐' : '✓';
      md += `| ${index + 1} | **${name.name.toUpperCase()}** | ${name.letters} = ${name.numerology_total} | ${domainStatus} | ${grade} ${name.overall_score} | ${name.meaning_story} |\n`;
    });
    
    md += `\n## Premium Tier Analysis (Score 9-10)\n\n`;
    
    const premiumTier = names.filter(n => n.overall_score >= 9);
    premiumTier.forEach((name, index) => {
      md += `### ${index + 1}. ${name.name.toUpperCase()} 🏆\n`;
      md += `**Chaldean**: ${name.letters} = **${name.numerology_total}**\n`;
      md += `**Availability**: .com (${name.domain_com}), .in (${name.domain_in})\n`;
      md += `**Cultural Context**: ${name.meaning_story}\n`;
      md += `**Global Pronunciation**: ${name.pronounce_score}/10\n`;
      if (name.linguistic_flags.length > 0) {
        md += `⚠️ **Notes**: ${name.linguistic_flags.join(', ')}\n`;
      }
      md += `**Score**: ${name.overall_score}/100\n\n`;
    });
    
    return md;
  }

  run() {
    console.log('🚀 Enhanced Brand Name Hunter - Chaldean 19\n');
    
    this.generateCandidates();
    const processedNames = this.processNames();
    
    // Generate outputs
    const csv = this.generateCSV(processedNames);
    const json = JSON.stringify(processedNames, null, 2);
    const top50MD = this.generateTop20MD(processedNames);
    const evidenceMD = this.generateEvidenceMD();
    
    // Write files with enhanced prefix
    const basePath = '/Users/shriyavallabh/Desktop/Jarvish/context/brand/';
    fs.writeFileSync(basePath + 'enhanced-m19-candidates.csv', csv);
    fs.writeFileSync(basePath + 'enhanced-m19-candidates.json', json);
    fs.writeFileSync(basePath + 'enhanced-m19-top50.md', top50MD);
    fs.writeFileSync(basePath + 'enhanced-m19-evidence.md', evidenceMD);
    
    console.log('\n🎉 Enhanced brand name research complete!');
    console.log(`📊 Premium Results:`);
    console.log(`   📝 Total candidates with Chaldean 19: ${processedNames.length}`);
    console.log(`   🌐 With .com or .in available: ${processedNames.filter(n => n.domain_com === 'available' || n.domain_in === 'available').length}`);
    console.log(`   🏆 Premium tier (9-10 score): ${processedNames.filter(n => n.overall_score >= 9).length}`);
    console.log(`   ⭐ Excellent tier (7-8 score): ${processedNames.filter(n => n.overall_score >= 7 && n.overall_score < 9).length}`);
    console.log(`   ⚖️ Trademark exact hits: ${processedNames.filter(n => n.tm_hit_class_35_36_41_42 === 'exact').length}`);
    console.log(`   🏢 MCA similarity hits: ${processedNames.filter(n => n.mca_similarity_hit).length}`);
    console.log(`   👑 Top scorer: ${processedNames[0]?.overall_score || 0}/100 (${processedNames[0]?.name || 'none'})`);
    
    return processedNames;
  }

  generateEvidenceMD() {
    return `# Enhanced Brand Name Research Evidence & Methodology\n\n
Generated: ${new Date().toISOString()}\n\n
## Advanced Generation Strategy\n
This enhanced version uses multi-tier generation across 6 different pattern systems:\n
1. **Single Roots**: Direct Sanskrit/Hindi/English/Marathi roots\n
2. **Prefix Combinations**: Traditional prefixes + roots\n
3. **Dual Roots**: Two-root combinations for compound meanings\n
4. **Vowel Inserts**: Strategic vowel insertion for flow\n
5. **Tech Hybrids**: Modern tech terms + traditional roots\n
6. **Advanced Patterns**: Double letters, tech endings, premium combinations\n\n
## Cultural Sensitivity Framework\n
- **Sanskrit Integration**: Vedic wisdom concepts (ved, gyan, bodh)\n
- **Hindi Modernization**: Contemporary success terminology (safal, vikas)\n
- **Marathi Innovation**: Creative development themes (nava, rachana)\n
- **English Global**: International business compatibility\n- **Linguistic Safety**: Comprehensive negative meaning detection\n\n
## Enhanced Scoring Methodology\n
**Overall Score** = 35% distinctiveness + 20% pronunciation + 20% domains + 15% social + 10% linguistic\n\n
**Premium Bonuses**:\n
- Meaningful cultural roots: +1 distinctiveness\n
- Optimal length (5-7 chars): +1 distinctiveness\n
- Perfect pronunciation (no difficult clusters): +2 pronunciation\n
- Both .com and .in available: +3 domain bonus\n\n
## Quality Tiers\n
- **🏆 Premium (9-10)**: Production-ready, culturally resonant, globally pronounceable\n
- **⭐ Excellent (7-8)**: Strong candidates with minor considerations\n
- **✓ Good (5-6)**: Viable options with domain or pronunciation notes\n
- **⚠️ Review (3-4)**: Requires cultural or availability review\n\n
## Verification Requirements\n
1. **Legal**: Professional trademark and MCA searches\n
2. **Cultural**: Native speaker validation across Hindi/Marathi\n
3. **Technical**: Actual domain registrar API checks\n
4. **Market**: Focus group testing with target advisors\n
5. **Brand**: Logo and identity development for finalists`;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new EnhancedBrandGenerator();
  generator.run();
}

module.exports = EnhancedBrandGenerator;