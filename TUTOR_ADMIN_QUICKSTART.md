# 🚀 Tutor Admin System - Quick Start

## Prerequisites

Before starting, ensure you have:
- ✅ Firebase project set up with Firestore enabled
- ✅ OpenAI API key with credits
- ✅ Backend deployed and running
- ✅ Frontend deployed

## Step 1: Install Dependencies

### Backend (ai-backend)
```bash
cd ai-backend
npm install
# All dependencies including pdf-parse and mammoth are already in package.json
```

### Frontend (root)
```bash
npm install
# All necessary packages are already configured
```

## Step 2: Create Your First Tutor Admin

### Option A: Using Firebase Console (Recommended for first tutor)

1. Go to Firebase Console → Firestore Database
2. Create a new collection called `tutorAdmins`
3. Add a document with these fields:

```javascript
{
  email: "yourtutor@example.com",  // Must match Google sign-in email
  name: "Your Name",
  picture: "https://your-photo-url.jpg",  // Optional
  active: true,
  specializations: ["Constitutional Law", "Criminal Law"],  // Optional
  bio: "Expert legal tutor with 10 years of experience",  // Optional
  createdAt: Firestore Timestamp (now),
  updatedAt: Firestore Timestamp (now)
}
```

### Option B: Using API (For subsequent tutors)

```bash
curl -X POST https://your-backend.vercel.app/api/tutor-admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tutor@example.com",
    "name": "Tutor Name",
    "picture": "https://photo.jpg",
    "specializations": ["Law Topic"],
    "bio": "Bio text"
  }'
```

## Step 3: Access Tutor Portal

1. **Sign In**: Go to your app and sign in with Google using the tutor email
2. **Navigate**: Go to `https://your-domain.com/tutor-admin`
3. **Verify**: System will check if you're a tutor admin and grant access

## Step 4: Upload Your First Document

1. **Prepare Document**:
   - Format: PDF, DOCX, DOC, or TXT
   - Size: Under 100MB
   - Content: Well-structured with clear sections
   - Example: "Introduction to Constitutional Law.pdf"

2. **Fill Upload Form**:
   ```
   Title: "Introduction to Constitutional Law"
   Description: "Learn the fundamentals of constitutional law including rights, powers, and government structure"
   Category: "Constitutional Law"
   Access Levels: [✓] Free [✓] Basic [ ] Standard [ ] Premium
   ```

3. **Upload**: Click "Upload & Generate Learning Content"

4. **Wait**: AI processing takes 1-3 minutes
   - Status will show "Processing"
   - You'll see "Ready" when complete

5. **Review & Publish**:
   - Click "Preview" to review AI-generated content
   - Click "Publish" to make it available to learners

## Step 5: Test as a Learner

1. **Sign Out** from tutor admin account
2. **Sign In** as a regular user
3. **Click** the "Learning Paths" button (🎓 icon)
4. **Find** your published module
5. **Start** a lesson and test:
   - Reading content
   - Taking quizzes
   - Requesting more quizzes
   - Asking questions

## Step 6: Monitor & Respond

Return to tutor portal and check:

### Messages Tab
- View questions from learners
- Mark as read
- Reply to questions

### Quiz Requests Tab
- See requests for additional quizzes
- Generate new quizzes using AI

### My Content Tab
- Monitor all your uploaded content
- Check processing status
- Publish new modules

## 🎯 Sample Workflow

### Day 1: Setup
```
1. Create tutor admin account ✓
2. Sign in and access portal ✓
3. Upload first test document ✓
4. Preview AI-generated content ✓
5. Publish module ✓
```

### Day 2: Test
```
1. Test as learner ✓
2. Complete a lesson ✓
3. Request quizzes ✓
4. Send test question ✓
```

### Day 3: Production
```
1. Upload real educational content ✓
2. Set appropriate access levels ✓
3. Monitor learner engagement ✓
4. Respond to questions ✓
```

## 📝 Example Documents to Start With

### Good Starting Documents:
- Legal textbook chapters (5-15 pages)
- Course syllabi with detailed content
- Legal guides and primers
- Case law summaries
- Statutory analysis documents

