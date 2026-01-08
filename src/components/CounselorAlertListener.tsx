import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCounselorProfile, getRequestsForCounselor, getPendingCounselRequests } from '@/lib/counsel-service';
import { ensureDailyPushRegistration } from '@/lib/pushNotifications';
import { notificationSound } from '@/lib/notification-sound';

/**
 * Background listener for counselors.
 * DISABLED: No longer needed since chats are created automatically after payment.
 * Counselors now see chats directly in their dashboard without needing to accept requests.
 */
export function CounselorAlertListener() {
  // This component is now disabled - chats are created automatically
  // and counselors see them directly in their dashboard
  return null;
}

