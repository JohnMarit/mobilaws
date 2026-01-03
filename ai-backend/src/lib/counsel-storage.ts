/**
 * Firestore-based counsel booking storage
 * Uber-like counsel booking for South Sudan
 * Manages counsel requests, appointments, counselor registration and broadcast
 */

import { getFirebaseAuth, admin } from './firebase-admin';

const COUNSEL_REQUESTS_COLLECTION = 'counselRequests';
const COUNSELORS_COLLECTION = 'counselors';
const APPOINTMENTS_COLLECTION = 'appointments';
const BOOKING_QUEUE_COLLECTION = 'bookingQueue';

// South Sudan States for location-based matching
export const SOUTH_SUDAN_STATES = [
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
] as const;

export type StateCode = typeof SOUTH_SUDAN_STATES[number]['code'];

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) {
    return null;
  }
  return admin.firestore();
}

export interface CounselRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  note: string;
  legalCategory: string; // Type of legal help needed
  state: StateCode; // User's state
  status: 'broadcasting' | 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled' | 'expired';
  counselorId?: string;
  counselorName?: string;
  counselorPhone?: string;
  scheduledAt?: string;
  preferredDate?: string;
  preferredTime?: string;
  broadcastedTo: string[]; // List of counselor IDs notified
  broadcastCount: number;
  expiresAt: admin.firestore.Timestamp; // Auto-expire after timeout
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  acceptedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
}

export interface Counselor {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  // Registration info
  nationalIdNumber?: string; // National ID number
  idDocumentUrl?: string; // URL to uploaded ID document
  applicationStatus: 'pending' | 'approved' | 'rejected'; // Admin approval status
  rejectionReason?: string; // Reason if rejected
  appliedAt?: admin.firestore.Timestamp; // When they applied
  approvedAt?: admin.firestore.Timestamp; // When approved
  approvedBy?: string; // Admin who approved
  // Operational status
  isOnline: boolean;
  isVerified: boolean; // Admin-verified counselor (same as approved)
  isAvailable: boolean; // Can accept new requests
  state: StateCode; // Counselor's primary state
  servingStates: StateCode[]; // States the counselor serves
  specializations: string[]; // Legal specializations
  // Stats
  rating: number;
  totalCases: number;
  completedCases: number;
  activeRequests: number;
  maxActiveRequests: number; // Max concurrent cases
  lastSeenAt: admin.firestore.Timestamp;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

export interface Appointment {
  id: string;
  requestId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userPhone?: string;
  counselorId?: string;
  counselorName?: string;
  counselorPhone?: string;
  note: string;
  state: StateCode;
  scheduledDate: string;
  scheduledTime: string;
  status: 'queued' | 'scheduled' | 'accepted' | 'completed' | 'cancelled' | 'no_show';
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

// Legal categories for South Sudan context
export const LEGAL_CATEGORIES = [
  { id: 'land', name: 'Land & Property Disputes', icon: '🏠' },
  { id: 'family', name: 'Family & Marriage', icon: '👨‍👩‍👧‍👦' },
  { id: 'criminal', name: 'Criminal Defense', icon: '⚖️' },
  { id: 'civil', name: 'Civil Rights', icon: '📜' },
  { id: 'business', name: 'Business & Contracts', icon: '💼' },
  { id: 'employment', name: 'Employment Issues', icon: '👷' },
  { id: 'inheritance', name: 'Inheritance & Wills', icon: '📋' },
  { id: 'immigration', name: 'Immigration & Citizenship', icon: '🛂' },
  { id: 'customary', name: 'Customary Law', icon: '🏛️' },
  { id: 'other', name: 'Other Legal Matter', icon: '❓' },
] as const;

/**
 * Apply to become a counselor (requires admin approval)
 */
export async function applyCounselor(application: {
  userId: string;
  name: string;
  email: string;
  phone: string;
  nationalIdNumber: string;
  idDocumentUrl?: string;
  state: StateCode;
  servingStates?: StateCode[];
  specializations?: string[];
}): Promise<{ success: boolean; message: string }> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return { success: false, message: 'Database not available' };
  }

