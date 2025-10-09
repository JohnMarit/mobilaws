# Server Setup Instructions

## Environment Configuration

1. Create a `.env` file in the root directory with the following content:

```
OPENAI_API_KEY=your_openai_api_key_here
```

2. Replace `your_openai_api_key_here` with your actual OpenAI API key
3. You can get your API key from: https://platform.openai.com/api-keys

## Running the Server

The server has been set up with the following scripts in package.json:

- `npm run server` - Run the server once
- `npm run server:dev` - Run the server in watch mode (restarts on file changes)

## Server Details

- **Port**: 3001
- **Endpoint**: POST `/api/chat/stream`
- **Model**: gpt-4o-mini (can be changed to gpt-4o in server-openai.ts)

## Dependencies

The following dependencies are already installed:
- express
- cors
- openai
- tsx (for running TypeScript files)

## Security Note

The `.env` file is already added to `.gitignore` to protect your API key from being committed to version control.

