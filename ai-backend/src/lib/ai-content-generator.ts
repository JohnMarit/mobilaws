/**
 * AI Content Generator for Duolingo-style learning materials
 * Processes uploaded documents and generates structured learning content
 */

import OpenAI from 'openai';
import { env } from '../env';
import { admin, getFirebaseAuth } from './firebase-admin';
import fs from 'fs';
import { saveDocumentPages, DocumentPage } from './document-page-storage';

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
  level?: number; // Level number (groups of 5 lessons per level)
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
  sharedLessonsLastPage?: number; // Last page number used for shared lesson generation
  documentTotalPages?: number; // Total pages in the source document
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
 * Extract document text with page information preserved
 * Returns array of pages with content
 */
async function extractDocumentPages(filePath: string): Promise<DocumentPage[]> {
  const ext = filePath.toLowerCase().split('.').pop();
  const pages: DocumentPage[] = [];
  
  if (ext === 'txt') {
    // For text files, split by form feed or every ~500 words as a "page"
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Try to split by form feed characters first
    let splits = content.split('\f');
    
    // If no form feeds, split by approximate page length (2000 characters)
    if (splits.length === 1) {
      const CHARS_PER_PAGE = 2000;
      splits = [];
      for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
        splits.push(content.slice(i, i + CHARS_PER_PAGE));
      }
    }
    
    splits.forEach((pageContent, index) => {
      if (pageContent.trim()) {
        pages.push({
          pageNumber: index + 1,
          content: pageContent.trim(),
          totalPages: splits.length
        });
      }
    });
    
    return pages;
  }
  
  if (ext === 'pdf') {
    // For PDFs, extract page by page if possible
    const pdfParse = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse.default(dataBuffer);
    
    // pdf-parse doesn't provide per-page text directly, so we approximate
    // by dividing the text evenly based on number of pages
    if (data.numpages && data.numpages > 1) {
      const avgCharsPerPage = Math.ceil(data.text.length / data.numpages);
      
      for (let i = 0; i < data.numpages; i++) {
        const start = i * avgCharsPerPage;
        const end = (i + 1) * avgCharsPerPage;
        const pageContent = data.text.slice(start, end).trim();
        
        if (pageContent) {
          pages.push({
            pageNumber: i + 1,
            content: pageContent,
            totalPages: data.numpages
          });
        }
      }
    } else {
      // Single page PDF
      pages.push({
        pageNumber: 1,
        content: data.text.trim(),
        totalPages: 1
      });
    }
    
    return pages;
  }
  
  if (ext === 'docx' || ext === 'doc') {
    // For DOCX, extract and split by page breaks if present
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    const content = result.value;
    
    // Split by page break characters or approximate page size
    let splits = content.split(/\f|\x0C/); // Form feed character
    
    // If no page breaks, split by approximate page length (2000 characters)
    if (splits.length === 1) {
      const CHARS_PER_PAGE = 2000;
      splits = [];
      for (let i = 0; i < content.length; i += CHARS_PER_PAGE) {
        splits.push(content.slice(i, i + CHARS_PER_PAGE));
      }
    }
    
    splits.forEach((pageContent, index) => {
      if (pageContent.trim()) {
        pages.push({
          pageNumber: index + 1,
          content: pageContent.trim(),
          totalPages: splits.length
        });
      }
    });
    
    return pages;
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
    
    // ALSO extract and save document pages for sequential lesson generation
    const documentPages = await extractDocumentPages(filePath);
    console.log(`📄 Extracted ${documentPages.length} pages from document`);
    
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
      
      // Save document pages for sequential lesson generation
      if (documentPages.length > 0 && module.id) {
        const pageStorageId = await saveDocumentPages({
          moduleId: module.id,
          contentId: sourceContentId,
          tutorId,
          title,
          totalPages: documentPages.length,
          pages: documentPages,
        });
        
        if (pageStorageId) {
          console.log(`✅ Saved ${documentPages.length} document pages for sequential learning`);
        } else {
          console.warn('⚠️ Failed to save document pages, but module was saved successfully');
        }
      }
    }

    return module;
  } catch (error) {
    console.error('❌ Error generating learning module:', error);
    return null;
  }
}

