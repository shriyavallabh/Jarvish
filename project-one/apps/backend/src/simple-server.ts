import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import complianceRoutes from './routes/compliance';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Mount compliance routes
app.use('/api/compliance', complianceRoutes);
app.use('/api/v1/compliance', complianceRoutes);

// Basic API info
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Jarvish API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth (coming soon)',
      content: '/api/v1/content (coming soon)',
      compliance: {
        check: 'POST /api/compliance/check - Real-time compliance checking',
        generate: 'POST /api/compliance/generate - Generate compliant content',
        stats: 'GET /api/compliance/stats - Usage statistics',
        batch: 'POST /api/compliance/batch - Batch compliance check',
        rules: 'GET /api/compliance/rules - Get compliance rules',
        fix: 'POST /api/compliance/fix - Auto-fix compliance issues',
        health: 'GET /api/compliance/health - Service health check'
      },
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Jarvish Backend Server Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
🔗 Base URL: http://localhost:${PORT}
📊 Health Check: http://localhost:${PORT}/health
🔑 API Base: http://localhost:${PORT}/api/v1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});