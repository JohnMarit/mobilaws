# Backend Deployment Notes - AI Lessons Route

## ⚠️ Important: Backend Must Be Redeployed

The new AI lessons generation feature requires **redeploying the backend** for the routes to be available.

### New Routes Added:
1. `POST /api/ai-lessons/generate` - Generate additional lessons using AI
2. `POST /api/ai-lessons/request-more` - Request more lessons for a module

### Files Changed:
- ✅ `ai-backend/src/routes/ai-lessons.ts` - NEW FILE
- ✅ `ai-backend/src/server.ts` - Added route import and mounting

### Deployment Steps:

1. **Build the backend:**
   ```bash
   cd ai-backend
   npm run build
   ```

2. **Deploy to your backend hosting:**
   - If using Vercel: `vercel --prod`
   - If using other hosting: Deploy the `dist` folder or push to your repo

3. **Verify deployment:**
   - Check that the backend server starts without errors
   - Test the endpoint: `POST /api/ai-lessons/generate`
   - Check backend logs for any startup errors

### Troubleshooting:

If you get a 404 error:
- ✅ Backend hasn't been redeployed with the new route
- ✅ Check backend logs for route registration
- ✅ Verify `ai-backend/src/server.ts` includes the route
- ✅ Restart the backend server if running locally

### Testing the Route:

```bash
# Test locally
curl -X POST http://localhost:8000/api/ai-lessons/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "moduleId": "test-module",
    "moduleName": "Test Module",
    "completedLessons": [],
    "tier": "premium",
    "numberOfLessons": 5
  }'
```

### Environment Variables Required:

Make sure your backend has:
- `OPENAI_API_KEY` - For AI lesson generation
- Firebase Admin SDK credentials - For Firestore access

### Status:

- ✅ Route code is complete
- ✅ Route is properly exported
- ✅ Route is mounted in server.ts
- ⚠️ **Backend needs to be redeployed**

