'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useVoiceAssistant } from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ChatTranscript } from '@/components/app/chat-transcript';
import { PreConnectMessage } from '@/components/app/preconnect-message';
import { useSession } from '@/components/app/session-provider';
import {
  AgentControlBar,
  type ControlBarControls,
} from '@/components/livekit/agent-control-bar/agent-control-bar';
import { useCVSummaryListener } from '@/hooks/useCVSummaryListener';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useConnectionTimeout } from '@/hooks/useConnectionTimout';
import { useDebugMode } from '@/hooks/useDebug';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../livekit/scroll-area/scroll-area';

const MotionBottom = motion.create('div');

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';
const BOTTOM_VIEW_MOTION_PROPS = {
  variants: {
    visible: {
      opacity: 1,
      translateY: '0%',
    },
    hidden: {
      opacity: 0,
      translateY: '100%',
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: {
    duration: 0.3,
    delay: 0.5,
    ease: 'easeOut',
  },
};

interface FadeProps {
  top?: boolean;
  bottom?: boolean;
  className?: string;
}

export function Fade({ top = false, bottom = false, className }: FadeProps) {
  return (
    <div
      className={cn(
        'from-background pointer-events-none h-4 bg-linear-to-b to-transparent',
        top && 'bg-linear-to-b',
        bottom && 'bg-linear-to-t',
        className
      )}
    />
  );
}
interface SessionViewProps {
  appConfig: AppConfig;
}

export const SessionView = ({
  appConfig,
  ...props
}: React.ComponentProps<'section'> & SessionViewProps) => {
  useConnectionTimeout(200_000);
  useDebugMode({ enabled: IN_DEVELOPMENT });

  const messages = useChatMessages();
  const [chatOpen, setChatOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { setCvSummary } = useSession();

  // Listen for CV summaries sent to the room
  useCVSummaryListener((summary) => {
    console.log('CV summary received in session:', summary);
    setCvSummary(summary);
  });

  // Get voice assistant state to detect when AI is speaking
  const { state: agentState } = useVoiceAssistant();
  const isAgentSpeaking = agentState === 'speaking';

  const controls: ControlBarControls = {
    leave: true,
    microphone: true,
    chat: appConfig.supportsChatInput,
    camera: appConfig.supportsVideoInput,
    screenShare: appConfig.supportsVideoInput,
  };

  useEffect(() => {
    const lastMessage = messages.at(-1);
    const lastMessageIsLocal = lastMessage?.from?.isLocal === true;

    if (scrollAreaRef.current && lastMessageIsLocal) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <section className="relative z-10 h-full w-full overflow-hidden" {...props}>
      {/* Main content area - centered with Dan and Speech Bubble */}
      <div className="flex h-[calc(100%-120px)] items-center justify-center px-4 md:px-8">
        <div className="flex max-w-4xl flex-col items-center gap-6 md:flex-row">
          {/* Speech Bubble Content Box */}
          <div className="relative order-2 md:order-1">
            {/* Speech bubble tail pointing right to Dan */}
            <div className="absolute top-8 -right-3 h-0 w-0 border-t-[12px] border-b-[12px] border-l-[20px] border-t-transparent border-b-transparent border-l-[#7b2cbf]" />
            <div className="absolute top-8 -right-2 h-0 w-0 border-t-[10px] border-b-[10px] border-l-[18px] border-t-transparent border-b-transparent border-l-[#1a0f2e]/90" />

            <div className="relative max-w-lg space-y-4 rounded-2xl border-2 border-[#7b2cbf] bg-[#1a0f2e]/90 p-5 shadow-[0_0_30px_rgba(123,44,191,0.6)] backdrop-blur-sm">
              {/* Header */}
              <div className="border-b-2 border-[#7b2cbf] pb-3">
                <h2 className="neon-glow text-center font-mono text-lg font-bold text-[#00f5ff]">
                  {'// SESSION ACTIVE'}
                </h2>
                <p className="mt-2 text-center font-mono text-xs text-[#c77dff]">
                  Career Planning Mode
                </p>
              </div>

              {/* Chat Transcript Area */}
              <div className="h-[300px] overflow-hidden rounded border border-[#7b2cbf] bg-[#2a1a4e]/50 backdrop-blur-sm">
                <div className="border-b border-[#7b2cbf] bg-[#2a1a4e]/90 p-2">
                  <p className="font-mono text-xs font-bold text-[#00ff9f]">
                    {chatOpen ? '📝 TRANSCRIPT' : '💬 CONVERSATION'}
                  </p>
                </div>
                <ScrollArea ref={scrollAreaRef} className="h-[calc(100%-2.5rem)] p-4">
                  <ChatTranscript
                    hidden={!chatOpen}
                    messages={messages}
                    className="space-y-3 transition-opacity duration-300 ease-out"
                  />
                  {!chatOpen && (
                    <div className="space-y-3 font-mono text-xs text-[#c77dff]">
                      <div className="border-l-2 border-[#00f5ff] pl-3">
                        <p className="text-[#00ff9f]">&gt; Session Info</p>
                        <p className="mt-1">Your Level 11 agent is listening...</p>
                      </div>
                      <div className="border-l-2 border-[#ff006e] pl-3">
                        <p className="text-[#00ff9f]">&gt; Growth Stats</p>
                        <p className="mt-1 text-[#00f5ff]">Agent State: {agentState}</p>
                        {isAgentSpeaking && (
                          <p className="mt-1 text-[#ff006e]">🎤 Dan is speaking...</p>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>

          {/* Dan Character */}
          <div className="order-1 flex-shrink-0 md:order-2">
            <Image
              src="/dan.png"
              alt="Dan Character"
              width={240}
              height={360}
              className="h-auto w-48 md:w-60"
              priority
            />
          </div>
        </div>
      </div>

      {/* Bottom Control Bar */}
      <MotionBottom
        {...BOTTOM_VIEW_MOTION_PROPS}
        className="fixed inset-x-3 bottom-0 z-50 md:inset-x-12"
      >
        {appConfig.isPreConnectBufferEnabled && (
          <PreConnectMessage messages={messages} className="pb-4" />
        )}
        <div className="relative mx-auto max-w-lg rounded-2xl border-2 border-[#7b2cbf] bg-[#1a0f2e]/90 p-4 pb-3 shadow-[0_0_30px_rgba(123,44,191,0.4)] backdrop-blur-sm md:pb-6">
          <AgentControlBar controls={controls} onChatOpenChange={setChatOpen} />
        </div>
      </MotionBottom>
    </section>
  );
};
