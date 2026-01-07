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
}

/**
 * Generate additional lessons for a module using AI
 * POST /api/ai-lessons/generate
 */
router.post('/ai-lessons/generate', async (req: Request, res: Response) => {
  try {
    const { userId, moduleId, moduleName, completedLessons, tier, numberOfLessons = 5 }: LessonRequest = req.body;

    if (!userId || !moduleId || !moduleName || !tier) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, moduleId, moduleName, tier' 
      });
    }

    console.log(`🤖 Generating ${numberOfLessons} lessons for module: ${moduleName} (tier: ${tier})`);

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

    const systemPrompt = `You are an expert educational content creator for South Sudan law. 
Create engaging, progressive lessons that build on previous content.

Each lesson should:
1. Be 5-10 minutes long
2. Include rich HTML-formatted content with examples
3. Have 3-5 quiz questions
4. Award appropriate XP based on difficulty
5. Include practical tips and real-world examples
6. Define key legal terms

Format as valid JSON:
{
  "lessons": [
    {
      "id": "lesson-${existingLessons.length + 1}",
      "title": "Lesson Title",
      "content": "Rich HTML content with <strong>, <em>, <ul>, <li>, <p> tags",
      "summary": "2-3 sentence summary",
      "xpReward": 50,
      "estimatedMinutes": 7,
      "tips": ["Practical tip 1", "Practical tip 2"],
      "examples": ["Real example 1", "Real example 2"],
      "keyTerms": [{"term": "Legal Term", "definition": "Clear definition"}],
      "quiz": [
        {
          "id": "q1",
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0,
          "explanation": "Why this answer is correct",
          "difficulty": "easy",
          "points": 10
        }
      ]
    }
  ]
}`;

    const userPrompt = `Create ${numberOfLessons} new lessons for the module: "${moduleName}"

Module Description: ${moduleData?.description || 'South Sudan legal education'}
Existing Lessons: ${existingLessons.length}
Completed Lessons: ${completedLessons.length}
User Tier: ${tier}

Context from existing lessons:
${existingLessons.slice(-2).map((l: any) => `- ${l.title}: ${l.summary}`).join('\n')}

${documentContext ? `\n=== REFERENCE MATERIAL FROM UPLOADED DOCUMENTS ===\nUse the following authoritative content from uploaded legal documents as the PRIMARY source for lesson content:\n\n${documentContext}\n\n=== END REFERENCE MATERIAL ===\n` : ''}

Create progressive lessons that:
1. Build on the existing content
2. ${documentContext ? 'Base content PRIMARILY on the reference material from uploaded documents above' : 'Introduce new concepts gradually'}
3. Include South Sudan-specific legal examples
4. Are appropriate for ${tier} tier users
5. Have varied difficulty levels
${documentContext ? '6. Cite specific sections from the reference material when applicable' : ''}

Generate ${numberOfLessons} engaging lessons now!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    const newLessons = result.lessons || [];

    if (newLessons.length === 0) {
      return res.status(500).json({ error: 'Failed to generate lessons' });
    }

    // Add hasAudio flag based on tier
    newLessons.forEach((lesson: any, index: number) => {
      lesson.hasAudio = tier === 'premium' || (tier === 'standard' && index % 3 === 0);
      lesson.accessLevels = moduleData?.accessLevels || [tier];
      lesson.createdAt = admin.firestore.Timestamp.now();
      lesson.userGenerated = true; // Mark as user-generated
    });

    // Store user-specific lessons in a separate collection
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
    return res.status(500).json({ 
      error: 'Failed to generate lessons',
      message: error instanceof Error ? error.message : 'Unknown error'
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

