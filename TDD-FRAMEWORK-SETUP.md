# JARVISH TEST-DRIVEN DEVELOPMENT FRAMEWORK
## Comprehensive Testing Infrastructure for Financial Advisory Platform

### **Document Version**: 1.0  
### **Created**: 2025-08-19  
### **Testing Strategy**: Test-First Development  
### **Frameworks**: Python (pytest) + JavaScript (Jest) + Puppeteer (UI)  

---

## 🎯 **TDD PHILOSOPHY & APPROACH**

### **Red-Green-Refactor Cycle**
```
🔴 RED: Write a failing test first
🟢 GREEN: Write minimal code to pass the test  
🔵 REFACTOR: Improve code while keeping tests green
```

### **Testing Pyramid for Jarvish**
```
           🔺 E2E Tests (10%)
          📱 Puppeteer + Playwright
         Financial Workflows
        
      🔷 Integration Tests (30%)
     🔗 API + Database + Services
    Financial Services Integration
   
 🟦 Unit Tests (60%)
🧮 Pure Functions + Components
Business Logic + Validation
```

### **Financial Services Testing Priorities**
1. **SEBI Compliance**: 100% test coverage for regulatory features
2. **Data Integrity**: Financial calculations must be error-free
3. **Security**: Authentication and authorization thoroughly tested
4. **Performance**: Mobile-first Indian market optimization
5. **Accessibility**: WCAG 2.1 AA compliance for inclusive design

---

## 🏗️ **TECHNOLOGY STACK**

### **Python Testing Stack**
```python
# Core Testing
pytest==7.4.3                    # Primary test runner
pytest-asyncio==0.21.1          # Async test support
pytest-cov==4.1.0               # Coverage reporting
pytest-mock==3.12.0             # Mocking utilities
pytest-xdist==3.3.1             # Parallel test execution

# Financial Services Specific
pytest-benchmark==4.0.0          # Performance benchmarking
pytest-postgresql==5.0.0         # Database testing
pytest-redis==3.0.2             # Cache testing
pytest-httpx==0.26.0            # HTTP client testing

# Security & Compliance
bandit==1.7.5                   # Security linting
safety==2.3.5                   # Dependency security
pytest-security==0.2.0          # Security testing

# Data Validation
cerberus==1.3.4                 # Schema validation
faker==20.1.0                   # Test data generation
factory-boy==3.3.0              # Model factories
```

### **JavaScript Testing Stack**
```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.1.4",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^14.5.1",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "supertest": "^6.3.3",
    "puppeteer": "^21.5.2",
    "playwright": "^1.40.0",
    "artillery": "^2.0.3",
    "lighthouse": "^11.3.0"
  }
}
```

### **UI Testing Stack**
```javascript
// Puppeteer Configuration
const puppeteerConfig = {
  launch: {
    headless: process.env.CI === 'true',
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  },
  viewport: {
    width: 1920,
    height: 1080
  }
};

// Playwright Configuration  
const playwrightConfig = {
  browsers: ['chromium', 'firefox', 'webkit'],
  devices: ['Desktop', 'Tablet', 'Mobile'],
  compliance: ['SEBI', 'DPDP', 'WCAG']
};
```

---

## 🧪 **TEST FRAMEWORK STRUCTURE**

### **Directory Structure**
```
tests/
├── unit/                     # Unit tests (60% of tests)
│   ├── backend/
│   │   ├── test_auth.py     # Authentication logic
│   │   ├── test_content.py  # Content generation
│   │   ├── test_compliance.py # SEBI compliance
│   │   └── test_whatsapp.py # WhatsApp integration
│   ├── frontend/
│   │   ├── components/      # React component tests
│   │   ├── hooks/          # Custom hooks tests
│   │   └── utils/          # Utility function tests
│   └── shared/
│       ├── validators/      # Data validation tests
│       └── utils/          # Shared utilities
├── integration/             # Integration tests (30%)
│   ├── api/                # API endpoint tests
│   ├── database/           # Database integration
│   ├── external/           # Third-party integrations
│   └── workflows/          # End-to-end workflows
├── e2e/                    # End-to-end tests (10%)
│   ├── advisor/            # Advisor user journeys
│   ├── admin/              # Admin workflows
│   └── compliance/         # Compliance scenarios
├── performance/            # Performance tests
│   ├── load/               # Load testing
│   ├── stress/             # Stress testing
│   └── mobile/             # Mobile performance
├── security/               # Security tests
│   ├── auth/               # Authentication security
│   ├── data/               # Data protection
│   └── compliance/         # SEBI compliance security
├── fixtures/               # Test data and fixtures
│   ├── advisors/           # Sample advisor data
│   ├── content/            # Sample content
│   └── compliance/         # SEBI test scenarios
└── utils/                  # Test utilities
    ├── factories/          # Data factories
    ├── mocks/              # Mock services
    └── helpers/            # Test helpers
```