  try {
    // Check if already applied
    const existingRef = db.collection(COUNSELORS_COLLECTION).doc(application.userId);
    const existing = await existingRef.get();
    
    if (existing.exists) {
      const data = existing.data() as Counselor;
      if (data.applicationStatus === 'approved') {
        return { success: false, message: 'You are already an approved counselor' };
      }
      if (data.applicationStatus === 'pending') {
        return { success: false, message: 'Your application is already pending review' };
      }
      // If rejected, allow re-application
    }

    const now = admin.firestore.Timestamp.now();
    
    const counselorData: Counselor = {
      id: application.userId,
      userId: application.userId,
      name: application.name,
      email: application.email,
      phone: application.phone,
      nationalIdNumber: application.nationalIdNumber,
      idDocumentUrl: application.idDocumentUrl || '',
      applicationStatus: 'pending',
      appliedAt: now,
      isOnline: false,
      isVerified: false,
      isAvailable: false,
      state: application.state,
      servingStates: application.servingStates || [application.state],
      specializations: application.specializations || [],
      rating: 0,
      totalCases: 0,
      completedCases: 0,
      activeRequests: 0,
      maxActiveRequests: 5,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await existingRef.set(counselorData);
    console.log(`✅ Counselor application submitted: ${application.name} (${application.userId})`);
    return { success: true, message: 'Application submitted successfully. Please wait for admin approval.' };
  } catch (error) {
    console.error('❌ Error submitting counselor application:', error);
    return { success: false, message: 'Failed to submit application' };
  }
}

/**
 * Get pending counselor applications (for admin)
 */
export async function getPendingCounselorApplications(): Promise<Counselor[]> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firestore not available');
    return [];
  }

  try {
    console.log('🔍 Querying Firestore for pending counselor applications...');
    const snapshot = await db.collection(COUNSELORS_COLLECTION)
      .where('applicationStatus', '==', 'pending')
      .orderBy('appliedAt', 'asc')
      .get();

    console.log(`✅ Found ${snapshot.size} pending applications in Firestore`);
    const applications = snapshot.docs.map(doc => {
      const data = doc.data() as Counselor;
      console.log('  - Application:', {
        id: doc.id,
        name: data.name,
        email: data.email,
        status: data.applicationStatus,
        appliedAt: data.appliedAt
      });
      return data;
    });
    
    return applications;
  } catch (error) {
    console.error('❌ Error fetching pending applications:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

/**
 * Get all counselors (for admin)
 */
export async function getAllCounselors(): Promise<Counselor[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection(COUNSELORS_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Counselor);
  } catch (error) {
    console.error('❌ Error fetching all counselors:', error);
    return [];
  }
}

/**
 * Approve a counselor application (admin only)
 */
export async function approveCounselor(
  counselorId: string,
  approvedBy: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(counselorId);
    const counselorDoc = await counselorRef.get();

    if (!counselorDoc.exists) {
      console.error('❌ Counselor not found:', counselorId);
      return false;
    }

    await counselorRef.update({
      applicationStatus: 'approved',
      isVerified: true,
      approvedAt: admin.firestore.Timestamp.now(),
      approvedBy,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Counselor approved: ${counselorId} by ${approvedBy}`);
    return true;
  } catch (error) {
    console.error('❌ Error approving counselor:', error);
    return false;
  }
}

/**
 * Reject a counselor application (admin only)
 */
export async function rejectCounselor(
  counselorId: string,
  rejectedBy: string,
  reason: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(counselorId);
    const counselorDoc = await counselorRef.get();

    if (!counselorDoc.exists) {
      console.error('❌ Counselor not found:', counselorId);
      return false;
    }

    await counselorRef.update({
      applicationStatus: 'rejected',
      rejectionReason: reason,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Counselor rejected: ${counselorId} - ${reason}`);
    return true;
  } catch (error) {
    console.error('❌ Error rejecting counselor:', error);
    return false;
  }
}

/**
 * Check if user is an approved counselor
 */
export async function isApprovedCounselor(userId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(userId);
    const counselorDoc = await counselorRef.get();

    if (!counselorDoc.exists) {
      return false;
    }

    const data = counselorDoc.data() as Counselor;
    return data.applicationStatus === 'approved';
  } catch (error) {
    console.error('❌ Error checking counselor status:', error);
    return false;
  }
}

/**
 * Get counselor application status
 */
