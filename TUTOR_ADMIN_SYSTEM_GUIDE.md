# Tutor Admin System - Complete Guide

## 🎓 Overview

The Tutor Admin System allows designated tutors to upload educational documents which are automatically transformed into engaging, Duolingo-style learning content using AI. This creates an interactive learning experience with quizzes, XP rewards, and gamification.

## 🚀 Key Features

### For Tutor Admins:
1. **Document Upload**: Upload PDF, DOCX, DOC, or TXT files (up to 100MB)
2. **Access Level Control**: Choose which subscription tiers can access the content (Free, Basic, Standard, Premium)
3. **AI Content Generation**: Automatically generates structured lessons with quizzes
4. **Content Management**: Review, edit, and publish generated content
5. **Student Communication**: Receive and respond to questions from learners
6. **Quiz Request Management**: Handle requests for additional practice quizzes

### For Learners:
1. **Duolingo-Style Learning**: Interactive lessons with progress tracking
2. **Quiz System**: Practice quizzes with instant feedback and explanations
3. **Request More Quizzes**: Ask for additional practice questions on specific topics
4. **Ask Questions**: Send messages directly to tutors for help
5. **XP & Leveling**: Earn experience points and level up
6. **Streaks & Achievements**: Daily streak tracking and achievement system

## 📋 Setup Instructions

### 1. Create Tutor Admin Accounts

You need to manually add tutor admin emails to the Firestore database:

```javascript
// In Firebase Console > Firestore Database
// Collection: tutorAdmins
// Add a document with:
{
  email: "tutor@example.com",
  name: "John Doe",
  active: true,
  specializations: ["Constitutional Law", "International Law"],
  bio: "Expert tutor with 10 years of experience",
  createdAt: [current timestamp],
  updatedAt: [current timestamp]
}
```

Or use the backend API endpoint:

```bash
curl -X POST https://your-api.com/api/tutor-admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tutor@example.com",
    "name": "John Doe",
    "picture": "https://example.com/photo.jpg",
    "specializations": ["Constitutional Law"],
    "bio": "Expert legal tutor"
  }'
```

### 2. Access Tutor Admin Portal

Once a tutor admin account is created:

1. Sign in with Google OAuth at the main login
2. Navigate to: `https://your-domain.com/tutor-admin`
3. The system will verify tutor admin status and grant access

## 🎯 How to Use (Tutor Admin)

### Uploading Content

1. **Go to "Upload Content" Tab**
   
2. **Fill in the Form:**
   - **Document File**: Choose your PDF/DOCX/DOC/TXT file (max 100MB)
   - **Module Title**: Give your content a clear, descriptive title
   - **Description**: Brief summary of what learners will learn
   - **Category**: Select appropriate category (Constitutional Law, Criminal Law, etc.)
   - **Access Levels**: Select one or more tiers that can access this content
     - ✅ **Free**: Available to all users
     - 💰 **Basic**: Requires Basic subscription ($5/month)
     - 🌟 **Standard**: Requires Standard subscription ($10/month)
     - 👑 **Premium**: Requires Premium subscription ($20/month)

3. **Click "Upload & Generate Learning Content"**
   - The document will upload immediately
   - AI will process the document (1-3 minutes)
   - You'll receive a notification when it's ready

### AI Content Generation Process

When you upload a document, the AI:

1. **Extracts** all text from the document
2. **Analyzes** the content and structure
3. **Creates** 5-8 bite-sized lessons (5-10 minutes each)
4. **Generates** 3-5 quiz questions per lesson with:
   - Multiple choice questions
   - Correct answers with explanations
   - Difficulty ratings
   - Point values
5. **Adds** learning enhancements:
   - Key terms and definitions
   - Real-world examples
   - Learning tips
   - Progress tracking

### Managing Content

In the **"My Content" tab**, you can:

- ✅ **View Upload Status**: See if content is Processing, Ready, or Failed
- 👁️ **Preview Modules**: Review AI-generated content before publishing
- 🚀 **Publish Content**: Make modules available to learners
- 📊 **Track Statistics**: See engagement and completion rates

