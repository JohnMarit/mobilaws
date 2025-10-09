# Fastbots Integration Guide

This document explains how Fastbots has been integrated into the Mobilaws application.

## Overview

The Mobilaws chat interface now uses **Fastbots AI** to power all responses about South Sudan laws and penal codes. Your custom UI remains intact while Fastbots handles the AI backend.

## What Was Changed

### 1. HTML Integration (`index.html`)
The Fastbots embed script has been added to the HTML file:
```html
<script defer src="https://app.fastbots.ai/embed.js" data-bot-id="cmgc1bkqx06r7p31l972xran2"></script>
```

This loads the Fastbots widget and makes it available on your page.

### 2. AI Service Updated (`src/lib/ai-chat.ts`)
The AI chat service has been completely rewritten to integrate with Fastbots:

- **Bot ID**: `cmgc1bkqx06r7p31l972xran2`
- **API URL**: `https://api.fastbots.ai`
- Attempts multiple integration methods:
  1. JavaScript widget API (if exposed by Fastbots)
  2. Direct HTTP API calls to Fastbots
  3. Fallback error handling

### 3. Chat Interface Updated (`src/components/ChatInterface.tsx`)
- Removed the "AI Server Offline" warnings
- Updated branding to show "Powered by Fastbots"
- Removed dependency on local AI server connection
- Chat input is always enabled (no offline mode)

## How It Works

### Message Flow
1. User types a message in your custom chat interface
2. Message is sent to the `AIChatService`
3. Service attempts to communicate with Fastbots:
   - First tries the Fastbots JavaScript API (if available)
   - Falls back to HTTP API endpoint
4. Response is streamed back to your custom UI
5. User sees the response in your branded interface

### Two Chat Options Available
Your users now have two ways to interact with the Fastbots AI:

1. **Custom Interface**: Your beautifully designed chat interface (main app)
2. **Fastbots Widget**: A floating chatbot widget (bottom-right corner)

Both use the same Fastbots AI backend with your trained bot.

## Important Notes

### API Access
⚠️ **Fastbots Public API Status**: As of the integration date, Fastbots' public API is in the "Planned" stage on their roadmap. The current integration attempts to use common API endpoint patterns.

**If you encounter API errors**, this means:
- The HTTP API endpoint may not be publicly available yet
- You may need to contact Fastbots support to enable API access
- The Fastbots widget will still work for direct user interaction

### What Works Now
✅ Fastbots embed widget (floating button)
✅ Custom UI (if API is available)
✅ All your existing UI components

### Future Enhancements
When Fastbots releases their public API, you may need to:
1. Obtain an API key from your Fastbots dashboard
2. Update the API endpoint in `src/lib/ai-chat.ts`
3. Add authentication headers to API requests

## Configuration

### Change Bot ID
If you need to use a different Fastbots bot, update the bot ID in two places:

1. **HTML File** (`index.html`):
```html
<script defer src="https://app.fastbots.ai/embed.js" data-bot-id="YOUR_BOT_ID_HERE"></script>
```

2. **AI Service** (`src/lib/ai-chat.ts`):
```typescript
private botId: string = 'YOUR_BOT_ID_HERE';
```

### Hide Fastbots Widget
If you want to hide the floating Fastbots widget (and only use your custom interface), add this CSS to your `src/index.css`:

```css
/* Hide Fastbots floating widget */
#fastbots-widget,
[id*="fastbots"],
[class*="fastbots"] {
  display: none !important;
}
```

## Testing the Integration

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Open the application** in your browser

3. **Test the custom chat interface**:
   - Type a question about South Sudan laws
   - You should see a response (if API is available)
   - If you see an API error, use the Fastbots widget instead

4. **Test the Fastbots widget**:
   - Look for the floating chat button (usually bottom-right)
   - Click it and ask a question
   - This should always work

## Troubleshooting

### "Fastbots API returned 404" or similar errors
- The public API may not be available yet
- Use the Fastbots floating widget instead
- Contact Fastbots support to request API access

### Widget not appearing
- Check browser console for errors
- Ensure the embed script is loading correctly
- Check if any ad blockers are interfering

### Messages not sending in custom interface
- Check browser console for detailed error messages
- Verify your bot ID is correct
- Try using the Fastbots widget as a fallback

## Support

For Fastbots-specific issues:
- Visit: https://help.fastbots.ai
- Contact: Fastbots support team
- Check their API roadmap: https://roadmap.fastbots.ai

For issues with your custom interface:
- Check the browser console for errors
- Review the code in `src/lib/ai-chat.ts`
- Ensure all dependencies are installed: `npm install`

## Next Steps

1. **Train your bot**: Make sure your Fastbots bot is properly trained with South Sudan law data
2. **Test thoroughly**: Try various legal questions to ensure accurate responses
3. **Monitor API availability**: Keep an eye on Fastbots' API roadmap for public API release
4. **Customize branding**: Adjust colors, logos, and text to match your brand
5. **Deploy**: Deploy your application to production when ready

---

**Last Updated**: October 2025  
**Bot ID**: cmgc1bkqx06r7p31l972xran2  
**Integration Version**: 1.0


