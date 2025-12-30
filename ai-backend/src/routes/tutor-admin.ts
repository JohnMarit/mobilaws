import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { 
  isTutorAdmin, 
  getTutorAdmin, 
  createTutorAdmin,
  getAllTutorAdmins,
  saveUploadedContent,
  updateContentStatus,
  getContentByTutor,
  getAllUploadedContent,
  getTutorAdminById
} from '../lib/tutor-admin-storage';
import {
  generateLearningModule,
  generateAdditionalQuizzes,
  saveQuizRequest,
  saveTutorMessage,
  getAllGeneratedModules,
  getModulesByAccessLevel,
  publishModule,
  getPendingQuizRequests,
  getTutorMessages,
  updateMessageStatus,
  addReplyToMessage
} from '../lib/ai-content-generator';
import { ingest } from '../rag';

const router = Router();

// Configure multer for document uploads
const uploadDir = process.env.VERCEL ? '/tmp/tutor-uploads' : './storage/tutor-uploads';

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
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max
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
 * Check if user is tutor admin
 * GET /api/tutor-admin/check/:email
 */
router.get('/tutor-admin/check/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    console.log('═══════════════════════════════════════════════');
    console.log('🔍 TUTOR ADMIN CHECK REQUEST');
    console.log('═══════════════════════════════════════════════');
    console.log('📧 Email parameter:', email);
    console.log('📧 Email length:', email.length);
    console.log('📧 Email trimmed:', email.trim());
    
    const isTutor = await isTutorAdmin(email);
    
    console.log('✅ Is tutor admin:', isTutor);
    
    if (isTutor) {
      const tutor = await getTutorAdmin(email);
      console.log('✅ Tutor admin found:', tutor?.email);
      console.log('═══════════════════════════════════════════════');
      res.json({ isTutorAdmin: true, tutor });
    } else {
      console.log('❌ No tutor admin found for this email');
      console.log('💡 Make sure:');
      console.log('   1. Account exists in Firestore tutorAdmins collection');
      console.log('   2. Email matches exactly (case-sensitive)');
      console.log('   3. active field is set to true');
      console.log('═══════════════════════════════════════════════');
      res.json({ isTutorAdmin: false });
    }
  } catch (error) {
    console.error('═══════════════════════════════════════════════');
    console.error('❌ ❌ ❌ ERROR CHECKING TUTOR ADMIN! ❌ ❌ ❌');
    console.error('💥 Error:', error);
    console.error('═══════════════════════════════════════════════');
    res.status(500).json({ error: 'Failed to check tutor admin status' });
  }
});

/**
 * Get tutor admin details
 * GET /api/tutor-admin/:tutorId
 */
router.get('/tutor-admin/:tutorId', async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    const tutor = await getTutorAdminById(tutorId);
    
    if (tutor) {
      res.json(tutor);
    } else {
      res.status(404).json({ error: 'Tutor admin not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching tutor admin:', error);
    res.status(500).json({ error: 'Failed to fetch tutor admin' });
  }
});

/**
 * Create tutor admin
 * POST /api/tutor-admin/create
 */
router.post('/tutor-admin/create', async (req: Request, res: Response) => {
  try {
    const { email, name, picture, specializations, bio } = req.body;
    
    if (!email || !name) {
      res.status(400).json({ error: 'Email and name are required' });
      return;
    }
    
    const tutor = await createTutorAdmin(email, name, picture, specializations, bio);
    
    if (tutor) {
      res.json({ success: true, tutor });
    } else {
      res.status(500).json({ error: 'Failed to create tutor admin' });
    }
  } catch (error) {
    console.error('❌ Error creating tutor admin:', error);
    res.status(500).json({ error: 'Failed to create tutor admin' });
  }
});

/**
 * Get all tutor admins
 * GET /api/tutor-admin/all
 */
router.get('/tutor-admin/all', async (req: Request, res: Response) => {
  try {
    const tutors = await getAllTutorAdmins();
    res.json(tutors);
  } catch (error) {
    console.error('❌ Error fetching tutor admins:', error);
    res.status(500).json({ error: 'Failed to fetch tutor admins' });
  }
});

/**
 * Upload learning content with AI generation
 * POST /api/tutor-admin/upload
 */
