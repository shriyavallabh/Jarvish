# Frontend State Management & API Integration

## ✅ Implementation Complete

### Installed Dependencies
- **zustand**: Global state management
- **axios**: HTTP client with interceptors
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling
- **@hookform/resolvers**: Form validation resolvers
- **zod**: Schema validation
- **@radix-ui/react-toast**: Toast foundation
- **sonner**: Toast notifications

### Created Files

#### 1. **API Layer** (`/lib/api/`)
- `client.ts`: Axios client with token management and interceptors

#### 2. **State Management** (`/lib/store/`)
- `auth-store.ts`: Authentication state with persistence
- `content-store.ts`: Content management state

#### 3. **Type Definitions** (`/lib/types/`)
- `api.ts`: Comprehensive API types for type-safe development

#### 4. **Custom Hooks** (`/lib/hooks/`)
- `use-api.ts`: API hooks with React Query integration
- `use-compliance.ts`: Real-time compliance checking hooks
- `use-form.ts`: Enhanced form handling with validation

#### 5. **Validation Schemas** (`/lib/validations/`)
- `auth.ts`: Authentication form validations
- `content.ts`: Content creation validations

#### 6. **Providers** (`/lib/providers/`)
- `query-provider.tsx`: React Query configuration
- `auth-provider.tsx`: Authentication route protection

#### 7. **Testing Components** (`/components/test/`)
- `state-test.tsx`: Comprehensive state testing component

## Testing Instructions

### 1. Test State Management UI
Visit: http://localhost:3000/test-state

This page includes:
- Auth Store testing (login/logout simulation)
- Content Store testing (fetch operations)
- Compliance checking (real-time validation)
- Form validation testing

### 2. Test Authentication Flow
```javascript
// In browser console at test page:
// 1. Send OTP
const authStore = window.__ZUSTAND_AUTH_STORE__;
await authStore.getState().sendOtp('9876543210');

// 2. Verify OTP
await authStore.getState().verifyOtp('9876543210', '123456');

// 3. Check auth status
console.log(authStore.getState().isAuthenticated);
```

### 3. Test API Client
```javascript
// Test API calls with automatic token handling
import { api } from '@/lib/api/client';

// GET request
const data = await api.get('/content');

// POST with data
const newContent = await api.post('/content', {
  title: 'Test',
  body: 'Content body',
  type: 'market_update'
});
```

### 4. Test Compliance Checking
The compliance hook automatically debounces input and checks with the backend:
```javascript
// In any component
const { riskScore, flags, suggestions } = useComplianceCheck(
  text,
  'market_update',
  'en'
);
```

## Integration with Backend

### Environment Variables
Configure in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_COMPLIANCE_API_URL=http://localhost:3002/api
```

### Authentication Flow
1. User enters phone → `sendOtp()`
2. Backend sends OTP via SMS
3. User enters OTP → `verifyOtp()`
4. Backend validates & returns JWT
5. Token stored in localStorage & Zustand
6. All API calls include Bearer token

### Protected Routes
The `AuthProvider` automatically:
- Redirects unauthenticated users to `/login`
- Redirects authenticated users from `/login` to dashboard
- Checks token validity on mount

## Key Features

### 1. Automatic Token Management
- Tokens persist across sessions
- Auto-refresh on 401 responses
- Secure storage in localStorage

### 2. Real-time Compliance
- Debounced text checking (<500ms)
- Visual risk indicators
- Suggestion display

### 3. Optimistic Updates
- UI updates before server confirmation
- Rollback on failure
- Loading states for all operations

### 4. Form Validation
- Zod schema validation
- Type-safe form handling
- Error display per field

### 5. Toast Notifications
- Success/error feedback
- Customizable duration
- Rich formatting support

## Backend Integration Checklist

✅ Frontend Ready for:
- [ ] User authentication endpoints
- [ ] Content CRUD operations
- [ ] Compliance checking API
- [ ] Analytics data fetching
- [ ] Real-time WebSocket events
- [ ] File upload handling

## Performance Optimizations

1. **Query Caching**: 1-minute stale time
2. **Debounced Compliance**: 500ms delay
3. **Lazy Loading**: Components load on demand
4. **Persistent Auth**: No re-login required
5. **Optimistic UI**: Instant feedback

## Next Steps

1. **Connect to Backend**: Update API_URL when backend is ready
2. **Test Auth Flow**: Implement SMS OTP service
3. **Add WebSocket**: Real-time updates for compliance
4. **Implement Upload**: Profile pictures & documents
5. **Add Analytics**: Track user interactions

## Troubleshooting

### Common Issues

1. **Token not persisting**: Check localStorage permissions
2. **API calls failing**: Verify CORS settings on backend
3. **State not updating**: Ensure providers wrap components
4. **Forms not validating**: Check Zod schema matches fields

### Debug Tools
- React Query DevTools (included in dev)
- Zustand DevTools compatible
- Network tab for API monitoring
- Console logs for state changes

## Architecture Summary

```
User Action → Component → Hook → Store/API → Backend
                ↓           ↓        ↓         ↓
             UI Update ← State ← Response ← Server
```

The implementation follows best practices:
- **Separation of Concerns**: UI, State, API layers
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Graceful failures with feedback
- **Performance**: Optimized re-renders and caching
- **Security**: Token management and validation