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
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const initializeGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID.');
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Render the button
      const buttonDiv = document.getElementById('google-signin-button');
      if (buttonDiv) {
        window.google.accounts.id.renderButton(buttonDiv, {
          theme: 'outline',
          size: 'large',
          width: buttonDiv.offsetWidth,
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
      setError('Failed to initialize Google Sign-In');
    }
  };

  const handleGoogleCallback = useCallback(async (response: any) => {
    setIsLoading(true);
    setError('');

    try {
      // Send the credential to backend for verification
      const result = await fetch(getApiUrl('auth/admin/google'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential
        })
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.success && data.admin && data.token) {
        setAdminFromToken(data.admin, data.token);
        toast.success('Welcome to Admin Dashboard!');
        navigate('/admin/dashboard');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
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

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-600">Authenticating...</p>
              </div>
            ) : (
              <>
                <div 
                  id="google-signin-button" 
                  className="flex justify-center"
                  style={{ minHeight: '44px' }}
                />
                
                {!googleReady && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                    <p className="text-sm text-gray-500">Loading Google Sign-In...</p>
                  </div>
                )}
              </>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 font-medium mb-2">🔐 Authorized Access Only</p>
              <p className="text-xs text-blue-600 mb-2">
                Only specific email addresses are authorized to access the admin dashboard.
              </p>
              <p className="text-xs text-blue-600">
                Current authorized email: <strong>thuchabraham42@gmail.com</strong>
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800 font-medium mb-1">✨ How it works:</p>
              <ol className="text-xs text-green-700 space-y-1 pl-4 list-decimal">
                <li>Click "Sign in with Google" above</li>
                <li>Sign in with your authorized Google account</li>
                <li>You'll be automatically redirected to the admin dashboard</li>
              </ol>
            </div>
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
