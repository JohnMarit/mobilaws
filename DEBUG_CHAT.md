# Chat Not Opening - Debug Guide

## Issue
The chat is not being created when a counselor accepts a request.

## Error Observed
```
GET https://mobilaws-ympe.vercel.app/api/counsel/chat/by-request/wCQVhn3GOrYnqx15p3mD 404 (Not Found)
💬 Chat fetched: null
❌ Chat not found for request: wCQVhn3GOrYnqx15p3mD
```

## Root Causes

### 1. Frontend Calling Wrong URL
The frontend is calling `mobilaws-ympe.vercel.app` (frontend) instead of `mobilaws-backend.vercel.app` (backend).

**Fix**: Ensure `VITE_API_URL` environment variable is set in Vercel:
```
VITE_API_URL=https://mobilaws-backend.vercel.app/api
```

### 2. Chat May Not Be Created on Backend
When `acceptCounselRequest` is called, it should create a chat session.

**To Verify**:
1. Check backend logs at https://vercel.com/johnmarits-projects/mobilaws-backend
2. Look for: `✅ Chat session created: [chatId]`
3. If not found, the chat creation is failing

## How to Fix

### Step 1: Set Environment Variable in Vercel
1. Go to https://vercel.com/johnmarits-projects/mobilaws-ympe
2. Go to Settings → Environment Variables
3. Add or update:
   - Name: `VITE_API_URL`
   - Value: `https://mobilaws-backend.vercel.app/api`
   - Environment: Production
4. Redeploy the frontend

### Step 2: Verify Chat Creation in Backend Logs
1. Accept a request as a counselor
2. Check backend logs for:
   - `✅ Counsel request accepted: [requestId] by [counselorName], chat: [chatId]`
   - `✅ Chat session created: [chatId]`
3. If chat creation fails, check Firestore permissions

### Step 3: Check Console for API Calls
Open browser console and look for:
```
🔧 API Configuration:
  - API Base URL: https://mobilaws-backend.vercel.app/api
```

If it shows `mobilaws-ympe.vercel.app`, the environment variable is not set correctly.

## Expected Flow
1. Counselor clicks "Accept" on request
2. Backend `acceptCounselRequest` creates chat session
3. Backend returns `{ success: true, chatId: "abc123" }`
4. Frontend calls `getChatByRequestId(requestId)`
5. Backend returns chat session
6. Frontend opens chat interface

## Current vs Expected URLs
- **Current (Wrong)**: `https://mobilaws-ympe.vercel.app/api/counsel/chat/by-request/...`
- **Expected (Correct)**: `https://mobilaws-backend.vercel.app/api/counsel/chat/by-request/...`

