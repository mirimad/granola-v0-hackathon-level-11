import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarVisualizer,
  type TrackReference,
  VideoTrack,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';

const MotionContainer = motion.create('div');

const ANIMATION_TRANSITION = {
  type: 'spring',
  stiffness: 675,
  damping: 75,
  mass: 1,
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface TileLayoutProps {
  chatOpen: boolean;
}

export function TileLayout({ chatOpen }: TileLayoutProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;

  const animationDelay = chatOpen ? 0 : 0.15;
  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className="relative h-full w-full max-w-2xl">
        <AnimatePresence mode="popLayout">
          {!isAvatar && (
            // Audio Agent - Retro Visualizer
            <MotionContainer
              key="agent"
              layoutId="agent"
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              transition={{
                ...ANIMATION_TRANSITION,
                delay: animationDelay,
              }}
              className="flex h-full w-full items-center justify-center"
            >
              <div className="retro-border pixel-corners relative flex aspect-square w-full max-w-md items-center justify-center rounded-lg bg-gradient-to-br from-[#2a1a4e] to-[#1a0f2e]">
                <BarVisualizer
                  barCount={7}
                  state={agentState}
                  options={{ minHeight: 10 }}
                  trackRef={agentAudioTrack}
                  className="flex h-32 items-end justify-center gap-2"
                >
                  <span
                    className={cn([
                      'min-h-4 w-4 rounded-sm bg-[#00f5ff]',
                      'origin-bottom transition-all duration-250 ease-linear',
                      'data-[lk-highlighted=true]:bg-[#ff006e] data-[lk-muted=true]:bg-[#7b2cbf]',
                      'shadow-[0_0_10px_currentColor]',
                    ])}
                  />
                </BarVisualizer>
                <div className="absolute right-0 bottom-6 left-0 text-center">
                  <div className="neon-glow font-mono text-sm text-[#00ff9f]">
                    AUDIO MODE ACTIVE
                  </div>
                </div>
              </div>
            </MotionContainer>
          )}

          {isAvatar && (
            // Avatar Agent - Retro Video Frame
            <MotionContainer
              key="avatar"
              layoutId="avatar"
              initial={{
                scale: 0.8,
                opacity: 0,
                filter: 'blur(20px)',
              }}
              animate={{
                scale: 1,
                opacity: 1,
                filter: 'blur(0px)',
              }}
              transition={{
                ...ANIMATION_TRANSITION,
                delay: animationDelay,
                filter: {
                  duration: 1,
                },
              }}
              className="flex h-full w-full items-center justify-center"
            >
              <div className="retro-border pixel-corners relative aspect-square w-full max-w-md overflow-hidden rounded-lg bg-black">
                <VideoTrack
                  width={videoWidth}
                  height={videoHeight}
                  trackRef={agentVideoTrack}
                  className="h-full w-full object-cover"
                />
                <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-[#1a0f2e] to-transparent p-4">
                  <div className="neon-glow font-mono text-sm text-[#00ff9f]">
                    LEVEL 11 AGENT // LIVE
                  </div>
                </div>
              </div>
            </MotionContainer>
          )}
        </AnimatePresence>

        {/* Camera & Screen Share - Small thumbnail */}
        <AnimatePresence>
          {((cameraTrack && isCameraEnabled) || (screenShareTrack && isScreenShareEnabled)) && (
            <MotionContainer
              key="camera"
              layout="position"
              layoutId="camera"
              initial={{
                opacity: 0,
                scale: 0,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0,
              }}
              transition={{
                ...ANIMATION_TRANSITION,
                delay: animationDelay,
              }}
              className="absolute right-4 bottom-4 z-10"
            >
              <div className="overflow-hidden rounded border-2 border-[#00f5ff] shadow-[0_0_20px_rgba(0,245,255,0.5)]">
                <VideoTrack
                  trackRef={cameraTrack || screenShareTrack}
                  width={(cameraTrack || screenShareTrack)?.publication.dimensions?.width ?? 0}
                  height={(cameraTrack || screenShareTrack)?.publication.dimensions?.height ?? 0}
                  className="bg-muted aspect-square w-[120px] object-cover"
                />
              </div>
            </MotionContainer>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