### Document Structure (Best Practices):
```
Title: Clear, Descriptive Title

Introduction
- What learners will learn
- Why it's important

Section 1: First Major Topic
- Key concepts
- Definitions
- Examples

Section 2: Second Major Topic
- More concepts
- Real-world applications

Section 3: Advanced Topics
- Complex scenarios
- Critical analysis

Conclusion
- Summary
- Key takeaways
```

## 🔧 Troubleshooting

### "Access Denied" when visiting /tutor-admin
**Solution**: 
- Check that your email is in the `tutorAdmins` collection
- Verify `active: true` in your document
- Make sure you're signed in with Google

### Content Stuck on "Processing"
**Solution**:
- Check backend logs for errors
- Verify OpenAI API key has credits
- Try uploading a smaller test document
- Check document format is valid PDF/DOCX/TXT

### AI Generation Failed
**Solution**:
- Document might be too large (over 100MB)
- Document might have no extractable text (scanned images)
- OpenAI API might be rate-limited
- Check backend error logs

### Learners Can't See Content
**Solution**:
- Make sure module is Published (not just "Ready")
- Verify access levels include user's subscription tier
- Check user has valid subscription

## 🎨 Customization

### Change Access Level Colors
Edit `src/pages/TutorAdminPortal.tsx`:
```typescript
// Find the Badge components and customize colors
<Badge variant="outline" className="text-xs capitalize bg-green-100">
  free
</Badge>
```

### Adjust AI Prompts
Edit `ai-backend/src/lib/ai-content-generator.ts`:
```typescript
const systemPrompt = `You are an expert educational content creator...
// Customize the prompt to fit your teaching style
`;
```

### Change XP Rewards
Edit `ai-backend/src/lib/ai-content-generator.ts`:
```typescript
const xpByTier = {
  basic: 10,    // Customize these values
  standard: 20,
  premium: 50
};
```

## 📊 Next Steps

Once your system is running:

1. **Create Sample Content**:
   - Upload 3-5 sample modules
   - Cover different topics
   - Test different access levels

2. **Invite Beta Testers**:
   - Add a few learners
   - Get feedback
   - Iterate on content

3. **Monitor Metrics**:
   - Track completion rates
   - Monitor quiz scores
   - Review questions asked

4. **Scale Up**:
   - Add more tutor admins
   - Upload more content
   - Promote to larger audience

## 🎓 Training Your Team

For additional tutor admins:

1. **Share** the TUTOR_ADMIN_SYSTEM_GUIDE.md
2. **Create** their tutor admin account
3. **Walk through** first upload together
4. **Review** AI-generated content quality
5. **Establish** response time expectations for messages

## 🔐 Security Best Practices

1. **Tutor Admin Access**:
   - Only give tutor admin rights to trusted educators
   - Regularly audit the `tutorAdmins` collection
   - Set `active: false` to revoke access

2. **Content Review**:
   - Always preview AI-generated content before publishing
   - Ensure content accuracy
   - Verify quiz questions are correct

3. **Learner Data**:
   - Monitor messages for inappropriate content
   - Respond professionally to all inquiries
   - Maintain learner privacy

## ✅ Checklist

Before going live, verify:

- [ ] Tutor admin account created and tested
- [ ] Backend deployed and API accessible
- [ ] OpenAI API key configured with credits
- [ ] Firebase/Firestore permissions set correctly
- [ ] Test document uploaded and processed successfully
- [ ] AI-generated content reviewed and looks good
- [ ] Module published and visible to learners
- [ ] Tested full learner workflow
- [ ] Message system tested
- [ ] Quiz request system tested
- [ ] Access levels working correctly
- [ ] XP and progress tracking working
- [ ] Mobile responsive design tested

## 🎉 You're Ready!

Your Duolingo-style learning platform is now ready to transform educational content into engaging, interactive lessons!

**Questions?** Check the full TUTOR_ADMIN_SYSTEM_GUIDE.md for detailed information.

---

**Happy Teaching! 📚✨**