### **Test Configuration Files**

#### **pytest.ini**
```ini
[tool:pytest]
testpaths = tests
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
addopts = 
    --strict-markers
    --strict-config
    --cov=src
    --cov-report=html
    --cov-report=term-missing
    --cov-report=xml
    --cov-fail-under=80
    --durations=10
    --tb=short
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    security: Security tests
    compliance: SEBI compliance tests
    performance: Performance tests
    mobile: Mobile-specific tests
    slow: Slow running tests
    critical: Critical functionality tests
```

#### **jest.config.js**
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx'
  ]
};
```

---

## 🧬 **FINANCIAL SERVICES TEST PATTERNS**

### **SEBI Compliance Testing Pattern**
```python
# tests/unit/compliance/test_sebi_validation.py
import pytest
from src.compliance.sebi_validator import SEBIValidator
from src.exceptions import ComplianceViolationError

class TestSEBICompliance:
    
    @pytest.fixture
    def validator(self):
        return SEBIValidator()
    
    @pytest.fixture
    def compliant_content(self):
        return {
            "text": "SIP investments help in wealth creation. Mutual fund investments are subject to market risks. Please read scheme documents carefully.",
            "advisor_euin": "E123456789",
            "content_type": "educational"
        }
    
    @pytest.fixture  
    def non_compliant_content(self):
        return {
            "text": "Guaranteed 20% returns in mutual funds! Invest now!",
            "advisor_euin": "E123456789", 
            "content_type": "promotional"
        }
    
    def test_compliant_content_passes_validation(self, validator, compliant_content):
        """Test that SEBI-compliant content passes validation"""
        # Act
        result = validator.validate_content(compliant_content)
        
        # Assert
        assert result.is_compliant is True
        assert result.compliance_score >= 95
        assert result.violations == []
        assert "market risks" in result.required_disclaimers
    
    def test_guaranteed_returns_triggers_violation(self, validator, non_compliant_content):
        """Test that guaranteed returns promise triggers SEBI violation"""
        # Act & Assert
        with pytest.raises(ComplianceViolationError) as exc_info:
            validator.validate_content(non_compliant_content)
        
        assert "guaranteed returns" in str(exc_info.value).lower()
        assert exc_info.value.violation_code == "SEBI_001"
    
    def test_missing_risk_disclaimer_flagged(self, validator):
        """Test that missing risk disclaimer is flagged"""
        # Arrange
        content_without_disclaimer = {
            "text": "SIP investments are good for wealth creation.",
            "advisor_euin": "E123456789",
            "content_type": "educational"
        }
        
        # Act
        result = validator.validate_content(content_without_disclaimer)
        
        # Assert
        assert result.is_compliant is False
        assert any("risk disclaimer" in v.description for v in result.violations)
    
    @pytest.mark.parametrize("euin,expected", [
        ("E123456789", True),   # Valid EUIN format
        ("123456789", False),   # Missing E prefix
        ("E12345", False),      # Too short
        ("EINVALID", False),    # Invalid format
    ])
    def test_euin_validation(self, validator, euin, expected):
        """Test EUIN format validation"""
        result = validator.validate_euin(euin)
        assert result.is_valid == expected
```

### **WhatsApp Integration Testing Pattern**
```python
# tests/integration/whatsapp/test_message_delivery.py
import pytest
import asyncio
from unittest.mock import AsyncMock, patch
from src.whatsapp.client import WhatsAppBusinessClient
from src.exceptions import DeliveryFailureError

