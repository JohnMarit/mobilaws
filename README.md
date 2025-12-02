# Mobilaws - South Sudan Law Assistant

An AI-powered legal assistant for searching and understanding South Sudan laws, including the Constitution and Penal Code.

## 📱 Now Available as Android App!

Mobilaws is now available as a native Android application! You can package and publish this app to the Google Play Store.

**Quick Start:**
- See [ANDROID_QUICK_START.md](./ANDROID_QUICK_START.md) for development
- See [ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md](./ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md) for Play Store publishing

## Features

- 🤖 **AI-Powered Chat**: Natural language conversations about South Sudan laws (powered by Fastbots)
- 🔍 **Instant Search**: Full-text search with fuzzy matching using Fuse.js
- 📚 **Comprehensive Database**: Constitution of South Sudan + Penal Code
- 💬 **Conversational Interface**: Ask questions in plain language and get detailed legal answers
- 🔐 **Google Authentication**: Secure login with Google OAuth for daily token access
- 📊 **Token System**: 3 free prompts for anonymous users, 20 tokens per day for authenticated users
- 📱 **Mobile-First**: Responsive design that works on all devices + Native Android app
- 🔗 **Deep Linking**: Share direct links to specific articles with search terms
- ⚡ **Fast Performance**: Client-side search with <200ms response times
- 🎯 **Smart Context**: AI remembers conversation history for follow-up questions
- 📋 **Easy Sharing**: Copy article links, text, or print individual articles
- ♿ **Accessible**: ARIA labels, semantic HTML, keyboard navigation

## Tech Stack

- **Framework**: Vite + React + TypeScript
- **Mobile**: Capacitor (for Android native app)
- **AI Backend**: Fastbots AI
- **Styling**: Tailwind CSS with custom design system
- **Search**: Fuse.js for fuzzy full-text search
- **UI Components**: shadcn/ui components
- **Icons**: Lucide React
- **State Management**: React Context API

## Getting Started

### Web App

#### Prerequisites

- Node.js 18+ and npm
- Google Cloud Platform account (for OAuth setup)

#### Installation

```bash
# Clone the repository
git clone [your-repo-url]
cd Mobilaws

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your Google OAuth Client ID

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

#### Google OAuth Setup

1. Follow the [Google Auth Setup Guide](./GOOGLE_AUTH_SETUP.md) to configure OAuth
2. Add your Google Client ID to the `.env` file
3. Test the authentication flow

### Android App

#### Prerequisites

- All web app prerequisites above
- Java JDK 17+
- Android SDK (command-line tools) - **Android Studio NOT required!**

#### Quick Start (Command Line - Recommended)

```powershell
# Check your setup
.\setup-android-cli.ps1

# Build and install on device
.\build-android.ps1

# Or build for Play Store
.\build-aab.ps1
```

#### Alternative: Using Android Studio

```bash
# Build web assets
npm run build

# Sync to Android
npm run android:sync

# Open in Android Studio
npm run android:open

# Run on device/emulator
npm run android:run
```

**Full Android Documentation:**
- [Ready to Publish?](./READY_TO_PUBLISH.md) ⭐ - Check what you need before publishing
- [CLI Setup Guide](./ANDROID_CLI_SETUP.md) - Build without Android Studio
- [Quick Start Guide](./ANDROID_QUICK_START.md) - Get up and running in 5 minutes
- [Publish to Play Store](./PUBLISH_TO_PLAYSTORE.md) - Quick publishing guide
- [Play Store Deployment Guide](./ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md) - Complete publishing walkthrough
- [App Icons Guide](./ANDROID_APP_ICONS_GUIDE.md) - Customize your app icon

## Fastbots Integration

This application uses **Fastbots AI** to power the conversational interface. See [FASTBOTS_INTEGRATION.md](./FASTBOTS_INTEGRATION.md) for detailed integration documentation.

### Key Points
- Bot ID: `cmgc1bkqx06r7p31l972xran2`
- Custom UI with Fastbots backend
- Two chat options: Custom interface + Fastbots widget
- No local AI server required

### Building for Production

```bash
# Build the app
npm run build

# Preview the build
npm run preview
```

## Usage

### AI Chat Interface

The main interface is now an AI-powered chatbot that can:
- Answer questions about South Sudan laws in natural language
- Find relevant articles from the Constitution and Penal Code
- Provide explanations and interpretations
- Remember conversation context for follow-up questions

**Authentication & Usage:**
- **Anonymous Users**: Can make 3 free prompts before being required to login
- **Authenticated Users**: 20 tokens per day after signing in with Google (resets daily)
- **Visual Indicators**: See your prompt/token count and login status in the interface

**Example questions:**
- "What are the fundamental rights guaranteed by the constitution?"
- "Tell me about citizenship laws in South Sudan"
- "What is the penalty for theft?"
- "Explain Article 23"

### Search Functionality (Classic Mode)

- **Keyword Search**: Type any keyword (e.g., "freedom", "education", "rights")
- **Article Number**: Search by article number (e.g., "23", "Article 23", "Art 23")  
- **Quick Filters**: Use topic tags to filter results
- **Natural Language**: Ask questions conversationally and get AI-powered answers

### URL Parameters

- `?q=keyword` - Pre-fill search with keyword
- `#article-N` - Jump to and expand specific article

