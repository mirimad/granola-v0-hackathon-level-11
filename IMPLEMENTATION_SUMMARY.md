# CV Upload & Room Data Transmission - Implementation Summary

## What Was Implemented

A complete system for uploading CVs, generating AI summaries, and sending those summaries to active LiveKit rooms in real-time.

## Files Modified

### 1. **`app/api/process-cv/route.ts`**

- **Added**: LiveKit RoomServiceClient integration
- **Added**: Server-side data transmission to active rooms
- **Changed**: Removed Edge runtime (required for RoomServiceClient)
- **Added**: Room name parameter handling
- **Added**: JSON data packet creation and encoding
- **Added**: Reliable data delivery to all participants with topic 'cv-summary'

### 2. **`components/app/cv-upload.tsx`**

- **Added**: `roomName` prop to component interface
- **Modified**: Destructured `roomName` in component props
- **Modified**: Upload handler to include room name in FormData
- **Purpose**: Enables CV upload to send summary to active room

### 3. **`hooks/useRoom.ts`**

- **Added**: `roomName` state tracking
- **Modified**: `startSession` to capture and store room name from connection details
- **Modified**: `endSession` to clear room name
- **Modified**: Return value to include `roomName`
- **Purpose**: Makes room name available throughout the app

### 4. **`components/app/session-provider.tsx`**

- **Added**: `roomName` to SessionContext interface
- **Modified**: Context default values to include `roomName`
- **Modified**: Provider to destructure and pass `roomName`
- **Modified**: Context value memoization to include `roomName`
- **Purpose**: Exposes room name to all components via context

### 5. **`components/app/welcome-view.tsx`**

- **Modified**: Destructured `roomName` from useSession hook
- **Modified**: CVUpload component to pass `roomName` prop
- **Purpose**: Connects CV upload with active room when session starts

### 6. **`components/app/session-view.tsx`**

- **Added**: Import for `useCVSummaryListener` hook
- **Added**: Import for `useSession` hook
- **Added**: CV summary listener to receive room data
- **Added**: Session state update when summary is received
- **Purpose**: Receives CV summaries sent to the room in real-time

### 7. **`hooks/useCVSummaryListener.ts`** _(New File)_

- **Created**: Custom React hook for listening to CV summary data
- **Implements**: RoomEvent.DataReceived listener
- **Filters**: Messages by type ('cv_summary')
- **Decodes**: Uint8Array to JSON
- **Triggers**: Callback with received summary
- **Purpose**: Encapsulates data reception logic

## How It Works

### Scenario 1: CV Upload Before Session

```
1. User uploads CV in welcome view (no room exists yet)
2. CV is processed, summary generated
3. Summary stored in session context
4. When user starts session, summary included in participant metadata
5. Agent receives summary via metadata
```

### Scenario 2: CV Upload During Active Session

```
1. User uploads CV while in active session (room exists)
2. CV Upload component has roomName from session context
3. Room name sent to API along with CV file
4. API processes CV, generates summary
5. API sends summary to room via RoomServiceClient.sendData()
6. All participants receive summary via DataReceived event
7. useCVSummaryListener hook processes and updates session state
```

## Key Technical Decisions

### 1. Using Data Packets vs Text Streams

**Chosen**: Data Packets with `RoomServiceClient.sendData()`

**Why**:

- Server-side transmission (not client-to-client)
- Summary fits in single packet (<15 KiB)
- Simpler API for one-time data send
- Built-in topic filtering

**Alternative** (Text Streams):

- Better for incremental/streaming data
- Automatic chunking for large data
- More suitable for client-to-client communication

### 2. Reliable vs Lossy Delivery

**Chosen**: `DataPacket_Kind.RELIABLE`

**Why**:

- CV summary is critical data
- Must be delivered completely
- Order matters for JSON structure
- Slight latency acceptable for this use case

### 3. Broadcast to All vs Targeted Delivery

**Chosen**: Broadcast to all participants (`destinationIdentities: []`)

**Why**:

- Simpler implementation
- Agent needs to receive it
- Other participants may benefit from context
- Can be filtered by topic on client side

