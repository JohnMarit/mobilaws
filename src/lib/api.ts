// API Configuration
// This determines whether to use local or production backend

const isDevelopment = import.meta.env.MODE === 'development';
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Get API URL from environment or use defaults
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (isDevelopment || isLocalhost 
    ? 'http://localhost:8000/api' 
    : 'https://your-backend-url.com/api');

// For backward compatibility, export individual API endpoints
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  // Remove '/api' prefix if present as it's already in API_BASE_URL
  const finalEndpoint = cleanEndpoint.startsWith('api/') ? cleanEndpoint.slice(4) : cleanEndpoint;
  return `${API_BASE_URL}/${finalEndpoint}`;
};

// Helper to check if backend is reachable
export const checkBackendConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(API_BASE_URL.replace('/api', '/healthz'), {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Backend not connected. Make sure the backend server is running.');
    return false;
  }
};

// Log the current API configuration (development only)
if (isDevelopment) {
  console.log('🔧 API Configuration:');
  console.log('  - Environment:', import.meta.env.MODE);
  console.log('  - API Base URL:', API_BASE_URL);
  console.log('  - Is Localhost:', isLocalhost);
}