### Handling Learner Messages

In the **"Messages" tab**:

- View all questions from learners
- Mark messages as read
- Reply to learner questions
- See message context (which lesson/module)

### Processing Quiz Requests

In the **"Quiz Requests" tab**:

- See all requests for additional quizzes
- View requested difficulty level and quantity
- Generate additional quizzes using AI
- Approve and publish new quizzes

## 📱 How to Use (Learners)

### Accessing Learning Content

1. **Sign in** to your account
2. **Click** the "Learning Paths" button (graduation cap icon)
3. **Choose** a module based on your subscription tier
4. **Start** any unlocked lesson

### Taking Lessons

1. **Read/Listen** to the lesson content
   - Standard users get audio on ~30% of lessons
   - Premium users get audio on ALL lessons
2. **Click "Take Quiz"** when ready
3. **Answer questions** and get instant feedback
4. **Score 70% or higher** to complete the lesson
5. **Earn XP** and level up!

### Requesting More Quizzes

While in a lesson:

1. Click **"Request More Quizzes"** button
2. Choose:
   - Number of quizzes (1-20)
   - Difficulty level (Easy/Medium/Hard)
   - Add notes about specific topics
3. Submit request
4. Tutors will generate and add them soon

### Asking Questions

While in a lesson:

1. Click **"Ask a Question"** button
2. Enter:
   - Subject line
   - Your detailed question
3. Submit message
4. Tutors will respond soon

## 🎨 Learning Interface Features

### Duolingo-Style Elements:

- ✨ **Visual Progress Bars**: See your advancement in real-time
- 🏆 **XP System**: Earn 10-50 XP per lesson (based on tier)
- 🔥 **Daily Streaks**: Maintain daily activity for bonus rewards
- 📊 **Leaderboards**: Compete with other learners
- 🎯 **Achievements**: Unlock badges and milestones
- 📈 **Level System**: Level up every 120 XP
- 💯 **Score Requirements**: Must score 70%+ to pass

### Access Level Features:

| Feature | Free | Basic | Standard | Premium |
|---------|------|-------|----------|---------|
| Daily Lessons | 2/day | Unlimited | Unlimited | Unlimited |
| Audio Lessons | ❌ | ❌ | 30% | 100% |
| Quiz Retakes | ✅ | ✅ | ✅ | ✅ |
| Quiz Requests | ✅ | ✅ | ✅ | ✅ |
| Ask Questions | ✅ | ✅ | ✅ | ✅ |
| Content Access | Free tier only | Basic + Free | Standard + Basic + Free | All content |

## 🔧 Technical Implementation

### Backend API Endpoints

#### Tutor Admin Endpoints:
- `GET /api/tutor-admin/check/:email` - Check if user is tutor admin
- `POST /api/tutor-admin/create` - Create new tutor admin
- `POST /api/tutor-admin/upload` - Upload document for AI processing
- `GET /api/tutor-admin/content/:tutorId` - Get tutor's uploaded content
- `GET /api/tutor-admin/modules` - Get all generated modules
- `POST /api/tutor-admin/modules/:id/publish` - Publish module
- `GET /api/tutor-admin/messages/:tutorId` - Get tutor messages
- `GET /api/tutor-admin/quiz-requests` - Get pending quiz requests

#### Learner Endpoints:
- `GET /api/learning/progress/:userId` - Get user learning progress
- `POST /api/learning/progress` - Save learning progress
- `POST /api/learning/quiz-request` - Request additional quizzes
- `POST /api/learning/message-tutor` - Send message to tutor

### Database Collections (Firestore):

1. **tutorAdmins** - Tutor admin accounts
2. **tutorContent** - Uploaded content metadata
3. **generatedModules** - AI-generated learning modules
4. **quizRequests** - Learner quiz requests
5. **tutorMessages** - Messages between learners and tutors
6. **learningProgress** - User progress tracking