/**
 * Generate additional SHARED lessons for a module (available to all users).
 * Uses page-based generation from page 1 to end sequentially.
 * Appends lessons directly to generatedModules/{moduleId}.lessons.
 */
export async function generateSharedLessonsForModule(
  moduleId: string,
  numberOfLessons: number = 5,
  difficulty: 'simple' | 'medium' | 'hard' = 'medium'
): Promise<{ 
  success: boolean; 
  added: number; 
  message?: string; 
  currentPage?: number; 
  totalPages?: number;
  pagesCovered?: number;
  pagesRemaining?: number;
  startPage?: number;
  endPage?: number;
  useFallback?: boolean;
}> {
  const db = getFirestore();
  if (!db) {
    return { success: false, added: 0, message: 'Database not available' };
  }

  try {
    // Get module
    const moduleDoc = await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).get();
    if (!moduleDoc.exists) {
      return { success: false, added: 0, message: 'Module not found' };
    }

    const moduleData = moduleDoc.data() as GeneratedModule & { sharedLessonsLastPage?: number };
    const sourceContentId = moduleData.sourceContentId;

    if (!sourceContentId) {
      return { success: false, added: 0, message: 'Module missing sourceContentId' };
    }

    // Get document pages (page-based generation)
    const { getDocumentPagesByContentId } = await import('./document-page-storage');
    let documentPagesData = await getDocumentPagesByContentId(sourceContentId);
    let documentPages = documentPagesData?.pages || [];
    let useFallbackContent = false;

    // If no pages exist, try to migrate
    if (!documentPages || documentPages.length === 0) {
      console.log(`⚠️ No document pages found for ${sourceContentId}, attempting migration...`);
      const { migrateModuleDocument } = await import('./document-migration');
      const migrationResult = await migrateModuleDocument(moduleId);
      
      if (migrationResult.success) {
        documentPagesData = await getDocumentPagesByContentId(sourceContentId);
        documentPages = documentPagesData?.pages || [];
      } else {
        console.log(`⚠️ Migration failed: ${migrationResult.message}. Using fallback: existing module content.`);
        useFallbackContent = true;
      }
    }

    // Fallback: Use existing module lessons as source content if pages aren't available
    let contentForAI: string;
    let totalPages: number;
    let lastPageCovered: number;
    let startPage: number;
    let endPage: number;

    if (useFallbackContent || !documentPages || documentPages.length === 0) {
      // Use existing lessons as source material
      const existingLessons = moduleData.lessons || [];
      if (existingLessons.length === 0) {
        return { 
          success: false, 
          added: 0, 
          message: 'Cannot generate lessons: No document pages available and module has no existing lessons to use as reference. Please re-upload the document or ensure the module has initial lessons.' 
        };
      }

      // Extract content from existing lessons
      const existingContent = existingLessons
        .map((lesson: any, idx: number) => {
          const lessonText = [
            `Lesson ${idx + 1}: ${lesson.title}`,
            lesson.summary || '',
            lesson.content?.replace(/<[^>]*>/g, '').substring(0, 1000) || '', // Strip HTML and limit length
            ...(lesson.keyTerms?.map((kt: any) => `${kt.term}: ${kt.definition}`) || [])
          ].filter(Boolean).join('\n');
          return lessonText;
        })
        .join('\n\n');

      contentForAI = `=== EXISTING MODULE CONTENT (as reference) ===\n${existingContent}\n=== END REFERENCE ===`;
      totalPages = existingLessons.length; // Treat each lesson as a "page"
      lastPageCovered = moduleData.sharedLessonsLastPage || 0;
      
      // Generate new lessons based on the module's theme and existing content
      const pagesToCover = Math.min(numberOfLessons, Math.max(1, totalPages - lastPageCovered));
      startPage = lastPageCovered + 1;
      endPage = lastPageCovered + pagesToCover;
      
      console.log(`📚 Using fallback: Generating ${numberOfLessons} lessons based on existing module content (${existingLessons.length} existing lessons)`);
    } else {
      // Use document pages (normal flow)
      totalPages = documentPages.length;
      lastPageCovered = moduleData.sharedLessonsLastPage || 0;

      // Check if we've reached the end
      if (lastPageCovered >= totalPages) {
      return {
        success: true,
        added: 0,
        message: `All ${totalPages} pages have been covered. Module is complete!`,
        currentPage: totalPages,
        totalPages,
        pagesCovered: totalPages,
        pagesRemaining: 0,
        startPage: totalPages,
        endPage: totalPages,
        useFallback: false
      };
      }

      // Determine pages to generate from
      const pagesToCover = Math.min(numberOfLessons, totalPages - lastPageCovered);
      startPage = lastPageCovered + 1;
      endPage = lastPageCovered + pagesToCover;

      // Get content for these pages
      contentForAI = documentPages
        .slice(startPage - 1, endPage)
        .map((p: any) => `--- Page ${p.pageNumber} ---\n${p.content}`)
        .join('\n\n');
      
      console.log(`📚 Generating ${numberOfLessons} shared lessons from pages ${startPage} to ${endPage} of ${totalPages}`);
    }

    // Initialize OpenAI
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const difficultyDescriptions = {
      simple: 'Simple mode with clear explanations and guided learning',
      medium: 'Medium difficulty with intermediate scenarios',
      hard: 'Hard mode with complex analysis'
    };

    // Calculate current level (each level has 5 lessons)
    const existingLessonsCount = moduleData.lessons?.length || 0;
    const currentLevel = Math.floor(existingLessonsCount / 5) + 1;
    
    // Force numberOfLessons to be 5 for proper level structure
    const lessonsToGenerate = 5;
    
    const systemPrompt = `You are an expert educational content creator for South Sudan law. 
Create engaging, INTERACTIVE lessons using Duolingo-style pedagogy.
Return ONLY valid JSON with lessons array in this format:
{
  "lessons": [
    {
      "id": "lesson-1",
      "title": "Lesson Title",
      "content": "<html content>",
      "summary": "Brief summary",
      "xpReward": 100,
      "estimatedMinutes": 10,
      "difficulty": "simple" | "medium" | "hard",
      "quiz": [{"id": "q1", "question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "...", "difficulty": "medium", "points": 10}],
      "tips": ["tip1", "tip2"],
      "examples": ["example1"],
      "keyTerms": [{"term": "term", "definition": "def"}]
    }
  ]
}

CRITICAL: You MUST return exactly 5 lessons with this difficulty distribution:
- Lesson 1: "simple" difficulty
- Lesson 2: "simple" difficulty
- Lesson 3: "medium" difficulty
- Lesson 4: "medium" difficulty
- Lesson 5: "hard" difficulty

All 5 lessons should cover the SAME topic/theme from the provided content.`;

    // Build user prompt based on whether we're using document pages or fallback content
    let userPrompt: string;
    if (useFallbackContent) {
      userPrompt = `Create exactly 5 new lessons for module "${moduleData.title}" - Level ${currentLevel}

Module Description: ${moduleData.description || 'South Sudan legal education'}
Existing Shared Lessons: ${moduleData.lessons?.length || 0}
Current Level: ${currentLevel} (each level contains 5 lessons)

${contentForAI}

CRITICAL REQUIREMENTS:
1. Create exactly 5 lessons covering the SAME topic/theme from the content above
2. Difficulty distribution (MANDATORY):
   - Lesson 1: "simple" - Basic introduction, clear explanations
   - Lesson 2: "simple" - Reinforce basics with examples
   - Lesson 3: "medium" - Intermediate concepts, more detail
   - Lesson 4: "medium" - Apply concepts in scenarios
   - Lesson 5: "hard" - Advanced analysis, complex scenarios
3. All 5 lessons must cover the SAME topic but with increasing difficulty
4. Include 3-5 quiz questions per lesson matching the lesson's difficulty
5. Provide clear explanations for quiz answers
6. Maintain consistency with the module's style and focus
7. Ensure lessons are complementary to existing ones, not duplicates

Create exactly 5 high-quality lessons with proper difficulty progression now!`;
    } else {
      userPrompt = `Create exactly 5 new SEQUENTIAL lessons for module "${moduleData.title}" - Level ${currentLevel}

Module Description: ${moduleData.description || 'South Sudan legal education'}
Existing Shared Lessons: ${moduleData.lessons?.length || 0}
Current Level: ${currentLevel} (each level contains 5 lessons)
Current Progress: Pages ${startPage}-${endPage} of ${totalPages}

=== DOCUMENT PAGES FOR THIS BATCH ===
${contentForAI}
=== END DOCUMENT PAGES ===

CRITICAL REQUIREMENTS:
1. Base ALL content ONLY on the document pages above (pages ${startPage}-${endPage})
2. Create exactly 5 lessons covering the SAME topic from these pages
3. Difficulty distribution (MANDATORY):
   - Lesson 1: "simple" - Basic introduction, clear explanations
   - Lesson 2: "simple" - Reinforce basics with examples
   - Lesson 3: "medium" - Intermediate concepts, more detail
   - Lesson 4: "medium" - Apply concepts in scenarios
   - Lesson 5: "hard" - Advanced analysis, complex scenarios
4. All 5 lessons must cover the SAME topic but with increasing difficulty
5. Ensure content is directly answerable from provided pages
6. Do NOT repeat content from previous pages (1-${lastPageCovered})
7. Include 3-5 quiz questions per lesson matching the lesson's difficulty
8. Provide clear explanations for quiz answers

Create exactly 5 high-quality, sequential lessons with proper difficulty progression now!`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 12000,
      response_format: { type: 'json_object' }
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      return { success: false, added: 0, message: 'Empty response from OpenAI' };
    }

    let newLessons: any[] = [];
    try {
      const parsed = JSON.parse(responseContent);
      newLessons = parsed.lessons || [];
    } catch (err) {
      console.error('❌ Failed to parse AI response:', err);
      return { success: false, added: 0, message: 'Failed to parse AI response' };
    }

    if (newLessons.length === 0) {
      return { success: false, added: 0, message: 'AI did not generate lessons' };
    }

    // Normalize lessons and quizzes
    const timestamp = Date.now();
    const difficultyOrder: ('simple' | 'medium' | 'hard')[] = ['simple', 'simple', 'medium', 'medium', 'hard'];
    
    newLessons.forEach((lesson: any, index: number) => {
      lesson.id = lesson.id || `shared-${timestamp}-${index}`;
      lesson.hasAudio = true;
      lesson.userGenerated = false;
      lesson.accessLevels = moduleData.accessLevels || ['free', 'basic', 'standard', 'premium'];
      
      // Assign difficulty based on position (2 simple, 2 medium, 1 hard)
      const assignedDifficulty = difficultyOrder[index % 5] || lesson.difficulty || 'medium';
      lesson.difficulty = assignedDifficulty;
      
      // Assign level number
      lesson.level = currentLevel;
      
      if (!useFallbackContent) {
        lesson.fromPages = { start: startPage, end: endPage }; // Track which pages this came from
      }
      if (Array.isArray(lesson.quiz)) {
        lesson.quiz.forEach((q: any, qIndex: number) => {
          q.id = q.id || `q-${timestamp}-${index}-${qIndex}`;
          q.points = q.points || 10;
          q.difficulty = q.difficulty || assignedDifficulty;
        });
      }
    });

    // Store new lessons in subcollection to avoid document size limit (1MB)
    // This prevents "Document size exceeds maximum" errors
    const sharedLessonsRef = db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).collection('sharedLessons');
    
    // Get existing shared lessons from subcollection BEFORE adding new ones
    const existingSharedLessonsSnapshot = await sharedLessonsRef.get();
    const existingSharedLessons = existingSharedLessonsSnapshot.docs.map(doc => doc.data());
    console.log(`📊 Found ${existingSharedLessons.length} existing shared lessons in subcollection`);
    
    // Batch write new lessons to subcollection
    const batch = db.batch();
    newLessons.forEach((lesson: any) => {
      const lessonRef = sharedLessonsRef.doc(lesson.id);
      batch.set(lessonRef, {
        ...lesson,
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    });
    await batch.commit();
    console.log(`✅ Stored ${newLessons.length} new shared lessons in subcollection for module ${moduleId}`);

    // Get existing lessons from array (backward compatibility)
    const existingArrayLessons = moduleData.lessons || [];
    
    // Calculate totals from ALL existing lessons (array + existing shared) + new lessons
    const allExistingLessons = [...existingArrayLessons, ...existingSharedLessons];
    const totalLessonsCount = allExistingLessons.length + newLessons.length;
    
    // Calculate XP from all existing lessons + new lessons
    const existingXp = allExistingLessons.reduce((sum: number, l: any) => sum + (l.xpReward || 0), 0);
    const newXp = newLessons.reduce((sum: number, l: any) => sum + (l.xpReward || 0), 0);
    const totalXp = existingXp + newXp;
    
    // Calculate hours from all existing lessons + new lessons
    const existingHours = allExistingLessons.reduce((sum: number, l: any) => sum + (l.estimatedMinutes || 5), 0) / 60;
    const newHours = newLessons.reduce((sum: number, l: any) => sum + (l.estimatedMinutes || 5), 0) / 60;
    const estimatedHours = existingHours + newHours;
    
    console.log(`📊 Total lessons: ${totalLessonsCount} (${existingArrayLessons.length} array + ${existingSharedLessons.length} existing shared + ${newLessons.length} new shared)`);

    // Update module metadata only (NOT the full lessons array to avoid size limit)
    const updateData: any = {
      totalLessons: totalLessonsCount,
      totalXp,
      estimatedHours: Math.round(estimatedHours * 10) / 10,
      hasSharedLessonsSubcollection: true, // Flag to indicate we're using subcollection
    };

    // Only update page tracking if we're using document pages (not fallback)
    if (!useFallbackContent) {
      updateData.sharedLessonsLastPage = endPage; // Track progress through document
      // Always store total pages if we have document pages
      if (documentPagesData && documentPagesData.totalPages) {
        updateData.documentTotalPages = documentPagesData.totalPages;
        console.log(`✅ Saving documentTotalPages: ${documentPagesData.totalPages} to module ${moduleId}`);
      } else if (totalPages) {
        // Fallback: use the totalPages we calculated from documentPages array
        updateData.documentTotalPages = totalPages;
        console.log(`✅ Saving documentTotalPages (fallback): ${totalPages} to module ${moduleId}`);
      }
    } else {
      // In fallback mode, track by lesson count instead
      updateData.sharedLessonsLastPage = totalLessonsCount;
    }

    updateData.updatedAt = admin.firestore.Timestamp.now();
    await db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).update(updateData);
    
    console.log(`📊 Updated module ${moduleId} metadata:`, {
      totalLessons: totalLessonsCount,
      totalXp,
      estimatedHours,
      hasSharedLessonsSubcollection: true,
      sharedLessonsLastPage: updateData.sharedLessonsLastPage,
      documentTotalPages: updateData.documentTotalPages
    });

    if (useFallbackContent) {
      console.log(`✅ Generated ${newLessons.length} shared lessons for module ${moduleId} (using fallback: existing module content)`);
      return {
        success: true,
        added: newLessons.length,
        message: `Generated ${newLessons.length} lessons using existing module content`,
        currentPage: endPage,
        totalPages,
        pagesCovered: endPage,
        pagesRemaining: Math.max(0, totalPages - endPage),
        startPage,
        endPage,
        useFallback: true
      };
    } else {
      console.log(`✅ Generated ${newLessons.length} shared lessons for module ${moduleId} (pages ${startPage}-${endPage}/${totalPages})`);
      return {
        success: true,
        added: newLessons.length,
        message: `Generated ${newLessons.length} lessons from pages ${startPage}-${endPage}. Progress: ${Math.round((endPage / totalPages) * 100)}%`,
        currentPage: endPage,
        totalPages,
        pagesCovered: endPage,
        pagesRemaining: Math.max(0, totalPages - endPage),
        startPage,
        endPage,
        useFallback: false
      };
    }
  } catch (error) {
    console.error('❌ Error generating shared lessons:', error);
    return { success: false, added: 0, message: error instanceof Error ? error.message : 'Unknown error' };
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
 * Fetch shared lessons from subcollection for a module
 */
async function fetchSharedLessonsFromSubcollection(moduleId: string): Promise<any[]> {
  const db = getFirestore();
  if (!db) return [];

  try {
    const sharedLessonsRef = db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).collection('sharedLessons');
    
    // Try with orderBy first, fallback to unordered if index missing
    let snapshot;
    try {
      snapshot = await sharedLessonsRef.orderBy('createdAt', 'asc').get();
    } catch (orderByError: any) {
      // If orderBy fails (missing index), fetch without ordering
      if (orderByError?.code === 9 || orderByError?.message?.includes('index')) {
        console.warn(`⚠️ Index missing for sharedLessons createdAt, fetching without orderBy for module ${moduleId}`);
        snapshot = await sharedLessonsRef.get();
      } else {
        throw orderByError;
      }
    }
    
    const lessons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Sort in memory if we didn't use orderBy
    if (lessons.length > 0 && !snapshot.query.orderBy) {
      lessons.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt?._seconds * 1000 || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt?._seconds * 1000 || 0;
        return aTime - bTime;
      });
    }
    
    console.log(`📚 Fetched ${lessons.length} shared lessons from subcollection for module ${moduleId}`);
    return lessons;
  } catch (error) {
    console.error(`❌ Error fetching shared lessons for module ${moduleId}:`, error);
    return [];
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

    // Fetch lessons from both array and subcollection for each module
    const modules = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const moduleId = doc.id;
      
      // Get lessons from array (backward compatibility)
      const arrayLessons = Array.isArray(data.lessons) ? data.lessons : [];
      
      // Always check subcollection (flag might not be set for older modules)
      let sharedLessons: any[] = [];
      try {
        const sharedLessonsRef = db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).collection('sharedLessons');
        const sharedSnapshot = await sharedLessonsRef.limit(1).get();
        if (!sharedSnapshot.empty || data.hasSharedLessonsSubcollection) {
          sharedLessons = await fetchSharedLessonsFromSubcollection(moduleId);
        }
      } catch (error) {
        console.debug(`No shared lessons subcollection for module ${moduleId}:`, error);
      }
      
      // Merge lessons: array lessons first, then shared lessons from subcollection
      const allLessons = [...arrayLessons, ...sharedLessons];
      
      return {
        id: moduleId,
        ...data,
        lessons: allLessons
      } as GeneratedModule;
    }));

    return modules;
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
    
    // Fetch lessons from both array and subcollection for each module
    const modules = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const moduleId = doc.id;
      
      // Get lessons from array (backward compatibility)
      const arrayLessons = Array.isArray(data.lessons) ? data.lessons : [];
      
      // Always check subcollection (flag might not be set for older modules)
      let sharedLessons: any[] = [];
      try {
        const sharedLessonsRef = db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).collection('sharedLessons');
        const sharedSnapshot = await sharedLessonsRef.limit(1).get();
        if (!sharedSnapshot.empty || data.hasSharedLessonsSubcollection) {
          sharedLessons = await fetchSharedLessonsFromSubcollection(moduleId);
        }
      } catch (error) {
        console.debug(`No shared lessons subcollection for module ${moduleId}:`, error);
      }
      
      // Merge lessons: array lessons first, then shared lessons from subcollection
      const allLessons = [...arrayLessons, ...sharedLessons];
      
      if (sharedLessons.length > 0) {
        console.log(`📚 Module ${moduleId}: ${arrayLessons.length} array + ${sharedLessons.length} shared = ${allLessons.length} total lessons`);
      }
      
      return {
        id: moduleId,
        ...data,
        lessons: allLessons
      } as GeneratedModule;
    }));
    
    console.log(`  - ${modules.filter(m => m.imageUrl).length} module(s) have images`);

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
    console.log(`✅ Updated module image: ${moduleId}`);
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
    
    // Helper to enrich modules with document page information
    const enrichModulesWithPageInfo = async (modules: GeneratedModule[]): Promise<GeneratedModule[]> => {
      const { getDocumentPagesByContentId } = await import('./document-page-storage');
      
      return Promise.all(modules.map(async (module) => {
        // If module already has documentTotalPages stored, use it
        if (module.documentTotalPages) {
          console.log(`✅ Module ${module.id} already has documentTotalPages: ${module.documentTotalPages}`);
          return module;
        }
        
        // If module has sharedLessonsLastPage but no documentTotalPages, try to fetch it
        const needsEnrichment = module.sharedLessonsLastPage !== undefined && !module.documentTotalPages;
        
        // Otherwise, try to fetch from documentPages collection
        if (module.sourceContentId) {
          try {
            const documentPages = await getDocumentPagesByContentId(module.sourceContentId);
            if (documentPages && documentPages.totalPages) {
              console.log(`✅ Fetched documentTotalPages for module ${module.id}: ${documentPages.totalPages}`);
              const enrichedModule = {
                ...module,
                documentTotalPages: documentPages.totalPages
              };
              
              // If module was missing documentTotalPages, save it back to Firestore
              if (needsEnrichment && module.id) {
                try {
                  await db.collection(GENERATED_MODULES_COLLECTION).doc(module.id).update({
                    documentTotalPages: documentPages.totalPages,
                    updatedAt: admin.firestore.Timestamp.now()
                  });
                  console.log(`✅ Saved documentTotalPages (${documentPages.totalPages}) to module ${module.id} in Firestore`);
                } catch (updateError) {
                  console.warn(`⚠️ Could not save documentTotalPages to module ${module.id}:`, updateError);
                }
              }
              
              return enrichedModule;
            } else {
              console.warn(`⚠️ No document pages found for module ${module.id}, sourceContentId: ${module.sourceContentId}`);
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch document pages for module ${module.id}:`, error);
          }
        } else {
          console.warn(`⚠️ Module ${module.id} has no sourceContentId`);
        }
        
        // Return module as-is if we couldn't get documentTotalPages
        return module;
      }));
    };
    
    // Try with orderBy first
    try {
      const snapshot = await db.collection(GENERATED_MODULES_COLLECTION)
        .where('tutorId', '==', tutorId)
        .orderBy('createdAt', 'desc')
        .get();

      // Fetch lessons from both array and subcollection for each module
      const modules = await Promise.all(snapshot.docs.map(async (doc) => {
        const data = doc.data();
        const moduleId = doc.id;
        
        // Get lessons from array (backward compatibility)
        const arrayLessons = Array.isArray(data.lessons) ? data.lessons : [];
        
        // Always check subcollection (flag might not be set for older modules)
        let sharedLessons: any[] = [];
        try {
          const sharedLessonsRef = db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).collection('sharedLessons');
          const sharedSnapshot = await sharedLessonsRef.limit(1).get();
          if (!sharedSnapshot.empty || data.hasSharedLessonsSubcollection) {
            sharedLessons = await fetchSharedLessonsFromSubcollection(moduleId);
          }
        } catch (error) {
          console.debug(`No shared lessons subcollection for module ${moduleId}:`, error);
        }
        
        // Merge lessons: array lessons first, then shared lessons from subcollection
        const allLessons = [...arrayLessons, ...sharedLessons];
        
        return {
          id: moduleId,
          ...data,
          lessons: allLessons
        } as GeneratedModule;
      }));
      
      console.log(`✅ Found ${modules.length} module(s) with orderBy`);
      
      // Debug: Log page coverage data before enrichment
      modules.forEach((module, index) => {
        console.log(`📄 Module ${index + 1} (${module.title}):`, {
          sharedLessonsLastPage: (module as any).sharedLessonsLastPage,
          documentTotalPages: (module as any).documentTotalPages,
          hasSharedLessonsLastPage: (module as any).sharedLessonsLastPage !== undefined
        });
      });
      
      const enrichedModules = await enrichModulesWithPageInfo(modules);
      
      // Debug: Log after enrichment
      enrichedModules.forEach((module, index) => {
        console.log(`📄 Module ${index + 1} AFTER enrichment:`, {
          sharedLessonsLastPage: module.sharedLessonsLastPage,
          documentTotalPages: module.documentTotalPages,
          hasPageData: module.sharedLessonsLastPage !== undefined && module.documentTotalPages !== undefined
        });
      });
      
      return enrichedModules;
    } catch (indexError: any) {
      // If index error, try without orderBy
      if (indexError?.code === 9 || indexError?.message?.includes('index')) {
        console.warn('⚠️ Index not found, querying without orderBy');
        console.warn('⚠️ Please deploy Firestore indexes: firebase deploy --only firestore:indexes');
        
        const snapshot = await db.collection(GENERATED_MODULES_COLLECTION)
          .where('tutorId', '==', tutorId)
          .get();

        // Fetch lessons from both array and subcollection for each module
        const modules = await Promise.all(snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const moduleId = doc.id;
          
          // Get lessons from array (backward compatibility)
          const arrayLessons = Array.isArray(data.lessons) ? data.lessons : [];
          
          // Always check subcollection (flag might not be set for older modules)
          let sharedLessons: any[] = [];
          try {
            const sharedLessonsRef = db.collection(GENERATED_MODULES_COLLECTION).doc(moduleId).collection('sharedLessons');
            const sharedSnapshot = await sharedLessonsRef.limit(1).get();
            if (!sharedSnapshot.empty || data.hasSharedLessonsSubcollection) {
              sharedLessons = await fetchSharedLessonsFromSubcollection(moduleId);
            }
          } catch (error) {
            console.debug(`No shared lessons subcollection for module ${moduleId}:`, error);
          }
          
          // Merge lessons: array lessons first, then shared lessons from subcollection
          const allLessons = [...arrayLessons, ...sharedLessons];
          
          return {
            id: moduleId,
            ...data,
            lessons: allLessons
          } as GeneratedModule;
        }));
        
        // Sort in memory
        modules.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
        
        console.log(`✅ Found ${modules.length} module(s) without orderBy (sorted in memory)`);
        
        // Debug: Log page coverage data before enrichment
        modules.forEach((module, index) => {
          console.log(`📄 Module ${index + 1} (${module.title}):`, {
            sharedLessonsLastPage: (module as any).sharedLessonsLastPage,
            documentTotalPages: (module as any).documentTotalPages,
            hasSharedLessonsLastPage: (module as any).sharedLessonsLastPage !== undefined
          });
        });
        
        const enrichedModules = await enrichModulesWithPageInfo(modules);
        
        // Debug: Log after enrichment
        enrichedModules.forEach((module, index) => {
          console.log(`📄 Module ${index + 1} AFTER enrichment:`, {
            sharedLessonsLastPage: module.sharedLessonsLastPage,
            documentTotalPages: module.documentTotalPages,
            hasPageData: module.sharedLessonsLastPage !== undefined && module.documentTotalPages !== undefined
          });
        });
        
        return enrichedModules;
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

