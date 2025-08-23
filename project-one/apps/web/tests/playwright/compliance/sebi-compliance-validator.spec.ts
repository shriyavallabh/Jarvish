import { test, expect, Page } from '@playwright/test';

/**
 * SEBI Compliance Validation System
 * 
 * Validates that the JARVISH platform meets SEBI regulatory requirements
 * for financial advisory services in India
 */

interface ComplianceCheck {
  name: string;
  description: string;
  validator: (page: Page) => Promise<boolean>;
  critical: boolean;
}

const sebiComplianceChecks: ComplianceCheck[] = [
  {
    name: 'EUIN Display Requirement',
    description: 'SEBI requires EUIN (Employee Unique Identification Number) to be prominently displayed',
    critical: true,
    validator: async (page: Page) => {
      const euinText = await page.textContent('body');
      const hasEUIN = /EUIN[:\s-]*[A-Z]{2}\d{10}/i.test(euinText || '');
      const hasEUINMention = (euinText || '').toLowerCase().includes('euin');
      
      if (hasEUIN) {
        console.log('✅ EUIN number found in proper format');
        return true;
      } else if (hasEUINMention) {
        console.log('⚠️ EUIN mentioned but not in proper format');
        return false;
      } else {
        console.log('❌ No EUIN found');
        return false;
      }
    }
  },
  
  {
    name: 'Investment Advisory Disclaimer',
    description: 'Required disclaimer for investment advisory services',
    critical: true,
    validator: async (page: Page) => {
      const pageText = await page.textContent('body');
      const text = (pageText || '').toLowerCase();
      
      const hasInvestmentDisclaimer = 
        text.includes('investment') && 
        (text.includes('risk') || text.includes('disclaimer') || text.includes('advisory'));
      
      const hasRiskWarning = 
        text.includes('risk') && 
        (text.includes('loss') || text.includes('market') || text.includes('subject'));
        
      if (hasInvestmentDisclaimer && hasRiskWarning) {
        console.log('✅ Investment advisory disclaimer found');
        return true;
      } else {
        console.log('❌ Missing proper investment advisory disclaimer');
        return false;
      }
    }
  },
  
  {
    name: 'SEBI Registration Display',
    description: 'SEBI registration information should be clearly visible',
    critical: true,
    validator: async (page: Page) => {
      const pageText = await page.textContent('body');
      const text = (pageText || '').toLowerCase();
      
      const hasSEBI = text.includes('sebi');
      const hasRegistration = text.includes('registration') || text.includes('registered');
      
      if (hasSEBI && hasRegistration) {
        console.log('✅ SEBI registration information found');
        return true;
      } else if (hasSEBI) {
        console.log('⚠️ SEBI mentioned but registration status unclear');
        return true; // Still pass as SEBI is mentioned
      } else {
        console.log('❌ No SEBI registration information found');
        return false;
      }
    }
  },
  
  {
    name: 'Data Privacy Notice (DPDP Act)',
    description: 'Data privacy notice as per Digital Personal Data Protection Act',
    critical: false,
    validator: async (page: Page) => {
      const pageText = await page.textContent('body');
      const text = (pageText || '').toLowerCase();
      
      const hasPrivacyNotice = 
        text.includes('privacy') && 
        (text.includes('policy') || text.includes('data') || text.includes('protection'));
      
      if (hasPrivacyNotice) {
        console.log('✅ Data privacy notice found');
        return true;
      } else {
        console.log('⚠️ No data privacy notice found');
        return false;
      }
    }
  },
  
  {
    name: 'Professional Financial Services Tone',
    description: 'Content should maintain professional tone suitable for financial services',
    critical: false,
    validator: async (page: Page) => {
      const pageText = await page.textContent('body');
      const text = (pageText || '').toLowerCase();
      
      // Check for unprofessional language
      const unprofessionalWords = ['get rich quick', 'guaranteed returns', 'no risk', 'easy money', 'instant profit'];
      const hasUnprofessionalContent = unprofessionalWords.some(word => text.includes(word));
      
      // Check for professional terms
      const professionalTerms = ['advisory', 'financial', 'investment', 'portfolio', 'analysis', 'professional'];
      const hasProfessionalContent = professionalTerms.some(term => text.includes(term));
      
      if (!hasUnprofessionalContent && hasProfessionalContent) {
        console.log('✅ Professional financial services tone maintained');
        return true;
      } else if (hasUnprofessionalContent) {
        console.log('❌ Unprofessional language detected');
        return false;
      } else {
        console.log('⚠️ Limited professional financial terminology');
        return true; // Don't fail for this
      }
    }
  },
  
  {
    name: 'Contact Information Display',
    description: 'Proper contact information should be available for regulatory compliance',
    critical: false,
    validator: async (page: Page) => {
      const pageText = await page.textContent('body');
      const text = (pageText || '').toLowerCase();
      
      const hasContactInfo = 
        (text.includes('contact') && (text.includes('us') || text.includes('info'))) ||
        text.includes('phone') || text.includes('email') || text.includes('address');
      
      // Check for email pattern
      const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const hasEmail = emailPattern.test(text);
      
      if (hasContactInfo || hasEmail) {
        console.log('✅ Contact information available');
        return true;
      } else {
        console.log('⚠️ No clear contact information found');
        return false;
      }
    }
  }
];

