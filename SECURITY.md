# Security Guide for Mobilaws

This document outlines the security measures implemented in the Mobilaws application to protect user data and prevent common security vulnerabilities.

## 🔒 Security Features Implemented

### 1. Authentication & Authorization

#### Firebase Authentication
- **Secure OAuth 2.0**: Using Firebase Authentication with Google OAuth for secure user authentication
- **Token-based sessions**: JWT tokens for maintaining user sessions
- **Environment-based credentials**: All Firebase credentials stored in environment variables, not hardcoded

#### Configuration
```bash
# Required environment variables in .env file
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### 2. Input Validation & Sanitization

#### Client-Side Protection (`src/utils/security.ts`)
- **XSS Prevention**: All user inputs are sanitized to prevent Cross-Site Scripting attacks
- **SQL Injection Detection**: Pattern matching to detect and block SQL injection attempts
- **Input Validation**: Checks for dangerous patterns in user input
- **Length Limits**: Maximum input length of 1000 characters for chat queries

#### Functions Available
```typescript
import { sanitizeInput, validateInput, checkRateLimit } from '@/utils/security';

// Sanitize user input
const clean = sanitizeInput(userInput);

// Validate input doesn't contain dangerous patterns
const isValid = validateInput(userInput);

// Check rate limits
const result = checkRateLimit(userId, { maxRequests: 10, windowMs: 60000 });
```

### 3. Rate Limiting

#### Client-Side Rate Limiting
- **Chat Input**: 10 messages per minute per user
- **Protection**: Prevents spam and abuse of the chat system
- **User Feedback**: Toast notifications inform users when rate limited

#### Server-Side Rate Limiting
- **API Endpoints**: 30 requests per minute per IP address
- **Automatic Cleanup**: Rate limit store automatically cleans expired entries
- **429 Response**: Returns appropriate HTTP status code when rate limited

### 4. Content Security Policy (CSP)

#### HTML Security Headers
Implemented in `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://accounts.google.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://accounts.google.com http://localhost:*;
  frame-src 'self' https://accounts.google.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'none';
  upgrade-insecure-requests;
">
```

#### Additional Security Headers
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking attacks
- `X-XSS-Protection: 1; mode=block` - Enables browser XSS filtering
- `Strict-Transport-Security` - Enforces HTTPS connections
- `Referrer-Policy: strict-origin-when-cross-origin` - Controls referrer information

### 5. CORS Configuration

#### Backend CORS Settings (`server-openai.ts`)
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 6. API Security

#### Request Validation
- **Body Size Limit**: 10MB maximum request body size
- **Array Validation**: Validates that messages are proper arrays
- **Message Count Limit**: Maximum 50 messages per conversation
- **Content Length Limit**: Maximum 5000 characters per message
- **Type Checking**: Ensures proper data types for all inputs

#### Error Handling
- **Generic Error Messages**: Doesn't expose internal system details
- **Proper HTTP Status Codes**: 400 for bad requests, 429 for rate limiting, 500 for server errors
- **Logging**: Server-side error logging without exposing to clients

### 7. Data Protection

#### Secure Storage
```typescript
import { secureStorage } from '@/utils/security';

// Store data with basic obfuscation
secureStorage.setItem('key', value);

// Retrieve data
const value = secureStorage.getItem('key');
```

#### CSRF Protection
```typescript
import { csrf } from '@/utils/security';

// Generate CSRF token
const token = csrf.generateToken();

// Validate CSRF token
const isValid = csrf.validateToken(token);
```

### 8. File Upload Security (If Implemented)

#### Validation
- **File Type Checking**: Whitelist of allowed MIME types
- **Size Limits**: Maximum file size restrictions
- **Content Validation**: Ensures files match declared types

```typescript
import { validateFileUpload } from '@/utils/security';

const result = validateFileUpload(
  file,
  ['application/pdf', 'text/plain'],
  10 * 1024 * 1024 // 10MB
);
```

## 🛡️ Security Best Practices

### For Developers

1. **Never Hardcode Secrets**
   - Always use environment variables for API keys and credentials
   - Never commit `.env` files to version control
   - Use `.env.example` as a template

2. **Validate All Inputs**
   - Use the security utilities for all user inputs
   - Validate both client-side and server-side
   - Sanitize before storing or displaying

3. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm audit fix
   ```

4. **Use HTTPS in Production**
   - Always serve the application over HTTPS
   - Enable `Strict-Transport-Security` header
   - Upgrade insecure requests automatically

5. **Monitor and Log**
   - Log security events (failed login attempts, rate limit violations)
   - Monitor for suspicious patterns
   - Set up alerts for security incidents

### For Deployment

1. **Environment Variables**
   - Set all required environment variables in production
   - Use secure secret management systems
   - Rotate credentials regularly

2. **Firewall Configuration**
   - Restrict API access to known origins
   - Use Web Application Firewall (WAF) if available
   - Block suspicious IP addresses

3. **Regular Updates**
   - Keep all dependencies up to date
   - Apply security patches promptly
   - Review and update security policies

## 🚨 Security Incident Response

If you discover a security vulnerability:

1. **Do Not** disclose publicly
2. **Do Not** exploit the vulnerability
3. **Do** contact the development team immediately
4. **Do** provide detailed information about the issue

## 📋 Security Checklist

### Before Deployment
- [ ] All secrets moved to environment variables
- [ ] `.env` file not committed to repository
- [ ] HTTPS configured and enforced
- [ ] CORS properly configured for production domains
- [ ] Rate limiting enabled and tested
- [ ] CSP headers properly configured
- [ ] Input validation implemented on all endpoints
- [ ] Error messages don't expose sensitive information
- [ ] Dependencies updated and audited
- [ ] Authentication properly implemented
- [ ] Logging configured for security events

### Regular Maintenance
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Audit security configurations quarterly
- [ ] Test disaster recovery procedures
- [ ] Review and update security documentation

## 🔍 Security Testing

### Manual Testing
1. Test rate limiting by sending rapid requests
2. Try XSS attacks in input fields
3. Attempt SQL injection patterns
4. Test with invalid authentication tokens
5. Try accessing unauthorized resources

### Automated Testing
```bash
# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated
```

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CORS Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

## 📝 Changelog

### Version 1.0.0 (Current)
- Implemented Firebase Authentication with Google OAuth
- Added comprehensive input validation and sanitization
- Implemented rate limiting (client and server)
- Added Content Security Policy headers
- Configured secure CORS settings
- Added request validation for API endpoints
- Implemented secure storage utilities
- Added CSRF protection utilities
- Moved all credentials to environment variables

---

**Last Updated**: October 8, 2025

For questions or concerns about security, please contact the development team.

