/**
 * API Configuration Health Check
 * Run this to verify your frontend is properly configured
 */

export const checkApiConfiguration = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const mode = import.meta.env.MODE;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  console.log('\n🔍 API Configuration Health Check\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check 1: Environment
  console.log('📦 Environment:', mode);
  console.log('🌐 Current URL:', window.location.href);
  console.log('💻 Is Localhost:', isLocalhost);
  console.log('');
  
  // Check 2: API URL Configuration
  console.log('🔧 API Configuration:');
  console.log('  VITE_API_URL:', apiUrl || '❌ NOT SET');
  
  if (!apiUrl) {
    console.error('❌ CRITICAL: VITE_API_URL is not set!');
    console.log('');
    console.log('🚨 YOUR BACKEND WILL NOT WORK!');
    console.log('');
    console.log('📝 To fix this:');
    console.log('  1. Go to Vercel Dashboard');
    console.log('  2. Select your FRONTEND project (mobilaws)');
    console.log('  3. Settings → Environment Variables');
    console.log('  4. Add: VITE_API_URL=https://mobilaws-ympe.vercel.app/api');
    console.log('  5. Redeploy');
    console.log('');
  } else {
    console.log('✅ VITE_API_URL is set:', apiUrl);
    
    // Check if it's pointing to localhost in production
    if (!isLocalhost && apiUrl.includes('localhost')) {
      console.warn('⚠️ WARNING: API URL points to localhost in production!');
      console.log('  This will NOT work. Update VITE_API_URL in Vercel.');
    } else if (isLocalhost) {
      console.log('ℹ️ Local development mode - localhost is OK');
    } else {
      console.log('✅ API URL looks correct!');
    }
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
};

// Auto-run in development
if (import.meta.env.DEV) {
  checkApiConfiguration();
}

