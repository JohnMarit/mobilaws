import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { env } from '../env';
import { admin, getFirestore } from '../lib/firebase-admin';
import { getRetriever } from '../rag/vectorstore';
import { Document } from '@langchain/core/documents';

const router = Router();

interface LessonRequest {
  userId: string;
  moduleId: string;
  moduleName: string;
  completedLessons: string[];
  tier: 'free' | 'basic' | 'standard' | 'premium';
  numberOfLessons?: number;
  difficulty?: 'simple' | 'medium' | 'hard';
}

/**
 * Generate additional lessons for a module using AI
 * POST /api/ai-lessons/generate
 */
router.post('/ai-lessons/generate', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId, moduleName, completedLessons, tier, numberOfLessons = 5, difficulty = 'medium' }: LessonRequest = req.body;

    if (!userId || !moduleId || !moduleName || !tier) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, moduleId, moduleName, tier' 
      });
    }

    console.log(`🤖 Generating ${numberOfLessons} ${difficulty} lessons for module: ${moduleName} (tier: ${tier})`);

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available', message: 'Firebase Admin not initialized' });
    }

    // Check request limits based on tier
    const requestLimits = {
      free: 4, // Increased from 1 to 4 (added 3 more sets)
      basic: 7, // Increased from 2 to 7 (added 5 more sets)
      standard: 15, // 15 requests per day
      premium: Infinity
    };

    const userRequestsRef = db.collection('lessonRequests').doc(userId);
    const userRequestsDoc = await userRequestsRef.get();
    const userData = userRequestsDoc.exists ? userRequestsDoc.data() : {};
    const moduleRequests = userData?.modules?.[moduleId]?.requestCount || 0;
    const maxRequests = requestLimits[tier as keyof typeof requestLimits] || 1;

    // Premium users have unlimited requests - skip limit check
    // For other tiers, check if limit is reached
    if (tier !== 'premium' && moduleRequests >= maxRequests) {
      const upgradeMessages = {
        free: 'You have reached your request limit. Upgrade to Basic or higher to request more lessons!',
        basic: 'You have reached your request limit. Upgrade to Premium for unlimited lesson requests!',
        standard: 'You have reached your request limit. Upgrade to Premium for unlimited lesson requests!',
        premium: 'Unlimited requests available'
      };
      
      return res.status(403).json({ 
        error: 'Request limit reached',
        message: upgradeMessages[tier as keyof typeof upgradeMessages],
        requestCount: moduleRequests,
        maxRequests
      });
    }

    // Get existing module to understand context
    const moduleDoc = await db.collection('generatedModules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleData = moduleDoc.data();
    const existingLessons = moduleData?.lessons || [];

    // Retrieve relevant context from uploaded documents using RAG
    let documentContext = '';
    try {
      const retriever = await getRetriever();
      const relevantDocs = await retriever.getRelevantDocuments(
        `${moduleName} ${moduleData?.description || ''} South Sudan law legal education`
      );
      
      if (relevantDocs.length > 0) {
        documentContext = relevantDocs
          .slice(0, 5) // Use top 5 most relevant documents
          .map((doc: Document) => doc.pageContent)
          .join('\n\n');
        console.log(`📚 Retrieved ${relevantDocs.length} relevant documents from uploaded content`);
      }
    } catch (error) {
      console.warn('⚠️ Could not retrieve documents from RAG:', error);
      // Continue without document context
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const difficultyDescriptions = {
      simple: 'Simple mode with auto-play conversations, basic case studies, and guided learning',
      medium: 'Medium difficulty with manual control, intermediate scenarios requiring critical thinking',
      hard: 'Hard mode with audio-only challenges (no text initially), complex legal cases requiring deep analysis'
    };

    const systemPrompt = `You are an expert educational content creator for South Sudan law. 
Create engaging, INTERACTIVE lessons using modern Duolingo-style pedagogy.

IMPORTANT: Each lesson MUST include BOTH:
1. A conversational dialogue between two characters discussing the legal topic
2. Real-world legal case studies with scenario-based questions

Lesson Structure:
{
  "lessons": [
    {
      "id": "lesson-${existingLessons.length + 1}",
      "title": "Lesson Title",
      "type": "conversational",
      "difficulty": "${difficulty}",
      "content": "Brief intro text (2-3 sentences)",
      "summary": "2-3 sentence summary",
      "xpReward": ${difficulty === 'hard' ? 100 : difficulty === 'medium' ? 75 : 50},
      "estimatedMinutes": ${difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 7},
      "conversationalContent": {
        "character1": {
          "name": "Character Name (e.g., Advocate Sarah)",
          "icon": "👩‍⚖️",
          "role": "Legal Expert"
        },
        "character2": {
          "name": "Character Name (e.g., Student James)",
          "icon": "👨‍🎓",
          "role": "Law Student"
        },
        "dialogue": [
          {
            "speaker": "character1",
            "text": "Natural conversational text explaining a legal concept"
          },
          {
            "speaker": "character2",
            "text": "Question or response showing understanding"
          }
        ],
        "keyPoints": [
          "Key takeaway 1",
          "Key takeaway 2",
          "Key takeaway 3"
        ]
      },
      "caseStudies": [
        {
          "scenario": "Detailed real-world legal scenario (3-5 sentences) based on South Sudan law",
          "question": "What should happen in this case?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation with legal reasoning",
          "difficulty": "${difficulty}"
        }
      ],
      "quiz": [
        {
          "id": "q1",
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct",
          "difficulty": "${difficulty}",
          "points": ${difficulty === 'hard' ? 25 : difficulty === 'medium' ? 20 : 15}
        }
      ]
    }
  ]
}

DIALOGUE REQUIREMENTS:
- 8-12 exchanges for ${difficulty} difficulty
- Natural, conversational tone
- Character 1 (expert) teaches, Character 2 (learner) asks questions
- Use emojis for character icons (👩‍⚖️, 👨‍⚖️, 👨‍🎓, 👩‍🎓, 👨‍💼, 👩‍💼, etc.)
- Each dialogue line should be 1-3 sentences
- Build concepts progressively through conversation

CASE STUDY REQUIREMENTS:
- 2-3 case studies per lesson
- Real-world scenarios from South Sudan legal context
- ${difficulty === 'hard' ? 'Complex scenarios requiring nuanced legal analysis' : difficulty === 'medium' ? 'Intermediate scenarios with multiple considerations' : 'Clear scenarios with straightforward applications'}
- Options should all be plausible
- Explanations must reference specific legal principles`;

    const userPrompt = `Create ${numberOfLessons} new INTERACTIVE lessons for: "${moduleName}"

Difficulty Level: ${difficulty.toUpperCase()} - ${difficultyDescriptions[difficulty]}
Module Description: ${moduleData?.description || 'South Sudan legal education'}
Existing Lessons: ${existingLessons.length}
User Tier: ${tier}

Context from existing lessons:
${existingLessons.slice(-2).map((l: any) => `- ${l.title}: ${l.summary || 'No summary'}`).join('\n')}

${documentContext ? `\n=== REFERENCE MATERIAL FROM UPLOADED DOCUMENTS ===\nUse the following authoritative content from uploaded legal documents as the PRIMARY source:\n\n${documentContext}\n\n=== END REFERENCE MATERIAL ===\n` : ''}

CRITICAL REQUIREMENTS:
1. Base ALL content on the reference material from uploaded documents above
2. Create engaging character dialogues that teach the concepts naturally
3. Design realistic case studies based on South Sudan legal scenarios
4. Ensure ${difficulty} difficulty throughout:
   ${difficulty === 'simple' ? '- Clear, straightforward concepts\n   - Basic yes/no or simple multiple choice\n   - Guided learning' : ''}
   ${difficulty === 'medium' ? '- Intermediate complexity\n   - Requires critical thinking\n   - Multiple valid perspectives' : ''}
   ${difficulty === 'hard' ? '- Complex legal analysis required\n   - Nuanced scenarios\n   - Deep understanding needed' : ''}
5. Use South Sudan-specific examples and legal references
6. Make dialogues feel like real conversations, not lectures

Generate ${numberOfLessons} interactive lessons NOW!`;

    // Validate OpenAI API key
    if (!env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY is not configured');
      return res.status(500).json({ 
        error: 'OpenAI API key not configured',
        message: 'Please configure OPENAI_API_KEY environment variable'
      });
    }

    let completion;
    try {
      completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });
    } catch (openaiError) {
      console.error('❌ OpenAI API error:', openaiError);
      return res.status(500).json({ 
        error: 'OpenAI API error',
        message: openaiError instanceof Error ? openaiError.message : 'Failed to generate lessons with AI'
      });
    }

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      console.error('❌ OpenAI returned empty response');
      return res.status(500).json({ 
        error: 'Empty response from AI',
        message: 'The AI did not return any content. Please try again.'
      });
    }

    let result;
    let newLessons;
    try {
      result = JSON.parse(responseContent);
      newLessons = result.lessons || [];
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      console.error('Response content:', responseContent.substring(0, 500));
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        message: 'The AI response was not in the expected format. Please try again.'
      });
    }

    if (newLessons.length === 0) {
      console.error('❌ No lessons generated from AI response');
      console.error('AI response structure:', Object.keys(result));
      return res.status(500).json({ 
        error: 'Failed to generate lessons',
        message: 'The AI did not generate any lessons. Please try again.'
      });
    }

    // Add metadata to lessons - available for all tiers (free, basic, standard, premium)
    newLessons.forEach((lesson: any, index: number) => {
      lesson.hasAudio = true; // Audio available for all tiers
      lesson.type = lesson.type || 'conversational'; // Default to conversational
      lesson.difficulty = difficulty;
      lesson.accessLevels = moduleData?.accessLevels || [tier];
      lesson.createdAt = admin.firestore.Timestamp.now();
      lesson.userGenerated = true; // Mark as user-generated
      
      // Ensure conversational content exists
      if (!lesson.conversationalContent && lesson.type === 'conversational') {
        console.warn(`⚠️ Lesson ${lesson.id} missing conversational content`);
      }
      
      // Ensure case studies exist
      if (!lesson.caseStudies || lesson.caseStudies.length === 0) {
        console.warn(`⚠️ Lesson ${lesson.id} missing case studies`);
      }
    });

    // Store user-specific lessons in a separate collection
    try {
      const userLessonsRef = db.collection('userLessons').doc(userId);
      const userLessonsDoc = await userLessonsRef.get();
      
      const existingUserLessons = userLessonsDoc.exists 
        ? (userLessonsDoc.data()?.modules?.[moduleId]?.lessons || [])
        : [];
      
      // Generate unique IDs for new lessons to avoid conflicts with completed lessons
      // Use timestamp-based IDs to ensure uniqueness
      // Also add generationBatchId to track which lessons belong to the same generation set
      const timestamp = Date.now();
      const generationBatchId = `batch-${timestamp}`;
      newLessons.forEach((lesson: any, index: number) => {
        // Generate unique ID: user-generated-{timestamp}-{index}
        lesson.id = `user-generated-${timestamp}-${index}`;
        // Add generation batch ID to track which set this lesson belongs to
        lesson.generationBatchId = generationBatchId;
        // Also ensure quiz IDs are unique
        if (Array.isArray(lesson.quiz)) {
          lesson.quiz.forEach((q: any, qIndex: number) => {
            q.id = `q-${timestamp}-${index}-${qIndex}`;
          });
        }
      });
      
      const updatedUserLessons = [...existingUserLessons, ...newLessons];
      
      // Update user's lessons
      await userLessonsRef.set({
        userId,
        modules: {
          [moduleId]: {
            lessons: updatedUserLessons,
            lastUpdated: admin.firestore.Timestamp.now()
          }
        },
        updatedAt: admin.firestore.Timestamp.now()
      }, { merge: true });

      // Update request count
      await userRequestsRef.set({
        userId,
        modules: {
          [moduleId]: {
            requestCount: moduleRequests + 1,
            lastRequestAt: admin.firestore.Timestamp.now()
          }
        },
        updatedAt: admin.firestore.Timestamp.now()
      }, { merge: true });
    } catch (firestoreError) {
      console.error('❌ Firestore error saving lessons:', firestoreError);
      return res.status(500).json({ 
        error: 'Database error',
        message: 'Failed to save lessons to database. Please try again.'
      });
    }

    console.log(`✅ Generated and saved ${newLessons.length} user-specific lessons for user ${userId}, module ${moduleId}`);

    return res.json({
      success: true,
      lessons: newLessons,
      totalLessons: existingLessons.length + updatedUserLessons.length,
      message: `Successfully generated ${newLessons.length} new lessons!`,
      requestCount: moduleRequests + 1,
      maxRequests: tier === 'premium' ? 'unlimited' : maxRequests
    });

  } catch (error) {
    console.error('❌ Error generating lessons:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific error types
      if (error.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'OpenAI API key not configured',
          message: 'Please configure OPENAI_API_KEY environment variable'
        });
      }
      
      if (error.message.includes('JSON')) {
        return res.status(500).json({ 
          error: 'Failed to parse AI response',
          message: 'The AI response was not in the expected format. Please try again.'
        });
      }
      
      if (error.message.includes('Firebase') || error.message.includes('Firestore')) {
        return res.status(500).json({ 
          error: 'Database error',
          message: 'Failed to connect to database. Please try again later.'
        });
      }
    }
    
    return res.status(500).json({ 
      error: 'Failed to generate lessons',
      message: error instanceof Error ? error.message : 'Unknown error occurred. Please try again later.'
    });
  }
});

/**
 * Request more lessons for a module
 * POST /api/ai-lessons/request-more
 */
router.post('/ai-lessons/request-more', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId, tier } = req.body;

    if (!userId || !moduleId || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available', message: 'Firebase Admin not initialized' });
    }

    // Save request to Firestore for tracking
    await db.collection('lessonRequests').add({
      userId,
      moduleId,
      tier,
      status: 'pending',
      createdAt: admin.firestore.Timestamp.now()
    });

    return res.json({
      success: true,
      message: 'Request received. New lessons will be generated shortly!'
    });

  } catch (error) {
    console.error('❌ Error requesting lessons:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

export default router;