class TestWhatsAppIntegration:
    
    @pytest.fixture
    def whatsapp_client(self):
        return WhatsAppBusinessClient(
            phone_number_id="test_phone_id",
            access_token="test_token"
        )
    
    @pytest.fixture
    def sample_message(self):
        return {
            "recipient": "+919876543210",
            "message": "Your SIP investment of ₹5,000 has been processed successfully.",
            "template_name": "investment_confirmation",
            "advisor_id": "ADV123"
        }
    
    @pytest.mark.asyncio
    async def test_successful_message_delivery(self, whatsapp_client, sample_message):
        """Test successful WhatsApp message delivery"""
        # Arrange
        with patch('src.whatsapp.client.httpx.AsyncClient') as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 200
            mock_response.json.return_value = {
                "messages": [{"id": "msg_123", "message_status": "sent"}]
            }
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            # Act
            result = await whatsapp_client.send_message(sample_message)
            
            # Assert
            assert result.success is True
            assert result.message_id == "msg_123"
            assert result.status == "sent"
    
    @pytest.mark.asyncio
    async def test_rate_limiting_handling(self, whatsapp_client, sample_message):
        """Test rate limiting graceful handling"""
        # Arrange
        with patch('src.whatsapp.client.httpx.AsyncClient') as mock_client:
            mock_response = AsyncMock()
            mock_response.status_code = 429
            mock_response.json.return_value = {"error": "Rate limit exceeded"}
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            # Act & Assert
            with pytest.raises(DeliveryFailureError) as exc_info:
                await whatsapp_client.send_message(sample_message)
            
            assert "rate limit" in str(exc_info.value).lower()
    
    @pytest.mark.asyncio
    async def test_bulk_message_delivery(self, whatsapp_client):
        """Test bulk message delivery with proper batching"""
        # Arrange
        messages = [
            {"recipient": f"+91987654321{i}", "message": f"Message {i}"}
            for i in range(100)
        ]
        
        with patch.object(whatsapp_client, 'send_message') as mock_send:
            mock_send.return_value = AsyncMock(success=True, message_id=f"msg_{i}")
            
            # Act
            results = await whatsapp_client.send_bulk_messages(messages)
            
            # Assert
            assert len(results) == 100
            assert all(r.success for r in results)
            # Verify batching (max 1000 requests per second)
            assert mock_send.call_count == 100
```

### **AI Content Generation Testing Pattern**
```python
# tests/unit/ai/test_content_generation.py
import pytest
from unittest.mock import patch, Mock
from src.ai.content_generator import ContentGenerator
from src.models.advisor import Advisor
from src.exceptions import ContentGenerationError

class TestContentGeneration:
    
    @pytest.fixture
    def content_generator(self):
        return ContentGenerator(model="claude-3-sonnet")
    
    @pytest.fixture
    def sample_advisor(self):
        return Advisor(
            id="ADV123",
            name="Rajesh Kumar",
            euin="E123456789",
            specialization="equity_funds",
            language_preference="hindi_english",
            client_demographics={"avg_age": 32, "avg_income": 500000}
        )
    
    @pytest.fixture
    def content_request(self):
        return {
            "content_type": "educational",
            "topic": "sip_benefits",
            "language": "hindi_english",
            "length": "medium",
            "personalization": True
        }
    
    def test_sip_educational_content_generation(self, content_generator, sample_advisor, content_request):
        """Test generation of SIP educational content"""
        # Arrange
        with patch('src.ai.claude_client.generate') as mock_generate:
            mock_generate.return_value = {
                "content": "SIP क्या है? SIP (Systematic Investment Plan) एक अच्छा तरीका है wealth creation के लिए। Mutual fund investments are subject to market risks.",
                "confidence": 0.95,
                "compliance_score": 98
            }
            
            # Act
            result = content_generator.generate_content(
                advisor=sample_advisor,
                request=content_request
            )
            
            # Assert
            assert result.content is not None
            assert "SIP" in result.content
            assert "market risks" in result.content
            assert result.compliance_score >= 95
            assert result.language_mix == "hindi_english"
            assert result.generation_time < 3.0  # <3 seconds requirement
    
    def test_content_personalization_for_young_professionals(self, content_generator, sample_advisor, content_request):
        """Test content personalization for young professional demographic"""
        # Arrange
        sample_advisor.client_demographics = {"avg_age": 28, "profession": "IT"}
        
        with patch('src.ai.claude_client.generate') as mock_generate:
            mock_generate.return_value = {
                "content": "Tech professionals के लिए SIP एक smart choice है। Monthly ₹5,000 SIP से 20 years में crores बना सकते हैं।",
                "confidence": 0.93,
                "compliance_score": 97
            }
            
            # Act
            result = content_generator.generate_content(
                advisor=sample_advisor, 
                request=content_request
            )
            
            # Assert
            assert "tech professionals" in result.content.lower()
            assert "₹" in result.content  # Indian currency
            assert result.personalization_applied is True
    
    def test_cost_optimization_model_selection(self, content_generator, content_request):
        """Test that cost optimization selects appropriate AI model"""
        # Arrange
        content_request["complexity"] = "simple"
        
        with patch('src.ai.model_selector.select_optimal_model') as mock_selector:
            mock_selector.return_value = "gpt-3.5-turbo"  # Cheaper model
            
            # Act
            content_generator.generate_content(
                advisor=sample_advisor,
                request=content_request
            )
            
            # Assert
            mock_selector.assert_called_once()
            args = mock_selector.call_args[1]
            assert args["complexity"] == "simple"
            assert args["cost_optimization"] is True
    
    @pytest.mark.performance
    def test_content_generation_performance(self, content_generator, sample_advisor, content_request):
        """Test content generation meets performance requirements"""
        import time
        
        # Arrange
        with patch('src.ai.claude_client.generate') as mock_generate:
            mock_generate.return_value = {
                "content": "Sample content for performance testing",
                "confidence": 0.9,
                "compliance_score": 95
            }
            
            # Act
            start_time = time.time()
            result = content_generator.generate_content(
                advisor=sample_advisor,
                request=content_request
            )
            end_time = time.time()
            
            # Assert
            assert (end_time - start_time) < 3.0  # Must be <3 seconds
            assert result.generation_time < 3.0
