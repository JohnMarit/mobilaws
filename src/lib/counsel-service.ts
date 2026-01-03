/**
 * Counsel Booking Service
 * Uber-like counsel booking for South Sudan
 */

import { getApiUrl } from './api';

// South Sudan States
export interface SouthSudanState {
  code: string;
  name: string;
  capital: string;
}

// Legal Categories
export interface LegalCategory {
  id: string;
  name: string;
  icon: string;
}

export interface CounselRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  note: string;
  legalCategory: string;
  state: string;
  status: 'broadcasting' | 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'expired';
  counselorId?: string;
  counselorName?: string;
  counselorPhone?: string;
  scheduledAt?: string;
  preferredDate?: string;
  preferredTime?: string;
  broadcastCount: number;
  createdAt: any;
  updatedAt: any;
  acceptedAt?: any;
}

export interface Counselor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  isOnline: boolean;
  isVerified: boolean;
  isAvailable: boolean;
  state: string;
  servingStates: string[];
  specializations: string[];
  rating: number;
  totalCases: number;
  completedCases: number;
  activeRequests: number;
}

export interface Appointment {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  note: string;
  state: string;
  scheduledDate: string;
  scheduledTime: string;
  status: 'queued' | 'scheduled' | 'accepted' | 'completed' | 'cancelled';
  counselorId?: string;
  counselorName?: string;
}

// Config cache
let configCache: { states: SouthSudanState[]; categories: LegalCategory[] } | null = null;

/**
 * Get configuration (states and categories)
 */
export async function getCounselConfig(): Promise<{ states: SouthSudanState[]; categories: LegalCategory[] }> {
  if (configCache) {
    return configCache;
  }

  try {
    const apiUrl = getApiUrl('counsel/config');
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch config');
    }

    const data = await response.json();
    configCache = {
      states: data.states || [],
      categories: data.categories || [],
    };
    return configCache;
  } catch (error) {
    console.error('❌ Error fetching config:', error);
    // Return defaults
    return {
      states: [
        { code: 'CES', name: 'Central Equatoria', capital: 'Juba' },
        { code: 'EES', name: 'Eastern Equatoria', capital: 'Torit' },
        { code: 'WES', name: 'Western Equatoria', capital: 'Yambio' },
        { code: 'JGL', name: 'Jonglei', capital: 'Bor' },
        { code: 'UNT', name: 'Unity', capital: 'Bentiu' },
        { code: 'UNL', name: 'Upper Nile', capital: 'Malakal' },
        { code: 'NBG', name: 'Northern Bahr el Ghazal', capital: 'Aweil' },
        { code: 'WBG', name: 'Western Bahr el Ghazal', capital: 'Wau' },
        { code: 'LKS', name: 'Lakes', capital: 'Rumbek' },
        { code: 'WRP', name: 'Warrap', capital: 'Kuajok' },
      ],
      categories: [
        { id: 'land', name: 'Land & Property Disputes', icon: '🏠' },
        { id: 'family', name: 'Family & Marriage', icon: '👨‍👩‍👧‍👦' },
        { id: 'criminal', name: 'Criminal Defense', icon: '⚖️' },
        { id: 'civil', name: 'Civil Rights', icon: '📜' },
        { id: 'business', name: 'Business & Contracts', icon: '💼' },
        { id: 'employment', name: 'Employment Issues', icon: '👷' },
        { id: 'inheritance', name: 'Inheritance & Wills', icon: '📋' },
        { id: 'customary', name: 'Customary Law', icon: '🏛️' },
        { id: 'other', name: 'Other Legal Matter', icon: '❓' },
      ],
    };
  }
}

/**
 * Create a counsel request (broadcast to counselors)
 */
export async function createCounselRequest(
  userId: string,
  userName: string,
  userEmail: string,
  userPhone: string,
  note: string,
  legalCategory: string,
  state: string
): Promise<{ 
  success: boolean; 
  requestId?: string; 
  broadcastCount?: number;
  hasAvailableCounselors?: boolean; 
  message?: string; 
  error?: string 
}> {
  try {
    const apiUrl = getApiUrl('counsel/request');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userName,
        userEmail,
        userPhone,
        note,
        legalCategory,
        state,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create request' };
    }

    return data;
  } catch (error) {
    console.error('❌ Error creating counsel request:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Schedule a booking for later
 */
export async function scheduleBooking(
  userId: string,
  userName: string,
  userEmail: string,
  userPhone: string,
  note: string,
  legalCategory: string,
  state: string,
  preferredDate: string,
  preferredTime: string
): Promise<{ success: boolean; requestId?: string; message?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl('counsel/schedule');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        userName,
        userEmail,
        userPhone,
        note,
        legalCategory,
        state,
        preferredDate,
        preferredTime,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to schedule booking' };
    }

    return data;
  } catch (error) {
    console.error('❌ Error scheduling booking:', error);
    return { success: false, error: 'Network error. Please try again.' };
  }
}

