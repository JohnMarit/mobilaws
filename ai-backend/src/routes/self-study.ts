import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getFirestore } from '../lib/firebase-admin';
import { verifyFirebaseToken } from '../middleware/auth';
import { generateLearningModule } from '../lib/ai-content-generator';
import { ingest } from '../rag';
import { env } from '../env';
import OpenAI from 'openai';
import { admin } from '../lib/firebase-admin';

const router = Router();

// Configure multer for file uploads
const uploadDir = process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'tmp');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `self-study-${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * Get daily lesson generation limit based on tier
 */
function getDailyLimit(tier: string): number {
  const normalized = tier.toLowerCase();
  if (normalized === 'premium') return Infinity;
  if (normalized === 'standard') return 20;
  if (normalized === 'basic') return 10;
  return 5; // free
}

/**
 * Get today's date string (YYYY-MM-DD)
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Check and update daily lesson generation count
 */
async function checkAndUpdateDailyLimit(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const db = getFirestore();
  if (!db) {
    throw new Error('Database not available');
  }

  const today = getTodayString();
  const limit = getDailyLimit(tier);
  
  // If unlimited, always allow
  if (limit === Infinity) {
    return { allowed: true, count: 0, limit: Infinity };
  }

  const limitRef = db.collection('selfStudyLimits').doc(userId);
  const limitDoc = await limitRef.get();

  let count = 0;
  if (limitDoc.exists()) {
    const data = limitDoc.data();
    // Reset if it's a new day
    if (data?.date === today) {
      count = data.count || 0;
    }
  }

  // Check if limit reached
  if (count >= limit) {
    return { allowed: false, count, limit };
  }

  // Update count
  await limitRef.set({
    date: today,
    count: count + 1,
  }, { merge: true });

  return { allowed: true, count: count + 1, limit };
}

/**
 * Get current daily count (without incrementing)
 */
async function getDailyCount(userId: string): Promise<number> {
  const db = getFirestore();
  if (!db) return 0;

  const today = getTodayString();
  const limitRef = db.collection('selfStudyLimits').doc(userId);
  const limitDoc = await limitRef.get();

  if (limitDoc.exists()) {
    const data = limitDoc.data();
    if (data?.date === today) {
      return data.count || 0;
    }
  }

  return 0;
}

/**
 * Upload self-study document
 * POST /api/self-study/upload
 */
router.post('/upload', verifyFirebaseToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const userId = (req as any).user?.uid;
    const userName = (req as any).user?.name || req.body.userName || 'User';
    const userEmail = (req as any).user?.email || req.body.userEmail || '';

    if (!file || !userId) {
      return res.status(400).json({ error: 'File and authentication required' });
    }

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    console.log(`📤 Self-study upload: ${file.originalname} by ${userId}`);

    // Extract document name from filename
    const moduleName = path.basename(file.originalname, path.extname(file.originalname));

    // Ingest document into vector store
    const indexedChunks = await ingest([file.path]);

    // Generate learning module
    const module = await generateLearningModule(
      file.path,
      moduleName,
      `Self-study module for ${moduleName}`,
      'self-study',
      ['free', 'basic', 'standard', 'premium'], // Available to all tiers
      userId, // Owner is the user
      userName || 'User',
      undefined // No contentId for self-study
    );

    // Save module metadata with self-study flag
    const moduleRef = db.collection('generatedModules').doc(module.id);
    await moduleRef.set({
      ...module,
      isSelfStudy: true,
      ownerId: userId,
      ownerEmail: userEmail,
      uploadedAt: new Date().toISOString(),
      published: true, // Self-study modules are automatically published
      accessLevels: ['free', 'basic', 'standard', 'premium'], // Available to all tiers
    }, { merge: true });

    // Clean up temp file
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      console.warn('Failed to delete temp file:', e);
    }

    res.json({
      success: true,
      moduleId: module.id,
      moduleName: module.name,
      indexedChunks,
    });
  } catch (error) {
    console.error('❌ Self-study upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get user's self-study modules
 * GET /api/self-study/modules
 */
router.get('/modules', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Get user's self-study modules (excluding tutor-admin modules)
    // Also include modules where tutorId matches userId (for backward compatibility)
    const modulesSnapshot = await db.collection('generatedModules')
      .where('ownerId', '==', userId)
      .where('isSelfStudy', '==', true)
      .orderBy('uploadedAt', 'desc')
      .get();

    const today = getTodayString();
    const dailyCount = await getDailyCount(userId);

    const modules = modulesSnapshot.docs.map(doc => {
      const data = doc.data();
      // Convert Firestore timestamp to ISO string
      let uploadedAt = new Date().toISOString();
      if (data.uploadedAt) {
        uploadedAt = typeof data.uploadedAt === 'string' 
          ? data.uploadedAt 
          : data.uploadedAt.toDate?.().toISOString() || new Date().toISOString();
      } else if (doc.createTime) {
        uploadedAt = doc.createTime.toDate().toISOString();
      }
      
      return {
        id: doc.id,
        name: data.name || data.title || 'Untitled',
        description: data.description || '',
        uploadedAt,
        lessonCount: Array.isArray(data.lessons) ? data.lessons.length : 0,
        generatedLessonsToday: dailyCount, // Total for all modules
        dailyLimit: Infinity, // Will be calculated on frontend
      };
    });

    res.json({
      success: true,
      modules,
      dailyCount,
    });
  } catch (error) {
    console.error('❌ Error fetching self-study modules:', error);
    res.status(500).json({
      error: 'Failed to fetch modules',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Generate lessons for self-study module
 * POST /api/self-study/generate-lessons
 */
router.post('/generate-lessons', verifyFirebaseToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid;
    const { moduleId, moduleName, difficulty, numberOfLessons, tier } = req.body;

    if (!moduleId || !moduleName || !userId || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check daily limit
    const limitCheck = await checkAndUpdateDailyLimit(userId, tier);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        error: 'Daily limit reached',
        message: `You have reached your daily limit of ${limitCheck.limit} lessons. Please try again tomorrow.`,
        count: limitCheck.count,
        limit: limitCheck.limit,
      });
    }

    const db = getFirestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Verify module belongs to user and is self-study
    const moduleRef = db.collection('generatedModules').doc(moduleId);
    const moduleDoc = await moduleRef.get();

    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleData = moduleDoc.data();
    if (moduleData?.ownerId !== userId || !moduleData?.isSelfStudy) {
      return res.status(403).json({ error: 'Unauthorized access to this module' });
    }

    // Use existing AI lesson generation logic
    // Import the function from ai-lessons.ts or duplicate the logic here
    // For now, we'll use the same endpoint logic
    const existingLessons = moduleData?.lessons || [];

    // Get sequential pages for this user
    const { getNextPagesForLessons } = await import('../lib/document-page-storage');
    let pagesResult = await getNextPagesForLessons(userId, moduleId, numberOfLessons || 5);

    if (!pagesResult || pagesResult.pages.length === 0) {
      // Try to migrate the module
      const { migrateModuleDocument } = await import('../lib/document-migration');
      const migrationResult = await migrateModuleDocument(moduleId);
      
      if (migrationResult.success || migrationResult.message?.includes('already exist')) {
        const { initializeUserPageProgress } = await import('../lib/document-page-storage');
        await initializeUserPageProgress(userId, moduleId);
        pagesResult = await getNextPagesForLessons(userId, moduleId, numberOfLessons || 5);
      }
    }

    if (!pagesResult || pagesResult.pages.length === 0) {
      return res.status(400).json({ error: 'No pages available for lesson generation' });
    }

    const documentContext = pagesResult.pages
      .map(p => `[Page ${p.pageNumber}]\n${p.content}`)
      .join('\n\n---\n\n');
    
    // Generate lessons using the same logic as ai-lessons.ts
    // We'll reuse the OpenAI generation code from ai-lessons
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const difficultyDescriptions = {
      simple: 'Simple mode with auto-play conversations, basic case studies, and guided learning',
      medium: 'Medium difficulty with manual control, intermediate scenarios requiring critical thinking',
      hard: 'Hard mode with audio-only challenges (no text initially), complex legal cases requiring deep analysis'
    };

    const quizCountByDifficulty = {
      simple: 3,
      medium: 5,
      hard: 7
    };

    // Use comprehensive prompt structure similar to ai-lessons
    const systemPrompt = `You are an expert educational content creator for South Sudan law. 
