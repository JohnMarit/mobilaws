/**
 * AI Content Generator for Duolingo-style learning materials
 * Processes uploaded documents and generates structured learning content
 */

import OpenAI from 'openai';
import { env } from '../env';
import { admin, getFirebaseAuth } from './firebase-admin';
import fs from 'fs';

const GENERATED_MODULES_COLLECTION = 'generatedModules';
const QUIZ_REQUESTS_COLLECTION = 'quizRequests';
const TUTOR_MESSAGES_COLLECTION = 'tutorMessages';

export interface DialogueLine {
  speaker: 'character1' | 'character2';
  text: string;
  audioUrl?: string;
}

export interface ConversationalLesson {
  character1: {
    name: string;
    icon: string;
    role: string;
  };
  character2: {
    name: string;
    icon: string;
    role: string;
  };
  dialogue: DialogueLine[];
  keyPoints: string[];
}

export interface CaseStudy {
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'simple' | 'medium' | 'hard';
}

export interface GeneratedLesson {
  id: string;
  title: string;
  content: string;
  summary: string; // Short summary for preview
  xpReward: number;
  estimatedMinutes: number;
  quiz: GeneratedQuiz[];
  tips: string[]; // Learning tips
  examples: string[]; // Real-world examples
  keyTerms: { term: string; definition: string }[]; // Vocabulary
  hasAudio: boolean; // Audio available for all tiers on tutor-uploaded content
  accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[]; // Granular access control per lesson
  
  // New interactive lesson types
  type?: 'traditional' | 'conversational' | 'case-study' | 'audio-only';
  difficulty?: 'simple' | 'medium' | 'hard';
  conversationalContent?: ConversationalLesson;
  caseStudies?: CaseStudy[];
}

export interface GeneratedQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  accessLevels?: ('free' | 'basic' | 'standard' | 'premium')[]; // Granular access control per quiz
}

export interface GeneratedModule {
  id?: string;
  title: string;
  description: string;
  category: string;
  icon: string; // Icon name or emoji
  imageUrl?: string; // Optional cover image
  lessons: GeneratedLesson[];
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[];
  tutorId: string;
  tutorName: string;
  sourceContentId: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
  totalXp: number;
  totalLessons: number;
  estimatedHours: number;
  published: boolean;
}

export interface QuizRequest {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  moduleId: string;
  lessonId?: string;
  message: string;
  numberOfQuizzes: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  createdAt: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  generatedQuizzes?: GeneratedQuiz[];
}

export interface TutorMessage {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  tutorId?: string; // Optional - can be broadcast to all tutors
  subject: string;
  message: string;
  moduleId?: string;
  lessonId?: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: admin.firestore.Timestamp;
  replies?: {
    from: string; // tutor or user
    message: string;
    timestamp: admin.firestore.Timestamp;
  }[];
}

function getFirestore(): admin.firestore.Firestore | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return admin.firestore();
}

/**
 * Extract text from document (PDF, DOCX, TXT)
 */
async function extractDocumentText(filePath: string): Promise<string> {
  const ext = filePath.toLowerCase().split('.').pop();
  
  if (ext === 'txt') {
    return fs.readFileSync(filePath, 'utf-8');
  }
  
  if (ext === 'pdf') {
    // Use pdf-parse or similar library
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    return data.text;
  }
  
  // For DOCX, use mammoth or similar
  if (ext === 'docx' || ext === 'doc') {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }
  
  throw new Error(`Unsupported file type: ${ext}`);
}

/**
 * Generate learning module from document using AI
 */
