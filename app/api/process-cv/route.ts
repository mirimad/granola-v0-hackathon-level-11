import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { RoomServiceClient } from 'livekit-server-sdk';
import { anthropic } from '@ai-sdk/anthropic';
import { DataPacket_Kind } from '@livekit/protocol';

// Note: Removed edge runtime to support RoomServiceClient (requires Node.js runtime)

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const roomName = formData.get('roomName') as string; // Room name to send data to

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Use Anthropic's Claude to analyze the PDF CV
    const result = await generateText({
      model: anthropic('claude-haiku-4-5'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a professional career coach analyzing a CV/Resume. Please provide a concise summary covering:

1. Professional identity (current role/title)
2. Years of experience and key domains
3. Top 3-5 technical skills or areas of expertise
4. Career goals or aspirations (if mentioned)
5. Any notable achievements or unique qualities

Keep the summary focused and under 200 words. This summary will be used by an AI career coach to personalize the conversation.`,
            },
            {
              type: 'file',
              data: buffer,
              mimeType: 'application/pdf',
            },
          ],
        },
      ],
    });

    // Send the summary to the active room if roomName is provided
    if (roomName && LIVEKIT_URL && API_KEY && API_SECRET) {
      try {
        const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

        // Create a data packet with the CV summary
        const summaryData = JSON.stringify({
          type: 'cv_summary',
          summary: result.text,
          timestamp: Date.now(),
        });

        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(summaryData);

        // Send data to all participants in the room with a specific topic
        await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
          topic: 'cv-summary',
          destinationIdentities: [], // Empty array sends to all participants
        });

        console.log(`CV summary sent to room: ${roomName}`);
      } catch (sendError) {
        console.error('Error sending data to room:', sendError);
        // Don't fail the entire request if sending to room fails
      }
    }

    return NextResponse.json({
      success: true,
      summary: result.text,
    });
  } catch (error) {
    console.error('Error processing CV:', error);
    return NextResponse.json(
      {
        error: 'Failed to process CV',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