export async function getCounselorApplicationStatus(userId: string): Promise<{
  exists: boolean;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
} | null> {
  const db = getFirestore();
  if (!db) {
    return null;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(userId);
    const counselorDoc = await counselorRef.get();

    if (!counselorDoc.exists) {
      return { exists: false };
    }

    const data = counselorDoc.data() as Counselor;
    return {
      exists: true,
      status: data.applicationStatus,
      rejectionReason: data.rejectionReason,
    };
  } catch (error) {
    console.error('❌ Error getting counselor status:', error);
    return null;
  }
}

/**
 * Legacy: Register a new counselor (kept for backward compatibility, now creates pending application)
 */
export async function registerCounselor(
  counselor: Omit<Counselor, 'id' | 'createdAt' | 'updatedAt' | 'rating' | 'totalCases' | 'completedCases' | 'activeRequests'>
): Promise<string | null> {
  const result = await applyCounselor({
    userId: counselor.userId,
    name: counselor.name,
    email: counselor.email,
    phone: counselor.phone || '',
    nationalIdNumber: counselor.nationalIdNumber || '',
    idDocumentUrl: counselor.idDocumentUrl,
    state: counselor.state,
    servingStates: counselor.servingStates,
    specializations: counselor.specializations,
  });
  
  return result.success ? counselor.userId : null;
}

/**
 * Create a new counsel request and broadcast to available counselors
 */
export async function createCounselRequest(
  request: Omit<CounselRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'broadcastedTo' | 'broadcastCount' | 'expiresAt'>
): Promise<{ requestId: string | null; broadcastCount: number; onlineCounselors: Counselor[] }> {
  const db = getFirestore();
  if (!db) {
    console.warn('⚠️ Firebase Admin not initialized');
    return { requestId: null, broadcastCount: 0, onlineCounselors: [] };
  }

  try {
    // Find available counselors in the user's state or serving that state
    const availableCounselors = await getAvailableCounselorsForState(request.state);
    
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc();
    const now = admin.firestore.Timestamp.now();
    // Request expires in 5 minutes if no one accepts
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 5 * 60 * 1000);
    
    const requestData: CounselRequest = {
      ...request,
      id: requestRef.id,
      status: availableCounselors.length > 0 ? 'broadcasting' : 'pending',
      broadcastedTo: availableCounselors.map(c => c.id),
      broadcastCount: availableCounselors.length,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    await requestRef.set(requestData);
    console.log(`✅ Counsel request created: ${requestRef.id}, broadcast to ${availableCounselors.length} counselors`);
    
    return {
      requestId: requestRef.id,
      broadcastCount: availableCounselors.length,
      onlineCounselors: availableCounselors,
    };
  } catch (error) {
    console.error('❌ Error creating counsel request:', error);
    return { requestId: null, broadcastCount: 0, onlineCounselors: [] };
  }
}

/**
 * Get available counselors for a specific state
 */
export async function getAvailableCounselorsForState(state: StateCode): Promise<Counselor[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    console.log(`🔍 Looking for available counselors in state: ${state}`);
    
    // Get counselors who are verified and online
    const snapshot = await db.collection(COUNSELORS_COLLECTION)
      .where('applicationStatus', '==', 'approved')
      .where('isOnline', '==', true)
      .get();

    console.log(`Found ${snapshot.size} online approved counselors total`);

    const counselors = snapshot.docs
      .map(doc => doc.data() as Counselor)
      .filter(c => {
        const servesState = c.servingStates?.includes(state) || c.state === state;
        const hasCapacity = (c.activeRequests || 0) < (c.maxActiveRequests || 5);
        const isAvailable = c.isAvailable !== false; // Default to true if not set
        
        console.log(`  Counselor ${c.name}: servesState=${servesState}, hasCapacity=${hasCapacity}, isAvailable=${isAvailable}`);
        
        return servesState && hasCapacity && isAvailable;
      })
      .sort((a, b) => {
        // Prioritize: same state > rating > fewer active requests
        const aInState = a.state === state ? 1 : 0;
        const bInState = b.state === state ? 1 : 0;
        if (aInState !== bInState) return bInState - aInState;
        if ((a.rating || 0) !== (b.rating || 0)) return (b.rating || 0) - (a.rating || 0);
        return (a.activeRequests || 0) - (b.activeRequests || 0);
      });
    
    console.log(`✅ Found ${counselors.length} available counselors for state ${state}`);
    return counselors;
  } catch (error) {
    console.error('❌ Error fetching available counselors:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    return [];
  }
}

