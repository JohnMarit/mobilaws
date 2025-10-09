import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GoogleAuthDebug() {
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [clientId, setClientId] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Check if Google script is loaded
    const checkGoogleScript = () => {
      if (window.google && window.google.accounts) {
        setGoogleScriptLoaded(true);
        addDebugInfo('✅ Google OAuth script loaded');
      } else {
        addDebugInfo('⏳ Google OAuth script not loaded yet');
        setTimeout(checkGoogleScript, 100);
      }
    };

    // Check environment variable
    const envClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    setClientId(envClientId || 'NOT SET');
    addDebugInfo(`Environment Client ID: ${envClientId ? 'SET' : 'NOT SET'}`);

    checkGoogleScript();
  }, []);

  const testGoogleAuth = () => {
    if (window.google && window.google.accounts) {
      try {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: (response: any) => {
            addDebugInfo('✅ Google OAuth callback received');
            console.log('Google OAuth response:', response);
          },
          auto_select: false,
          cancel_on_tap_outside: false,
        });
        addDebugInfo('✅ Google OAuth initialized');
        
        // Try to show the prompt
        window.google.accounts.id.prompt();
        addDebugInfo('✅ Google OAuth prompt triggered');
      } catch (error) {
        addDebugInfo(`❌ Error: ${error}`);
        console.error('Google OAuth error:', error);
      }
    } else {
      addDebugInfo('❌ Google OAuth not available');
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Google OAuth Debug Panel</CardTitle>
        <CardDescription>
          This panel helps debug Google OAuth configuration issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Google Script Loaded:</strong> {googleScriptLoaded ? '✅ Yes' : '❌ No'}
          </div>
          <div>
            <strong>Client ID:</strong> {clientId ? '✅ Set' : '❌ Not Set'}
          </div>
        </div>

        <div className="space-y-2">
          <Button onClick={testGoogleAuth} disabled={!googleScriptLoaded || !clientId}>
            Test Google OAuth
          </Button>
          <Button onClick={clearDebugInfo} variant="outline">
            Clear Debug Info
          </Button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Debug Log:</h3>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <p className="text-gray-500">No debug info yet...</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="text-sm font-mono">
                  {info}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Create a <code>.env</code> file in the project root</li>
            <li>Add: <code>VITE_GOOGLE_CLIENT_ID=your_client_id_here</code></li>
            <li>Get your Client ID from Google Cloud Console</li>
            <li>Restart the development server</li>
            <li>Check the debug log above for any errors</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
