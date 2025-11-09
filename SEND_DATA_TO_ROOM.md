# Sending Text Data to Active LiveKit Rooms

This document explains how to send text data (like CV summaries) to an active LiveKit room from your server.

## Overview

The implementation uses **LiveKit's RoomServiceClient** to send data packets from the server to all participants in an active room. This is useful for scenarios where server-side processing needs to share results with participants in real-time.

## Architecture

### Flow Diagram

```
User uploads CV → Server processes CV → Generates summary → Sends to active room → All participants receive
```

### Key Components

1. **Server-side API** (`/api/process-cv/route.ts`):
   - Processes uploaded CV files
   - Generates AI summary using Claude
   - Sends summary to active LiveKit room using `RoomServiceClient.sendData()`

2. **Client-side Hook** (`useCVSummaryListener.ts`):
   - Listens for incoming data packets in the room
   - Filters for CV summary messages
   - Triggers callback with received summary

3. **Session Management**:
   - Tracks active room name
   - Passes room name to CV upload component
   - Updates session state when summary is received

## Implementation Details

### 1. Server-Side: Sending Data to Room

```typescript
import { RoomServiceClient } from 'livekit-server-sdk';
import { DataPacket_Kind } from '@livekit/protocol';

// Initialize the RoomServiceClient
const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

// Prepare your data
const summaryData = JSON.stringify({
  type: 'cv_summary',
  summary: 'Your summary text here',
  timestamp: Date.now(),
});

// Convert to Uint8Array
const encoder = new TextEncoder();
const data = encoder.encode(summaryData);

// Send to all participants in the room
await roomService.sendData(
  roomName, // Room name
  data, // Data as Uint8Array
  DataPacket_Kind.RELIABLE, // Delivery mode (RELIABLE or LOSSY)
  {
    topic: 'cv-summary', // Topic for categorization
    destinationIdentities: [], // Empty = send to all participants
  }
);
```

### 2. Client-Side: Receiving Data

```typescript
import { DataPacket_Kind, RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

// Listen for data in the room
const room = useRoomContext();

room.on(RoomEvent.DataReceived, (payload, participant, kind) => {
  const decoder = new TextDecoder();
  const dataString = decoder.decode(payload);
  const data = JSON.parse(dataString);

  if (data.type === 'cv_summary') {
    console.log('Received CV summary:', data.summary);
  }
});
```

### 3. Integration with CV Upload

The `CVUpload` component now accepts an optional `roomName` prop:

```typescript
<CVUpload
  onSummaryGenerated={handleSummary}
  roomName={activeRoomName}  // Pass room name when session is active
/>
```

When a room name is provided:

- The CV is uploaded to `/api/process-cv` with the room name
- After generating the summary, it's sent to all participants in that room
- The agent and other participants receive the summary in real-time

## Use Cases

### Before Session Starts

- User uploads CV
- Summary is stored in session context
- When session starts, summary is included in participant metadata
- Agent receives it via metadata

### During Active Session

- User uploads CV mid-session
- Summary is sent directly to the room via data packets
- Agent receives it via `RoomEvent.DataReceived`
- All participants in the room can access it

## LiveKit API Options

### Data Delivery Modes

```typescript
DataPacket_Kind.RELIABLE; // Guaranteed delivery with retransmission
DataPacket_Kind.LOSSY; // Fast delivery, no guarantee
```

### Send Data Options

```typescript
interface SendDataOptions {
  topic?: string; // Categorize messages
  destinationIdentities?: string[]; // Target specific participants
  destinationSids?: string[]; // Target by session ID
}
```

#### Sending to Specific Participants

```typescript
// Send to specific participants only
await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
  topic: 'cv-summary',
  destinationIdentities: ['agent-identity', 'user-123'],
});
```

#### Using Topics

Topics help categorize different types of data:

```typescript
// Different message types
await roomService.sendData(roomName, data1, DataPacket_Kind.RELIABLE, {
  topic: 'cv-summary',
});

await roomService.sendData(roomName, data2, DataPacket_Kind.RELIABLE, {
  topic: 'chat-message',
});

// Clients can filter by topic
if (data.topic === 'cv-summary') {
  handleCVSummary(data);
}
```

## Important Notes

### Runtime Considerations

⚠️ **Important**: `RoomServiceClient` requires Node.js runtime and **cannot** run in Edge runtime.

If your API route previously used:

```typescript
export const runtime = 'edge';
```

You must **remove** this line to use `RoomServiceClient`.

### Message Size Limits

- **Reliable mode**: Up to 15 KiB per packet
- **Lossy mode**: Recommended max 1300 bytes (MTU limit)

For larger data:

- Split into multiple packets
- Use LiveKit's text streams (automatic chunking)
- Consider storing data externally and sending a reference

### Reliability vs Speed

**Reliable** (`DataPacket_Kind.RELIABLE`):

- Guaranteed in-order delivery
- Automatic retransmission
- Best for: Critical data, summaries, commands
- Trade-off: Slight latency

**Lossy** (`DataPacket_Kind.LOSSY`):

- Fast, one-shot delivery
- No retransmission
- Best for: Real-time updates, position data
- Trade-off: Potential packet loss

## Alternative Approaches

### 1. Text Streams (Client-Side)

For sending large amounts of text from one participant to others:

```typescript
// Send all at once
const info = await room.localParticipant.sendText(largeText, {
  topic: 'summary',
});

// Stream incrementally
const writer = await room.localParticipant.streamText({
  topic: 'summary',
});
await writer.write('chunk 1');
await writer.write('chunk 2');
await writer.close();
```

### 2. Participant Metadata

For data available at connection time:

```typescript
// Server-side: Include in access token
const token = new AccessToken(API_KEY, API_SECRET, {
  identity: 'user-123',
});
token.metadata = JSON.stringify({ cv_summary: summary });
```

### 3. Room Metadata

For room-wide shared state:

```typescript
// Update room metadata
await roomService.updateRoomMetadata(
  roomName,
  JSON.stringify({
    cv_summaries: [summary1, summary2],
  })
);
```

## Troubleshooting

### Data Not Being Received

1. **Check room connection**: Ensure participants are connected before sending
2. **Verify topic matching**: Topic on sender must match listener
3. **Check data format**: Ensure JSON is valid
4. **Inspect network**: Use browser DevTools to check WebRTC data channels

### Performance Issues

1. **Reduce message size**: Keep data packets small
2. **Use topics**: Filter irrelevant messages early
3. **Batch updates**: Combine multiple small updates
4. **Consider lossy mode**: For non-critical real-time data

## Resources

- [LiveKit Text Streams Documentation](https://docs.livekit.io/home/client/data/text-streams/)
- [LiveKit Data Packets Documentation](https://docs.livekit.io/home/client/data/packets/)
- [LiveKit Server SDK Reference](https://docs.livekit.io/reference/server-sdk-js/)
- [LiveKit RoomServiceClient API](https://docs.livekit.io/reference/server-sdk-js/classes/RoomServiceClient.html)

## Example: Full Integration

See the following files for the complete implementation:

- **Server API**: `app/api/process-cv/route.ts`
- **Client Hook**: `hooks/useCVSummaryListener.ts`
- **Upload Component**: `components/app/cv-upload.tsx`
- **Session Management**: `hooks/useRoom.ts`
- **Session Provider**: `components/app/session-provider.tsx`
