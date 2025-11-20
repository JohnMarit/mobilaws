import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../lib/api';
import { useAdmin } from '../contexts/AdminContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAdminFromToken, isAuthenticated } = useAdmin();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Initialize Google OAuth
  useEffect(() => {
    // Check if we're returning from Google OAuth
    const handleOAuthRedirect = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      const state = params.get('state');
      
      if (idToken && state === 'admin_login') {
        console.log('🔐 Received ID token from Google OAuth redirect');
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        // Process the token
        handleGoogleCallback({ credential: idToken });
        return true;
      }
      return false;
    };

    // Check for OAuth redirect first
    if (!handleOAuthRedirect()) {
      // Load Google Sign-In script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google) {
          setGoogleReady(true);
          initializeGoogleSignIn();
        }
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Sign-In script');
        setError('Failed to load Google Sign-In. Please check your internet connection.');
      };
      document.head.appendChild(script);

      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, []);

  const initializeGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID.');
      console.error('❌ VITE_GOOGLE_CLIENT_ID not found');
      return;
    }

    console.log('🔧 Initializing Google Sign-In with Client ID:', clientId.substring(0, 20) + '...');

    try {
      // Initialize Google Identity Services
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: false,
        itp_support: true, // Improved tracking prevention support
      });
      
      console.log('✅ Google OAuth initialized successfully');
    } catch (err) {
      console.error('❌ Error initializing Google Sign-In:', err);
      setError('Failed to initialize Google Sign-In. Please refresh the page.');
    }
  };

  const handleGoogleSignIn = () => {
    if (!googleReady) {
      setError('Google Sign-In is not ready yet. Please wait.');
      return;
    }

    setError(''); // Clear any previous errors
    setIsLoading(true);
    
    try {
      console.log('🚀 Opening Google Sign-In popup...');
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      // Use OAuth2 implicit flow (most reliable)
      const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
      const redirectUri = window.location.origin + window.location.pathname;
      
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: Math.random().toString(36).substring(2, 15),
        state: 'admin_login',
        prompt: 'select_account',
      });
      
      // Redirect to Google OAuth (simpler and more reliable than popup)
      const authUrl = `${oauth2Endpoint}?${params.toString()}`;
      window.location.href = authUrl;
      
    } catch (err) {
      console.error('❌ Error triggering Google Sign-In:', err);
      setError('Failed to open Google Sign-In. Please try again.');
      setIsLoading(false);
    }
  };


  const handleGoogleCallback = useCallback(async (response: any) => {
    console.log('🔐 Google callback received');
    setIsLoading(true);
    setError('');

    try {
      console.log('📤 Sending token to backend for verification...');
      // Send the credential to backend for verification
      const result = await fetch(getApiUrl('auth/admin/google'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: response.credential
        })
      });

      const data = await result.json();
      console.log('📥 Backend response:', data);

      if (!result.ok) {
        console.error('❌ Backend returned error:', data);
        throw new Error(data.message || data.error || 'Authentication failed');
      }

      if (data.success && data.admin && data.token) {
        console.log('✅ Admin authentication successful:', data.admin.email);
        setAdminFromToken(data.token, data.admin);
        toast.success(`Welcome, ${data.admin.name || data.admin.email}!`);
        navigate('/admin/dashboard');
      } else {
        console.error('❌ Invalid response structure:', data);
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Admin login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [setAdminFromToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Admin Login</CardTitle>
          <CardDescription>
            Sign in with your authorized Google account to access the admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Custom Google Sign-In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading || !googleReady}
              className="w-full flex items-center justify-center space-x-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : !googleReady ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
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
                  <span>Sign in with Google</span>
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              ← Back to Main Site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