Example: `?q=freedom#article-23` opens the app with "freedom" searched and Article 23 expanded.

### Article Actions

When an article is expanded, you can:
- **Copy Link**: Get a shareable URL with search context
- **Copy Text**: Copy the full article text
- **Print**: Print the article with clean formatting

## Architecture

### AI Integration Flow
1. User types a message in the custom chat interface
2. Message is sent to Fastbots AI via the `AIChatService`
3. Fastbots processes the query using trained law data
4. Response is streamed back and displayed in the custom UI

### Data Structure

The law data is stored in `public/law.json` with this structure:

```json
[
  {
    "article": 1,
    "title": "Title of the Article",
    "chapter": "Chapter Name", 
    "text": "Full text of the article...",
    "tags": ["keyword1", "keyword2"]
  }
]
```

## Adding Official Constitution Data

**TODO**: Replace the demo data in `public/constitution.json` with the official Constitution text.

### Steps to add official data:

1. **Get the Source**: Obtain the official Constitution text (PDF, Word doc, etc.)

2. **Convert to JSON**: Transform the content into the required JSON structure:
   ```json
   [
     {
       "article": 1,
       "title": "Article title",
       "chapter": "Chapter I — Chapter Name",
       "text": "Full article text...",
       "tags": ["relevant", "keywords"]
     }
   ]
   ```

3. **Add Tags**: Include relevant keyword tags for better search results:
   - Common tags: "rights", "freedom", "citizenship", "justice", "government", "courts", "education", "assembly", "property", "religion"

4. **Replace File**: Save the complete data as `public/constitution.json`

5. **Test**: Verify all articles load and search works correctly

### Conversion Tips

- Use consistent chapter naming (e.g., "Chapter I — General Provisions")
- Include all article text, including sub-sections and clauses
- Add 3-6 relevant tags per article for optimal filtering
- Maintain sequential article numbering

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Build the app
npm run build

# Upload the dist/ folder to Netlify
```

### Other Static Hosts

Build the app and deploy the `dist/` folder to any static hosting service (GitHub Pages, Cloudflare Pages, etc.).

## Performance

- **Lighthouse Scores**: 90+ on Performance, 95+ on Accessibility, Best Practices, and SEO
- **Bundle Size**: <100KB JavaScript (excluding dataset)
- **Search Speed**: <200ms on mid-range mobile devices
- **Offline Support**: Basic caching via service worker (optional)

## Browser Support

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source. The Constitution of South Sudan is public domain.

## Support

For issues or questions:
- Check the [Issues](../../issues) page
- Review this README
- Test with the demo data first

## Related Documentation

### Core Functionality
- [Google Auth Setup Guide](./GOOGLE_AUTH_SETUP.md) - Google OAuth configuration and setup
- [Fastbots Integration Guide](./FASTBOTS_INTEGRATION.md) - Detailed Fastbots setup and configuration
- [Law Search README](./LAW_SEARCH_README.md) - Search functionality documentation
- [Server Setup](./SERVER_SETUP.md) - Server configuration (legacy)

### Android App
- [Android Quick Start](./ANDROID_QUICK_START.md) - Get your Android app running in 5 minutes
- [Play Store Deployment Guide](./ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md) - Complete guide to publish on Google Play Store
- [App Icons Guide](./ANDROID_APP_ICONS_GUIDE.md) - Customize your app icon and splash screen

## Changelog

### v2.2 - Android App Support (November 2025)
- ✅ Added Capacitor for native Android support
- ✅ Complete Android project setup
- ✅ Play Store deployment documentation
- ✅ Android app icons and configuration
- ✅ Build scripts for Android development
- ✅ Comprehensive deployment guides

### v2.1 - Google Authentication & Token System (December 2024)
- ✅ Added Google OAuth authentication system
- ✅ Implemented 3-prompt limit for anonymous users
- ✅ Added 20 tokens per day for authenticated users (resets daily)
- ✅ Added login modal with Google sign-in
- ✅ User session persistence across browser sessions
- ✅ Visual indicators for prompt/token count and user status
- ✅ Logout functionality
- ✅ Mobile-responsive authentication UI

### v2.0 - Fastbots Integration (October 2025)
- ✅ Integrated Fastbots AI for natural language conversations
- ✅ Custom chat interface with Fastbots backend
- ✅ Removed dependency on local AI server
- ✅ Added conversation history and context
- ✅ Improved mobile experience
- ✅ Added chat history management

### v1.0 - Initial Release
- ✅ Constitution search functionality
- ✅ Penal code database
- ✅ Basic search interface

---

**Current Status**: Production-ready with Fastbots AI integration, Google OAuth authentication, and Android app support. Available as both a web application and native Android app. Custom UI powered by Fastbots backend with token-based access control (3 prompts for anonymous users, 20 tokens/day for authenticated users).

## 🚀 Ready to Deploy?

- **Web**: See deployment section above for Vercel, Netlify, or other static hosts
- **Android**: Follow [ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md](./ANDROID_PLAYSTORE_DEPLOYMENT_GUIDE.md) to publish to Play Store
- **iOS**: Coming soon (Capacitor supports iOS with minimal changes!)