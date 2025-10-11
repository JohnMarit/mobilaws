import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, Loader2 } from 'lucide-react';

export default function AdminVerify() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAdmin();

  useEffect(() => {
    // If already authenticated, redirect to dashboard
    if (isAuthenticated) {
      navigate('/admin/dashboard');
    } else {
      // Otherwise redirect to login
      setTimeout(() => {
        navigate('/admin/login');
      }, 1500);
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          </div>
          <CardTitle className="text-2xl">Redirecting...</CardTitle>
          <CardDescription>
            {isAuthenticated 
              ? 'Taking you to the admin dashboard' 
              : 'Taking you to the login page'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-gray-400 animate-pulse" />
            </div>
            <p className="text-sm text-gray-600">
              Please wait a moment...
            </p>
          </div>
          <div className="mt-4 text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate(isAuthenticated ? '/admin/dashboard' : '/admin/login')}
              className="text-sm"
            >
              Click here if not redirected automatically
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
