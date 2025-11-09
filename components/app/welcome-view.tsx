'use client';

import Image from 'next/image';
import { CVUpload } from '@/components/app/cv-upload';
import { useSession } from '@/components/app/session-provider';
import { Button } from '@/components/livekit/button';

interface WelcomeViewProps {
  startButtonText: string;
  onStartCall: () => void;
}

export const WelcomeView = ({
  startButtonText,
  onStartCall,
  ref,
}: React.ComponentProps<'div'> & WelcomeViewProps) => {
  const { setCvSummary, roomName, cvSummary } = useSession();

  const handleSummaryGenerated = (summary: string) => {
    setCvSummary(summary);
  };

  return (
    <div ref={ref} className="flex h-full w-full items-center justify-center px-4 md:px-8">
      {/* Centered container with Speech Bubble and Dan */}
      <div className="flex max-w-4xl flex-col items-center gap-6 md:flex-row">
        {/* Speech Bubble Box */}
        <div className="relative order-2 md:order-1">
          {/* Speech bubble tail/pointer (pointing right to Dan) */}
          <div className="absolute top-8 -right-3 h-0 w-0 border-t-[12px] border-b-[12px] border-l-[20px] border-t-transparent border-b-transparent border-l-[#7b2cbf]" />
          <div className="absolute top-8 -right-2 h-0 w-0 border-t-[10px] border-b-[10px] border-l-[18px] border-t-transparent border-b-transparent border-l-black/90" />

          <div className="relative max-w-lg space-y-4 rounded-2xl border-2 border-[#7b2cbf] bg-black/90 p-5 shadow-[0_0_30px_rgba(123,44,191,0.6)] backdrop-blur-sm">
            <div className="space-y-3">
              <h1 className="text-xs leading-tight text-[#00ff9f] md:text-sm">
                YOUR LEVEL 11 ENGINEER
              </h1>

              <div className="space-y-1.5 border-l-2 border-[#ff006e] pl-3">
                <p className="text-[10px] leading-relaxed text-[#c77dff] md:text-xs">
                  <span className="text-[#00f5ff]">&gt;</span> Career planning
                </p>
                <p className="text-[10px] leading-relaxed text-[#c77dff] md:text-xs">
                  <span className="text-[#00f5ff]">&gt;</span> Track progress
                </p>
                <p className="text-[10px] leading-relaxed text-[#c77dff] md:text-xs">
                  <span className="text-[#00f5ff]">&gt;</span> Level up
                </p>
              </div>

              <div className="mt-3 rounded border border-[#7b2cbf] bg-[#2a1a4e]/80 p-2">
                <p className="text-[9px] leading-tight text-[#00ff9f] md:text-[10px]">
                  <span className="text-[#ff006e]">STATUS:</span> Ready to help navigate your career
                </p>
              </div>
            </div>

            {/* CV Upload Component */}
            <CVUpload
              onSummaryGenerated={handleSummaryGenerated}
              roomName={roomName ?? undefined}
            />

            {/* Show start button only after CV is analyzed */}
            {cvSummary && (
              <Button
                variant="primary"
                size="sm"
                onClick={onStartCall}
                className="retro-border neon-pulse w-full bg-[#ff006e] px-4 py-2 text-[10px] text-white hover:bg-[#ff006e]/80 md:text-xs"
              >
                {startButtonText}
              </Button>
            )}
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
  );
};
