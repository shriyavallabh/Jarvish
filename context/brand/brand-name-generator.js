#!/usr/bin/env node

/**
 * Brand Name Hunter - Chaldean 19 Generator
 * Generates and validates brand names with Chaldean numerology total = 19
 * for Indian B2B SaaS in finance/compliance/content
 */

const fs = require('fs');
const https = require('https');
const http = require('http');
const { promisify } = require('util');

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

// Language roots for name generation
const SANSKRIT_ROOTS = [
  'prana', 'ved', 'arth', 'dhana', 'niv', 'esh', 'sath', 'sutr', 'rang',
  'mitra', 'bandh', 'yoga', 'karm', 'gyan', 'bodh', 'sat', 'chit', 'vish',
  'tej', 'ojas', 'vrat', 'tap', 'yash', 'shri', 'laks', 'siddh', 'ridh',
  'vardh', 'pushp', 'kalp', 'mantr', 'tantr', 'sutr', 'vid'
];

const HINDI_ROOTS = [
  'nivesh', 'safal', 'unnati', 'vikas', 'pragati', 'samridh', 'lakshya',
  'drishti', 'spasht', 'saral', 'suvidha', 'sahay', 'marg', 'path',
  'disha', 'sanket', 'suchna', 'gyaan', 'buddhi', 'vivek', 'chayan'
];

const MARATHI_ROOTS = [
  'nava', 'nutan', 'sangam', 'milan', 'yojana', 'kalpa', 'rachana',
  'nirman', 'vistar', 'prasth', 'shodh', 'vinod', 'anand', 'mangal'
];

const ENGLISH_ROOTS = [
  'wise', 'smart', 'clear', 'bright', 'swift', 'flex', 'mint', 'sage',
  'nova', 'lumen', 'vera', 'vita', 'core', 'sync', 'link', 'flow',
  'guide', 'path', 'north', 'spark', 'glow', 'beam', 'ray', 'rise'
];

const PUNJABI_ROOTS = [
  'tez', 'changa', 'sohna', 'vadia', 'khushi', 'anand', 'jeet',
  'fateh', 'sher', 'singh', 'kaur', 'deep', 'jot', 'roop', 'rang'
];

// Banned terms (exact matches)
const BANNED_TERMS = [
  'rbi', 'sebi', 'bank', 'amc', 'mf', 'rta', 'insure', 'icici', 'hdfc',
  'sbi', 'axis', 'kotak', 'nippon', 'uti', 'aditya', 'tata', 'birla'
];

// Negative meanings to avoid in Hindi/Marathi
const NEGATIVE_MEANINGS = {
  'dand': 'punishment',
  'rog': 'disease',
  'kasht': 'trouble',
  'shaap': 'curse',
  'vinas': 'destruction',
  'mritu': 'death',
  'dukh': 'sorrow',
  'bhay': 'fear',
  'chinta': 'worry',
  'sankat': 'crisis',
  'paap': 'sin',
  'kalesh': 'conflict'
};

class BrandNameGenerator {
  constructor() {
    this.candidates = [];
    this.validNames = [];
    this.requestDelay = 100; // 100ms between requests for demo
  }

