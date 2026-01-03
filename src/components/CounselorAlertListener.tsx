import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { getCounselorProfile, getRequestsForCounselor } from '@/lib/counsel-service';
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
    const startPolling = async () => {
      if (!user) return;

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
          const requests = await getRequestsForCounselor(user.id);
          const activeRequests = requests.filter(r =>
            ['broadcasting', 'pending'].includes(r.status)
          );

          if (activeRequests.length > lastCountRef.current) {
            // New requests arrived
            notificationSound.playRequestNotification();
            toast({
              title: '🔔 Incoming Counsel Request',
              description: `${activeRequests.length - lastCountRef.current} new request(s) need attention.`,
            });
          }

          lastCountRef.current = activeRequests.length;
        } catch (error) {
          console.error('Error polling counselor requests:', error);
        }
      }, 5000);
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

