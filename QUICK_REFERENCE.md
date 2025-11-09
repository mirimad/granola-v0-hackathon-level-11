# LiveKit Room Data Transmission - Quick Reference

## Server-Side: Send Data to Room

```typescript
import { RoomServiceClient } from 'livekit-server-sdk';
import { DataPacket_Kind } from '@livekit/protocol';

const roomService = new RoomServiceClient(
  process.env.LIVEKIT_URL!,
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!
);

// Prepare data
const data = new TextEncoder().encode(
  JSON.stringify({
    type: 'your-type',
    payload: 'your-data',
  })
);

// Send to room
await roomService.sendData('room-name', data, DataPacket_Kind.RELIABLE, { topic: 'your-topic' });
```

## Client-Side: Receive Data in Room

```typescript
import { useEffect } from 'react';
import { RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

function useDataListener(onDataReceived: (data: any) => void) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handler = (payload: Uint8Array) => {
      const decoder = new TextDecoder();
      const data = JSON.parse(decoder.decode(payload));
      onDataReceived(data);
    };

    room.on(RoomEvent.DataReceived, handler);
    return () => {
      room.off(RoomEvent.DataReceived, handler);
    };
  }, [room, onDataReceived]);
}
```

## Data Packet Options

### Delivery Modes

```typescript
DataPacket_Kind.RELIABLE; // ✅ Guaranteed delivery, in-order, retransmission
DataPacket_Kind.LOSSY; // ⚡ Fast, no guarantee, no retransmission
```

### Send Options

```typescript
interface SendDataOptions {
  topic?: string; // Message categorization
  destinationIdentities?: string[]; // Target specific participants
  destinationSids?: string[]; // Target by session ID
}
```

### Examples

```typescript
// Send to everyone
await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
  topic: 'broadcast',
});

// Send to specific user
await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
  topic: 'private',
  destinationIdentities: ['user-123'],
});

// Send to multiple users
await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
  topic: 'group',
  destinationIdentities: ['user-1', 'user-2', 'agent'],
});
```

## Size Limits

| Mode     | Max Size | Notes                       |
| -------- | -------- | --------------------------- |
| Reliable | 15 KiB   | Protocol limit with headers |
| Lossy    | 1.3 KB   | MTU limit (1400 bytes)      |

## Common Patterns

### Pattern 1: Request-Response

**Client sends request:**

```typescript
const data = new TextEncoder().encode(
  JSON.stringify({
    type: 'request',
    action: 'get-summary',
    requestId: 'req-123',
  })
);

room.localParticipant.publishData(data, {
  reliable: true,
  topic: 'requests',
});
```

**Server sends response:**

```typescript
await roomService.sendData(roomName, responseData, DataPacket_Kind.RELIABLE, {
  topic: 'responses',
  destinationIdentities: [requesterId],
});
```

### Pattern 2: Broadcast Updates

```typescript
// Server broadcasts to all participants
await roomService.sendData(roomName, updateData, DataPacket_Kind.RELIABLE, {
  topic: 'updates',
});
```

### Pattern 3: Topic-Based Routing

```typescript
// Client listens for specific topics
room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
  switch (topic) {
    case 'cv-summary':
      handleCVSummary(payload);
      break;
    case 'chat-message':
      handleChatMessage(payload);
      break;
    case 'system-alert':
      handleSystemAlert(payload);
      break;
  }
});
```

## Error Handling

```typescript
try {
  await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, options);
  console.log('Data sent successfully');
} catch (error) {
  if (error.code === 'ROOM_NOT_FOUND') {
    console.error('Room does not exist');
  } else if (error.code === 'PARTICIPANT_NOT_FOUND') {
    console.error('Destination participant not in room');
  } else {
    console.error('Failed to send data:', error);
  }
}
```

## Debugging

### Server-Side

```typescript
console.log('Sending data to room:', roomName);
console.log('Data size:', data.length, 'bytes');
console.log('Topic:', options.topic);
console.log('Destinations:', options.destinationIdentities);
```

### Client-Side

```typescript
room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
  console.log('Data received from:', participant?.identity);
  console.log('Topic:', topic);
  console.log('Size:', payload.length, 'bytes');
  console.log('Kind:', kind === DataPacket_Kind.RELIABLE ? 'RELIABLE' : 'LOSSY');
});
```

## Performance Tips

1. **Keep messages small**: Split large data into chunks
2. **Use topics**: Filter messages early to reduce processing
3. **Batch updates**: Combine multiple small messages
4. **Choose appropriate delivery**: Use LOSSY for real-time, non-critical data
5. **Compress when needed**: Use gzip for large text payloads

## Common Mistakes

❌ **Sending without checking room exists**

```typescript
// Bad
await roomService.sendData(roomName, data, kind, options);
```

✅ **Check room first**

```typescript
// Good
const rooms = await roomService.listRooms([roomName]);
if (rooms.length > 0) {
  await roomService.sendData(roomName, data, kind, options);
}
```

❌ **Exceeding size limits**

```typescript
// Bad - might exceed 15 KiB
const hugeData = new TextEncoder().encode(JSON.stringify(massiveObject));
await roomService.sendData(roomName, hugeData, DataPacket_Kind.RELIABLE, {});
```

✅ **Check size and split if needed**

```typescript
// Good
if (data.length > 15000) {
  // Split into chunks or use alternative method
  console.warn('Data too large, splitting...');
}
```

❌ **Not handling disconnected participants**

```typescript
// Bad - might fail if participant left
await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
  destinationIdentities: [userId],
});
```

✅ **Verify participant is still in room**

```typescript
// Good
const participants = await roomService.listParticipants(roomName);
const participantExists = participants.some((p) => p.identity === userId);
if (participantExists) {
  await roomService.sendData(roomName, data, DataPacket_Kind.RELIABLE, {
    destinationIdentities: [userId],
  });
}
```

## API Cheat Sheet

```typescript
// RoomServiceClient methods
roomService.createRoom(options)
roomService.listRooms(names?)
roomService.deleteRoom(roomName)
roomService.listParticipants(roomName)
roomService.sendData(roomName, data, kind, options)
roomService.updateParticipant(roomName, identity, options)
roomService.removeParticipant(roomName, identity)

// Room events
RoomEvent.DataReceived
RoomEvent.Connected
RoomEvent.Disconnected
RoomEvent.ParticipantConnected
RoomEvent.ParticipantDisconnected

// Data packet kinds
DataPacket_Kind.RELIABLE
DataPacket_Kind.LOSSY
```

## Need More Help?

- 📖 Full guide: `SEND_DATA_TO_ROOM.md`
- 📝 Implementation details: `IMPLEMENTATION_SUMMARY.md`
- 🔗 [LiveKit Docs](https://docs.livekit.io)
- 💬 [LiveKit Discord](https://livekit.io/discord)
