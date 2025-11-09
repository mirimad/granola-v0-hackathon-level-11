# Updated CV Upload Flow

## New User Flow

The application now follows a **required CV upload** flow with the following steps:

### Step-by-Step Process

```
1. User lands on welcome screen
   ↓
2. User sees "Upload CV" button (no longer optional)
   ↓
3. User selects and uploads PDF file
   ↓
4. System processes CV and generates AI summary
   ↓
5. Success message appears: "CV analyzed successfully! Ready to start session."
   ↓
6. "START SESSION" button appears (was hidden before)
   ↓
7. User clicks "START SESSION"
   ↓
8. Room connection established
   ↓
9. CV summary automatically sent to room
   ↓
10. All participants (including agent) receive the summary
```

## Key Changes

### 1. **CV Upload is Now Required**

- Button text changed from "Upload CV (Optional)" to "Upload CV"
- Start session button is hidden until CV is analyzed
- User cannot proceed without uploading a CV

### 2. **Summary Not Shown in UI**

- CV summary is generated but not displayed to user
- Only a success message is shown
- Summary is stored internally for transmission to room

### 3. **Start Button Conditional Rendering**

```tsx
{
  /* Show start button only after CV is analyzed */
}
{
  cvSummary && <Button onClick={onStartCall}>{startButtonText}</Button>;
}
```

### 4. **Automatic Summary Transmission**

- When room connects, CV summary is automatically sent
- Uses client-side `publishData` for real-time transmission
- Sent to all participants with topic 'cv-summary'

## Technical Implementation

### Welcome View (`welcome-view.tsx`)

```tsx
const { cvSummary } = useSession();

// Start button only shows when cvSummary exists
{
  cvSummary && <Button onClick={onStartCall}>START SESSION</Button>;
}
```

### CV Upload Component (`cv-upload.tsx`)

**Before:**

```tsx
// Showed full summary in UI
<div>
  <p>{summary}</p>
  <Button onClick={handleRemove}>Remove CV</Button>
</div>
```

**After:**

```tsx
// Just shows success message
<div>
  <CheckCircle />
  <span>CV analyzed successfully! Ready to start session.</span>
</div>
```

### Room Hook (`useRoom.ts`)

```tsx
// New: Listens for room connection
room.on(RoomEvent.Connected, async () => {
  if (cvSummary) {
    const data = new TextEncoder().encode(
      JSON.stringify({
        type: 'cv_summary',
        summary: cvSummary,
        timestamp: Date.now(),
      })
    );

    await room.localParticipant.publishData(data, {
      reliable: true,
      topic: 'cv-summary',
    });
  }
});
```

## Data Flow Diagram

```
┌─────────────────┐
│  Welcome Screen │
│  (Start Button  │
│   Hidden)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Upload CV     │
│  (Required)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Processing  │
│  Generate       │
│  Summary        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Success State  │
│  + Show Start   │
│    Button       │
└────────┬────────┘
         │ User clicks START SESSION
         ▼
┌─────────────────┐
│  Connect to     │
│  LiveKit Room   │
└────────┬────────┘
         │ onConnected event
         ▼
┌─────────────────┐
│  publishData()  │
│  Send Summary   │
│  to Room        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  All            │
│  Participants   │
│  Receive        │
└─────────────────┘
```

## Agent Integration

Your agent should listen for the CV summary on connection:

### Python Agent Example

```python
from livekit import rtc

@room.on("data_received")
def on_data_received(data: rtc.DataPacket):
    if data.topic == "cv-summary":
        summary_data = json.loads(data.data.decode('utf-8'))
        cv_summary = summary_data['summary']

        print(f"Received CV summary: {cv_summary}")

        # Use summary to personalize agent behavior
        agent.set_context(cv_summary)
        agent.personalize_greeting(cv_summary)
```

### Node.js Agent Example

```typescript
room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
  if (topic === 'cv-summary') {
    const decoder = new TextDecoder();
    const dataString = decoder.decode(payload);
    const data = JSON.parse(dataString);

    console.log('Agent received CV summary:', data.summary);

    // Use summary to personalize agent
    agent.setContext(data.summary);
    agent.personalizeGreeting(data.summary);
  }
});
```

## User Experience

### Before Changes

1. ✅ CV upload was optional
2. ✅ Summary displayed in UI (user could see it)
3. ✅ Start button always visible
4. ✅ User could start session without CV

### After Changes