/**
 * Get all online counselors (for broadcast)
 */
export async function getAllOnlineCounselors(): Promise<Counselor[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection(COUNSELORS_COLLECTION)
      .where('isOnline', '==', true)
      .get();

    return snapshot.docs.map(doc => doc.data() as Counselor);
  } catch (error) {
    console.error('❌ Error fetching online counselors:', error);
    return [];
  }
}

/**
 * Get a counsel request by ID
 */
export async function getCounselRequest(requestId: string): Promise<CounselRequest | null> {
  const db = getFirestore();
  if (!db) {
    return null;
  }

  try {
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (requestDoc.exists) {
      return requestDoc.data() as CounselRequest;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching counsel request:', error);
    return null;
  }
}

/**
 * Get pending/broadcasting requests for a counselor
 */
export async function getRequestsForCounselor(counselorId: string): Promise<CounselRequest[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const counselor = await getCounselor(counselorId);
    if (!counselor) return [];

    // Get requests where this counselor was notified
    const snapshot = await db.collection(COUNSEL_REQUESTS_COLLECTION)
      .where('status', 'in', ['broadcasting', 'pending', 'scheduled'])
      .where('broadcastedTo', 'array-contains', counselorId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as CounselRequest);
  } catch (error) {
    console.error('❌ Error fetching requests for counselor:', error);
    return [];
  }
}

/**
 * Get all pending requests (for counselors to see)
 * Only shows 'broadcasting' and 'pending' (not 'scheduled' or 'expired')
 */
export async function getPendingCounselRequests(): Promise<CounselRequest[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await db.collection(COUNSEL_REQUESTS_COLLECTION)
      .where('status', 'in', ['broadcasting', 'pending'])
      .where('expiresAt', '>', now)
      .orderBy('expiresAt', 'asc')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as CounselRequest);
  } catch (error) {
    console.error('❌ Error fetching pending counsel requests:', error);
    return [];
  }
}

/**
 * Get user's counsel requests
 */
export async function getUserCounselRequests(userId: string): Promise<CounselRequest[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection(COUNSEL_REQUESTS_COLLECTION)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    return snapshot.docs.map(doc => doc.data() as CounselRequest);
  } catch (error) {
    console.error('❌ Error fetching user counsel requests:', error);
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
): Promise<{ success: boolean; chatId?: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false };
  }

  try {
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      console.error('❌ Counsel request not found:', requestId);
      return { success: false };
    }

    const requestData = requestDoc.data() as CounselRequest;
    if (requestData.status !== 'broadcasting' && requestData.status !== 'pending' && requestData.status !== 'scheduled') {
      console.error('❌ Cannot accept request with status:', requestData.status);
      return { success: false };
    }

    // Check if already accepted by another counselor
    if (requestData.counselorId) {
      console.error('❌ Request already accepted by another counselor');
      return { success: false };
    }

    // Create chat session
    const { createChatSession } = await import('./counsel-chat-storage');
    const chatId = await createChatSession(
      requestId,
      null,
      requestData.userId,
      requestData.userName,
      counselorId,
      counselorName
    );

    await requestRef.update({
      status: 'accepted',
      counselorId,
      counselorName,
      counselorPhone: counselorPhone || null,
      acceptedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update counselor active requests count
    await incrementCounselorActiveRequests(counselorId, 1);

    console.log(`✅ Counsel request accepted: ${requestId} by ${counselorName}, chat: ${chatId}`);
    return { success: true, chatId: chatId || undefined };
  } catch (error) {
    console.error('❌ Error accepting counsel request:', error);
    return { success: false };
  }
}

/**
 * Schedule a counsel request for later (when no counselors available)
 */