/**
 * Get user's counsel requests
 */
export async function getUserCounselRequests(userId: string): Promise<CounselRequest[]> {
  try {
    const apiUrl = getApiUrl(`counsel/requests/user/${userId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error('❌ Error fetching user requests:', error);
    return [];
  }
}

/**
 * Get a specific counsel request
 */
export async function getCounselRequest(requestId: string): Promise<CounselRequest | null> {
  try {
    const apiUrl = getApiUrl(`counsel/request/${requestId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.request || null;
  } catch (error) {
    console.error('❌ Error fetching request:', error);
    return null;
  }
}

/**
 * Cancel a counsel request
 */
export async function cancelCounselRequest(requestId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = getApiUrl(`counsel/request/${requestId}/cancel`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error cancelling request:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get online counselors count
 */
export async function getOnlineCounselorsCount(): Promise<number> {
  try {
    const apiUrl = getApiUrl('counsel/counselors/online');
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.count || 0;
  } catch (error) {
    console.error('❌ Error fetching online counselors:', error);
    return 0;
  }
}

/**
 * Get available counselors for a state
 */
export async function getAvailableCounselors(state: string): Promise<Counselor[]> {
  try {
    const apiUrl = getApiUrl(`counsel/counselors/available/${state}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.counselors || [];
  } catch (error) {
    console.error('❌ Error fetching available counselors:', error);
    return [];
  }
}

// ========== COUNSELOR FUNCTIONS ==========

/**
 * Register as a counselor
 */
export async function registerAsCounselor(
  userId: string,
  name: string,
  email: string,
  phone: string,
  state: string,
  servingStates: string[],
  specializations: string[]
): Promise<{ success: boolean; counselorId?: string; message?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl('counsel/counselor/register');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name,
        email,
        phone,
        state,
        servingStates,
        specializations,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return data;
  } catch (error) {
    console.error('❌ Error registering counselor:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Set counselor online status
 */
export async function setCounselorOnlineStatus(
  userId: string,
  name: string,
  email: string,
  isOnline: boolean,
  phone?: string,
  state?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl('counsel/counselor/online');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        name,
        email,
        phone,
        isOnline,
        state,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return data;
  } catch (error) {
    console.error('❌ Error updating counselor status:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Get counselor profile
 */
export async function getCounselorProfile(userId: string): Promise<Counselor | null> {
  try {
    const apiUrl = getApiUrl(`counsel/counselor/${userId}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.counselor || null;
  } catch (error) {
    console.error('❌ Error fetching counselor:', error);
    return null;
  }
}

/**
 * Get pending requests (for counselors)
 */
export async function getPendingCounselRequests(): Promise<CounselRequest[]> {
  try {
    const apiUrl = getApiUrl('counsel/requests/pending');
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.requests || [];
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    return [];
  }
}

/**
 * Get queued appointments (for counselors)
 */
export async function getQueuedAppointments(state?: string): Promise<Appointment[]> {
  try {
    const apiUrl = getApiUrl(`counsel/appointments/queued${state ? `?state=${state}` : ''}`);
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.appointments || [];
  } catch (error) {
    console.error('❌ Error fetching queued appointments:', error);
    return [];
  }
}

/**
 * Accept a counsel request
 */
export async function acceptCounselRequest(
  requestId: string,
  counselorId: string,
  counselorName: string,
  counselorPhone?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl(`counsel/request/${requestId}/accept`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        counselorId,
        counselorName,
        counselorPhone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return data;
  } catch (error) {
    console.error('❌ Error accepting request:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Accept a queued appointment
 */
export async function acceptQueuedAppointment(
  appointmentId: string,
  counselorId: string,
  counselorName: string,
  counselorPhone?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const apiUrl = getApiUrl(`counsel/appointment/${appointmentId}/accept`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        counselorId,
        counselorName,
        counselorPhone,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return data;
  } catch (error) {
    console.error('❌ Error accepting appointment:', error);
    return { success: false, error: 'Network error' };
  }
}

/**
 * Complete a request
 */
export async function completeCounselRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const apiUrl = getApiUrl(`counsel/request/${requestId}/complete`);
    const response = await fetch(apiUrl, { method: 'POST' });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error completing request:', error);
    return { success: false, error: 'Network error' };
  }
}
