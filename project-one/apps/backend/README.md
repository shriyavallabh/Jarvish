# Jarvish Backend API

Multi-tenant SaaS backend for financial advisory content management with AI-powered compliance checking.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker (for PostgreSQL and Redis)
- npm or yarn

### Setup Instructions

1. **Install Dependencies**
```bash
npm install
```

2. **Start Database Services**
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or manually with Docker
docker run --name jarvish-postgres -e POSTGRES_DB=jarvish_db -e POSTGRES_USER=jarvish_user -e POSTGRES_PASSWORD=secure_password_123 -p 5432:5432 -d postgres:15-alpine
docker run --name jarvish-redis -p 6379:6379 -d redis:7-alpine
```

3. **Configure Environment**
- Copy `.env.example` to `.env` (if not already done)
- Update database credentials if changed
- Add your OpenAI API key for AI features

4. **Setup Database**
```bash
# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# Or run migrations (for production)
npm run prisma:migrate
```

5. **Start Development Server**
```bash
npm run dev
```

Server will start on http://localhost:8000

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts           # Main server file
│   ├── routes/             # API route definitions
│   │   ├── auth.routes.ts  # Authentication endpoints
│   │   ├── content.routes.ts # Content management
│   │   └── index.ts        # Route aggregator
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.ts # JWT authentication
│   │   └── validation.middleware.ts # Request validation
│   ├── services/           # Business logic
│   ├── controllers/        # Route controllers
│   ├── utils/              # Utility functions
│   │   ├── database.ts     # Prisma client
│   │   └── redis.ts        # Redis utilities
│   └── types/              # TypeScript types
├── prisma/
│   └── schema.prisma       # Database schema
├── tests/                  # Test files
├── docker-compose.yml      # Docker services
├── .env                    # Environment variables
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies

```

## 🔑 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new advisor
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/profile` - Get profile
- `PATCH /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Content Management
- `POST /api/v1/content` - Create content
- `GET /api/v1/content` - List content (paginated)
- `GET /api/v1/content/:id` - Get single content
- `PATCH /api/v1/content/:id` - Update content
- `DELETE /api/v1/content/:id` - Delete content
- `POST /api/v1/content/:id/submit-compliance` - Submit for compliance
- `GET /api/v1/content/stats/overview` - Get statistics

### Health Checks
- `GET /health` - Application health status
- `GET /ready` - Readiness probe

## 🔒 Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 🎯 Features

### Multi-Tenant Architecture
- Supports 150-300 advisors
- Isolated data per advisor
- Tier-based access control (Basic, Standard, Pro, Enterprise)

### Security Features
- JWT authentication with refresh tokens
- Rate limiting based on subscription tier
- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection
- CORS configuration

### Database Schema
- **Advisors**: User accounts with business info
- **Content**: Multi-language content management
- **Compliance**: Three-stage approval workflow
- **WhatsApp**: Message tracking and delivery
- **Subscriptions**: Billing and tier management
- **Analytics**: Event tracking and metrics
- **Audit Logs**: Complete action history

### Caching Strategy
- Redis for session management
- Content caching for performance
- Rate limiting counters
- Queue management for background jobs

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Register
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all production environment variables are set:
- Database credentials
- JWT secrets (generate secure random strings)
- API keys (OpenAI, WhatsApp)
- CORS origins

### Database Migrations
```bash
npm run prisma:migrate deploy
```

## 📊 Monitoring

### Prisma Studio
View and manage database data:
```bash
npm run prisma:studio
```
Access at http://localhost:5555

### Logs
- Development: Console output with detailed logs
- Production: Structured JSON logs

## 🔧 Troubleshooting

### Database Connection Issues
1. Check Docker containers: `docker ps`
2. Verify `.env` DATABASE_URL
3. Test connection: `npm run prisma:generate`

### Redis Connection Issues
1. Check Redis container: `docker ps | grep redis`
2. Test connection: `redis-cli ping`

### Port Already in Use
Change PORT in `.env` file

## 📝 Next Steps

1. **Implement AI Services**
   - OpenAI integration for content generation
   - Compliance checking logic
   - Content improvement suggestions

2. **Add WhatsApp Integration**
   - WhatsApp Business API setup
   - Message template management
   - Delivery tracking

3. **Implement Analytics**
   - Usage tracking
   - Performance metrics
   - Advisor insights

4. **Add Payment Integration**
   - Razorpay webhook handling
   - Subscription management
   - Usage limits enforcement

5. **Setup Monitoring**
   - Error tracking (Sentry)
   - Performance monitoring
   - Uptime monitoring

## 📚 API Documentation

Full API documentation available at:
- Development: http://localhost:8000/api/v1
- Production: https://api.jarvish.ai/docs

## 🤝 Support

For issues or questions, please refer to the main project documentation or contact the development team.