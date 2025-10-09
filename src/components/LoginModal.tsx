import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePromptLimit } from '@/contexts/PromptLimitContext';
import { Loader2 } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { isLoading, login } = useAuth();
  const { promptCount, maxPrompts, maxDailyTokens } = usePromptLimit();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      await login();
      onClose();
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Sign In to Continue</DialogTitle>
          <DialogDescription className="text-center">
            {promptCount >= maxPrompts 
              ? `You've used ${promptCount} out of ${maxPrompts} free prompts. Sign in with Google to continue asking questions.`
              : 'Sign in with Google to access premium features and get more tokens for legal assistance.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="text-sm text-gray-600 text-center">
            Sign in to get {maxDailyTokens} tokens per day for legal assistance
          </div>
          
          {error && (
            <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 text-center">
              {error}
            </div>
          )}
          
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn || isLoading}
            className="w-full flex items-center justify-center space-x-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
            size="lg"
          >
            {isLoggingIn || isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </Button>
          
          <div className="text-xs text-gray-500 text-center">
            By signing in, you agree to our terms of service and privacy policy
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