export async function generateLearningModule(
  filePath: string,
  title: string,
  description: string,
  category: string,
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[],
  tutorId: string,
  tutorName: string,
  sourceContentId: string
): Promise<GeneratedModule | null> {
  try {
    console.log('📚 Starting AI content generation...');
    
    // Extract text from document
    const documentText = await extractDocumentText(filePath);
    console.log(`📄 Extracted ${documentText.length} characters from document`);
    
    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    
    // Generate structured learning content using AI
    const systemPrompt = `You are an expert educational content creator specializing in creating Duolingo-style learning materials. 
Your task is to transform legal/educational documents into engaging, bite-sized lessons with quizzes.

Create content that is:
1. Interactive and engaging (like Duolingo)
2. Broken into small, digestible lessons (5-10 minutes each)
3. Progressive in difficulty
4. Rich with examples and real-world applications
5. Includes varied quiz types (multiple choice, true/false, fill-in-the-blank concepts)
6. Uses gamification principles (XP rewards, achievements, tips)

Format your response as valid JSON matching this structure:
{
  "title": "Module Title",
  "description": "Brief description",
  "icon": "📚" or "faIcon",
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Lesson Title",
      "content": "Rich HTML-formatted content with <strong>, <em>, <ul>, <li>, <p> tags",
      "summary": "2-3 sentence summary",
      "xpReward": 50,
      "estimatedMinutes": 5,
      "tips": ["Tip 1", "Tip 2"],
      "examples": ["Example 1", "Example 2"],
      "keyTerms": [{"term": "Term", "definition": "Definition"}],
      "quiz": [
        {
          "id": "q1",
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Why this is correct",
          "difficulty": "easy",
          "points": 10
        }
      ]
    }
  ]
}`;

    const userPrompt = `Create a comprehensive learning module from this document:

Title: ${title}
Description: ${description}
Category: ${category}
Access Levels: ${accessLevels.join(', ')}

Document Content:
${documentText.slice(0, 12000)} 

Create 5-8 lessons with 3-5 quiz questions each. Make it engaging and educational!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' }
    });

    const generatedContent = JSON.parse(completion.choices[0].message.content || '{}');
    console.log('✅ AI generated learning content');

    // Calculate totals
    const totalXp = generatedContent.lessons.reduce(
      (sum: number, lesson: any) => sum + (lesson.xpReward || 0), 0
    );
    const totalLessons = generatedContent.lessons.length;
    const estimatedHours = generatedContent.lessons.reduce(
      (sum: number, lesson: any) => sum + (lesson.estimatedMinutes || 5), 0
    ) / 60;

    // Add audio availability - ALL tutor-uploaded content has audio for ALL tiers (free to premium)
    generatedContent.lessons = generatedContent.lessons.map((lesson: any) => ({
      ...lesson,
      hasAudio: true // Audio available for all tiers on tutor-uploaded content
    }));

    // Create module object
    const module: GeneratedModule = {
      title: generatedContent.title || title,
      description: generatedContent.description || description,
      category,
      icon: generatedContent.icon || '📚',
      lessons: generatedContent.lessons,
      accessLevels,
      tutorId,
      tutorName,
      sourceContentId,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      totalXp,
      totalLessons,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      published: false // Requires tutor review before publishing
    };

    // Save to Firestore
    const db = getFirestore();
    if (db) {
      const docRef = await db.collection(GENERATED_MODULES_COLLECTION).add(module);
      module.id = docRef.id;
      console.log(`✅ Saved generated module: ${module.id}`);
    }

    return module;
  } catch (error) {
    console.error('❌ Error generating learning module:', error);
    return null;
  }
}

/**
 * Generate additional quizzes based on user request
 */
export async function generateAdditionalQuizzes(
  request: QuizRequest
): Promise<GeneratedQuiz[] | null> {
  try {
    console.log('🎯 Generating additional quizzes...');
    
    const db = getFirestore();
    if (!db) return null;

    // Get the module and lesson content
    const moduleDoc = await db.collection(GENERATED_MODULES_COLLECTION).doc(request.moduleId).get();
    if (!moduleDoc.exists) {
      console.error('Module not found');
      return null;
    }

    const module = moduleDoc.data() as GeneratedModule;
    const lesson = request.lessonId 
      ? module.lessons.find(l => l.id === request.lessonId)
      : null;

    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const systemPrompt = `You are an expert quiz creator for educational content. 
Create engaging, varied quiz questions that test understanding and application, not just memorization.
Use different question types and difficulty levels.

Return valid JSON array of quiz objects:
[
  {
    "id": "q1",
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Detailed explanation",
    "difficulty": "easy" | "medium" | "hard",
    "points": 10-30
  }
]`;

    const userPrompt = `Create ${request.numberOfQuizzes} quiz questions for:
Module: ${module.title}
${lesson ? `Lesson: ${lesson.title}\nContent: ${lesson.content.slice(0, 2000)}` : ''}

Difficulty: ${request.difficulty || 'medium'}
User Request: ${request.message}

Make questions practical, engaging, and test real understanding!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"quizzes":[]}');
    const quizzes = result.quizzes || result;
    
    console.log(`✅ Generated ${quizzes.length} additional quizzes`);
    return quizzes;
  } catch (error) {
    console.error('❌ Error generating quizzes:', error);
    return null;
  }
}

/**
 * Save quiz request
 */
