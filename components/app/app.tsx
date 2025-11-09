'use client';

import Image from 'next/image';
import { RoomAudioRenderer, StartAudio } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { SessionProvider } from '@/components/app/session-provider';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';

interface AppProps {
  appConfig: AppConfig;
}

export function App({ appConfig }: AppProps) {
  return (
    <SessionProvider appConfig={appConfig}>
      {/* Background Image */}
      <div className="main-bg">
        {/* Top Center Logo */}
        <div className="top-logo">
          <Image
            src="/l11-logo.png"
            alt="Level 11 Logo"
            width={400}
            height={133}
            className="h-32 w-auto"
            style={{
              filter:
                'drop-shadow(0 0 40px rgba(0,245,255,0.8)) drop-shadow(0 10px 80px rgba(0,0,0,1)) drop-shadow(0 20px 100px rgba(0,0,0,0.9))',
            }}
            priority
          />
        </div>

        <main className="relative z-10 grid h-svh grid-cols-1 place-content-center">
          <ViewController />
        </main>
        <StartAudio label="Start Audio" />
        <RoomAudioRenderer />
        <Toaster />
      </div>
    </SessionProvider>
  );
}