```

### **Mobile Responsiveness Testing Pattern**
```javascript
// tests/e2e/mobile/advisor_dashboard_mobile.test.js
const puppeteer = require('puppeteer');

describe('Advisor Dashboard Mobile Responsiveness', () => {
  let browser;
  let page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: 50
    });
    page = await browser.newPage();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  const MOBILE_VIEWPORTS = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 }
  ];
  
  MOBILE_VIEWPORTS.forEach(viewport => {
    describe(`${viewport.name} (${viewport.width}x${viewport.height})`, () => {
      beforeEach(async () => {
        await page.setViewport(viewport);
        await page.goto('http://localhost:3000/advisor/dashboard');
        await page.waitForLoadState('networkidle');
      });
      
      test('dashboard loads and displays key metrics', async () => {
        // Check for mobile dashboard layout
        const mobileLayout = await page.$('[data-testid="mobile-dashboard"]');
        expect(mobileLayout).toBeTruthy();
        
        // Verify key metrics are visible
        const metrics = await page.$$('[data-testid="metric-card"]');
        expect(metrics.length).toBeGreaterThan(0);
        
        // Check for horizontal scrolling issues
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewport.width);
      });
      
      test('content generation button is accessible', async () => {
        const generateButton = await page.$('[data-testid="generate-content-mobile"]');
        expect(generateButton).toBeTruthy();
        
        // Verify button size meets accessibility requirements (44px minimum)
        const buttonSize = await page.evaluate((button) => {
          const rect = button.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }, generateButton);
        
        expect(buttonSize.width).toBeGreaterThanOrEqual(44);
        expect(buttonSize.height).toBeGreaterThanOrEqual(44);
      });
      
      test('WhatsApp preview works on mobile', async () => {
        // Generate content
        await page.tap('[data-testid="generate-content-mobile"]');
        await page.waitForSelector('[data-testid="content-preview"]');
        
        // Open WhatsApp preview
        await page.tap('[data-testid="whatsapp-preview-button"]');
        await page.waitForSelector('[data-testid="whatsapp-mobile-preview"]');
        
        // Verify preview is properly sized for mobile
        const preview = await page.$('[data-testid="whatsapp-mobile-preview"]');
        const previewWidth = await page.evaluate((el) => 
          el.getBoundingClientRect().width, preview
        );
        
        expect(previewWidth).toBeLessThanOrEqual(viewport.width - 32); // Account for padding
      });
      
      test('SEBI compliance disclaimer visible on mobile', async () => {
        const disclaimer = await page.$('[data-testid="sebi-disclaimer"]');
        expect(disclaimer).toBeTruthy();
        
        // Verify disclaimer text is readable (minimum 12px)
        const fontSize = await page.evaluate((el) => 
          window.getComputedStyle(el).fontSize, disclaimer
        );
        
        const fontSizeNum = parseInt(fontSize.replace('px', ''));
        expect(fontSizeNum).toBeGreaterThanOrEqual(12);
      });
      
      test('navigation menu works on mobile', async () => {
        // Test hamburger menu
        const menuButton = await page.$('[data-testid="mobile-menu-button"]');
        expect(menuButton).toBeTruthy();
        
        await page.tap('[data-testid="mobile-menu-button"]');
        await page.waitForSelector('[data-testid="mobile-menu"]');
        
        // Verify menu items are accessible
        const menuItems = await page.$$('[data-testid="mobile-menu-item"]');
        expect(menuItems.length).toBeGreaterThan(0);
        
        // Test menu item interaction
        await page.tap('[data-testid="mobile-menu-item"]:first-child');
        await page.waitForNavigation();
        
        expect(page.url()).not.toContain('/dashboard');
      });
    });
  });
  
  test('performance on mobile network simulation', async () => {
    // Simulate 3G network (common in Indian tier 2/3 cities)
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 150 // 150ms
    });
    
    await page.setViewport({ width: 375, height: 667 });
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000/advisor/dashboard');
    await page.waitForSelector('[data-testid="dashboard-loaded"]');
    const loadTime = Date.now() - startTime;
    
    // Must load in <3 seconds on 3G
    expect(loadTime).toBeLessThan(3000);
  });
});
```

---

## 🚀 **TDD IMPLEMENTATION WORKFLOW**

### **Step 1: Write Failing Tests First**
```bash
# Create test file
touch tests/unit/test_advisor_registration.py

