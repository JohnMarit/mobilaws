/**
 * Browser Fingerprinting Utility
 * Creates a semi-persistent identifier for anonymous users
 * This survives page refreshes but resets when browser data is cleared
 */

/**
 * Generate a simple hash from a string
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get browser fingerprint components
 */
function getFingerprintComponents(): string[] {
  const components: string[] = [];

  // User agent
  components.push(navigator.userAgent);

  // Screen resolution
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Hardware concurrency (CPU cores)
  if (navigator.hardwareConcurrency) {
    components.push(navigator.hardwareConcurrency.toString());
  }

  // Device memory (if available)
  if ('deviceMemory' in navigator) {
    components.push((navigator as any).deviceMemory.toString());
  }

  return components;
}

/**
 * Generate a browser fingerprint
 * Returns a unique identifier based on browser characteristics
 */
export function generateBrowserFingerprint(): string {
  try {
    const components = getFingerprintComponents();
    const fingerprintString = components.join('|');
    const fingerprint = simpleHash(fingerprintString);
    
    console.log('🔍 Browser fingerprint generated:', fingerprint);
    return fingerprint;
  } catch (error) {
    console.error('Error generating browser fingerprint:', error);
    // Fallback to a random ID if fingerprinting fails
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Get or create anonymous user ID
 * First checks localStorage, then generates new fingerprint if needed
 */
export function getAnonymousUserId(): string {
  const STORAGE_KEY = 'anonymous_user_id';
  
  try {
    // Check if we already have an ID stored
    const storedId = localStorage.getItem(STORAGE_KEY);
    if (storedId) {
      console.log('✅ Using stored anonymous user ID:', storedId);
      return storedId;
    }

    // Generate new fingerprint-based ID
    const fingerprint = generateBrowserFingerprint();
    localStorage.setItem(STORAGE_KEY, fingerprint);
    console.log('✅ Created new anonymous user ID:', fingerprint);
    return fingerprint;
  } catch (error) {
    console.error('Error managing anonymous user ID:', error);
    // Return a session-based ID as fallback
    return 'session_' + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Check if current user is anonymous (not authenticated)
 */
export function isAnonymousUser(): boolean {
  try {
    // Check if user is authenticated by looking for Firebase user data
    const savedUser = localStorage.getItem('user');
    return !savedUser;
  } catch (error) {
    return true;
  }
}