Create engaging, INTERACTIVE lessons using modern Duolingo-style pedagogy.

IMPORTANT: Each lesson MUST include BOTH:
1. A conversational dialogue between two characters discussing the legal topic
2. Real-world legal case studies with scenario-based questions

You must respond with valid JSON in the following structure:
{
  "lessons": [
    {
      "id": "lesson-${existingLessons.length + 1}",
      "title": "Lesson Title",
      "type": "conversational",
      "difficulty": "${difficulty || 'medium'}",
      "content": "4-6 rich paragraphs teaching the topic",
      "contentSections": [
        { "heading": "Key Principle", "body": "2-3 sentences" },
        { "heading": "Practical Steps", "body": "Guidance" },
        { "heading": "Common Pitfalls", "body": "What to avoid" }
      ],
      "summary": "2-3 sentence summary",
      "xpReward": ${difficulty === 'hard' ? 100 : difficulty === 'medium' ? 75 : 50},
      "estimatedMinutes": ${difficulty === 'hard' ? 15 : difficulty === 'medium' ? 10 : 7},
      "conversationalContent": {
        "character1": { "name": "Expert", "icon": "👩‍⚖️", "role": "Legal Expert" },
        "character2": { "name": "Student", "icon": "👨‍🎓", "role": "Law Student" },
        "dialogue": [
          { "speaker": "character1", "text": "Explanation" },
          { "speaker": "character2", "text": "Question" }
        ],
        "keyPoints": ["Point 1", "Point 2", "Point 3"]
      },
      "caseStudies": [
        {
          "scenario": "Detailed legal scenario",
          "question": "What should happen?",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Detailed explanation",
          "difficulty": "${difficulty || 'medium'}"
        }
      ],
      "quiz": [
        {
          "id": "q1",
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Why correct",
          "difficulty": "${difficulty || 'medium'}",
          "points": ${difficulty === 'hard' ? 25 : difficulty === 'medium' ? 20 : 15}
        }
      ]
    }
  ]
}