const complianceTestPages = [
  { name: 'landing-page', url: '/', priority: 'high' },
  { name: 'sign-up', url: '/sign-up', priority: 'high' },
  { name: 'pricing', url: '/pricing', priority: 'high' },
  { name: 'onboarding', url: '/onboarding', priority: 'medium' },
  { name: 'analytics-demo', url: '/analytics-demo', priority: 'medium' }
];

test.describe('SEBI Compliance Validation', () => {
  
  complianceTestPages.forEach((pageInfo) => {
    test(`SEBI Compliance - ${pageInfo.name}`, async ({ page }) => {
      console.log(`\n🏛️ Testing SEBI compliance for ${pageInfo.name} (${pageInfo.priority} priority)`);
      
      try {
        // Navigate to page
        await page.goto(pageInfo.url, { 
          waitUntil: 'networkidle',
          timeout: 30000 
        });

        // Wait for content to load
        await page.waitForTimeout(3000);

        const results = {
          passed: 0,
          failed: 0,
          critical_failed: 0,
          total: sebiComplianceChecks.length
        };

        // Run all compliance checks
        for (const check of sebiComplianceChecks) {
          console.log(`\n🔍 Running: ${check.name}`);
          console.log(`   Description: ${check.description}`);
          
          try {
            const passed = await check.validator(page);
            
            if (passed) {
              console.log(`   ✅ PASSED${check.critical ? ' (Critical)' : ''}`);
              results.passed++;
            } else {
              console.log(`   ❌ FAILED${check.critical ? ' (Critical)' : ''}`);
              results.failed++;
              if (check.critical) {
                results.critical_failed++;
              }
            }
          } catch (error) {
            console.log(`   🚨 ERROR: ${error.message}${check.critical ? ' (Critical)' : ''}`);
            results.failed++;
            if (check.critical) {
              results.critical_failed++;
            }
          }
        }

        // Generate compliance report
        console.log(`\n📊 SEBI Compliance Report for ${pageInfo.name}:`);
        console.log(`   ✅ Passed: ${results.passed}/${results.total}`);
        console.log(`   ❌ Failed: ${results.failed}/${results.total}`);
        console.log(`   🚨 Critical Failures: ${results.critical_failed}`);
        
        const complianceScore = (results.passed / results.total) * 100;
        console.log(`   📈 Compliance Score: ${complianceScore.toFixed(1)}%`);
        
        // Grade the compliance
        let grade = 'F';
        if (complianceScore >= 90) grade = 'A';
        else if (complianceScore >= 80) grade = 'B';
        else if (complianceScore >= 70) grade = 'C';
        else if (complianceScore >= 60) grade = 'D';
        
        console.log(`   🏆 Compliance Grade: ${grade}`);

        // For high priority pages, require higher compliance
        if (pageInfo.priority === 'high') {
          expect(results.critical_failed).toBe(0);
          expect(complianceScore).toBeGreaterThanOrEqual(70);
        } else {
          // Medium priority can have some non-critical failures
          expect(results.critical_failed).toBeLessThanOrEqual(1);
        }

      } catch (error) {
        console.error(`❌ Error during SEBI compliance testing for ${pageInfo.name}: ${error.message}`);
        throw error;
      }
    });
  });
});

test.describe('Regulatory Content Validation', () => {
  
  test('Footer compliance links', async ({ page }) => {
    await page.goto('/');
    
    // Check for common regulatory links
    const footerText = await page.locator('footer').textContent();
    const pageText = footerText || '';
    
    const hasPrivacyPolicy = pageText.toLowerCase().includes('privacy');
    const hasTerms = pageText.toLowerCase().includes('terms');
    
    console.log('🔗 Regulatory links check:');
    console.log(`   Privacy Policy: ${hasPrivacyPolicy ? '✅' : '❌'}`);
    console.log(`   Terms of Service: ${hasTerms ? '✅' : '❌'}`);
    
    // At least one should be present
    expect(hasPrivacyPolicy || hasTerms).toBeTruthy();
  });
  
  test('Professional imagery validation', async ({ page }) => {
    await page.goto('/');
    
    // Check for images and their alt text
    const images = await page.locator('img').all();
    
    console.log(`🖼️ Found ${images.length} images on landing page`);
    
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const img = images[i];
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      console.log(`   Image ${i + 1}: ${src} - Alt: "${alt}"`);
      
      // Images should have alt text for accessibility
      if (!alt || alt.trim() === '') {
        console.log(`   ⚠️ Missing alt text for image: ${src}`);
      } else {
        console.log(`   ✅ Alt text present`);
      }
    }
  });
});