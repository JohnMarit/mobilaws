import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCounselorProfile, getRequestsForCounselor, getPendingCounselRequests } from '@/lib/counsel-service';
import { ensureDailyPushRegistration } from '@/lib/pushNotifications';
import { notificationSound } from '@/lib/notification-sound';

/**
 * Background listener for counselors.
 * Polls for incoming requests and plays a ringing sound + toast,
 * even if the counselor dashboard is not open.
 */
export function CounselorAlertListener() {
  const { user } = useAuth();
  const { toast } = useToast();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastCountRef = useRef<number>(0);
  const isApprovedRef = useRef<boolean>(false);
  const isOnlineRef = useRef<boolean>(false);

  useEffect(() => {
    // Listen for service worker messages (e.g., background push to trigger sound)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handler = (event: MessageEvent) => {
        if (event.data?.type === 'NEW_COUNSEL_REQUEST') {
          console.log('📩 SW message: NEW_COUNSEL_REQUEST -> playing sound');
          notificationSound.playRequestNotification();
          if (navigator?.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
        }
        if (event.data?.type === 'REQUEST_CANCELLED') {
          console.log('📩 SW message: REQUEST_CANCELLED -> stopping sound');
          notificationSound.stopRinging();
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);

  useEffect(() => {
    const startPolling = async () => {
      if (!user) return;

      // Register push notifications (once per day prompt)
      ensureDailyPushRegistration(user.id);

      // Check counselor profile to ensure approved/online
      const profile = await getCounselorProfile(user.id);
      isApprovedRef.current = profile?.applicationStatus === 'approved';
      isOnlineRef.current = !!profile?.isOnline;

      if (!isApprovedRef.current || !isOnlineRef.current) {
        stopPolling();
        return;
      }

      if (pollingRef.current) return;

      pollingRef.current = setInterval(async () => {
        try {
          const [personal, globalPending] = await Promise.all([
            getRequestsForCounselor(user.id),
            getPendingCounselRequests(),
          ]);

          const personalActive = personal.filter(r =>
            ['broadcasting', 'pending'].includes(r.status)
          );
          const globalActive = globalPending.filter(r =>
            ['broadcasting', 'pending'].includes(r.status)
          );
          const activeRequests = personalActive.length > 0 ? personalActive : globalActive;

          console.log(`🔍 Counselor polling: personal=${personalActive.length}, global=${globalActive.length}, using=${activeRequests.length} (previous: ${lastCountRef.current})`);

          if (activeRequests.length > lastCountRef.current) {
            const newCount = activeRequests.length - lastCountRef.current;
            console.log(`🆕 ${newCount} NEW REQUEST(S)! Playing sound...`);
            
            // Play notification sound
            notificationSound.playRequestNotification();
            if (navigator?.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            
            // Show toast
            toast({
              title: '🔔 Incoming Counsel Request!',
              description: `${newCount} new request(s) need your attention. Click to view.`,
              duration: 10000,
            });
          }

          // Stop ringing when no active requests remain
          if (activeRequests.length === 0 && lastCountRef.current > 0) {
            console.log('🔕 No active requests, stopping sound');
            notificationSound.stopRinging();
          }

          lastCountRef.current = activeRequests.length;
        } catch (error) {
          console.error('❌ Error polling counselor requests:', error);
        }
      }, 2000); // poll faster for quicker ring/stop
    };

    const stopPolling = () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };

    startPolling();
    return () => stopPolling();
  }, [user, toast]);

  return null;
}