export async function saveQuizRequest(request: Omit<QuizRequest, 'id'>): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const docRef = await db.collection(QUIZ_REQUESTS_COLLECTION).add({
      ...request,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Saved quiz request: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving quiz request:', error);
    return null;
  }
}

/**
 * Save tutor message
 */
export async function saveTutorMessage(message: Omit<TutorMessage, 'id'>): Promise<string | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    const docRef = await db.collection(TUTOR_MESSAGES_COLLECTION).add({
      ...message,
      createdAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Saved tutor message: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error saving tutor message:', error);
    return null;
  }
}

/**
 * Get all generated modules
 */
export async function getAllGeneratedModules(): Promise<GeneratedModule[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(GENERATED_MODULES_COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as GeneratedModule[];
  } catch (error) {
    console.error('❌ Error fetching generated modules:', error);
    return [];
  }
}

/**
 * Get modules by access level
 */
export async function getModulesByAccessLevel(
  accessLevel: 'free' | 'basic' | 'standard' | 'premium'
): Promise<GeneratedModule[]> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized');
    return [];
  }

  try {
    console.log(`🔍 Fetching modules for access level: ${accessLevel}`);
    console.log(`📋 Query: published == true AND accessLevels array-contains ${accessLevel} ORDER BY createdAt DESC`);
    
    const snapshot = await db.collection(GENERATED_MODULES_COLLECTION)
      .where('published', '==', true)
      .where('accessLevels', 'array-contains', accessLevel)
      .orderBy('createdAt', 'desc')
      .get();

    console.log(`✅ Found ${snapshot.size} published module(s) for ${accessLevel} tier`);
    
    const modules = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`  - Module: ${data.title} (ID: ${doc.id}, Published: ${data.published}, AccessLevels: ${JSON.stringify(data.accessLevels)}, HasImage: ${!!data.imageUrl})`);
      return {
        id: doc.id,
        ...data
      };
    }) as GeneratedModule[];

    return modules;
  } catch (error: any) {
    console.error('❌ Error fetching modules by access level:', error);
    
    // Check if it's an index error
    if (error.code === 9 || error.message?.includes('index')) {
      console.error('⚠️ Firestore index missing!');
      console.error('💡 You need to create a composite index for:');
      console.error('   Collection: generatedModules');
      console.error('   Fields: published (ASC) + accessLevels (ARRAY_CONTAINS) + createdAt (DESC)');
      console.error('💡 Run: firebase deploy --only firestore:indexes');
    }
    
    return [];
  }
}

/**
 * Publish module
 */