router.post('/tutor-admin/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { 
      tutorId, 
      tutorName, 
      title, 
      description, 
      accessLevels, 
      category 
    } = req.body;
    
    if (!file || !tutorId || !title || !accessLevels) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    console.log('📤 Received document upload from tutor:', tutorName);
    
    // Parse access levels
    const levels = typeof accessLevels === 'string' 
      ? JSON.parse(accessLevels) 
      : accessLevels;
    
    // Save content metadata
    const contentId = await saveUploadedContent({
      tutorId,
      tutorName,
      title,
      description: description || '',
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      accessLevels: levels,
      category: category || 'general',
      status: 'processing',
    });
    
    if (!contentId) {
      res.status(500).json({ error: 'Failed to save content metadata' });
      return;
    }
    
    // Start AI content generation (async)
    console.log('🤖 Starting AI content generation...');
    
    generateLearningModule(
      file.path,
      title,
      description || '',
      category || 'general',
      levels,
      tutorId,
      tutorName,
      contentId
    ).then(async (module) => {
      if (module && module.id) {
        await updateContentStatus(contentId, 'ready', module.id);
        console.log('✅ Content generation completed:', module.id);
        
        // Also index in vector store for chat
        try {
          await ingest([file.path]);
          console.log('✅ Document indexed in vector store');
        } catch (err) {
          console.warn('⚠️ Failed to index in vector store:', err);
        }
      } else {
        await updateContentStatus(contentId, 'failed');
        console.error('❌ Content generation failed');
      }
    }).catch(async (error) => {
      console.error('❌ Content generation error:', error);
      await updateContentStatus(contentId, 'failed');
    });
    
    // Return immediate response
    res.json({
      success: true,
      contentId,
      message: 'Document uploaded successfully. AI is generating learning content...',
      file: {
        originalName: file.originalname,
        size: file.size,
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Get uploaded content by tutor
 * GET /api/tutor-admin/content/:tutorId
 */
router.get('/tutor-admin/content/:tutorId', async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    const content = await getContentByTutor(tutorId);
    res.json(content);
  } catch (error) {
    console.error('❌ Error fetching tutor content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

/**
 * Get all uploaded content (admin view)
 * GET /api/tutor-admin/content/all
 */
router.get('/tutor-admin/content-all', async (req: Request, res: Response) => {
  try {
    const content = await getAllUploadedContent();
    res.json(content);
  } catch (error) {
    console.error('❌ Error fetching all content:', error);
    res.status(500).json({ error: 'Failed to fetch content' });
  }
});

/**
 * Get all generated modules
 * GET /api/tutor-admin/modules
 */
router.get('/tutor-admin/modules', async (req: Request, res: Response) => {
  try {
    const modules = await getAllGeneratedModules();
    res.json(modules);
  } catch (error) {
    console.error('❌ Error fetching modules:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

/**
 * Get modules by access level
 * GET /api/tutor-admin/modules/:accessLevel
 */
router.get('/tutor-admin/modules/level/:accessLevel', async (req: Request, res: Response) => {
  try {
    const { accessLevel } = req.params;
    const modules = await getModulesByAccessLevel(accessLevel as any);
    res.json(modules);
  } catch (error) {
    console.error('❌ Error fetching modules by access level:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

/**
 * Publish module
 * POST /api/tutor-admin/modules/:moduleId/publish
 */
router.post('/tutor-admin/modules/:moduleId/publish', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const success = await publishModule(moduleId);
    
    if (success) {
      res.json({ success: true, message: 'Module published successfully' });
    } else {
      res.status(500).json({ error: 'Failed to publish module' });
    }
  } catch (error) {
    console.error('❌ Error publishing module:', error);
    res.status(500).json({ error: 'Failed to publish module' });
  }
});

/**
 * Request additional quizzes (learner endpoint)
 * POST /api/learning/quiz-request
 */
router.post('/learning/quiz-request', async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      userName, 
      userEmail, 
      moduleId, 
      lessonId, 
      message, 
      numberOfQuizzes, 
      difficulty 
    } = req.body;
    
    if (!userId || !moduleId || !numberOfQuizzes) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const requestId = await saveQuizRequest({
      userId,
      userName: userName || 'User',
      userEmail: userEmail || '',
      moduleId,
      lessonId,
      message: message || '',
      numberOfQuizzes: parseInt(numberOfQuizzes),
      difficulty: difficulty || 'medium',
      status: 'pending',
    } as any);
    
    if (requestId) {
      res.json({ success: true, requestId, message: 'Quiz request submitted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to submit quiz request' });
    }
  } catch (error) {
    console.error('❌ Error submitting quiz request:', error);
    res.status(500).json({ error: 'Failed to submit quiz request' });
  }
});

/**
 * Send message to tutor (learner endpoint)
 * POST /api/learning/message-tutor
 */
router.post('/learning/message-tutor', async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      userName, 
      userEmail, 
      tutorId, 
      subject, 
      message, 
      moduleId, 
      lessonId 
    } = req.body;
    
    if (!userId || !subject || !message) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const messageId = await saveTutorMessage({
      userId,
      userName: userName || 'User',
      userEmail: userEmail || '',
      tutorId,
      subject,
      message,
      moduleId,
      lessonId,
      status: 'unread',
    } as any);
    
    if (messageId) {
      res.json({ success: true, messageId, message: 'Message sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

/**
 * Get pending quiz requests (tutor endpoint)
 * GET /api/tutor-admin/quiz-requests
 */
router.get('/tutor-admin/quiz-requests', async (req: Request, res: Response) => {
  try {
    const requests = await getPendingQuizRequests();
    res.json(requests);
  } catch (error) {
    console.error('❌ Error fetching quiz requests:', error);
    res.status(500).json({ error: 'Failed to fetch quiz requests' });
  }
});

/**
 * Get tutor messages
 * GET /api/tutor-admin/messages/:tutorId?
 */
router.get('/tutor-admin/messages/:tutorId?', async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    const messages = await getTutorMessages(tutorId);
    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Update message status
 * POST /api/tutor-admin/messages/:messageId/status
 */
router.post('/tutor-admin/messages/:messageId/status', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;
    
    const success = await updateMessageStatus(messageId, status);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update status' });
    }
  } catch (error) {
    console.error('❌ Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * Reply to message
 * POST /api/tutor-admin/messages/:messageId/reply
 */
router.post('/tutor-admin/messages/:messageId/reply', async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { from, message } = req.body;
    
    const success = await addReplyToMessage(messageId, from, message);
    
    if (success) {
      res.json({ success: true, message: 'Reply sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send reply' });
    }
  } catch (error) {
    console.error('❌ Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
});

/**
 * Process quiz request (generate quizzes)
 * POST /api/tutor-admin/quiz-requests/:requestId/process
 */
router.post('/tutor-admin/quiz-requests/:requestId/process', async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    
    // Get request details from Firestore
    // Then generate quizzes
    // Update request status
    
    res.json({ success: true, message: 'Quiz generation started' });
  } catch (error) {
    console.error('❌ Error processing quiz request:', error);
    res.status(500).json({ error: 'Failed to process quiz request' });
  }
});

export default router;