export async function scheduleBooking(
  request: Omit<CounselRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'broadcastedTo' | 'broadcastCount' | 'expiresAt'>,
  preferredDate: string,
  preferredTime: string
): Promise<string | null> {
  const db = getFirestore();
  if (!db) {
    return null;
  }

  try {
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc();
    const appointmentRef = db.collection(APPOINTMENTS_COLLECTION).doc();
    const now = admin.firestore.Timestamp.now();
    // Scheduled requests don't expire quickly
    const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    const requestData: CounselRequest = {
      ...request,
      id: requestRef.id,
      status: 'scheduled',
      preferredDate,
      preferredTime,
      broadcastedTo: [],
      broadcastCount: 0,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };

    const appointmentData: Appointment = {
      id: appointmentRef.id,
      requestId: requestRef.id,
      userId: request.userId,
      userName: request.userName,
      userEmail: request.userEmail,
      userPhone: request.userPhone,
      note: request.note,
      state: request.state,
      scheduledDate: preferredDate,
      scheduledTime: preferredTime,
      status: 'queued',
      createdAt: now,
      updatedAt: now,
    };

    // Save both in a batch
    const batch = db.batch();
    batch.set(requestRef, requestData);
    batch.set(appointmentRef, appointmentData);
    await batch.commit();

    console.log(`✅ Booking scheduled: ${requestRef.id} for ${preferredDate} ${preferredTime}`);
    return requestRef.id;
  } catch (error) {
    console.error('❌ Error scheduling booking:', error);
    return null;
  }
}

/**
 * Get queued appointments (for counselors to pick up)
 */
