import React, { useRef, useState } from 'react';
import { GenerationRecord } from '../types/index.js';
import { Send } from 'lucide-react';

interface VideoPlayerProps {
  generation: GenerationRecord;
  onShowScript: () => void;
  onShowScenes: () => void;
  onRegenerate: () => void;
  onPublishToQoneqt: () => void;
  isPublishing?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  generation,
  onPublishToQoneqt,
  isPublishing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [_playing, setPlaying] = useState(false);

  return (
    <div className="w-full my-2 space-y-3">
      {/* Video — 9:16 portrait */}
      <div className="flex justify-start">
        <div className="relative w-full max-w-[260px] aspect-[9/16] bg-black rounded-xl overflow-hidden shadow-xl border border-white/10">
          {generation.videoUrl ? (
            <video
              ref={videoRef}
              src={generation.videoUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/30 text-sm">
              Video unavailable
            </div>
          )}
        </div>
      </div>

      {/* Publish button */}
      <button
        onClick={onPublishToQoneqt}
        disabled={isPublishing}
        className="inline-flex items-center gap-2 px-3.5 py-2 text-[13px] font-medium text-white bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7e22ce] active:scale-[0.98] disabled:opacity-50 rounded-xl transition-all shadow-md shadow-purple-950/40 border border-white/15 cursor-pointer"
      >
        <img
          src="/qoneqt-icon.png"
          alt="Qoneqt"
          className="w-4 h-4 object-contain shrink-0"
          style={{ width: '16px', height: '16px' }}
        />
        <span>{isPublishing ? 'Publishing…' : 'Publish to Qoneqt'}</span>
        <span className="text-white/60 text-[11px] font-mono ml-0.5">↗</span>
      </button>
    </div>
  );
};
