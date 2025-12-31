import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { env } from '../env';
import { admin } from '../lib/firebase-admin';

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

    const db = admin.firestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
    }

    // Get existing module to understand context
    const moduleDoc = await db.collection('generatedModules').doc(moduleId).get();
    if (!moduleDoc.exists) {
      return res.status(404).json({ error: 'Module not found' });
    }

    const moduleData = moduleDoc.data();
    const existingLessons = moduleData?.lessons || [];

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

Create progressive lessons that:
1. Build on the existing content
2. Introduce new concepts gradually
3. Include South Sudan-specific legal examples
4. Are appropriate for ${tier} tier users
5. Have varied difficulty levels

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
    });

    // Update module with new lessons
    const updatedLessons = [...existingLessons, ...newLessons];
    await db.collection('generatedModules').doc(moduleId).update({
      lessons: updatedLessons,
      totalLessons: updatedLessons.length,
      totalXp: updatedLessons.reduce((sum: number, l: any) => sum + (l.xpReward || 0), 0),
      updatedAt: admin.firestore.Timestamp.now()
    });

    console.log(`✅ Generated and added ${newLessons.length} lessons to module ${moduleId}`);

    return res.json({
      success: true,
      lessons: newLessons,
      totalLessons: updatedLessons.length,
      message: `Successfully generated ${newLessons.length} new lessons!`
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

    const db = admin.firestore();
    if (!db) {
      return res.status(500).json({ error: 'Database not available' });
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

