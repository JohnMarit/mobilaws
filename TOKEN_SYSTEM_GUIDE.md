# Token System Implementation Guide

## Overview

The Mobilaws application now uses a token-based access control system that provides different limits for anonymous and authenticated users.

## Token System Details

### **Anonymous Users**
- **Limit**: 3 free prompts total
- **Reset**: Never (one-time limit)
- **UI Display**: "2/3 free prompts"
- **Action Required**: Must login after 3rd prompt

### **Authenticated Users**
- **Limit**: 20 tokens per day
- **Reset**: Daily at midnight (based on user's local time)
- **UI Display**: "5/20 tokens today"
- **Action Required**: Wait until next day for token reset

## Technical Implementation

### **Core Components**

1. **PromptLimitContext** (`src/contexts/PromptLimitContext.tsx`)
   - Manages both anonymous prompt count and daily token count
   - Handles daily reset logic
   - Persists data in localStorage

2. **ChatInterface** (`src/components/ChatInterface.tsx`)
   - Displays appropriate counters based on user status
   - Shows different UI elements for anonymous vs authenticated users

3. **LoginModal** (`src/components/LoginModal.tsx`)
- Updated to reflect daily token limits instead of unlimited access

### **Data Storage**

- Token counts are persisted in Firestore (no localStorage for tokens).
- Authentication data may still use localStorage (managed by Firebase auth context).

### **Reset Logic**

- Daily reset occurs at midnight (local time) and is enforced via Firestore `tokenUsage` documents.

## User Experience Flow

### **Anonymous User Journey**
1. User opens app → sees "0/3 free prompts"
2. Sends 1st prompt → sees "1/3 free prompts"
3. Sends 2nd prompt → sees "2/3 free prompts"
4. Sends 3rd prompt → sees "3/3 free prompts"
5. Tries 4th prompt → login modal appears
6. Clicks Google sign-in → automatically logged in
7. Now sees "0/20 tokens today" and their name

### **Authenticated User Journey**
1. User opens app → sees "5/20 tokens today" (example)
2. Sends prompts → counter increases: "6/20", "7/20", etc.
3. Reaches 20 tokens → cannot send more prompts
4. Next day → automatically resets to "0/20 tokens today"

## UI Indicators

### **Desktop (Top Bar)**
- **Anonymous**: "● 2/3 free prompts"
- **Authenticated**: "● John Doe ● 5/20 tokens today"

### **Mobile (Welcome Screen)**
- **Anonymous**: "2/3 free prompts remaining"
- **Authenticated**: "Signed in as John Doe" + "5/20 tokens used today"

### **Login Modal**
- **Message**: "Sign in to get 20 tokens per day for legal assistance"

## Configuration

### **Token Limits**
```typescript
const maxPrompts = 3;        // Anonymous users
const maxDailyTokens = 20;   // Authenticated users
```

### **Customization**
To change the daily token limit, update `maxDailyTokens` in `PromptLimitContext.tsx`:

```typescript
const maxDailyTokens = 20; // Change this value
```

## Testing

### **Manual Testing Steps**

1. **Anonymous User Test:**
   - Open app in incognito mode
   - Send 3 prompts, verify counter updates
   - Try 4th prompt, verify login modal appears

2. **Authenticated User Test:**
   - Login with Google
   - Send prompts, verify daily token counter
   - Test daily reset (change system date or wait)

3. **Daily Reset Test:**
   - Use all 20 tokens
   - Change system date to next day
   - Refresh app, verify tokens reset to 0

### **Automated Testing**
Use the test utilities in `src/utils/authTest.ts`:

```typescript
import { runAuthTests, testUserJourney } from './utils/authTest';

// Run all authentication tests
runAuthTests();

// Test complete user journey
testUserJourney();
```

## Benefits

1. **Fair Usage**: Prevents abuse while allowing reasonable access
2. **User Retention**: Encourages users to create accounts
3. **Scalable**: Easy to adjust token limits as needed
4. **Transparent**: Clear indicators of usage and limits
5. **Daily Reset**: Fresh start each day for authenticated users

## Security Considerations

- Token counts are stored in localStorage (client-side)
- No server-side validation (can be enhanced for production)
- Daily reset is based on user's local time
- Authentication handled by Google OAuth

## Future Enhancements

1. **Server-side Validation**: Move token tracking to backend
2. **Premium Tiers**: Different token limits for different user types
3. **Usage Analytics**: Track token usage patterns
4. **Admin Panel**: Manage token limits and user accounts
5. **Purchase System**: Allow users to buy additional tokens

## Troubleshooting

### **Common Issues**

1. **Tokens not resetting daily:**
   - Check system date/time
   - Clear localStorage and refresh
   - Verify reset logic in console

2. **Counter not updating:**
   - Check browser console for errors
   - Verify localStorage is working
   - Refresh the page

3. **Login not working:**
   - Verify Google OAuth configuration
   - Check network connectivity
   - Clear browser cache

### **Debug Commands**

```javascript
// Check current state in browser console
console.log('Prompt Count:', localStorage.getItem('promptCount'));
console.log('Daily Tokens:', localStorage.getItem('dailyTokens'));
console.log('Reset Date:', localStorage.getItem('tokensResetDate'));
console.log('User:', localStorage.getItem('user'));

// Reset all data (for testing)
localStorage.clear();
location.reload();
```

## Support

For issues with the token system:
1. Check browser console for errors
2. Verify localStorage data
3. Test with different user states
4. Use the provided test utilities
5. Review this documentation