Generate ${numberOfLessons || 5} lessons with 8-12 dialogue exchanges, 2-3 case studies, and ${quizCountByDifficulty[difficulty || 'medium']} quiz questions each.`;
    
    const progressInfo = pagesResult.progressUpdate || null;
    const { getDocumentProgressPercentage } = await import('../lib/document-page-storage');
    const currentProgress = progressInfo ? await getDocumentProgressPercentage(userId, moduleId) : 0;
    
    const progressMessage = progressInfo 
      ? `\n📖 SEQUENTIAL LEARNING PATH: You are creating lessons from pages ${progressInfo.startPage}-${progressInfo.endPage} of the document. User has covered ${currentProgress}% of the material so far. Focus ONLY on the content from these specific pages to ensure comprehensive, non-repetitive coverage.\n`
      : '';

    const userPrompt = `Create ${numberOfLessons || 5} new INTERACTIVE lessons for: "${moduleName}"

Difficulty Level: ${(difficulty || 'medium').toUpperCase()} - ${difficultyDescriptions[difficulty || 'medium']}
Module Description: ${moduleData?.description || 'South Sudan legal education'}
Existing Lessons: ${existingLessons.length}
User Tier: ${tier}
${progressMessage}
Context from existing lessons:
${existingLessons.slice(-2).map((l: any) => `- ${l.title}: ${l.summary || 'No summary'}`).join('\n')}

${documentContext ? `\n=== REFERENCE MATERIAL FROM UPLOADED DOCUMENT ===\nUse this authoritative content from uploaded legal documents as the PRIMARY source.\n${progressInfo ? `These are pages ${progressInfo.startPage}-${progressInfo.endPage} in sequential order. Create lessons that progress through this material systematically without skipping content.\n` : ''}\n${documentContext}\n\n=== END REFERENCE MATERIAL ===\n` : ''}

CRITICAL REQUIREMENTS:
1. Base ALL content on the reference material from uploaded document above
2. ${progressInfo ? `IMPORTANT: Cover the material SEQUENTIALLY from the pages provided. Do not skip content or jump around. Each lesson should naturally progress from the previous one, following the document's flow.` : 'Create comprehensive lessons covering different aspects of the topic'}
3. Create engaging character dialogues that teach concepts naturally (8-12 exchanges)
4. Design realistic case studies based on South Sudan legal scenarios (2-3 per lesson)
5. Ensure ${difficulty || 'medium'} difficulty throughout
6. Use South Sudan-specific examples and legal references
7. Provide substantial lesson content (4-6 paragraphs) and ensure every quiz question can be answered from the lesson
8. ${progressInfo ? `Remember: This is part of a sequential learning journey. Cover everything in these pages thoroughly.` : ''}

Generate exactly ${numberOfLessons || 5} interactive lessons NOW and return them in the JSON format specified above!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 16000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('Empty response from AI');
    }

    let result;
    let newLessons;
    try {
      result = JSON.parse(responseContent);
      newLessons = result.lessons || [];
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse AI response',
        message: 'The AI response was not in the expected format. Please try again.'
      });
    }

    if (newLessons.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to generate lessons',
        message: 'The AI did not generate any lessons. Please try again.'
      });
    }

    // Add metadata to lessons
    const timestamp = Date.now();
    newLessons.forEach((lesson: any, index: number) => {
      lesson.id = `self-study-${timestamp}-${index}`;
      lesson.hasAudio = true;
      lesson.type = lesson.type || 'conversational';
      lesson.difficulty = difficulty || 'medium';
      lesson.accessLevels = ['free', 'basic', 'standard', 'premium'];
      lesson.createdAt = admin.firestore.Timestamp.now();
      lesson.isSelfStudy = true;
      
      // Ensure quiz IDs are unique
      if (Array.isArray(lesson.quiz)) {
        lesson.quiz.forEach((q: any, qIndex: number) => {
          q.id = `q-${timestamp}-${index}-${qIndex}`;
        });
      }
    });

    // Update module with new lessons (replace entire array)
    await moduleRef.update({
      lessons: [...existingLessons, ...newLessons],
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Update user page progress if we used sequential pages
    if (progressInfo) {
      const { updateUserPageProgress } = await import('../lib/document-page-storage');
      await updateUserPageProgress(userId, moduleId, progressInfo.endPage, true);
    }

    // Initialize user progress if not already done
    const { initializeUserPageProgress } = await import('../lib/document-page-storage');
    await initializeUserPageProgress(userId, moduleId);

    res.json({
      success: true,
      lessonsGenerated: newLessons.length,
      lessons: newLessons,
      dailyCount: limitCheck.count,
      dailyLimit: limitCheck.limit,
      message: `Successfully generated ${newLessons.length} lessons!`,
    });
  } catch (error) {
    console.error('❌ Error generating self-study lessons:', error);
    res.status(500).json({
      error: 'Failed to generate lessons',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
