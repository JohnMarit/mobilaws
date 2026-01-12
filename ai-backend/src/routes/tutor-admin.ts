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
  getTutorAdminById,
  deleteUploadedContent,
  updateUploadedContent,
  getUploadedContentById,
  permanentlyDeleteUploadedContent,
  restoreUploadedContent,
  getDeletedContentByTutor
} from '../lib/tutor-admin-storage';
import {
  generateLearningModule,
  generateAdditionalQuizzes,
  saveQuizRequest,
  saveTutorMessage,
  getAllGeneratedModules,
  getModulesByAccessLevel,
  getModulesByTutorId,
  publishModule,
  getPendingQuizRequests,
  getTutorMessages,
  updateMessageStatus,
  addReplyToMessage,
  deleteNonTutorModules,
  deleteModule,
  updateModule,
  updateLessonAccessLevels,
  updateQuizAccessLevels,
  bulkUpdateModuleAccessLevels,
  updateModuleImageUrl
} from '../lib/ai-content-generator';
import { ingest } from '../rag';
import { admin, getFirestore } from '../lib/firebase-admin';

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

// Configure multer for image uploads
const imageUploadDir = process.env.VERCEL ? '/tmp/tutor-images' : './storage/tutor-images';
if (!fs.existsSync(imageUploadDir)) {
  fs.mkdirSync(imageUploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, imageUploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const imageUpload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for images
  },
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image type. Allowed: ${allowedExts.join(', ')}`));
    }
  },
});

/**
 * Check if user is tutor admin
 * GET /api/tutor-admin/check/:email
 */
router.get('/tutor-admin/check/:email', async (req: Request, res: Response) => {
  try {
    // Decode the email parameter (it's URL encoded from frontend)
    const { email } = req.params;
    const decodedEmail = decodeURIComponent(email);
    
    console.log('═══════════════════════════════════════════════');
    console.log('🔍 TUTOR ADMIN CHECK REQUEST');
    console.log('═══════════════════════════════════════════════');
    console.log('📧 Email parameter (raw):', email);
    console.log('📧 Email parameter (decoded):', decodedEmail);
    console.log('📧 Email length:', decodedEmail.length);
    console.log('📧 Email trimmed:', decodedEmail.trim());
    
    const isTutor = await isTutorAdmin(decodedEmail);
    
    console.log('✅ Is tutor admin:', isTutor);
    
    if (isTutor) {
      const tutor = await getTutorAdmin(decodedEmail);
      console.log('✅ Tutor admin found:', tutor?.email);
      console.log('═══════════════════════════════════════════════');
      res.json({ isTutorAdmin: true, tutor });
    } else {
      console.log('❌ No tutor admin found for this email');
      console.log('💡 Make sure:');
      console.log('   1. Account exists in Firestore tutorAdmins collection');
      console.log('   2. Email matches exactly (case-insensitive, normalized to lowercase)');
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
    console.log('📦 Fetching content for tutor:', tutorId);
    const content = await getContentByTutor(tutorId);
    console.log(`✅ Found ${content.length} content item(s)`);
    res.json(content);
  } catch (error) {
    console.error('❌ Error fetching tutor content:', error);
    // Return empty array instead of error object to prevent frontend crash
    res.json([]);
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
    
    // Validate access level
    const validLevels = ['free', 'basic', 'standard', 'premium'];
    if (!validLevels.includes(accessLevel)) {
      return res.status(400).json({ 
        error: 'Invalid access level', 
        message: `Access level must be one of: ${validLevels.join(', ')}` 
      });
    }
    
    console.log(`📚 Fetching modules for access level: ${accessLevel}`);
    const modules = await getModulesByAccessLevel(accessLevel as any);
    
    console.log(`✅ Returning ${modules.length} module(s) for ${accessLevel} tier`);
    res.json(modules);
  } catch (error: any) {
    console.error('❌ Error fetching modules by access level:', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      error: 'Failed to fetch modules',
      message: error.message || 'Unknown error occurred'
    });
  }
});

/**
 * Publish module
 * POST /api/tutor-admin/modules/:moduleId/publish
 */
router.post('/tutor-admin/modules/:moduleId/publish', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { contentId } = req.body;
    
    const success = await publishModule(moduleId);
    
    if (success) {
      // Update the content's published status
      if (contentId) {
        const db = getFirestore();
        if (db) {
          await db.collection('tutorContent').doc(contentId).update({
            published: true,
            publishedAt: admin.firestore.Timestamp.now(),
          });
        }
      }
      
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
 * Soft delete uploaded content (move to trash)
 * DELETE /api/tutor-admin/content/:contentId
 */
router.delete('/tutor-admin/content/:contentId', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    // Get the content to verify it exists
    const content = await getUploadedContentById(contentId);
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    // Soft delete the content (move to trash)
    const success = await deleteUploadedContent(contentId);
    
    if (success) {
      res.json({ success: true, message: 'Content moved to trash successfully' });
    } else {
      res.status(500).json({ error: 'Failed to move content to trash' });
    }
  } catch (error) {
    console.error('❌ Error soft deleting content:', error);
    res.status(500).json({ error: 'Failed to move content to trash' });
  }
});

/**
 * Restore content from trash
 * POST /api/tutor-admin/content/:contentId/restore
 */
router.post('/tutor-admin/content/:contentId/restore', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    // Get the content to verify it exists
    const content = await getUploadedContentById(contentId);
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    // Restore the content from trash
    const success = await restoreUploadedContent(contentId);
    
    if (success) {
      res.json({ success: true, message: 'Content restored successfully' });
    } else {
      res.status(500).json({ error: 'Failed to restore content' });
    }
  } catch (error) {
    console.error('❌ Error restoring content:', error);
    res.status(500).json({ error: 'Failed to restore content' });
  }
});

/**
 * Permanently delete content from trash
 * DELETE /api/tutor-admin/content/:contentId/permanent
 */
router.delete('/tutor-admin/content/:contentId/permanent', async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    
    // Get the content to find the associated module ID
    const content = await getUploadedContentById(contentId);
    if (!content) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    // Delete the associated module if it exists
    if (content.generatedModuleId) {
      const moduleDeleted = await deleteModule(content.generatedModuleId);
      if (!moduleDeleted) {
        console.warn(`⚠️ Failed to delete module ${content.generatedModuleId}, continuing with content deletion`);
      }
    }

    // Permanently delete the content
    const success = await permanentlyDeleteUploadedContent(contentId);
    
    if (success) {
      res.json({ success: true, message: 'Content permanently deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to permanently delete content' });
    }
  } catch (error) {
    console.error('❌ Error permanently deleting content:', error);
    res.status(500).json({ error: 'Failed to permanently delete content' });
  }
});

/**
 * Get deleted content (trash bin) for a tutor
 * GET /api/tutor-admin/content/trash/:tutorId
 */
router.get('/tutor-admin/content/trash/:tutorId', async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    
    const deletedContent = await getDeletedContentByTutor(tutorId);
    
    res.json({ success: true, content: deletedContent });
  } catch (error) {
    console.error('❌ Error fetching deleted content:', error);
    res.status(500).json({ error: 'Failed to fetch deleted content' });
  }
});

/**
 * Update uploaded content and regenerate module
 * PUT /api/tutor-admin/content/:contentId
 */
router.put('/tutor-admin/content/:contentId', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const { title, description, category, accessLevels, tutorId, tutorName } = req.body;
    
    // Get existing content
    const existingContent = await getUploadedContentById(contentId);
    if (!existingContent) {
      res.status(404).json({ error: 'Content not found' });
      return;
    }

    // Update content metadata
    const updates: any = {};
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (accessLevels) {
      try {
        updates.accessLevels = JSON.parse(accessLevels);
      } catch {
        updates.accessLevels = accessLevels;
      }
    }

    const contentUpdated = await updateUploadedContent(contentId, updates);
    if (!contentUpdated) {
      res.status(500).json({ error: 'Failed to update content metadata' });
      return;
    }

    // If a new file was uploaded, regenerate the module
    const file = req.file;
    let moduleUpdated = false;

    if (existingContent.generatedModuleId) {
      const parsedAccessLevels = updates.accessLevels || existingContent.accessLevels;
      
      // If a new file was uploaded, regenerate the module with new content
      if (file) {
        const filePath = file.path;
        
        // Update the module with new content
        const updatedModule = await updateModule(
          existingContent.generatedModuleId,
          filePath,
          title || existingContent.title,
          description || existingContent.description,
          category || existingContent.category,
          parsedAccessLevels,
          tutorId || existingContent.tutorId,
          tutorName || existingContent.tutorName,
          contentId
        );

        if (updatedModule) {
          moduleUpdated = true;
          // Update content status to processing temporarily, then back to ready
          await updateContentStatus(contentId, 'processing');
          await updateContentStatus(contentId, 'ready', existingContent.generatedModuleId);
        }
        } else {
          // No new file, just update module metadata if it exists
          // Use getFirestore() for safe access
          const db = getFirestore();
          if (!db) {
            return res.status(500).json({ error: 'Database not available', message: 'Firebase Admin not initialized' });
          }
          try {
            await db.collection('generatedModules').doc(existingContent.generatedModuleId).update({
              title: title || existingContent.title,
              description: description || existingContent.description,
              category: category || existingContent.category,
              accessLevels: parsedAccessLevels,
              updatedAt: admin.firestore.Timestamp.now(),
            });
            moduleUpdated = true;
          } catch (error) {
            console.error('❌ Error updating module metadata:', error);
          }
        }
    }

    res.json({ 
      success: true, 
      message: moduleUpdated 
        ? 'Content and module updated successfully' 
        : 'Content metadata updated successfully',
      moduleUpdated
    });
  } catch (error) {
    console.error('❌ Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
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
    console.log('📝 Fetching pending quiz requests...');
    const requests = await getPendingQuizRequests();
    console.log(`✅ Found ${requests.length} pending quiz request(s)`);
    res.json(requests);
  } catch (error) {
    console.error('❌ Error fetching quiz requests:', error);
    // Return empty array instead of error object to prevent frontend crash
    res.json([]);
  }
});

/**
 * Get tutor messages
 * GET /api/tutor-admin/messages/:tutorId?
 */
router.get('/tutor-admin/messages/:tutorId?', async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    console.log('💬 Fetching messages for tutor:', tutorId || 'all');
    const messages = await getTutorMessages(tutorId);
    console.log(`✅ Found ${messages.length} message(s)`);
    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    // Return empty array instead of error object to prevent frontend crash
    res.json([]);
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

/**
 * Get modules by tutor ID
 * GET /api/tutor-admin/modules/tutor/:tutorId
 */
router.get('/tutor-admin/modules/tutor/:tutorId', async (req: Request, res: Response) => {
  try {
    const { tutorId } = req.params;
    console.log('📚 Fetching modules for tutor:', tutorId);
    const modules = await getModulesByTutorId(tutorId);
    console.log(`✅ Found ${modules.length} module(s)`);
    res.json(modules);
  } catch (error) {
    console.error('❌ Error fetching modules for tutor:', error);
    res.status(500).json({ error: 'Failed to fetch modules' });
  }
});

/**
 * Update lesson access levels
 * PUT /api/tutor-admin/modules/:moduleId/lessons/:lessonId/access
 */
router.put('/tutor-admin/modules/:moduleId/lessons/:lessonId/access', async (req: Request, res: Response) => {
  try {
    const { moduleId, lessonId } = req.params;
    const { accessLevels } = req.body;
    
    if (!accessLevels || !Array.isArray(accessLevels)) {
      res.status(400).json({ error: 'Invalid access levels' });
      return;
    }
    
    const success = await updateLessonAccessLevels(moduleId, lessonId, accessLevels);
    
    if (success) {
      res.json({ success: true, message: 'Lesson access levels updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update lesson access levels' });
    }
  } catch (error) {
    console.error('❌ Error updating lesson access levels:', error);
    res.status(500).json({ error: 'Failed to update lesson access levels' });
  }
});

/**
 * Update quiz access levels
 * PUT /api/tutor-admin/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/access
 */
router.put('/tutor-admin/modules/:moduleId/lessons/:lessonId/quizzes/:quizId/access', async (req: Request, res: Response) => {
  try {
    const { moduleId, lessonId, quizId } = req.params;
    const { accessLevels } = req.body;
    
    if (!accessLevels || !Array.isArray(accessLevels)) {
      res.status(400).json({ error: 'Invalid access levels' });
      return;
    }
    
    const success = await updateQuizAccessLevels(moduleId, lessonId, quizId, accessLevels);
    
    if (success) {
      res.json({ success: true, message: 'Quiz access levels updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update quiz access levels' });
    }
  } catch (error) {
    console.error('❌ Error updating quiz access levels:', error);
    res.status(500).json({ error: 'Failed to update quiz access levels' });
  }
});

/**
 * Bulk update module access levels
 * PUT /api/tutor-admin/modules/:moduleId/access/bulk
 */
router.put('/tutor-admin/modules/:moduleId/access/bulk', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const { moduleAccessLevels, lessonUpdates, quizUpdates } = req.body;
    
    const success = await bulkUpdateModuleAccessLevels(moduleId, {
      moduleAccessLevels,
      lessonUpdates,
      quizUpdates
    });
    
    if (success) {
      res.json({ success: true, message: 'Module access levels updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update module access levels' });
    }
  } catch (error) {
    console.error('❌ Error bulk updating access levels:', error);
    res.status(500).json({ error: 'Failed to bulk update access levels' });
  }
});

/**
 * Cleanup: Delete modules not created by tutor admins
 * POST /api/tutor-admin/cleanup-modules
 * Body: { dryRun?: boolean }
 * WARNING: This permanently deletes modules unless dryRun=true!
 */
router.post('/tutor-admin/cleanup-modules', async (req: Request, res: Response) => {
  try {
    const { dryRun = false } = req.body;
    console.log(`🧹 Cleanup request received (dryRun: ${dryRun})`);
    
    const result = await deleteNonTutorModules(dryRun);
    
    res.json({
      success: true,
      message: dryRun 
        ? `Preview: ${result.modulesToDelete.length} module(s) would be deleted, ${result.modulesToKeep.length} would be kept.`
        : `Cleanup complete. Deleted ${result.deleted} module(s), kept ${result.modulesToKeep.length}.`,
      result: {
        dryRun,
        deleted: result.deleted,
        total: result.total,
        kept: result.modulesToKeep.length,
        tutorAdminIds: result.tutorAdminIds,
        modulesToDelete: result.modulesToDelete,
        modulesToKeep: result.modulesToKeep,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    res.status(500).json({
      error: 'Cleanup failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Upload course profile image
 * POST /api/tutor-admin/modules/:moduleId/image
 */
router.post('/tutor-admin/modules/:moduleId/image', imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    // Read the image file and convert to base64 data URL
    const imageBuffer = fs.readFileSync(file.path);
    const imageBase64 = imageBuffer.toString('base64');
    const imageDataUrl = `data:${file.mimetype};base64,${imageBase64}`;

    // Delete temporary file
    fs.unlinkSync(file.path);

    // Update module with image URL
    const success = await updateModuleImageUrl(moduleId, imageDataUrl);

    if (success) {
      res.json({ success: true, imageUrl: imageDataUrl });
    } else {
      res.status(500).json({ error: 'Failed to update module image' });
    }
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    res.status(500).json({
      error: 'Failed to upload image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * Delete course profile image
 * DELETE /api/tutor-admin/modules/:moduleId/image
 */
router.delete('/tutor-admin/modules/:moduleId/image', async (req: Request, res: Response) => {
  try {
    const { moduleId } = req.params;

    const success = await updateModuleImageUrl(moduleId, null);

    if (success) {
      res.json({ success: true, message: 'Image deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete module image' });
    }
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    res.status(500).json({
      error: 'Failed to delete image',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

