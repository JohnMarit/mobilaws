// Test utility for authentication functionality
// This can be used to verify the authentication flow works correctly

export interface AuthTestResult {
  isAuthenticated: boolean;
  user: any;
  promptCount: number;
  canSendPrompt: boolean;
}

export function testAuthFlow(
  isAuthenticated: boolean,
  user: any,
  promptCount: number,
  maxPrompts: number = 3
): AuthTestResult {
  const canSendPrompt = isAuthenticated || promptCount < maxPrompts;
  
  return {
    isAuthenticated,
    user,
    promptCount,
    canSendPrompt
  };
}

// Test cases for authentication flow
export const authTestCases = [
  // Test case 1: Anonymous user, 0 prompts
  { 
    isAuthenticated: false, 
    user: null, 
    promptCount: 0, 
    maxPrompts: 3, 
    expected: true,
    description: "Anonymous user can send first prompt"
  },
  
  // Test case 2: Anonymous user, 2 prompts
  { 
    isAuthenticated: false, 
    user: null, 
    promptCount: 2, 
    maxPrompts: 3, 
    expected: true,
    description: "Anonymous user can send third prompt"
  },
  
  // Test case 3: Anonymous user, 3 prompts (at limit)
  { 
    isAuthenticated: false, 
    user: null, 
    promptCount: 3, 
    maxPrompts: 3, 
    expected: false,
    description: "Anonymous user cannot send fourth prompt"
  },
  
  // Test case 4: Authenticated user, any prompt count
  { 
    isAuthenticated: true, 
    user: { name: "John Doe", email: "john@example.com" }, 
    promptCount: 0, 
    maxPrompts: 3, 
    expected: true,
    description: "Authenticated user can send prompts"
  },
  
  // Test case 5: Authenticated user, high prompt count
  { 
    isAuthenticated: true, 
    user: { name: "Jane Doe", email: "jane@example.com" }, 
    promptCount: 100, 
    maxPrompts: 3, 
    expected: true,
    description: "Authenticated user has unlimited prompts"
  },
];

export function runAuthTests(): boolean {
  let allPassed = true;
  
  console.log('Running authentication flow tests...');
  
  authTestCases.forEach((testCase, index) => {
    const result = testAuthFlow(
      testCase.isAuthenticated,
      testCase.user,
      testCase.promptCount,
      testCase.maxPrompts
    );
    
    const passed = result.canSendPrompt === testCase.expected;
    
    if (!passed) {
      allPassed = false;
      console.error(`❌ Test case ${index + 1} failed:`, {
        description: testCase.description,
        input: {
          isAuthenticated: testCase.isAuthenticated,
          promptCount: testCase.promptCount,
          maxPrompts: testCase.maxPrompts
        },
        result: result.canSendPrompt,
        expected: testCase.expected
      });
    } else {
      console.log(`✅ Test case ${index + 1} passed: ${testCase.description}`);
    }
  });
  
  if (allPassed) {
    console.log('🎉 All authentication flow tests passed!');
  } else {
    console.log('💥 Some authentication flow tests failed!');
  }
  
  return allPassed;
}

// Function to test the complete user journey
export function testUserJourney(): void {
  console.log('🚀 Testing complete user journey...');
  
  // Step 1: Anonymous user starts
  console.log('Step 1: Anonymous user starts with 0 prompts');
  let result = testAuthFlow(false, null, 0);
  console.log(`Can send prompt: ${result.canSendPrompt} (expected: true)`);
  
  // Step 2: User sends 3 prompts
  console.log('Step 2: User sends 3 prompts');
  result = testAuthFlow(false, null, 3);
  console.log(`Can send prompt: ${result.canSendPrompt} (expected: false)`);
  
  // Step 3: User authenticates
  console.log('Step 3: User authenticates with Google');
  result = testAuthFlow(true, { name: "Test User", email: "test@example.com" }, 3);
  console.log(`Can send prompt: ${result.canSendPrompt} (expected: true)`);
  
  // Step 4: User can continue with unlimited prompts
  console.log('Step 4: User can send unlimited prompts');
  result = testAuthFlow(true, { name: "Test User", email: "test@example.com" }, 50);
  console.log(`Can send prompt: ${result.canSendPrompt} (expected: true)`);
  
  console.log('✅ User journey test completed!');
}
