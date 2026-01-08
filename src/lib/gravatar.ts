/**
 * Get Gravatar URL from email address
 * Uses MD5 hash of email to generate Gravatar profile picture
 */

import CryptoJS from 'crypto-js';

/**
 * Get Gravatar URL from email
 * @param email - User's email address
 * @param size - Image size in pixels (default: 128)
 * @returns Gravatar URL
 */
export function getGravatarUrl(email: string, size: number = 128): string {
  if (!email) return '';
  
  // Normalize email: trim and lowercase (Gravatar requirement)
  const normalizedEmail = email.trim().toLowerCase();
  
  // Generate MD5 hash using crypto-js
  const hash = CryptoJS.MD5(normalizedEmail).toString();
  
  // Return Gravatar URL with default image fallback
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon&r=pg`;
}

/**
 * Get user avatar URL (Gravatar or fallback)
 * @param email - User's email address
 * @param name - User's name (for fallback initials)
 * @param size - Image size in pixels
 * @returns Avatar URL or null if no email
 */
export function getUserAvatarUrl(email?: string, name?: string, size: number = 128): string | null {
  if (email) {
    return getGravatarUrl(email, size);
  }
  return null;
}