# Write failing test
pytest tests/unit/test_advisor_registration.py::test_valid_euin_registration
# ❌ FAIL: No implementation yet
```

### **Step 2: Implement Minimal Code**
```python
# src/services/advisor_service.py
def register_advisor(advisor_data):
    # Minimal implementation to pass test
    if advisor_data.get('euin', '').startswith('E'):
        return {"success": True, "advisor_id": "ADV123"}
    raise ValidationError("Invalid EUIN")
```

### **Step 3: Run Test and Verify Green**
```bash
pytest tests/unit/test_advisor_registration.py::test_valid_euin_registration
# ✅ PASS: Minimal implementation works
```

### **Step 4: Refactor and Improve**
```python
# src/services/advisor_service.py
def register_advisor(advisor_data):
    # Improved implementation with proper validation
    validator = EUINValidator()
    if not validator.validate(advisor_data.get('euin')):
        raise ValidationError("Invalid EUIN format")
    
    # Save to database
    advisor = Advisor.create(advisor_data)
    return {"success": True, "advisor_id": advisor.id}
```

### **Step 5: Run All Tests**
```bash
pytest tests/unit/test_advisor_registration.py
# ✅ All tests pass with improved implementation
```

---

## 📊 **TESTING METRICS & COVERAGE**

### **Coverage Requirements**
- **Unit Tests**: 85% minimum coverage
- **Integration Tests**: 80% critical path coverage  
- **E2E Tests**: 90% user journey coverage
- **Security Tests**: 100% authentication/authorization
- **Compliance Tests**: 100% SEBI regulatory features

### **Performance Benchmarks**
- **Unit Tests**: <100ms per test
- **Integration Tests**: <5 seconds per test
- **E2E Tests**: <30 seconds per workflow
- **Load Tests**: 1000 concurrent users
- **Mobile Tests**: <3 seconds load time on 3G

### **Quality Gates**
- All tests must pass before merge
- Coverage thresholds must be met
- Security scans must be clean
- Performance benchmarks must be maintained
- SEBI compliance tests must achieve 100%

---

## 🔧 **CI/CD INTEGRATION**

### **GitHub Actions Workflow**
```yaml
name: TDD Pipeline

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      - name: Run unit tests
        run: pytest tests/unit/ --cov=src --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  integration-tests:
    needs: unit-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup services
        run: docker-compose up -d postgres redis
      - name: Run integration tests
        run: pytest tests/integration/
  
  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Playwright
        run: npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e
  
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run security scan
        run: |
          bandit -r src/
          safety check
          npm audit
```

---

## 📚 **TESTING BEST PRACTICES**

### **Financial Services Specific**
1. **Decimal Precision**: Use `decimal.Decimal` for financial calculations
2. **Currency Handling**: Test with Indian Rupee formatting
3. **Regulatory Compliance**: Every SEBI rule must have corresponding tests
4. **Data Privacy**: Test DPDP Act compliance scenarios
5. **Multi-language**: Test Hindi/English content generation

### **Test Data Management**
1. **Factories**: Use factory-boy for creating test data
2. **Fixtures**: Reusable test data via pytest fixtures
3. **Mocking**: Mock external APIs (SEBI, WhatsApp, AI services)
4. **Anonymization**: Use fake data for testing, never real advisor data
5. **Cleanup**: Ensure tests clean up after themselves

### **Performance Testing**
1. **Indian Networks**: Test on simulated 3G/4G speeds
2. **Mobile First**: Prioritize mobile performance
3. **API Limits**: Test WhatsApp rate limiting
4. **AI Costs**: Monitor token usage in tests
5. **Database**: Test with realistic data volumes

---

*This TDD framework ensures Jarvish is built with quality, compliance, and reliability from day one, following financial services best practices and test-first development principles.*