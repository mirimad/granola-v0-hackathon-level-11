# CV Upload & PDF Processing Setup

This document explains how the CV upload and PDF processing feature works in this application.

## Overview

The application now supports uploading a PDF CV/Resume file before starting a LiveKit session. The PDF is processed using Vercel's AI SDK with Anthropic's Claude model to generate a personalized career summary that is then passed to the LiveKit agent for a more personalized conversation.

## Features

- 📄 **PDF Upload**: Upload CV/Resume files (PDF format, max 10MB)
- 🤖 **AI-Powered Analysis**: Uses Claude 3.5 Sonnet to analyze and summarize CVs
- 🔐 **Secure Processing**: Edge runtime for fast and secure PDF processing
- 📊 **Summary Preview**: See the generated summary before starting the session
- 🎯 **Personalized Sessions**: CV summary is passed to LiveKit agent via participant metadata

## Setup Instructions

### 1. Install Dependencies

Dependencies are already added to `package.json`:

- `ai` - Vercel AI SDK core
- `@ai-sdk/anthropic` - Anthropic provider for AI SDK
- `@ai-sdk/google` - Google AI provider (optional alternative)

Run:

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root with the following:

```bash
# LiveKit Configuration (existing)
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
LIVEKIT_URL=wss://your-livekit-url.livekit.cloud

# Anthropic API Key for PDF CV Processing (NEW)
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**Get your Anthropic API key:**

1. Visit [https://console.anthropic.com/](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy it to your `.env.local` file

### 3. Alternative: Use Google AI

If you prefer to use Google's Gemini instead of Anthropic:

1. Update `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=your-google-api-key
```

2. Update `/app/api/process-cv/route.ts`:

```typescript
import { google } from '@ai-sdk/google';

// Change the model line:
model: google('gemini-1.5-pro');
```

## Architecture

### Components

1. **CVUpload Component** (`/components/app/cv-upload.tsx`)
   - Handles file selection and upload UI
   - Validates PDF files (type and size)
   - Displays upload progress and summary preview
   - Styled to match the existing retro/cyberpunk theme

2. **Process CV API** (`/app/api/process-cv/route.ts`)
   - Edge runtime endpoint for fast PDF processing
   - Uses Anthropic's Claude 3.5 Sonnet model
   - Extracts key career information from PDF
   - Returns a concise summary (~200 words)

3. **Session Provider** (`/components/app/session-provider.tsx`)
   - Manages CV summary state
   - Passes summary to LiveKit connection

4. **Connection Details API** (`/app/api/connection-details/route.ts`)
   - Adds CV summary to participant metadata
   - Makes summary available to LiveKit agent

### Data Flow

```
User uploads PDF
    ↓
CVUpload component sends to /api/process-cv
    ↓
Anthropic Claude analyzes PDF and generates summary
    ↓
Summary stored in session state
    ↓
User starts session
    ↓
Summary sent to /api/connection-details
    ↓
Summary added to participant metadata (JWT token)
    ↓
LiveKit agent receives participant metadata with CV summary
    ↓
Agent uses summary for personalized conversation
```

## CV Summary Content

The AI generates a summary covering:

1. **Professional Identity** - Current role/title
2. **Experience** - Years and key domains
3. **Technical Skills** - Top 3-5 areas of expertise
4. **Career Goals** - Aspirations (if mentioned in CV)
5. **Notable Achievements** - Unique qualities or accomplishments

## Usage

1. **Start the app**: `pnpm dev`
2. **Upload CV** (optional):
   - Click "Upload CV (Optional)" button
   - Select a PDF file (max 10MB)
   - Click "Analyze CV"
   - Wait for processing (usually 5-10 seconds)
   - Review the generated summary
3. **Start Session**: Click "[START SESSION]"
4. **Enjoy personalized conversation** with your AI career coach!

## Accessing CV Summary in LiveKit Agent

In your LiveKit agent code, you can access the CV summary from the participant metadata:

```python
# Python example
def on_participant_connected(participant):
    metadata = json.loads(participant.metadata)
    cv_summary = metadata.get('cv_summary')

    if cv_summary:
        # Use the CV summary to personalize the conversation
        print(f"User CV Summary: {cv_summary}")
```

```typescript
// TypeScript example
room.on(RoomEvent.ParticipantConnected, (participant) => {
  const metadata = JSON.parse(participant.metadata || '{}');
  const cvSummary = metadata.cv_summary;

  if (cvSummary) {
    // Use the CV summary to personalize the conversation
    console.log('User CV Summary:', cvSummary);
  }
});
```

## Security Considerations

- PDFs are processed server-side in Edge runtime
- Files are validated for type and size
- API keys are stored securely in environment variables
- CV summaries are transmitted via secure JWT tokens
- No PDFs are stored permanently on the server

## Troubleshooting

### "Failed to process CV" error

- Check that `ANTHROPIC_API_KEY` is set correctly in `.env.local`
- Verify your Anthropic API key is valid and has credits
- Check browser console for detailed error messages

### PDF upload button not working

- Ensure file is a valid PDF
- Check file size is under 10MB
- Clear browser cache and reload

### Summary not reaching LiveKit agent

- Verify participant metadata is being read correctly in agent code
- Check LiveKit server logs for metadata transmission
- Ensure JWT token includes metadata field

## Cost Estimation

**Anthropic Claude API:**

- Model: Claude 3.5 Sonnet
- Average cost per CV: ~$0.02-0.05
- Cost depends on PDF length and complexity

**Alternative (Google Gemini):**

- Model: Gemini 1.5 Pro
- Average cost per CV: ~$0.01-0.03
- Often has free tier available

## Future Enhancements

- [ ] Support for multiple file formats (DOCX, TXT)
- [ ] Store CV summaries for returning users
- [ ] Progress indicator during processing
- [ ] Batch processing for multiple documents
- [ ] Custom prompt templates for different career stages
- [ ] Multi-language support

## Resources

- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [LiveKit Documentation](https://docs.livekit.io/)
- [Vercel Blog: AI SDK 4.0 with PDF Support](https://vercel.com/blog/ai-sdk-4-0)
