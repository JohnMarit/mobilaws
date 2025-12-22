# Learning Path System Implementation

## Overview

The Mobilaws application now includes a comprehensive subscription-based learning path system that provides structured legal education based on user subscription tiers.

## Implementation Details

### 1. Subscription Tier Detection

**File:** `ai-backend/src/routes/chat.ts`

- The chat endpoint now fetches the user's subscription tier from Firestore
- Subscription tier is determined from the user's active subscription planId
- Defaults to 'free' if no subscription is found or if the user is anonymous
- Subscription tier is passed to the AI system prompt builder

**Subscription Tier Mapping:**
- `planId: 'basic'` → `subscriptionTier: 'basic'`
- `planId: 'standard'` → `subscriptionTier: 'standard'`
- `planId: 'premium'` → `subscriptionTier: 'premium'`
- `planId: 'free'` or no subscription → `subscriptionTier: 'free'` (treated as 'basic' for learning paths)

### 2. Dynamic System Prompt Builder

**File:** `ai-backend/src/rag/retriever.ts`

The system now includes a dynamic prompt builder that adds subscription-specific learning path rules:

- **`buildLearningPathRules()`**: Creates subscription-tier-specific rules
- **`buildSystemPrompt()`**: Combines base prompt with learning path rules
- Rules are injected into the system prompt based on the user's subscription tier

### 3. Learning Path Rules by Tier

#### Basic Subscription (Free users default to Basic)
- **Allowed:**
  - Only introductory learning paths
  - Maximum 3 modules per path
  - Maximum 1 step per module
  - High-level explanations only
  - No legal documents, case examples, or action plans

- **Required Behavior:**
  - Brief explanations
  - Lock notices at end of modules: "🔒 Upgrade to Standard or Premium to continue this learning path"

- **Disallowed:**
  - Deep legal interpretation
  - Step-by-step procedures
  - Templates or documents
  - Constitutional article citations

#### Standard Subscription
- **Allowed:**
  - Full learning paths with up to 5 modules
  - Up to 3 steps per module
  - Practical explanations
  - Simple real-life examples
  - Limited constitutional references (no article numbers)
  - General guidance on what to do next

- **Required Behavior:**
  - Structured progress (Module 1 → Module 2)
  - Lock notices for advanced content: "🔒 Upgrade to Premium for full legal depth, documents, and detailed guidance"

- **Disallowed:**
  - Legal document templates
  - Full constitutional article breakdowns
  - Detailed procedural checklists

#### Premium Subscription
- **Allowed:**
  - Unlimited learning paths
  - Full module depth (6–8 modules)
  - Step-by-step legal education
  - Detailed constitutional explanations
  - Practical checklists
  - Document templates (educational use)
  - "What to do next" action guidance
  - Warnings about common mistakes
  - Summary and revision modules

- **Required Behavior:**
  - Progressive teaching from basic to advanced
  - Clear constitutional principle references
  - Learning outcomes at end of each module
  - Recap and next-path suggestions

### 4. Learning Path Format

When users request learning paths, the AI follows this mandatory format:

```
Learning Path Title:
Target Audience:
Subscription Level: [Basic/Standard/Premium]
Modules:
- Module 1: Title
  Step 1: [Content based on tier]
  Step 2: [If allowed by tier]
  Step 3: [If allowed by tier]
- Module 2: Title
  ...
```

### 5. Locked Content Handling

When users request content beyond their subscription tier:
- The AI does NOT provide the restricted content
- Clearly explains the restriction
- Politely encourages upgrade
- Never leaks restricted information

Example response:
```
🔒 This step is available on the Standard and Premium plans.
```

## Technical Flow

1. **User sends message** → Chat endpoint receives request
2. **Subscription lookup** → Fetches user's subscription from Firestore
3. **Tier determination** → Maps planId to subscription tier
4. **Prompt building** → System prompt includes tier-specific learning path rules
5. **AI response** → AI follows rules based on subscription tier
6. **Content restriction** → AI enforces limits and shows upgrade prompts when needed

## Files Modified

1. `ai-backend/src/routes/chat.ts`
   - Added subscription tier fetching
   - Passes subscription tier to `ask()` function

2. `ai-backend/src/rag/index.ts`
   - Updated `ask()` function signature to accept subscription tier
   - Passes tier to `askQuestion()`

3. `ai-backend/src/rag/retriever.ts`
   - Added `buildLearningPathRules()` function
   - Added `buildSystemPrompt()` function
   - Updated `askQuestion()` to accept and use subscription tier
   - Modified base system prompt to emphasize Mobilaws role

## Testing

To test the learning path system:

1. **Basic Tier Test:**
   - Ask: "Create a learning path about citizenship"
   - Should return max 3 modules, 1 step each, with lock notices

2. **Standard Tier Test:**
   - Ask: "Create a learning path about land rights"
   - Should return up to 5 modules, 3 steps each, with premium upgrade prompts

3. **Premium Tier Test:**
   - Ask: "Create a comprehensive learning path about criminal law"
   - Should return 6-8 modules with full depth, checklists, and detailed guidance

## Notes

- The system treats 'free' users as 'basic' tier for learning paths
- Learning path rules are enforced through the system prompt, not code-level restrictions
- The AI is instructed to be educational, not provide legal advice
- All responses maintain South Sudan context only
- Tone is clear, educational, respectful, and neutral


