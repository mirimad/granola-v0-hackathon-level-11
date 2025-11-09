import { useEffect } from 'react';
import { DataPacket_Kind, RoomEvent } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

interface CVSummaryData {
  type: 'cv_summary';
  summary: string;
  timestamp: number;
}

export function useCVSummaryListener(onSummaryReceived: (summary: string) => void) {
  const room = useRoomContext();

  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant?: any, kind?: DataPacket_Kind) => {
      try {
        const decoder = new TextDecoder();
        const dataString = decoder.decode(payload);
        const data: CVSummaryData = JSON.parse(dataString);

        // Check if this is a CV summary message
        if (data.type === 'cv_summary' && data.summary) {
          console.log('Received CV summary in room:', data.summary);
          onSummaryReceived(data.summary);
        }
      } catch (error) {
        console.error('Error processing received data:', error);
      }
    };

    room.on(RoomEvent.DataReceived, handleDataReceived);

    return () => {
      room.off(RoomEvent.DataReceived, handleDataReceived);
    };
  }, [room, onSummaryReceived]);
}