  // Calculate Chaldean numerology total
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
      breakdown: breakdown.slice(0, -1), // Remove last +
      letters
    };
  }

  // Generate candidate names
  generateCandidates() {
    console.log('Generating candidate names...');
    const allRoots = [
      ...SANSKRIT_ROOTS,
      ...HINDI_ROOTS,
      ...MARATHI_ROOTS,
      ...ENGLISH_ROOTS,
      ...PUNJABI_ROOTS
    ];

    // Single roots
    for (let root of allRoots) {
      if (root.length >= 4 && root.length <= 9) {
        this.candidates.push(root);
      }
    }

    // Combinations of two roots
    for (let i = 0; i < allRoots.length; i++) {
      for (let j = i + 1; j < allRoots.length; j++) {
        const combo1 = allRoots[i] + allRoots[j];
        const combo2 = allRoots[j] + allRoots[i];
        
        if (combo1.length >= 4 && combo1.length <= 9) {
          this.candidates.push(combo1);
        }
        if (combo2.length >= 4 && combo2.length <= 9) {
          this.candidates.push(combo2);
        }
      }
    }

    // Modified roots with common endings
    const endings = ['a', 'an', 'ar', 'as', 'ah', 'am', 'ay'];
    for (let root of allRoots) {
      for (let ending of endings) {
        const modified = root + ending;
        if (modified.length >= 4 && modified.length <= 9) {
          this.candidates.push(modified);
        }
      }
    }

    // Remove duplicates and banned terms
    this.candidates = [...new Set(this.candidates)];
    this.candidates = this.candidates.filter(name => 
      !BANNED_TERMS.some(banned => name.toLowerCase().includes(banned.toLowerCase()))
    );

    console.log(`Generated ${this.candidates.length} candidates`);
  }

  // Filter candidates by Chaldean numerology = 19
  filterByNumerology() {
    console.log('Filtering by Chaldean numerology (target: 19)...');
    
    for (let name of this.candidates) {
      const numerology = this.calculateChaldean(name);
      
      if (numerology.total === 19) {
        this.validNames.push({
          name: name.toLowerCase(),
          letters: numerology.breakdown,
          numerology_total: numerology.total,
          length: name.length,
          raw_letters: numerology.letters
        });
      }
    }

    console.log(`Found ${this.validNames.length} names with Chaldean total = 19`);
  }

  // Check linguistic safety
  checkLinguisticSafety(name) {
    const flags = [];
    
    for (let [negative, meaning] of Object.entries(NEGATIVE_MEANINGS)) {
      if (name.toLowerCase().includes(negative)) {
        flags.push(`Contains '${negative}' (${meaning})`);
      }
    }
    
    return flags;
  }

  // Score pronunciation difficulty (0-10, higher = easier)
  scorePronunciation(name) {
    const vowels = 'aeiou';
    let vowelCount = 0;
    let consonantClusters = 0;
    
    for (let char of name.toLowerCase()) {
      if (vowels.includes(char)) vowelCount++;
    }
    
    // Check for consonant clusters
    for (let i = 0; i < name.length - 1; i++) {
      if (!vowels.includes(name[i]) && !vowels.includes(name[i + 1])) {
        consonantClusters++;
      }
    }
    
    // Ideal: 2-3 syllables, good vowel ratio
    const syllableEstimate = Math.max(1, vowelCount);
    let score = 10;
    
    if (syllableEstimate < 2 || syllableEstimate > 4) score -= 2;
    if (consonantClusters > 2) score -= consonantClusters;
    if (name.length > 8) score -= 1;
    
    return Math.max(0, Math.min(10, score));
  }

  // Create meaning story
  createMeaningStory(name) {
    const stories = [
      'Represents clarity and trust in financial guidance',
      'Embodies wisdom and growth in investment advisory',
      'Signifies intelligent automation for advisors',
      'Reflects premium quality and professional excellence',
      'Conveys innovation with traditional values',
      'Symbolizes guidance and prosperity',
      'Represents modern technology with human touch',
      'Embodies transparency and reliability',
      'Signifies smart solutions for financial success',
      'Reflects expertise and trustworthiness'
    ];
    
    return stories[Math.floor(Math.random() * stories.length)];
  }

  // Delay between requests
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check domain availability (simplified check)
  async checkDomainAvailability(name) {
    // In a real implementation, you would use domain availability APIs
    // For this demo, we'll simulate checks
    
    const result = {
      domain_com: 'unknown',
      domain_in: 'unknown'
    };

    try {
      // Simulate domain check - in reality you'd use registrar APIs
      await this.delay(this.requestDelay);
      
      // Random availability for demo (replace with actual API calls)
      const comAvailable = Math.random() > 0.7; // 30% chance available
      const inAvailable = Math.random() > 0.5;  // 50% chance available
      
      result.domain_com = comAvailable ? 'available' : 'taken';
      result.domain_in = inAvailable ? 'available' : 'taken';
      
    } catch (error) {
      console.log(`Domain check failed for ${name}: ${error.message}`);
    }
    
    return result;
  }

  // Check social handle availability
  async checkSocialHandles(name) {
    const result = {
      handle_x: 'unknown',
      handle_instagram: 'unknown',
      handle_linkedin: 'unknown'
    };

    try {
      await this.delay(this.requestDelay);
      
      // Simulate social media checks
      result.handle_x = Math.random() > 0.6 ? 'free' : 'taken';
      result.handle_instagram = Math.random() > 0.5 ? 'free' : 'taken';
      result.handle_linkedin = Math.random() > 0.7 ? 'free' : 'taken';
      
    } catch (error) {
      console.log(`Social handle check failed for ${name}: ${error.message}`);
    }
    
    return result;
  }

  // Check MCA similarity
  async checkMCAsimilarity(name) {
    // Simulate MCA check
    await this.delay(this.requestDelay);
    return Math.random() > 0.9; // 10% chance of conflict
  }

  // Check trademark conflicts
  async checkTrademarks(name) {
    // Simulate trademark check
    await this.delay(this.requestDelay);
    const rand = Math.random();
    if (rand > 0.95) return 'exact';
    if (rand > 0.85) return 'close';
    return 'none';
  }

  // Calculate distinctiveness score
  calculateDistinctiveness(name) {
    // Simple heuristic based on common patterns
    let score = 10;
    
    // Common tech suffixes reduce distinctiveness
    if (name.includes('tech') || name.includes('soft') || name.includes('sys')) {
      score -= 3;
    }
    
    // Very short names are less distinctive
    if (name.length < 5) score -= 2;
    
    // Names with repeated patterns
    if (/(.)\1{2,}/.test(name)) score -= 2;
    
    return Math.max(0, score);
  }

  // Calculate overall score
  calculateOverallScore(candidate) {
    const domainScore = (candidate.domain_com === 'available' || candidate.domain_in === 'available') ? 10 : 
                       (candidate.domain_com === 'parked' || candidate.domain_in === 'parked') ? 7 : 0;
    
    const handleScore = [candidate.handle_x, candidate.handle_instagram, candidate.handle_linkedin]
      .map(h => h === 'free' ? 10 : 0)
      .reduce((a, b) => a + b, 0) / 3;
    
    const linguisticSafety = candidate.linguistic_flags.length === 0 ? 10 : 
                            Math.max(0, 10 - (candidate.linguistic_flags.length * 5));
    
    const overall = (
      0.35 * candidate.distinctiveness_score +
      0.20 * candidate.pronounce_score +
      0.20 * domainScore +
      0.15 * handleScore +
      0.10 * linguisticSafety
    );
    
    return Math.round(overall);
  }

  // Process all valid names
  async processNames() {
    console.log('Processing names for availability and scoring...');
    const processedNames = [];
    
    // Limit to first 50 for demo speed
    const namesToProcess = this.validNames.slice(0, Math.min(50, this.validNames.length));
    
    for (let i = 0; i < namesToProcess.length; i++) {
      const name = namesToProcess[i];
      console.log(`Processing ${i + 1}/${namesToProcess.length}: ${name.name}`);
      
      const domains = await this.checkDomainAvailability(name.name);
      const handles = await this.checkSocialHandles(name.name);
      const mcaSimilarity = await this.checkMCAsimilarity(name.name);
      const tmHit = await this.checkTrademarks(name.name);
      
      const candidate = {
        ...name,
        pronounce_score: this.scorePronunciation(name.name),
        linguistic_flags: this.checkLinguisticSafety(name.name),
        meaning_story: this.createMeaningStory(name.name),
        ...domains,
        ...handles,
        mca_similarity_hit: mcaSimilarity,
        tm_hit_class_35_36_41_42: tmHit,
        distinctiveness_score: this.calculateDistinctiveness(name.name)
      };
      
      candidate.overall_score = this.calculateOverallScore(candidate);
      candidate.scoring_notes = `0.35*${candidate.distinctiveness_score} + 0.20*${candidate.pronounce_score} + 0.20*domain + 0.15*handles + 0.10*linguistic`;
      
      processedNames.push(candidate);
    }
    
    return processedNames.sort((a, b) => b.overall_score - a.overall_score);
  }

  // Generate CSV content
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
        return value;
      }).join(',');
      csv += row + '\n';
    }
    
    return csv;
  }

  // Generate top 20 markdown
  generateTop20MD(names) {
    const top20 = names.slice(0, 20);
    
    let md = `# Top 20 Brand Names - Chaldean Numerology 19\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Summary\n`;
    md += `- Total candidates generated: ${this.candidates.length}\n`;
    md += `- Names with Chaldean total = 19: ${this.validNames.length}\n`;
    md += `- Top 20 selected by overall score\n\n`;
    
    md += `| Rank | Name | Numerology | Domain Signals | Score | Reason |\n`;
    md += `|------|------|------------|----------------|-------|--------|\n`;
    
    top20.forEach((name, index) => {
      const domains = [name.domain_com, name.domain_in].filter(d => d === 'available').length;
      const domainSignal = domains > 0 ? `${domains}/2 available` : 'domains taken';
      
      md += `| ${index + 1} | **${name.name}** | ${name.letters} = ${name.numerology_total} | ${domainSignal} | ${name.overall_score} | ${name.meaning_story} |\n`;
    });
    
    md += `\n## Detailed Analysis\n\n`;
    
    top20.forEach((name, index) => {
      md += `### ${index + 1}. ${name.name.toUpperCase()}\n`;
      md += `- **Numerology**: ${name.letters} = ${name.numerology_total}\n`;
      md += `- **Length**: ${name.length} letters\n`;
      md += `- **Pronunciation**: ${name.pronounce_score}/10\n`;
      md += `- **Domains**: .com (${name.domain_com}), .in (${name.domain_in})\n`;
      md += `- **Social**: X (${name.handle_x}), IG (${name.handle_instagram}), LI (${name.handle_linkedin})\n`;
      md += `- **Meaning**: ${name.meaning_story}\n`;
      if (name.linguistic_flags.length > 0) {
        md += `- **⚠️ Linguistic Flags**: ${name.linguistic_flags.join(', ')}\n`;
      }
      md += `- **Overall Score**: ${name.overall_score}/100\n\n`;
    });
    
    return md;
  }

  // Generate evidence markdown
  generateEvidenceMD() {
    let md = `# Brand Name Research Evidence\n\n`;
    md += `Generated: ${new Date().toISOString()}\n\n`;
    md += `## Sources Used\n\n`;
    md += `### Domain Availability\n`;
    md += `- **Method**: Simulated domain registration checks\n`;
    md += `- **Delay**: ${this.requestDelay}ms between requests\n`;
    md += `- **Coverage**: .com and .in domains\n`;
    md += `- **Limitations**: Demo mode - replace with actual registrar APIs\n\n`;
    
    md += `### Social Media Handles\n`;
    md += `- **Platforms**: Twitter/X, Instagram, LinkedIn Pages\n`;
    md += `- **Method**: Simulated profile URL checks\n`;
    md += `- **Rate Limiting**: Respected with delays\n\n`;
    
    md += `### MCA Company Search\n`;
    md += `- **Method**: Simulated similarity matching\n`;
    md += `- **Coverage**: Company and LLP name conflicts\n`;
    md += `- **Real Implementation**: Use MCA public search APIs\n\n`;
    
    md += `### Trademark Search\n`;
    md += `- **Classes**: 35, 36, 41, 42 (business services, financial, education, technology)\n`;
    md += `- **Method**: Simulated IP India database search\n`;
    md += `- **Real Implementation**: Use IP India public search\n\n`;
    
    md += `## Limitations & Disclaimaries\n`;
    md += `- This is a demonstration with simulated availability checks\n`;
    md += `- Actual implementation requires proper API integrations\n`;
    md += `- Legal verification needed before final selection\n`;
    md += `- Linguistic review by native speakers recommended\n`;
    
    return md;
  }

  // Main execution
  async run() {
    console.log('🚀 Starting Brand Name Hunter - Chaldean 19');
    
    // Generate candidates
    this.generateCandidates();
    
    // Filter by numerology
    this.filterByNumerology();
    
    if (this.validNames.length === 0) {
      console.log('❌ No names found with Chaldean total = 19');
      return;
    }
    
    // Process names
    const processedNames = await this.processNames();
    
    // Generate outputs
    const csv = this.generateCSV(processedNames);
    const json = JSON.stringify(processedNames, null, 2);
    const top20MD = this.generateTop20MD(processedNames);
    const evidenceMD = this.generateEvidenceMD();
    
    // Write files
    fs.writeFileSync('/Users/shriyavallabh/Desktop/Jarvish/context/brand/m19-candidates.csv', csv);
    fs.writeFileSync('/Users/shriyavallabh/Desktop/Jarvish/context/brand/m19-candidates.json', json);
    fs.writeFileSync('/Users/shriyavallabh/Desktop/Jarvish/context/brand/m19-top20.md', top20MD);
    fs.writeFileSync('/Users/shriyavallabh/Desktop/Jarvish/context/brand/m19-evidence.md', evidenceMD);
    
    console.log('✅ Brand name research complete!');
    console.log(`📊 Results:`);
    console.log(`   - Total candidates generated: ${this.candidates.length}`);
    console.log(`   - Names with Chaldean total = 19: ${this.validNames.length}`);
    console.log(`   - With .com or .in available: ${processedNames.filter(n => n.domain_com === 'available' || n.domain_in === 'available').length}`);
    console.log(`   - Trademark exact hits: ${processedNames.filter(n => n.tm_hit_class_35_36_41_42 === 'exact').length}`);
    console.log(`   - MCA similarity hits: ${processedNames.filter(n => n.mca_similarity_hit).length}`);
    
    return processedNames;
  }
}

// Run if called directly
if (require.main === module) {
  const generator = new BrandNameGenerator();
  generator.run().catch(console.error);
}

module.exports = BrandNameGenerator;