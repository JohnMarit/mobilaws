# 🔐 Mobilaws Security Documentation

## Overview

This document provides a comprehensive overview of the security measures implemented in the Mobilaws application.

---

## 🛡️ Security Architecture

### Defense in Depth

Mobilaws implements multiple layers of security:

1. **Network Layer:** HTTPS/TLS, Rate Limiting, DDoS Protection
2. **Application Layer:** Input Validation, Output Encoding, CSRF Protection
3. **Authentication Layer:** Firebase Auth, OAuth 2.0, Token Verification
4. **Authorization Layer:** RBAC, Firestore Rules, API Middleware
5. **Data Layer:** Encryption at Rest, Secure Storage, Access Controls

---

## 🔑 Authentication

### User Authentication

- **Provider:** Firebase Authentication
- **Methods:**
  - Google OAuth 2.0 (Primary)
  - Email/Password (Future)
  - GitHub OAuth (Future)
- **Token:** Firebase ID Token (JWT)
- **Session:** Browser localStorage with auto-refresh
- **Expiration:** 1 hour (Firebase default)

### Admin Authentication

- **Method:** Google OAuth with email whitelist
- **Whitelist:** Environment variable `ADMIN_EMAILS`
- **Verification:** Server-side email validation
- **Permissions:** Full CRUD on users, subscriptions, support tickets

---

## 🔒 Authorization

### Role-Based Access Control (RBAC)

**Roles:**
- `user` - Standard authenticated user
- `admin` - Administrator with elevated privileges

**Permissions:**
```typescript
user: {
  read: ['own_profile', 'own_subscriptions', 'own_tickets'],
  write: ['own_profile'],
  create: ['own_tickets'],
}

admin: {
  read: ['all_users', 'all_subscriptions', 'all_tickets', 'stats'],
  write: ['all_users', 'all_subscriptions', 'all_tickets'],
  create: ['admin_actions'],
  delete: ['users', 'tickets'],
}
```

### Firestore Security Rules

Rules enforce authorization at the database level:

```javascript
// Users can only access their own data
match /users/{userId} {
  allow read, write: if request.auth.uid == userId;
}

// Admins can access all data
match /users/{userId} {
  allow read: if isAdmin();
}
```

---

## 🚫 Input Validation

### XSS Prevention

All user input is sanitized:

```typescript
// HTML entity encoding
sanitizeInput(input)
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#x27;')
  .replace(/\//g, '&#x2F;');
```

### SQL Injection Prevention

Pattern detection and blocking:

```typescript
const sqlPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/i,
  /(\bOR\b|\bAND\b).*?=.*?=/i,
  /[';]--/,
];
```

### Maximum Lengths

- Chat messages: 5,000 characters
- Ticket subject: 200 characters
- Ticket message: 5,000 characters
- Request body: 20MB

---

## 🔐 Rate Limiting

### Tiered Rate Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Public | 300 requests | 15 min |
| API | 100 requests | 15 min |
| Authentication | 5 requests | 15 min |
| Payment | 5 requests | 15 min |

### Per-User Limits

Authenticated users have separate rate limits:
- Chat: 20 messages / minute
- Search: 30 searches / minute

### IP-Based Blocking

Excessive violations result in:
- Temporary block: 1 hour
- Repeated violations: Permanent block (manual review required)

---

## 🌐 CORS Configuration

### Allowed Origins

Production: Strict whitelist only
```typescript
CORS_ORIGINS=https://mobilaws.vercel.app,https://www.mobilaws.vercel.app
```

Development: Localhost with any port
```typescript
CORS_ORIGINS=http://localhost:*
```

### Credentials

```typescript
credentials: true
```

Allows sending cookies and authorization headers cross-origin.

---

## 📄 Content Security Policy (CSP)

### Directives

```
default-src 'self'
script-src 'self' [trusted domains]
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
connect-src 'self' [API endpoints]
frame-src 'self' [OAuth providers]
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'none'
upgrade-insecure-requests
```

