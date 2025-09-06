#!/usr/bin/env node

/**
 * Check for existing WhatsApp templates with IMAGE headers
 * This script will list all templates and identify which ones support images
 */

const https = require('https');

const CONFIG = {
  token: 'EAATOFQtMe9gBPYsaJDcHnKMcBKvcJNZAd68EfRGM2YrvlXv1ljiAWT2hVBZB59hS8Q6TT57gwTutZBXbwOaytZBQAwgy4pDdzmw72o3PvWrsftQS6WSI33ko36HZCftHDqDxVWQPNnZBVozulSdH2RqB4nMf5UGYMAst8KG3ev0Lhg8ip4oHZBrC25O09Tw4eJUsgZDZD',
  businessId: '1861646317956355'
};

async function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CONFIG.token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function checkImageTemplates() {
  console.log('🔍 Checking for WhatsApp templates with IMAGE headers...\n');
  
  try {
    // Get all message templates
    const response = await makeRequest(
      'GET',
      `/v21.0/${CONFIG.businessId}/message_templates?limit=100`
    );

    if (response.error) {
      console.error('❌ Error fetching templates:', response.error.message);
      return;
    }

    const templates = response.data || [];
    console.log(`📋 Total templates found: ${templates.length}\n`);

    // Filter and display templates with image headers
    const imageTemplates = [];
    const textTemplates = [];
    
    templates.forEach(template => {
      const hasImageHeader = template.components?.some(
        comp => comp.type === 'HEADER' && comp.format === 'IMAGE'
      );
      
      if (hasImageHeader) {
        imageTemplates.push(template);
      } else {
        textTemplates.push(template);
      }
    });

    console.log('📸 IMAGE TEMPLATES:');
    console.log('==================');
    if (imageTemplates.length === 0) {
      console.log('❌ NO TEMPLATES WITH IMAGE HEADERS FOUND!\n');
    } else {
      imageTemplates.forEach(template => {
        console.log(`✅ ${template.name}`);
        console.log(`   Status: ${template.status}`);
        console.log(`   Category: ${template.category}`);
        console.log(`   Language: ${template.language}`);
        
        // Show header component details
        const header = template.components?.find(c => c.type === 'HEADER');
        if (header) {
          console.log(`   Header Format: ${header.format}`);
          if (header.example?.header_handle) {
            console.log(`   Example URL: ${header.example.header_handle[0]}`);
          }
        }
        console.log('');
      });
    }

    console.log('\n📝 TEXT-ONLY TEMPLATES:');
    console.log('======================');
    textTemplates.forEach(template => {
      const header = template.components?.find(c => c.type === 'HEADER');
      console.log(`• ${template.name} (${template.status}) - Header: ${header?.format || 'NONE'}`);
    });

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('===========');
    console.log(`Total Templates: ${templates.length}`);
    console.log(`Image Templates: ${imageTemplates.length}`);
    console.log(`Text Templates: ${textTemplates.length}`);
    console.log(`Templates without headers: ${templates.length - imageTemplates.length - textTemplates.filter(t => t.components?.some(c => c.type === 'HEADER')).length}`);

    if (imageTemplates.length === 0) {
      console.log('\n⚠️  ACTION REQUIRED: No image templates found!');
      console.log('   Run register-image-template.js to create one.');
    } else {
      const approved = imageTemplates.filter(t => t.status === 'APPROVED');
      if (approved.length > 0) {
        console.log('\n✅ You can use these approved image templates:');
        approved.forEach(t => console.log(`   - ${t.name}`));
      } else {
        console.log('\n⏳ Image templates exist but are pending approval.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the check
checkImageTemplates();