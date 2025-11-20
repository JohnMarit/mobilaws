# 🔐 Security Deployment Checklist

Use this checklist before deploying to production to ensure all security measures are in place.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables ⚠️ **CRITICAL**

- [ ] Rotate ALL API keys and secrets (do not reuse development keys)
- [ ] Set `NODE_ENV=production` on backend
- [ ] Configure `OPENAI_API_KEY` (new key for production)
- [ ] Configure all Firebase environment variables
  - [ ] `VITE_FIREBASE_API_KEY`
  - [ ] `VITE_FIREBASE_AUTH_DOMAIN`
  - [ ] `VITE_FIREBASE_PROJECT_ID`
  - [ ] `VITE_FIREBASE_STORAGE_BUCKET`
  - [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `VITE_FIREBASE_APP_ID`
  - [ ] `VITE_FIREBASE_MEASUREMENT_ID`
  - [ ] `FIREBASE_SERVICE_ACCOUNT` (JSON string, backend only)
- [ ] Configure Qdrant/Vector DB credentials
  - [ ] `QDRANT_URL` (must be HTTPS)
  - [ ] `QDRANT_API_KEY` (new key)
  - [ ] `QDRANT_COLLECTION`
- [ ] Configure Stripe (LIVE keys only)
  - [ ] `STRIPE_SECRET_KEY` (sk_live_...)
  - [ ] `STRIPE_PUBLISHABLE_KEY` (pk_live_...)
  - [ ] `STRIPE_WEBHOOK_SECRET` (whsec_...)
- [ ] Set `ADMIN_EMAILS` (comma-separated whitelist)
- [ ] Set `CORS_ORIGINS` (strict whitelist, HTTPS only)
- [ ] Set `FRONTEND_URL` (production URL)
- [ ] Set `API_BASE_URL` / `VITE_API_URL` (backend URL)
- [ ] Configure email service (Gmail/SMTP)
  - [ ] `EMAIL_HOST`
  - [ ] `EMAIL_PORT`
  - [ ] `EMAIL_USER`
  - [ ] `EMAIL_PASSWORD` (app password)
  - [ ] `EMAIL_FROM`

### 2. Firebase Security Rules ⚠️ **CRITICAL**

- [ ] Review `firestore.rules` file
- [ ] Review `firebase-storage.rules` file
- [ ] Deploy Firestore security rules: `firebase deploy --only firestore:rules`
- [ ] Deploy Storage security rules: `firebase deploy --only storage:rules`
- [ ] Verify rules are active in Firebase Console
- [ ] Test rules with Firebase Emulator
- [ ] Add admin users to `/admins` collection (via Firebase Admin SDK)

### 3. HTTPS/TLS Configuration ⚠️ **CRITICAL**

- [ ] Ensure ALL endpoints use HTTPS (no HTTP)
- [ ] Configure SSL/TLS certificates
- [ ] Enable auto-renewal for certificates
- [ ] Test HTTPS on all domains/subdomains
- [ ] Verify TLS 1.2 or higher is enforced
- [ ] Disable SSLv3, TLS 1.0, TLS 1.1
- [ ] Test with SSL Labs (https://www.ssllabs.com/ssltest/)

### 4. Security Headers

- [ ] Verify security headers are active (check with https://securityheaders.com)
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - [ ] `Content-Security-Policy` (check CSP)
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy`
- [ ] Test CSP doesn't break functionality
- [ ] Remove `X-Powered-By` header

### 5. Rate Limiting & DDoS Protection

- [ ] Verify rate limiting is active on all routes
- [ ] Test rate limits with load testing tool
- [ ] Configure alerts for rate limit violations
- [ ] Consider using Cloudflare or AWS WAF for additional DDoS protection
- [ ] Set up IP-based blocking for abusive clients

### 6. Authentication & Authorization

- [ ] Test Google OAuth flow end-to-end
- [ ] Verify Firebase token verification works
- [ ] Test admin authentication flow
- [ ] Verify admin whitelist is enforced
- [ ] Test ownership verification (users can't access other users' data)
- [ ] Verify email verification is required where needed
- [ ] Test token expiration handling

### 7. Input Validation & Sanitization

- [ ] Test XSS prevention (try injecting `<script>alert('XSS')</script>`)
- [ ] Test SQL injection prevention (try `' OR '1'='1`)
- [ ] Test excessive input length handling (10MB+ payloads)
- [ ] Test special character handling
- [ ] Verify file upload restrictions (if applicable)

### 8. Database Security

**Firestore:**
- [ ] Verify security rules block unauthorized access
- [ ] Test user can only read/write their own data
- [ ] Test admin can access all data
- [ ] Verify soft delete (no hard deletes)

**Qdrant:**
- [ ] Verify HTTPS is used
- [ ] Verify API key is set
- [ ] Test query validation
- [ ] Test result sanitization

### 9. Error Handling

- [ ] Verify error messages don't leak sensitive info
- [ ] Test 404 handling
- [ ] Test 500 error handling
- [ ] Verify stack traces are hidden in production
- [ ] Set up error tracking (Sentry, DataDog, etc.)

### 10. Monitoring & Logging

- [ ] Set up error monitoring (Sentry recommended)
- [ ] Configure log aggregation (CloudWatch, Azure Monitor)
- [ ] Set up alerts for:
  - [ ] High error rates
  - [ ] Failed authentication attempts
  - [ ] Rate limit violations
  - [ ] Security events (SQL injection attempts, etc.)
  - [ ] Server downtime
- [ ] Test alerting system
- [ ] Set up uptime monitoring (Pingdom, UptimeRobot)

### 11. Backup & Disaster Recovery

- [ ] Configure automated Firestore backups
- [ ] Test Firestore restore process
- [ ] Configure Qdrant backups (if using Qdrant Cloud)
- [ ] Document recovery procedures
- [ ] Test disaster recovery process
- [ ] Store backups in separate region/account

### 12. Dependency Security

- [ ] Run `npm audit` on frontend and fix vulnerabilities
- [ ] Run `npm audit` on backend and fix vulnerabilities
- [ ] Update `@langchain/community` to 1.0.4+ (if possible)
- [ ] Set up Dependabot or Renovate for automated updates
- [ ] Configure Snyk or similar for continuous vulnerability scanning

### 13. API Security

- [ ] Test all API endpoints with Postman/Insomnia
- [ ] Verify rate limiting works
- [ ] Test CORS configuration
- [ ] Test authentication on protected routes
- [ ] Test authorization (users can't access admin endpoints)
- [ ] Verify request validation
- [ ] Test error responses (no info leakage)

### 14. Frontend Security

- [ ] Verify CSP doesn't block legitimate resources
- [ ] Test for XSS vulnerabilities
- [ ] Test for CSRF vulnerabilities
- [ ] Verify sensitive data is not stored in localStorage unencrypted
- [ ] Test authentication persistence
- [ ] Verify logout clears all session data

### 15. Payment Security (Stripe)

- [ ] Use Stripe LIVE keys (never test keys in production)
- [ ] Verify webhook signature verification is active
- [ ] Test payment flow end-to-end
- [ ] Verify PCI compliance (use Stripe Elements)
- [ ] Never store card numbers in your database
- [ ] Test refund flow
- [ ] Set up fraud prevention rules in Stripe dashboard

### 16. Compliance

- [ ] Add Privacy Policy
- [ ] Add Terms of Service
- [ ] Add Cookie Consent banner (GDPR)
- [ ] Add "Do Not Sell My Info" link (CCPA)
- [ ] Implement data export functionality (GDPR)
- [ ] Implement data deletion functionality (GDPR)
- [ ] Complete Stripe PCI compliance questionnaire

### 17. Performance & Scalability

- [ ] Run load testing (k6, Apache JMeter)
- [ ] Test under expected peak load
- [ ] Configure auto-scaling (if supported by platform)
- [ ] Set up CDN for static assets
- [ ] Enable caching where appropriate
- [ ] Optimize database queries

### 18. Documentation

- [ ] Update README with production deployment instructions
- [ ] Document all environment variables
- [ ] Document security policies
- [ ] Document incident response procedures
- [ ] Document backup/restore procedures
- [ ] Create runbook for common issues

### 19. Final Security Scan

- [ ] Run OWASP ZAP or Burp Suite scan
- [ ] Check https://securityheaders.com
- [ ] Check https://www.ssllabs.com/ssltest/
- [ ] Check https://observatory.mozilla.org
- [ ] Run lighthouse audit
- [ ] Check for exposed secrets with `trufflehog` or `gitleaks`

### 20. Post-Deployment

- [ ] Verify all services are running
- [ ] Test complete user flow (signup to payment)
- [ ] Monitor error rates for first 24 hours
- [ ] Monitor performance metrics
- [ ] Check logs for security events
- [ ] Test all critical paths
- [ ] Announce to team that production is live

---

## 🚨 Emergency Contacts

**In case of security incident:**

1. **Primary:** thuchabraham42@gmail.com
2. **Platform Issues:**
   - Vercel: support@vercel.com
   - Firebase: firebase-support@google.com
   - Stripe: support@stripe.com

---

## 📞 Security Incident Response

If you detect a security incident:

1. **Immediately:**
   - Assess severity (Critical, High, Medium, Low)
   - Document what happened (logs, screenshots)
   - Do NOT publicly announce until assessed

2. **Within 1 hour (Critical/High):**
   - Contact admin team
   - Implement immediate mitigation (disable feature, block IP, etc.)
   - Preserve evidence (logs, database snapshots)

3. **Within 24 hours:**
   - Root cause analysis
   - Develop permanent fix
   - Test fix thoroughly
   - Deploy fix

4. **Within 72 hours:**
   - Post-mortem document
   - Update security procedures
   - Notify affected users (if required by law)
   - Submit breach notification (if required)

---

## ✅ Deployment Approval

- [ ] Security checklist completed
- [ ] All critical items addressed
- [ ] Team notified
- [ ] Rollback plan documented
- [ ] Monitoring active

**Approved by:** _________________  
**Date:** _________________  
**Signature:** _________________

---

## 🎯 Post-Deployment Monitoring (First 24 Hours)

- [ ] Hour 1: Check error rates, server load
- [ ] Hour 4: Review security logs
- [ ] Hour 8: Check authentication success rate
- [ ] Hour 12: Review user feedback
- [ ] Hour 24: Full system health check

---

**Remember:** Security is not a one-time task. Continue monitoring and updating regularly!