### Frontend Components:

- `TutorAdminContext.tsx` - Tutor admin authentication
- `TutorAdminPortal.tsx` - Main tutor admin dashboard
- `QuizRequestDialog.tsx` - Quiz request form for learners
- `MessageTutorDialog.tsx` - Message form for learners
- `LearningHub.tsx` - Main learning interface (enhanced)
- `LessonRunner.tsx` - Lesson and quiz runner (enhanced)

## 🎯 Best Practices

### For Tutors:

1. **Clear Titles**: Use descriptive titles that tell learners exactly what they'll learn
2. **Good Descriptions**: Write 2-3 sentences about the content
3. **Appropriate Access Levels**: Consider content complexity when setting tiers
4. **Review AI Content**: Always preview before publishing
5. **Respond Promptly**: Answer learner questions within 24-48 hours
6. **Monitor Requests**: Check quiz requests regularly

### For Content Creation:

1. **Document Quality**: Use well-structured documents with clear sections
2. **Length**: Ideal length is 5-20 pages per module
3. **Formatting**: Use headings, bullet points, and clear paragraphs
4. **Examples**: Include real-world examples in your documents
5. **Definitions**: Define key terms clearly

## 🔄 Content Update Workflow

1. **Upload** → Document uploaded by tutor
2. **Processing** → AI analyzes and generates content (1-3 minutes)
3. **Ready** → Content ready for review
4. **Preview** → Tutor reviews generated lessons and quizzes
5. **Publish** → Content made available to learners
6. **Feedback** → Learners ask questions and request quizzes
7. **Iterate** → Tutor responds and improves content

## 🆘 Troubleshooting

### Content Generation Failed:
- **Check document format**: Must be PDF, DOCX, DOC, or TXT
- **Check file size**: Must be under 100MB
- **Check content**: Document must have sufficient text content
- **Check OpenAI**: Ensure OpenAI API key is valid and has credits

### Can't Access Tutor Portal:
- **Check email**: Must be registered as tutor admin in Firestore
- **Check sign-in**: Must be signed in with Google OAuth
- **Check active status**: Account must have `active: true`

### Learners Can't See Content:
- **Check published status**: Module must be published
- **Check access levels**: Module must include user's tier
- **Check subscription**: User must have valid subscription

## 🚀 Next Steps

### Recommended Improvements:

1. **Icon Library Integration**: Add Unsplash or similar for modern icons/images
2. **Content Templates**: Create templates for different content types
3. **Bulk Upload**: Allow multiple document uploads at once
4. **Analytics Dashboard**: Detailed engagement and completion metrics
5. **Quiz Analytics**: Track which questions are hardest
6. **Automated Responses**: AI-assisted replies to common questions
7. **Content Versioning**: Track and manage content updates
8. **Collaborative Editing**: Multiple tutors working on same content

### Modern Icon/Image Sources (Legal & Free):

- **Unsplash** (https://unsplash.com/developers) - Free high-quality images
- **Pexels** (https://www.pexels.com/api/) - Free stock photos
- **Font Awesome** (Already integrated) - Icon library
- **Lucide Icons** (Already integrated) - Modern icon set
- **Heroicons** (https://heroicons.com/) - MIT licensed icons

## 📊 Success Metrics

Track these metrics to measure success:

- Number of modules created
- Learner completion rates
- Average quiz scores
- Question response time
- Quiz request fulfillment time
- User satisfaction ratings
- Subscription upgrades (content-driven)

## 🎓 Training Resources

For new tutor admins:

1. Review this guide thoroughly
2. Upload a test document first
3. Preview and understand AI generation
4. Practice responding to sample questions
5. Review learner feedback regularly

---

## 📞 Support

For technical issues or questions:
- Check backend logs for errors
- Verify Firebase/Firestore permissions
- Ensure OpenAI API key is configured
- Test with sample documents first

**Congratulations! You now have a complete Duolingo-style learning platform powered by AI! 🎉**

