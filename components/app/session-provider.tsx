'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import { RoomContext } from '@livekit/components-react';
import { APP_CONFIG_DEFAULTS, type AppConfig } from '@/app-config';
import { useRoom } from '@/hooks/useRoom';

const SessionContext = createContext<{
  appConfig: AppConfig;
  isSessionActive: boolean;
  roomName: string | null;
  cvSummary: string | null;
  startSession: () => void;
  endSession: () => void;
  setCvSummary: (summary: string | null) => void;
}>({
  appConfig: APP_CONFIG_DEFAULTS,
  isSessionActive: false,
  roomName: null,
  cvSummary: null,
  startSession: () => {},
  endSession: () => {},
  setCvSummary: () => {},
});

interface SessionProviderProps {
  appConfig: AppConfig;
  children: React.ReactNode;
}

export const SessionProvider = ({ appConfig, children }: SessionProviderProps) => {
  const [cvSummary, setCvSummary] = useState<string | null>(null);
  const { room, isSessionActive, roomName, startSession, endSession } = useRoom(appConfig);
  const contextValue = useMemo(
    () => ({
      appConfig,
      isSessionActive,
      roomName,
      cvSummary,
      startSession,
      endSession,
      setCvSummary,
    }),
    [appConfig, isSessionActive, roomName, cvSummary, startSession, endSession]
  );

  return (
    <RoomContext.Provider value={room}>
      <SessionContext.Provider value={contextValue}>{children}</SessionContext.Provider>
    </RoomContext.Provider>
  );
};

export function useSession() {
  return useContext(SessionContext);
}
