/**
 * Counselor Alert Listener
 * Listens for push notifications and plays sound alerts for counselors
 */

import { useEffect } from 'react';
import { useAuth } from '@/contexts/FirebaseAuthContext';
import { useToast } from '@/hooks/use-toast';

// Audio context for notification sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
}

// Play notification sound for new chat
function playNewChatSound() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Pleasant notification tone
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
}

export function CounselorAlertListener() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NEW_COUNSEL_REQUEST' || event.data?.type === 'new_chat' || event.data?.type === 'new_message') {
        console.log('🔔 Received notification:', event.data);
        
        // Play sound
        playNewChatSound();
        
        // Show toast
        if (event.data.type === 'new_message') {
          const userName = event.data.data?.userName || 'A user';
          const message = event.data.data?.message || 'New message';
          toast({
            title: `💬 ${userName}`,
            description: message.substring(0, 100),
          });
        } else if (event.data.type === 'new_chat') {
          toast({
            title: '💬 New Chat!',
            description: `${event.data.data?.userName || 'A user'} has started a chat with you.`,
          });
        } else {
          toast({
            title: '🔔 New Counsel Request!',
            description: 'A new counsel request is waiting for you.',
          });
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, [user, toast]);

  return null;
}

