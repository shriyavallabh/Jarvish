const fs = require('fs');
const path = require('path');

class AccessibilityReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.results = {
      startTime: new Date().toISOString(),
      tests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0
      },
      accessibilityIssues: [],
      colorContrastIssues: [],
      visualRegressionFailures: []
    };
  }

  onRunStart() {
    console.log('\n🔍 Starting Puppeteer Accessibility Tests...\n');
  }

  onTestResult(test, testResult) {
    const { testResults } = testResult;
    
    testResults.forEach(result => {
      this.results.tests.push({
        title: result.title,
        fullName: result.fullName,
        status: result.status,
        duration: result.duration,
        failureMessages: result.failureMessages
      });
      
      this.results.summary.total++;
      
      if (result.status === 'passed') {
        this.results.summary.passed++;
        console.log(`✅ ${result.fullName}`);
      } else if (result.status === 'failed') {
        this.results.summary.failed++;
        console.log(`❌ ${result.fullName}`);
        
        // Extract accessibility issues from failure messages
        result.failureMessages.forEach(msg => {
          if (msg.includes('accessibility')) {
            this.results.accessibilityIssues.push({
              test: result.fullName,
              message: msg
            });
          }
          if (msg.includes('color contrast') || msg.includes('contrast ratio')) {
            this.results.colorContrastIssues.push({
              test: result.fullName,
              message: msg
            });
          }
        });
      } else {
        this.results.summary.skipped++;
        console.log(`⏭️  ${result.fullName}`);
      }
    });
  }

  onRunComplete() {
    this.results.endTime = new Date().toISOString();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⏭️  Skipped: ${this.results.summary.skipped}`);
    
    if (this.results.accessibilityIssues.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('♿ ACCESSIBILITY ISSUES FOUND');
      console.log('='.repeat(60));
      this.results.accessibilityIssues.forEach(issue => {
        console.log(`\n❗ ${issue.test}`);
        console.log(`   ${issue.message.substring(0, 200)}...`);
      });
    }
    
    if (this.results.colorContrastIssues.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('🎨 COLOR CONTRAST ISSUES');
      console.log('='.repeat(60));
      this.results.colorContrastIssues.forEach(issue => {
        console.log(`\n❗ ${issue.test}`);
        console.log(`   ${issue.message.substring(0, 200)}...`);
      });
    }
    
    // Generate HTML report
    this.generateHTMLReport();
    
    // Save JSON report
    if (this._options.outputPath) {
      const dir = path.dirname(this._options.outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const jsonPath = this._options.outputPath.replace('.html', '.json');
      fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));
      console.log(`\n📁 JSON report saved to: ${jsonPath}`);
    }
  }

  generateHTMLReport() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
      background: white; 
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    .header p {
      opacity: 0.9;
      font-size: 1.1em;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 30px;
      background: #f8f9fa;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    .summary-card:hover {
      transform: translateY(-5px);
    }
    .summary-card .value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .summary-card.passed .value { color: #28a745; }
    .summary-card.failed .value { color: #dc3545; }
    .summary-card.skipped .value { color: #ffc107; }
    .summary-card.total .value { color: #007bff; }
    .content {
      padding: 30px;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      color: #333;
      border-bottom: 3px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .test-result {
      background: #f8f9fa;
      border-left: 4px solid #28a745;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 5px;
      transition: all 0.3s;
    }
    .test-result:hover {
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .test-result.failed {
      border-left-color: #dc3545;
      background: #fff5f5;
    }
    .test-result.skipped {
      border-left-color: #ffc107;
      background: #fffdf5;
    }
    .test-result .title {
      font-weight: bold;
      margin-bottom: 5px;
    }
    .test-result .duration {
      color: #666;
      font-size: 0.9em;
    }
    .test-result .failure {
      margin-top: 10px;
      padding: 10px;
      background: white;
      border-radius: 5px;
      color: #dc3545;
      font-family: monospace;
      font-size: 0.9em;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .issue-card {
      background: #fff3cd;
      border: 1px solid #ffeeba;
      padding: 20px;
      margin-bottom: 15px;
      border-radius: 10px;
    }
    .issue-card h3 {
      color: #856404;
      margin-bottom: 10px;
    }
    .issue-card p {
      color: #666;
    }
    .footer {
      background: #f8f9fa;
      padding: 20px;
      text-align: center;
      color: #666;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: bold;
      margin-left: 10px;
    }
    .badge.passed { background: #d4edda; color: #155724; }
    .badge.failed { background: #f8d7da; color: #721c24; }
    .badge.skipped { background: #fff3cd; color: #856404; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Puppeteer Accessibility Test Report</h1>
      <p>Generated: ${new Date(this.results.startTime).toLocaleString()}</p>
    </div>
    
    <div class="summary">
      <div class="summary-card total">
        <div class="value">${this.results.summary.total}</div>
        <div class="label">Total Tests</div>
      </div>
      <div class="summary-card passed">
        <div class="value">${this.results.summary.passed}</div>
        <div class="label">Passed</div>
      </div>
      <div class="summary-card failed">
        <div class="value">${this.results.summary.failed}</div>
        <div class="label">Failed</div>
      </div>
      <div class="summary-card skipped">
        <div class="value">${this.results.summary.skipped}</div>
        <div class="label">Skipped</div>
      </div>
    </div>
    
    <div class="content">
      ${this.results.accessibilityIssues.length > 0 ? `
        <div class="section">
          <h2>♿ Accessibility Issues</h2>
          ${this.results.accessibilityIssues.map(issue => `
            <div class="issue-card">
              <h3>${issue.test}</h3>
              <p>${this.escapeHtml(issue.message)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${this.results.colorContrastIssues.length > 0 ? `
        <div class="section">
          <h2>🎨 Color Contrast Issues</h2>
          ${this.results.colorContrastIssues.map(issue => `
            <div class="issue-card">
              <h3>${issue.test}</h3>
              <p>${this.escapeHtml(issue.message)}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div class="section">
        <h2>📋 Test Results</h2>
        ${this.results.tests.map(test => `
          <div class="test-result ${test.status}">
            <div class="title">
              ${test.fullName}
              <span class="badge ${test.status}">${test.status.toUpperCase()}</span>
            </div>
            <div class="duration">Duration: ${test.duration}ms</div>
            ${test.failureMessages && test.failureMessages.length > 0 ? `
              <div class="failure">${this.escapeHtml(test.failureMessages.join('\n'))}</div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="footer">
      <p>Test execution completed in ${this.calculateDuration()} seconds</p>
      <p>Powered by Puppeteer & Jest</p>
    </div>
  </div>
</body>
</html>`;
    
    if (this._options.outputPath) {
      fs.writeFileSync(this._options.outputPath, html);
      console.log(`\n📄 HTML report saved to: ${this._options.outputPath}`);
    }
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  calculateDuration() {
    if (this.results.startTime && this.results.endTime) {
      const start = new Date(this.results.startTime).getTime();
      const end = new Date(this.results.endTime).getTime();
      return ((end - start) / 1000).toFixed(2);
    }
    return '0';
  }
}

module.exports = AccessibilityReporter;