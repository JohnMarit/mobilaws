/**
 * Security Utilities
 * Provides input validation, sanitization, and rate limiting functionality
 */

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter to prevent abuse
 * @param key - Unique identifier (e.g., user ID, IP address)
 * @param config - Rate limit configuration
 * @returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60000 }
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
  }

  if (!entry || entry.resetTime < now) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validate email format
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate that input doesn't contain potentially dangerous patterns
 * @param input - Input to validate
 * @returns true if input is safe
 */
export function validateInput(input: string): boolean {
  if (typeof input !== 'string') {
    return false;
  }

  // Check for common injection patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /data:text\/html/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize HTML content while preserving safe formatting
 * @param html - HTML content to sanitize
 * @returns Sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove javascript: and data: URIs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '');
  sanitized = sanitized.replace(/src\s*=\s*["']data:text\/html[^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Generate a Content Security Policy nonce for inline scripts
 * @returns Random nonce string
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate file upload
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @param maxSize - Maximum file size in bytes
 * @returns Validation result
 */
export function validateFileUpload(
  file: File,
  allowedTypes: string[] = ['application/pdf', 'text/plain', 'application/msword'],
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` };
  }

  if (file.size > maxSize) {
    return { valid: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
  }

  return { valid: true };
}

/**
 * Hash sensitive data (client-side hashing for additional security)
 * @param data - Data to hash
 * @returns Promise<string> - Hashed data
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Detect and prevent SQL injection patterns in user input
 * @param input - Input to check
 * @returns true if suspicious patterns detected
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(\bOR\b|\bAND\b).*?=.*?=/i,
    /[';]--/,
    /\bxp_\w+/i,
    /\bsp_\w+/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Secure localStorage wrapper with encryption-like obfuscation
 */
export const secureStorage = {
  /**
   * Set item in localStorage with basic obfuscation
   */
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encoded = btoa(serialized);
      localStorage.setItem(key, encoded);
    } catch (error) {
      console.error('Error saving to secure storage:', error);
    }
  },

  /**
   * Get item from localStorage with deobfuscation
   */
  getItem(key: string): any {
    try {
      const encoded = localStorage.getItem(key);
      if (!encoded) return null;
      const decoded = atob(encoded);
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Error reading from secure storage:', error);
      return null;
    }
  },

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  /**
   * Clear all items from localStorage
   */
  clear(): void {
    localStorage.clear();
  },
};

/**
 * CSRF token management
 */
let csrfToken: string | null = null;

export const csrf = {
  /**
   * Generate a new CSRF token
   */
  generateToken(): string {
    csrfToken = generateCSPNonce();
    secureStorage.setItem('csrf_token', csrfToken);
    return csrfToken;
  },

  /**
   * Get the current CSRF token
   */
  getToken(): string | null {
    if (!csrfToken) {
      csrfToken = secureStorage.getItem('csrf_token');
    }
    return csrfToken;
  },

  /**
   * Validate a CSRF token
   */
  validateToken(token: string): boolean {
    const storedToken = this.getToken();
    return storedToken !== null && storedToken === token;
  },

  /**
   * Clear the CSRF token
   */
  clearToken(): void {
    csrfToken = null;
    secureStorage.removeItem('csrf_token');
  },
};