### Trusted Domains

- `accounts.google.com` (OAuth)
- `js.stripe.com` (Payments)
- `*.firebaseapp.com` (Firebase)
- `www.googletagmanager.com` (Analytics)

---

## 🗄️ Database Security

### Firestore

**Encryption:**
- At rest: AES-256 (Google-managed)
- In transit: TLS 1.3

**Access Control:**
- Security Rules enforced at database level
- No direct database access from client
- Admin SDK for server-side operations

**Data Validation:**
- Type checking
- Size limits (1MB per document)
- Required fields validation

### Qdrant (Vector Database)

**Security Measures:**
- HTTPS required in production
- API key authentication
- Query validation
- Result sanitization
- Rate limiting

---

## 🔍 Security Monitoring

### Logging

**Security Events Logged:**
- Failed authentication attempts
- Authorization failures
- Rate limit violations
- SQL injection attempts
- XSS attempts
- API errors (500+)
- Admin actions

**Log Format:**
```json
{
  "timestamp": "2025-11-20T12:00:00Z",
  "event": "UNAUTHORIZED_ACCESS",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "details": { ... }
}
```

### Alerts

**Configured Alerts:**
- High error rate (>10% in 5 min)
- Failed auth rate (>10 in 1 min)
- Rate limit violations (>100 in 1 min)
- Server errors (any 500 error)
- Downtime (>1 minute)

---

## 🚨 Incident Response

### Severity Levels

1. **Critical:** Data breach, system compromise, complete outage
2. **High:** Authentication bypass, major security flaw
3. **Medium:** Non-critical security flaw, partial outage
4. **Low:** Minor security issue, degraded performance

### Response Times

| Severity | Acknowledge | Mitigation | Resolution |
|----------|-------------|------------|------------|
| Critical | 15 minutes | 1 hour | 24 hours |
| High | 1 hour | 4 hours | 48 hours |
| Medium | 4 hours | 24 hours | 1 week |
| Low | 24 hours | 1 week | 1 month |

### Response Procedure

1. **Detection:** Monitoring alert or user report
2. **Assessment:** Determine severity and scope
3. **Containment:** Isolate affected systems
4. **Eradication:** Remove threat
5. **Recovery:** Restore services
6. **Post-Mortem:** Document and learn

---

## 🔄 Security Updates

### Dependency Updates

- **Frequency:** Monthly
- **Tool:** npm audit
- **Process:**
  1. Run `npm audit`
  2. Review vulnerabilities
  3. Update packages
  4. Test thoroughly
  5. Deploy

### Security Patches

- **Critical:** Deploy within 24 hours
- **High:** Deploy within 1 week
- **Medium:** Deploy within 1 month
- **Low:** Deploy in next release

---

## 📚 Security Training

### For Developers

- OWASP Top 10
- Secure coding practices
- Firebase security rules
- Authentication/authorization
- Input validation
- Error handling

### For Admins

- User management
- Incident response
- Security monitoring
- Backup/restore procedures

---

## 🔗 Security Resources

### Tools
- [OWASP ZAP](https://www.zaproxy.org/) - Security scanner
- [Snyk](https://snyk.io/) - Dependency scanning
- [SecurityHeaders.com](https://securityheaders.com/) - Header check
- [SSL Labs](https://www.ssllabs.com/ssltest/) - TLS check

### Documentation
- [OWASP](https://owasp.org/)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 Contact

**Security Issues:** thuchabraham42@gmail.com  
**General Support:** Via support ticket system

---

## ✅ Compliance

### GDPR
- Right to access
- Right to deletion
- Right to data portability
- Privacy by design

### CCPA
- Do not sell my info
- Access requests
- Deletion requests

### PCI DSS
- Using Stripe (PCI Level 1)
- No card data stored
- Secure transmission (HTTPS)

---

*Last Updated: November 20, 2025*