1. ✅ CV upload is required
2. ✅ Summary generated but not shown (cleaner UI)
3. ✅ Start button appears only after CV analysis
4. ✅ Cannot start session without CV
5. ✅ Summary automatically sent to all participants on connect

## Benefits

### 1. **Guaranteed Context**

- Agent always has CV information
- No need to handle "no CV" cases
- Better personalization from the start

### 2. **Cleaner UI**

- Less clutter on screen
- Focus on action (start session)
- Professional, streamlined experience

### 3. **Better Data Flow**

- CV summary sent at optimal time (right after connection)
- Uses client-side publishData (more efficient)
- No need for metadata workarounds

### 4. **Real-time Delivery**

- Summary sent via WebRTC data channel
- All participants receive simultaneously
- Immediate availability to agent

## Testing the New Flow

### Manual Testing Steps

```bash
# 1. Start the app
pnpm dev

# 2. Open http://localhost:3000

# 3. Verify initial state:
#    - "Upload CV" button is visible
#    - "START SESSION" button is HIDDEN

# 4. Upload a PDF CV

# 5. Verify processing:
#    - "Processing..." state appears
#    - Success message: "CV analyzed successfully! Ready to start session."

# 6. Verify button appears:
#    - "START SESSION" button is now VISIBLE

# 7. Click "START SESSION"

# 8. Check console logs:
#    - "CV summary sent to room after connection"
#    - Agent should log receipt of summary

# 9. Verify in LiveKit:
#    - Check LiveKit dashboard for data packets
#    - Topic should be "cv-summary"
```

### Console Output Expected

```
Client Console:
✅ CV summary sent to room after connection

Agent Console:
✅ Received CV summary: [summary text]
✅ Agent context updated with CV information
```

## Edge Cases Handled

### 1. **User Refreshes Page**

- CV summary is lost (session state cleared)
- User must re-upload CV
- This is expected behavior for security

### 2. **Connection Fails**

- CV summary not sent if connection fails
- User can retry connection
- Summary still available for retry

### 3. **User Disconnects and Reconnects**

- Summary not re-sent on reconnection
- Agent should cache received summary
- Or implement re-send logic if needed

## Migration Notes

### If Upgrading from Previous Version

1. **No Database Changes**: All in-memory state
2. **No API Changes**: Same endpoints used
3. **UI Changes**: Users will notice new flow
4. **Agent Update Required**: Agent must listen for `cv-summary` topic

### Configuration

No configuration changes needed. Everything works with existing environment variables:

```bash
# .env.local (no changes)
LIVEKIT_URL=https://your-project.livekit.cloud
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
ANTHROPIC_API_KEY=your-anthropic-key
```

## Troubleshooting

### Start Button Not Appearing

**Check:**

1. CV upload completed successfully?
2. Check browser console for errors
3. Verify `cvSummary` is set in session context

```tsx
// Debug: Add temporary log in welcome-view.tsx
console.log('CV Summary:', cvSummary);
```

### Summary Not Received by Agent

**Check:**

1. Agent listening for `cv-summary` topic?
2. Check agent console logs
3. Verify room connection is established
4. Check LiveKit dashboard for data packets

```typescript
// Debug: Add log in useRoom.ts
console.log('Attempting to send CV summary:', cvSummary);
```

### Upload Fails

**Check:**

1. File is PDF format?
2. File size under 10MB?
3. Anthropic API key configured?
4. Check API route logs

## Future Enhancements

### Potential Improvements

1. **Progress Indicator**: Show upload/processing progress percentage
2. **Retry Logic**: Automatic retry if sending fails
3. **Summary Cache**: Store summary for reconnections
4. **Multiple CVs**: Allow updating CV during session
5. **Summary Validation**: Verify agent received summary
6. **Timeout Handling**: Handle slow AI processing
7. **File Preview**: Show PDF preview before upload

## Related Documentation

- `SEND_DATA_TO_ROOM.md` - Technical details on data transmission
- `IMPLEMENTATION_SUMMARY.md` - Full implementation overview
- `QUICK_REFERENCE.md` - API quick reference
- `CV_UPLOAD_SETUP.md` - Original CV upload setup guide

## Summary

The new flow ensures that:

- ✅ Every session has CV context
- ✅ UI is cleaner and more focused
- ✅ Summary delivery is immediate and reliable
- ✅ Agent always has necessary information
- ✅ User experience is streamlined

Users can no longer bypass CV upload, ensuring consistent, personalized agent interactions from the start of every session.
