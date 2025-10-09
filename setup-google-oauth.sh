#!/bin/bash

# Google OAuth Setup Script for Unix/Linux/macOS
# This script helps you set up Google OAuth for the Mobilaws application

echo "🔧 Google OAuth Setup for Mobilaws"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

echo "📋 Please follow these steps:"
echo ""
echo "1. Go to: https://console.developers.google.com/"
echo "2. Create a new project or select existing project"
echo "3. Enable Google+ API"
echo "4. Create OAuth 2.0 credentials"
echo "5. Add authorized origins:"
echo "   - http://localhost:8081"
echo "   - https://yourdomain.com (for production)"
echo "6. Copy the Client ID"
echo ""

read -p "Enter your Google Client ID: " clientId

if [ -z "$clientId" ]; then
    echo "❌ Client ID cannot be empty"
    exit 1
fi

# Create .env file
cat > .env << EOF
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=$clientId

# Backend Configuration (optional)
VITE_BACKEND_URL=http://localhost:8000

# OpenAI Configuration (optional)
VITE_OPENAI_API_KEY=your_openai_api_key_here
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "🚀 Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Test the authentication by sending 4 messages"
echo "3. The Google sign-in popup should appear"
echo ""
echo "📖 For more details, see: GOOGLE_OAUTH_SETUP.md"
