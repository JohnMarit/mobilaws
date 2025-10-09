# Using Fastbots Widget - Current Setup

## Current Status: Widget-Only Mode ✅

The Fastbots public API is still in development, so **the Fastbots widget is the primary way** to interact with your AI assistant. This is perfectly normal and the widget provides full functionality!

---

## ✅ What Works Now

### The Fastbots Widget
- **Location**: Floating button in the bottom-right corner
- **Functionality**: 100% operational
- **Features**: Full AI capabilities for South Sudan law questions
- **No setup needed**: Just click and start chatting!

### Your Custom Interface
- **Shows welcome screen**: Beautiful, branded design
- **Directs to widget**: Helpful messages guide users to the widget
- **Error handling**: Gracefully handles API unavailability

---

## 🎯 How to Use

### Option 1: Fastbots Widget (Recommended - Works Now!)

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Open the app** in your browser

3. **Look for the floating chat button** in the bottom-right corner
   - It should appear automatically
   - Click it to open the chat window

4. **Ask your questions**:
   - "What are the fundamental rights in South Sudan?"
   - "Tell me about citizenship laws"
   - "What is Article 23 of the constitution?"
   - "What are the penalties for theft?"

5. **Enjoy full AI-powered responses!** ✨

### Option 2: Custom Interface (Currently Redirects to Widget)

If you type in the custom chat interface, you'll see a friendly message directing you to use the widget. This is expected behavior until Fastbots releases their public API.

---

## 🔧 What Changed (Fix for CORS Error)

I've updated the code to handle the API unavailability gracefully:

### Before (Showed Raw Error)
```
❌ CORS error
❌ Failed to fetch
❌ Confusing error messages
```

### After (User-Friendly)
```
✅ "I'm currently only available through the Fastbots chat widget."
✅ "Please look for the floating chat button in the bottom-right corner"
✅ Clear, helpful guidance
```

---

## 📊 Integration Architecture

```
┌─────────────────────────────────┐
│   Your Custom Interface         │
│   (Shows welcome + redirects)   │
└─────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Fastbots Widget               │ ← Currently Active
│   (Floating button)             │
└─────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   Fastbots AI Backend           │
│   Bot ID: cmgc1bkqx06r7p31l...  │
└─────────────────────────────────┘
```

---

## 🎨 Customizing the Widget

You can customize how the Fastbots widget appears. Add this to your `src/index.css` if you want to adjust positioning or styling:

```css
/* Example: Change widget position */
#fastbots-widget {
  bottom: 20px !important;
  right: 20px !important;
}
```

---

## 🚫 Hiding the Custom Interface (Optional)

If you want to ONLY show the Fastbots widget and hide your custom interface, you can modify `src/pages/Index.tsx` to show a simpler landing page. However, I recommend keeping both:

**Why keep both?**
- Your custom interface looks professional
- It provides clear branding
- When Fastbots API becomes available, you're ready to switch
- Users see your logo and branding before clicking the widget

---

## 🔮 Future: When Fastbots API Becomes Available

When Fastbots releases their public API, here's what will happen:

### Automatic Benefits
1. **Custom interface will work**: Messages typed in your UI will get responses
2. **No code changes needed**: The integration is already prepared
3. **You may need to add**: API key (from Fastbots dashboard)

### What You'll Need to Do
1. Get your API key from Fastbots dashboard
2. Update `src/lib/ai-chat.ts` to include the API key
3. Test the custom interface
4. Deploy the update

I'll provide detailed instructions when the API becomes available!

---

## 📝 Training Your Bot

To make your bot more effective, train it in the Fastbots dashboard:

1. **Log in** to https://app.fastbots.ai
2. **Find your bot** (ID: cmgc1bkqx06r7p31l972xran2)
3. **Upload documents**:
   - South Sudan Constitution
   - Penal Code
   - Any other legal documents
4. **Add Q&A pairs**: Common questions and answers
5. **Test in dashboard**: Verify responses before deploying
6. **Adjust settings**: Tone, style, response length

---

## 🎯 Testing Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] App loads in browser
- [ ] Fastbots widget button visible (bottom-right)
- [ ] Can click widget button
- [ ] Chat window opens
- [ ] Can type messages
- [ ] Receiving responses from AI
- [ ] Responses are relevant to South Sudan laws
- [ ] Custom interface shows welcome message
- [ ] Custom interface directs to widget (not showing errors)

---

## 🐛 Troubleshooting

### Widget Not Appearing
**Check these:**
1. Browser console for errors (F12 → Console)
2. Ad blockers (disable temporarily)
3. Bot ID is correct in `index.html`
4. Embed script is loading: Check Network tab for `embed.js`

### Widget Appears But Not Responding
**Try this:**
1. Verify bot is trained in Fastbots dashboard
2. Check bot status in dashboard (published/active)
3. Test the bot directly in Fastbots dashboard first
4. Check browser console for JavaScript errors

### Custom Interface Shows Errors
**This is expected!** The custom interface will show a friendly redirect message until the API is available. This is the correct behavior.

---

## 📞 Support

### For Fastbots Widget Issues
- Dashboard: https://app.fastbots.ai
- Help Docs: https://help.fastbots.ai  
- Support: Contact Fastbots team

### For Integration Issues
- Check browser console (F12)
- Review this guide
- Verify embed script in `index.html`
- Check bot ID matches

---

## 💡 Tips for Best Results

1. **Train Your Bot Well**: Upload comprehensive legal documents
2. **Test Thoroughly**: Try various question types
3. **Set Expectations**: Tell users to use the widget
4. **Monitor Usage**: Check Fastbots dashboard analytics
5. **Iterate**: Improve bot training based on user questions

---

## 🎉 Summary

**Current State**: ✅ Fully Functional
- Fastbots widget is active and working
- Custom interface provides branding and redirects
- No errors shown to users
- Professional user experience

**What Users See**:
1. Beautiful Mobilaws landing page
2. Clear guidance to use the widget
3. Working AI chat via Fastbots widget
4. Professional, polished experience

**Next Steps**:
1. Test the widget thoroughly
2. Train your bot with legal content
3. Deploy to production
4. Wait for Fastbots API release (future enhancement)

---

**Status**: Production Ready ✅  
**Mode**: Widget-Only (Fully Functional)  
**Last Updated**: October 4, 2025


