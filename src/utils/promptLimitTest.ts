// Test utility for prompt limit functionality
// This can be used to verify the prompt counting logic works correctly

export interface PromptLimitTestResult {
  promptCount: number;
  maxPrompts: number;
  canSendPrompt: boolean;
  isAuthenticated: boolean;
}

export function testPromptLimit(
  promptCount: number, 
  maxPrompts: number, 
  isAuthenticated: boolean
): PromptLimitTestResult {
  const canSendPrompt = isAuthenticated || promptCount < maxPrompts;
  
  return {
    promptCount,
    maxPrompts,
    canSendPrompt,
    isAuthenticated
  };
}

// Test cases
export const testCases = [
  // Test case 1: User not authenticated, 0 prompts used
  { promptCount: 0, maxPrompts: 3, isAuthenticated: false, expected: true },
  
  // Test case 2: User not authenticated, 2 prompts used
  { promptCount: 2, maxPrompts: 3, isAuthenticated: false, expected: true },
  
  // Test case 3: User not authenticated, 3 prompts used (at limit)
  { promptCount: 3, maxPrompts: 3, isAuthenticated: false, expected: false },
  
  // Test case 4: User not authenticated, 4 prompts used (over limit)
  { promptCount: 4, maxPrompts: 3, isAuthenticated: false, expected: false },
  
  // Test case 5: User authenticated, any number of prompts
  { promptCount: 0, maxPrompts: 3, isAuthenticated: true, expected: true },
  { promptCount: 5, maxPrompts: 3, isAuthenticated: true, expected: true },
  { promptCount: 100, maxPrompts: 3, isAuthenticated: true, expected: true },
];

export function runPromptLimitTests(): boolean {
  let allPassed = true;
  
  console.log('Running prompt limit tests...');
  
  testCases.forEach((testCase, index) => {
    const result = testPromptLimit(
      testCase.promptCount, 
      testCase.maxPrompts, 
      testCase.isAuthenticated
    );
    
    const passed = result.canSendPrompt === testCase.expected;
    
    if (!passed) {
      allPassed = false;
      console.error(`Test case ${index + 1} failed:`, {
        input: testCase,
        result: result.canSendPrompt,
        expected: testCase.expected
      });
    } else {
      console.log(`Test case ${index + 1} passed`);
    }
  });
  
  if (allPassed) {
    console.log('✅ All prompt limit tests passed!');
  } else {
    console.log('❌ Some prompt limit tests failed!');
  }
  
  return allPassed;
}