export async function publishModule(moduleId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update({
      published: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Published module: ${moduleId}`);
    return true;
  } catch (error) {
    console.error('❌ Error publishing module:', error);
    return false;
  }
}

/**
 * Update module image URL
 */
export async function updateModuleImageUrl(moduleId: string, imageUrl: string | null): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };
    
    if (imageUrl === null) {
      // Delete the imageUrl field
      updateData.imageUrl = admin.firestore.FieldValue.delete();
    } else {
      updateData.imageUrl = imageUrl;
    }

    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update(updateData);

    console.log(`✅ Updated module image: ${moduleId} (has imageUrl: ${!!imageUrl})`);
    
    // Verify the update by reading back
    const docRef = await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).get();
    const updatedData = docRef.data();
    console.log(`🔍 Verification - Module ${moduleId} imageUrl exists: ${!!updatedData?.imageUrl}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error updating module image:', error);
    return false;
  }
}

/**
 * Delete module and all its content
 */
export async function deleteModule(moduleId: string): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).delete();
    console.log(`✅ Deleted module: ${moduleId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting module:', error);
    return false;
  }
}

/**
 * Update module with new content (regenerates the module)
 */
export async function updateModule(
  moduleId: string,
  filePath: string,
  title: string,
  description: string,
  category: string,
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[],
  tutorId: string,
  tutorName: string,
  sourceContentId: string
): Promise<GeneratedModule | null> {
  const db = getFirestore();
  if (!db) return null;

  try {
    // Get existing module to preserve ID
    const moduleDoc = await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).get();
    
    if (!moduleDoc.exists) {
      console.error(`❌ Module not found: ${moduleId}`);
      return null;
    }

    // Generate new module content
    const newModule = await generateLearningModule(
      filePath,
      title,
      description,
      category,
      accessLevels,
      tutorId,
      tutorName,
      sourceContentId
    );

    if (!newModule) {
      console.error('❌ Failed to generate new module content');
      return null;
    }

    // Update the existing module document with new content
    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update({
      title: newModule.title,
      description: newModule.description,
      category: newModule.category,
      icon: newModule.icon,
      lessons: newModule.lessons,
      accessLevels: newModule.accessLevels,
      totalXp: newModule.totalXp,
      totalLessons: newModule.totalLessons,
      estimatedHours: newModule.estimatedHours,
      updatedAt: admin.firestore.Timestamp.now(),
      // Keep published status - don't auto-unpublish on update
    });

    // Update the module ID in the returned object
    newModule.id = moduleId;
    console.log(`✅ Updated module: ${moduleId}`);
    return newModule;
  } catch (error) {
    console.error('❌ Error updating module:', error);
    return null;
  }
}

/**
 * Get pending quiz requests
 */
export async function getPendingQuizRequests(): Promise<QuizRequest[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const snapshot = await db.collection(QUIZ_REQUESTS_COLLECTION)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as QuizRequest[];
  } catch (error) {
    console.error('❌ Error fetching quiz requests:', error);
    return [];
  }
}

/**
 * Get tutor messages
 */
export async function getTutorMessages(tutorId?: string): Promise<TutorMessage[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    let query: admin.firestore.Query = db.collection(TUTOR_MESSAGES_COLLECTION);
    
    if (tutorId) {
      query = query.where('tutorId', '==', tutorId);
    }
    
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as TutorMessage[];
  } catch (error) {
    console.error('❌ Error fetching tutor messages:', error);
    return [];
  }
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  messageId: string,
  status: 'unread' | 'read' | 'replied'
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    await db.collection(TUTOR_MESSAGES_COLLECTION).doc(messageId).update({
      status,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('❌ Error updating message status:', error);
    return false;
  }
}

/**
 * Add reply to message
 */
export async function addReplyToMessage(
  messageId: string,
  from: string,
  message: string
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    await db.collection(TUTOR_MESSAGES_COLLECTION).doc(messageId).update({
      replies: admin.firestore.FieldValue.arrayUnion({
        from,
        message,
        timestamp: admin.firestore.Timestamp.now(),
      }),
      status: 'replied',
      updatedAt: admin.firestore.Timestamp.now(),
    });

    return true;
  } catch (error) {
    console.error('❌ Error adding reply:', error);
    return false;
  }
}

/**
 * Get modules by tutor ID
 */
export async function getModulesByTutorId(tutorId: string): Promise<GeneratedModule[]> {
  const db = getFirestore();
  if (!db) {
    console.error('❌ Firestore not initialized');
    return [];
  }

  try {
    console.log(`🔍 Querying generatedModules for tutorId: ${tutorId}`);
    
    // Try with orderBy first
    try {
      const snapshot = await db.collection(GENERATED_MODULES_COLLECTION)
        .where('tutorId', '==', tutorId)
        .orderBy('createdAt', 'desc')
        .get();

      const modules = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GeneratedModule[];
      
      console.log(`✅ Found ${modules.length} module(s) with orderBy`);
      return modules;
    } catch (indexError: any) {
      // If index error, try without orderBy
      if (indexError?.code === 9 || indexError?.message?.includes('index')) {
        console.warn('⚠️ Index not found, querying without orderBy');
        console.warn('⚠️ Please deploy Firestore indexes: firebase deploy --only firestore:indexes');
        
        const snapshot = await db.collection(GENERATED_MODULES_COLLECTION)
          .where('tutorId', '==', tutorId)
          .get();

        const modules = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GeneratedModule[];
        
        // Sort in memory
        modules.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        console.log(`✅ Found ${modules.length} module(s) without orderBy (sorted in memory)`);
        return modules;
      }
      throw indexError;
    }
  } catch (error) {
    console.error('❌ Error fetching modules by tutor:', error);
    console.error('Error details:', error);
    return [];
  }
}

/**
 * Update access levels for a specific lesson within a module
 */
export async function updateLessonAccessLevels(
  moduleId: string,
  lessonId: string,
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[]
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const moduleDoc = await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).get();
    if (!moduleDoc.exists) return false;

    const module = moduleDoc.data() as GeneratedModule;
    const updatedLessons = module.lessons.map(lesson => {
      if (lesson.id === lessonId) {
        return { ...lesson, accessLevels };
      }
      return lesson;
    });

    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update({
      lessons: updatedLessons,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Updated access levels for lesson ${lessonId} in module ${moduleId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating lesson access levels:', error);
    return false;
  }
}

/**
 * Update access levels for a specific quiz within a lesson
 */
export async function updateQuizAccessLevels(
  moduleId: string,
  lessonId: string,
  quizId: string,
  accessLevels: ('free' | 'basic' | 'standard' | 'premium')[]
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const moduleDoc = await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).get();
    if (!moduleDoc.exists) return false;

    const module = moduleDoc.data() as GeneratedModule;
    const updatedLessons = module.lessons.map(lesson => {
      if (lesson.id === lessonId) {
        const updatedQuizzes = lesson.quiz.map(quiz => {
          if (quiz.id === quizId) {
            return { ...quiz, accessLevels };
          }
          return quiz;
        });
        return { ...lesson, quiz: updatedQuizzes };
      }
      return lesson;
    });

    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update({
      lessons: updatedLessons,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Updated access levels for quiz ${quizId} in lesson ${lessonId}`);
    return true;
  } catch (error) {
    console.error('❌ Error updating quiz access levels:', error);
    return false;
  }
}

