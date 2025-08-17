import { Router } from 'express';
import authRoutes from './auth.routes';
import contentRoutes from './content.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/content', contentRoutes);

// API documentation endpoint
router.get('/', (_req, res) => {
  res.json({
    message: 'Jarvish API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/v1/auth/register',
        login: 'POST /api/v1/auth/login',
        refresh: 'POST /api/v1/auth/refresh',
        logout: 'POST /api/v1/auth/logout',
        profile: 'GET /api/v1/auth/profile',
        updateProfile: 'PATCH /api/v1/auth/profile',
        changePassword: 'POST /api/v1/auth/change-password',
      },
      content: {
        create: 'POST /api/v1/content',
        list: 'GET /api/v1/content',
        get: 'GET /api/v1/content/:id',
        update: 'PATCH /api/v1/content/:id',
        delete: 'DELETE /api/v1/content/:id',
        submitCompliance: 'POST /api/v1/content/:id/submit-compliance',
        stats: 'GET /api/v1/content/stats/overview',
      },
    },
    authentication: 'Bearer token in Authorization header',
    documentation: 'https://api.jarvish.ai/docs',
  });
});

export default router;