/**
 * Security utilities for Mobilaws frontend
 * Implements modern security best practices
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if content contains potential SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|;|\/\*|\*\/)/g,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check if content contains potential XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // Event handlers like onclick=
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate and sanitize user input before sending to API
 */
export function validateAndSanitize(input: string, maxLength: number = 10000): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  // Check length
  if (input.length > maxLength) {
    return {
      isValid: false,
      sanitized: '',
      error: `Input exceeds maximum length of ${maxLength} characters`
    };
  }

  // Check for SQL injection
  if (containsSQLInjection(input)) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Input contains potentially harmful SQL patterns'
    };
  }

  // Check for XSS
  if (containsXSS(input)) {
    return {
      isValid: false,
      sanitized: '',
      error: 'Input contains potentially harmful scripts'
    };
  }

  // Sanitize the input
  const sanitized = sanitizeInput(input);

  return {
    isValid: true,
    sanitized
  };
}

/**
 * Rate limiting helper for client-side
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  /**
   * Check if action is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Filter out old attempts
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Add current attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(key: string): number {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    return Math.max(0, this.maxAttempts - recentAttempts.length);
  }

  /**
   * Reset attempts for a key
   */
  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Secure local storage wrapper
 */
export class SecureStorage {
  private prefix: string;

  constructor(prefix: string = 'mobilaws_') {
    this.prefix = prefix;
  }

  /**
   * Set item in storage
   */
  setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify({
        value,
        timestamp: Date.now()
      });
      localStorage.setItem(this.prefix + key, serialized);
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }

  /**
   * Get item from storage
   */
  getItem<T>(key: string, maxAge?: number): T | null {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // Check if item is expired
      if (maxAge && Date.now() - parsed.timestamp > maxAge) {
        this.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error('Failed to read from storage:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }

  /**
   * Clear all items with prefix
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Content Security Policy helper
 */
export function enforceCSP(): void {
  // Add CSP meta tag if not present
  if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https: blob:;
      connect-src 'self' https://mobilaws-ympe.vercel.app https://firestore.googleapis.com https://identitytoolkit.googleapis.com;
      frame-src 'self' https://accounts.google.com;
    `.replace(/\s+/g, ' ').trim();
    document.head.appendChild(meta);
  }
}

/**
 * Prevent clickjacking
 */
export function preventClickjacking(): void {
  if (window.self !== window.top) {
    // Page is in an iframe
    window.top!.location = window.self.location;
  }
}

/**
 * Secure random string generator
 */
export function generateSecureRandom(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string using SHA-256
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate file upload
 */
export function validateFileUpload(file: File, options: {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}): { isValid: boolean; error?: string } {
  const { maxSize = 10 * 1024 * 1024, allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum of ${maxSize / (1024 * 1024)}MB`
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  return { isValid: true };
}

/**
 * Debounce function for rate limiting user actions
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Initialize security features
export function initializeSecurity(): void {
  // Enforce CSP
  enforceCSP();
  
  // Prevent clickjacking
  preventClickjacking();
  
  // Disable right-click in production (optional)
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      // Allow right-click on input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      // e.preventDefault(); // Uncomment to disable right-click
    });
  }
  
  // Log security initialization
  console.log('🔒 Security features initialized');
}

// Export instances
export const storage = new SecureStorage();
export const rateLimiter = new RateLimiter();