/**
 * Bulk update access levels for all items in a module
 */
export async function bulkUpdateModuleAccessLevels(
  moduleId: string,
  updates: {
    moduleAccessLevels?: ('free' | 'basic' | 'standard' | 'premium')[];
    lessonUpdates?: Array<{ lessonId: string; accessLevels: ('free' | 'basic' | 'standard' | 'premium')[] }>;
    quizUpdates?: Array<{ lessonId: string; quizId: string; accessLevels: ('free' | 'basic' | 'standard' | 'premium')[] }>;
  }
): Promise<boolean> {
  const db = getFirestore();
  if (!db) return false;

  try {
    const moduleDoc = await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).get();
    if (!moduleDoc.exists) return false;

    const module = moduleDoc.data() as GeneratedModule;
    let updatedModule: any = { ...module };

    // Update module-level access
    if (updates.moduleAccessLevels) {
      updatedModule.accessLevels = updates.moduleAccessLevels;
    }

    // Update lesson access levels
    if (updates.lessonUpdates && updates.lessonUpdates.length > 0) {
      updatedModule.lessons = module.lessons.map(lesson => {
        const lessonUpdate = updates.lessonUpdates!.find(u => u.lessonId === lesson.id);
        if (lessonUpdate) {
          return { ...lesson, accessLevels: lessonUpdate.accessLevels };
        }
        return lesson;
      });
    }

    // Update quiz access levels
    if (updates.quizUpdates && updates.quizUpdates.length > 0) {
      updatedModule.lessons = (updatedModule.lessons || module.lessons).map((lesson: GeneratedLesson) => {
        const quizUpdatesForLesson = updates.quizUpdates!.filter(u => u.lessonId === lesson.id);
        if (quizUpdatesForLesson.length > 0) {
          const updatedQuizzes = lesson.quiz.map((quiz: GeneratedQuiz) => {
            const quizUpdate = quizUpdatesForLesson.find(u => u.quizId === quiz.id);
            if (quizUpdate) {
              return { ...quiz, accessLevels: quizUpdate.accessLevels };
            }
            return quiz;
          });
          return { ...lesson, quiz: updatedQuizzes };
        }
        return lesson;
      });
    }

    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update({
      ...updatedModule,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✅ Bulk updated access levels for module ${moduleId}`);
    return true;
  } catch (error) {
    console.error('❌ Error bulk updating access levels:', error);
    return false;
  }
}

/**
 * Delete modules not created by tutor admins
 * Returns number of modules deleted
 * @param dryRun - If true, only preview what would be deleted without actually deleting
 */
export async function deleteNonTutorModules(dryRun = false): Promise<{
  deleted: number;
  total: number;
  tutorAdminIds: string[];
  modulesToDelete: { id: string; title: string; tutorId?: string }[];
  modulesToKeep: { id: string; title: string; tutorId: string }[];
  errors: string[];
}> {
  const db = getFirestore();
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const result = {
    deleted: 0,
    total: 0,
    tutorAdminIds: [] as string[],
    modulesToDelete: [] as { id: string; title: string; tutorId?: string }[],
    modulesToKeep: [] as { id: string; title: string; tutorId: string }[],
    errors: [] as string[],
  };

  try {
    console.log('═══════════════════════════════════════════════');
    console.log(`🧹 CLEANUP: ${dryRun ? 'PREVIEW' : 'Deleting'} modules not created by tutor admins`);
    console.log(`   Mode: ${dryRun ? '🔍 DRY RUN (preview only)' : '🗑️  DELETE (permanent)'}`);
    console.log('═══════════════════════════════════════════════');

    // Get all tutor admin IDs
    const { getAllTutorAdmins } = await import('./tutor-admin-storage');
    const tutorAdmins = await getAllTutorAdmins();
    result.tutorAdminIds = tutorAdmins.map(t => t.id);
    
    console.log(`📋 Found ${tutorAdmins.length} tutor admin(s):`);
    tutorAdmins.forEach(tutor => {
      console.log(`   • ${tutor.name} (${tutor.email}) - ID: ${tutor.id}`);
    });

    if (tutorAdmins.length === 0) {
      console.warn('⚠️  No tutor admins found. All modules will be deleted!');
    }

    // Get all modules
    const modulesSnapshot = await db.collection(GENERATED_MODULES_COLLECTION).get();
    result.total = modulesSnapshot.size;
    
    console.log(`\n📦 Found ${result.total} total module(s)`);

    // Categorize modules: keep vs delete
    modulesSnapshot.docs.forEach(doc => {
      const moduleData = doc.data();
      const tutorId = moduleData.tutorId;

      // Check if module should be kept or deleted
      // KEEP if: tutorId exists AND matches a tutor admin ID
      // DELETE if: no tutorId OR tutorId doesn't match any tutor admin
      if (tutorId && tutorId !== '' && result.tutorAdminIds.includes(tutorId)) {
        // KEEP THIS MODULE - it has a valid tutor admin ID
        result.modulesToKeep.push({
          id: doc.id,
          title: moduleData.title || 'Untitled',
          tutorId: tutorId,
        });
      } else {
        // DELETE THIS MODULE - invalid or missing tutor admin ID
        result.modulesToDelete.push({
          id: doc.id,
          title: moduleData.title || 'Untitled',
          tutorId: tutorId || 'MISSING',
        });
      }
    });

    console.log(`\n✅ Modules to KEEP: ${result.modulesToKeep.length}`);
    if (result.modulesToKeep.length > 0) {
      console.log('\n📋 Modules that will be KEPT (created by tutor admins):');
      result.modulesToKeep.forEach((m, i) => {
        console.log(`   ${i + 1}. "${m.title}" (ID: ${m.id}, tutorId: ${m.tutorId})`);
      });
    }

    console.log(`\n🗑️  Modules to DELETE: ${result.modulesToDelete.length}`);
    if (result.modulesToDelete.length > 0) {
      console.log('\n📋 Modules that will be DELETED:');
      result.modulesToDelete.forEach((m, i) => {
        console.log(`   ${i + 1}. "${m.title}" (ID: ${m.id}, tutorId: ${m.tutorId})`);
      });
    }
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN MODE - No modules were actually deleted');
      console.log('   Run again without dryRun=true to perform deletion');
      console.log('═══════════════════════════════════════════════');
      return result;
    }

    // Delete modules in batches (Firestore batch limit is 500)
    console.log('\n🗑️  Starting deletion...');
    const BATCH_SIZE = 500;
    for (let i = 0; i < result.modulesToDelete.length; i += BATCH_SIZE) {
      const batch = result.modulesToDelete.slice(i, i + BATCH_SIZE);
      const firestoreBatch = db.batch();

      batch.forEach(module => {
        const docRef = db.collection(GENERATED_MODULES_COLLECTION).doc(module.id);
        firestoreBatch.delete(docRef);
      });

      try {
        await firestoreBatch.commit();
        result.deleted += batch.length;
        console.log(`\n✅ Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} module(s)`);
      } catch (error) {
        const errorMsg = `Failed to delete batch ${Math.floor(i / BATCH_SIZE) + 1}: ${error}`;
        console.error(`❌ ${errorMsg}`);
        result.errors.push(errorMsg);
      }
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ CLEANUP COMPLETE');
    console.log(`   Total modules: ${result.total}`);
    console.log(`   Kept (tutor admin): ${result.modulesToKeep.length}`);
    console.log(`   Deleted (non-tutor): ${result.deleted}`);
    console.log(`   Errors: ${result.errors.length}`);
    console.log('═══════════════════════════════════════════════');

    return result;
  } catch (error) {
    const errorMsg = `Cleanup failed: ${error}`;
    console.error('❌ ❌ ❌ CLEANUP FAILED! ❌ ❌ ❌');
    console.error(errorMsg);
    result.errors.push(errorMsg);
    throw error;
  }
}

