import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

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

// Basic API info
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'Jarvish API v1',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/v1/auth (coming soon)',
      content: '/api/v1/content (coming soon)',
      compliance: '/api/v1/compliance (coming soon)',
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