export async function getQueuedAppointments(state?: StateCode): Promise<Appointment[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    let query = db.collection(APPOINTMENTS_COLLECTION)
      .where('status', '==', 'queued')
      .orderBy('scheduledDate', 'asc')
      .orderBy('scheduledTime', 'asc');

    const snapshot = await query.get();
    let appointments = snapshot.docs.map(doc => doc.data() as Appointment);

    // Filter by state if provided
    if (state) {
      appointments = appointments.filter(a => a.state === state);
    }

    return appointments;
  } catch (error) {
    console.error('❌ Error fetching queued appointments:', error);
    return [];
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
): Promise<{ success: boolean; chatId?: string }> {
  const db = getFirestore();
  if (!db) {
    return { success: false };
  }

  try {
    const appointmentRef = db.collection(APPOINTMENTS_COLLECTION).doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();

    if (!appointmentDoc.exists) {
      return { success: false };
    }

    const appointment = appointmentDoc.data() as Appointment;
    if (appointment.status !== 'queued') {
      return { success: false };
    }

    // Create chat session for this appointment
    const { createChatSession } = await import('./counsel-chat-storage');
    const chatId = await createChatSession(
      null,
      appointmentId,
      appointment.userId,
      appointment.userName,
      counselorId,
      counselorName
    );

    // Update appointment
    await appointmentRef.update({
      status: 'accepted',
      counselorId,
      counselorName,
      counselorPhone: counselorPhone || null,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update related request
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc(appointment.requestId);
    await requestRef.update({
      status: 'accepted',
      counselorId,
      counselorName,
      counselorPhone: counselorPhone || null,
      acceptedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update counselor stats
    await incrementCounselorActiveRequests(counselorId, 1);

    console.log(`✅ Appointment accepted: ${appointmentId} by ${counselorName}, chat: ${chatId}`);
    return { success: true, chatId: chatId || undefined };
  } catch (error) {
    console.error('❌ Error accepting appointment:', error);
    return { success: false };
  }
}

/**
 * Set counselor online status
 */
export async function setCounselorOnlineStatus(
  userId: string,
  isOnline: boolean,
  name: string,
  email: string,
  phone?: string,
  state?: StateCode
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(userId);
    const counselorDoc = await counselorRef.get();
    const now = admin.firestore.Timestamp.now();

    if (counselorDoc.exists) {
      await counselorRef.update({
        isOnline,
        isAvailable: isOnline,
        lastSeenAt: now,
        updatedAt: now,
        ...(phone && { phone }),
        ...(state && { state }),
      });
    } else {
      // Auto-register counselor if not exists
      await counselorRef.set({
        id: userId,
        userId,
        name,
        email,
        phone: phone || '',
        isOnline,
        isVerified: false, // Needs admin verification
        isAvailable: isOnline,
        state: state || 'CES', // Default to Central Equatoria (Juba)
        servingStates: [state || 'CES'],
        specializations: [],
        rating: 0,
        totalCases: 0,
        completedCases: 0,
        activeRequests: 0,
        maxActiveRequests: 5,
        lastSeenAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`✅ Counselor ${userId} online status set to: ${isOnline}`);
    return true;
  } catch (error) {
    console.error('❌ Error setting counselor online status:', error);
    return false;
  }
}

/**
 * Get online counselors
 */
export async function getOnlineCounselors(): Promise<Counselor[]> {
  const db = getFirestore();
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db.collection(COUNSELORS_COLLECTION)
      .where('isOnline', '==', true)
      .get();

    return snapshot.docs.map(doc => doc.data() as Counselor);
  } catch (error) {
    console.error('❌ Error fetching online counselors:', error);
    return [];
  }
}

/**
 * Get counselor by user ID
 */
export async function getCounselor(userId: string): Promise<Counselor | null> {
  const db = getFirestore();
  if (!db) {
    return null;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(userId);
    const counselorDoc = await counselorRef.get();

    if (counselorDoc.exists) {
      return counselorDoc.data() as Counselor;
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching counselor:', error);
    return null;
  }
}

/**
 * Increment/decrement counselor active requests count
 */
export async function incrementCounselorActiveRequests(
  counselorId: string,
  delta: number
): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(counselorId);
    await counselorRef.update({
      activeRequests: admin.firestore.FieldValue.increment(delta),
      totalCases: admin.firestore.FieldValue.increment(delta > 0 ? 1 : 0),
      updatedAt: admin.firestore.Timestamp.now(),
    });
    return true;
  } catch (error) {
    console.error('❌ Error updating counselor active requests:', error);
    return false;
  }
}

/**
 * Complete a counsel request
 */
export async function completeCounselRequest(requestId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return false;
    }

    const requestData = requestDoc.data() as CounselRequest;
    
    await requestRef.update({
      status: 'completed',
      completedAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update appointment status if exists
    const appointmentsSnapshot = await db.collection(APPOINTMENTS_COLLECTION)
      .where('requestId', '==', requestId)
      .get();
    
    for (const appointmentDoc of appointmentsSnapshot.docs) {
      await appointmentDoc.ref.update({
        status: 'completed',
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }

    // Decrement counselor active requests and increment completed
    if (requestData.counselorId) {
      await incrementCounselorActiveRequests(requestData.counselorId, -1);
      const counselorRef = db.collection(COUNSELORS_COLLECTION).doc(requestData.counselorId);
      await counselorRef.update({
        completedCases: admin.firestore.FieldValue.increment(1),
      });
    }

    console.log(`✅ Counsel request completed: ${requestId}`);
    return true;
  } catch (error) {
    console.error('❌ Error completing counsel request:', error);
    return false;
  }
}

/**
 * Cancel a counsel request
 */
export async function cancelCounselRequest(requestId: string, reason?: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) {
    return false;
  }

  try {
    const requestRef = db.collection(COUNSEL_REQUESTS_COLLECTION).doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return false;
    }

    const requestData = requestDoc.data() as CounselRequest;
    
    await requestRef.update({
      status: 'cancelled',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Decrement counselor active requests if was accepted
    if (requestData.counselorId && requestData.status === 'accepted') {
      await incrementCounselorActiveRequests(requestData.counselorId, -1);
    }

    console.log(`✅ Counsel request cancelled: ${requestId}`);
    return true;
  } catch (error) {
    console.error('❌ Error cancelling counsel request:', error);
    return false;
  }
}

/**
 * Get counselor stats
 */
export async function getCounselorStats(): Promise<{ total: number; online: number; byState: Record<StateCode, number> }> {
  const db = getFirestore();
  if (!db) {
    return { total: 0, online: 0, byState: {} as Record<StateCode, number> };
  }

  try {
    const snapshot = await db.collection(COUNSELORS_COLLECTION).get();
    const counselors = snapshot.docs.map(doc => doc.data() as Counselor);
    
    const byState: Record<string, number> = {};
    let online = 0;

    for (const c of counselors) {
      if (c.isOnline) online++;
      byState[c.state] = (byState[c.state] || 0) + 1;
    }

    return {
      total: counselors.length,
      online,
      byState: byState as Record<StateCode, number>,
    };
  } catch (error) {
    console.error('❌ Error getting counselor stats:', error);
    return { total: 0, online: 0, byState: {} as Record<StateCode, number> };
  }
}
