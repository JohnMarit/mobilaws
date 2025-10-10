import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl } from '../lib/api';

export default function AdminVerify() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAdminFromToken } = useAdmin();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('No verification token found');
      return;
    }

    verifyToken(token);
  }, [token]);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(getApiUrl('auth/verify-magic-link'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      if (data.success && data.type === 'admin' && data.admin) {
        // Store admin data
        setAdminFromToken(data.admin, data.token);
        
        setStatus('success');
        toast.success('Successfully logged in!');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${
              status === 'verifying' ? 'bg-blue-100' :
              status === 'success' ? 'bg-green-100' :
              'bg-red-100'
            }`}>
              {status === 'verifying' && <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-8 w-8 text-green-600" />}
              {status === 'error' && <XCircle className="h-8 w-8 text-red-600" />}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {status === 'verifying' && 'Verifying...'}
            {status === 'success' && 'Login Successful!'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your magic link'}
            {status === 'success' && 'You\'ll be redirected to the admin dashboard'}
            {status === 'error' && 'There was a problem verifying your login link'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-gray-400 animate-pulse" />
              </div>
              <p className="text-sm text-gray-600">
                Authenticating your access...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Authentication successful!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Welcome back, Admin!
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center text-sm text-gray-600">
                <p>Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">
                      Verification failed
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      {error || 'The login link is invalid or has expired'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-600 font-medium">Common reasons:</p>
                <ul className="text-sm text-gray-600 space-y-1 pl-5 list-disc">
                  <li>The link has expired (links expire after 15 minutes)</li>
                  <li>The link has already been used</li>
                  <li>The link is invalid or corrupted</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/admin/login')}
                >
                  Request New Link
                </Button>
                <Button 
                  variant="ghost"
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