**Can be changed to**:

```typescript
destinationIdentities: ['agent-identity']; // Only to agent
```

### 4. Edge Runtime Removal

**Changed**: Removed `export const runtime = 'edge'`

**Why**:

- `RoomServiceClient` uses Node.js APIs (crypto, buffer)
- Edge runtime doesn't support required dependencies
- Server-side SDK needs full Node.js environment

**Trade-off**:

- Slightly slower cold starts
- Higher resource usage
- But necessary for server SDK functionality

## Data Flow Diagram

```
┌─────────────┐
│   User UI   │
└──────┬──────┘
       │ Upload CV + roomName
       ▼
┌─────────────────────┐
│ /api/process-cv     │
│ - Validate file     │
│ - Generate summary  │
│ - Create data packet│
└──────┬──────────────┘
       │ RoomServiceClient.sendData()
       ▼
┌─────────────────────┐
│  LiveKit Server     │
│  - Route to room    │
│  - Distribute data  │
└──────┬──────────────┘
       │ WebRTC Data Channel
       ▼
┌─────────────────────┐
│  All Participants   │
│  - Agent            │
│  - Other users      │
└──────┬──────────────┘
       │ RoomEvent.DataReceived
       ▼
┌─────────────────────┐
│ useCVSummaryListener│
│ - Decode payload    │
│ - Parse JSON        │
│ - Update state      │
└─────────────────────┘
```

## Testing the Implementation

### 1. Before Session Starts

```bash
# Start the dev server
pnpm dev

# 1. Go to http://localhost:3000
# 2. Upload a PDF CV
# 3. See summary generated and displayed
# 4. Start session
# 5. Agent should have context from CV summary (via metadata)
```

### 2. During Active Session

```bash
# 1. Start a session first
# 2. Upload a CV while session is active
# 3. Check browser console for "CV summary sent to room: room_name"
# 4. Check client console for "CV summary received in session: ..."
# 5. Session state should update with the summary
```

### 3. Debugging

**Server logs**:

```bash
# Check API route logs
console.log(`CV summary sent to room: ${roomName}`);
```

**Client logs**:

```bash
# Check browser console
console.log('CV summary received in session:', summary);
```

**LiveKit logs**:

- Check LiveKit Cloud dashboard for room data packets
- Use LiveKit CLI to inspect room state

## Environment Variables Required

Ensure these are set in `.env.local`:

```bash
LIVEKIT_URL=https://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# For Anthropic Claude (CV processing)
ANTHROPIC_API_KEY=your-anthropic-key
```

## Next Steps / Enhancements

### 1. Agent-Side Integration

Update your agent code to listen for CV summaries:

```python
# Python agent example
@room.on("data_received")
def on_data_received(data: rtc.DataPacket):
    if data.topic == "cv-summary":
        summary_data = json.loads(data.data)
        print(f"Agent received CV summary: {summary_data['summary']}")
        # Use summary to personalize agent responses
```

### 2. Error Handling Enhancement

- Add retry logic for failed data sends
- Queue messages if room is temporarily unavailable
- Notify user if delivery fails

### 3. UI Feedback

- Show toast notification when summary is sent
- Display "Sending to agent..." loading state
- Confirm when agent acknowledges receipt

### 4. Security Enhancements

- Validate room ownership before sending
- Add rate limiting to prevent spam
- Encrypt sensitive CV data

### 5. Performance Optimization

- Cache processed CVs to avoid reprocessing
- Compress large summaries before sending
- Use lossy mode for non-critical updates

## Useful Commands

```bash
# Format all code
pnpm format

# Check for linter errors
pnpm lint

# Build for production
pnpm build

# Run development server
pnpm dev
```

## References

- [LiveKit Server SDK Documentation](https://docs.livekit.io/reference/server-sdk-js/)
- [LiveKit Data Packets](https://docs.livekit.io/home/client/data/packets/)
- [LiveKit RoomServiceClient API](https://docs.livekit.io/reference/server-sdk-js/classes/RoomServiceClient.html)
- Full implementation guide: `SEND_DATA_TO_ROOM.md`
