import React from 'react';
import { GenerationRecord, PipelineStatus as StatusType } from '../types/index.js';
import ThoughtLine from './ThoughtLine.js';

interface PipelineStatusProps {
  generation: GenerationRecord;
}

const STAGE_STEPS = [
  'Understanding topic & intent',
  'Writing narrative script',
  'Planning scenes & storyboard',
  'Generating 9:16 visual assets',
  'Generating speech narration',
  'Composing video in FFmpeg',
  'Automated quality control',
  'Ready to publish',
];

const STAGE_ORDER: Record<StatusType, number> = {
  queued: 0,
  analyzing: 1,
  scripting: 2,
  planning: 3,
  visuals: 4,
  audio: 5,
  composing: 6,
  quality: 7,
  completed: 8,
  failed: -1,
};

export const PipelineStatusTimeline: React.FC<PipelineStatusProps> = ({ generation }) => {
  const currentIdx = STAGE_ORDER[generation.status] ?? 0;
  const isFailed = generation.status === 'failed';
  const isCompleted = generation.status === 'completed';
  const isWorking = !isFailed && !isCompleted;

  // Build the steps visible so far: all completed + current active
  const visibleSteps = STAGE_STEPS.slice(0, Math.max(1, currentIdx));

  return (
    <div className="my-2">
      <ThoughtLine
        working={isWorking}
        steps={visibleSteps}
        label={generation.currentStageText || 'Generating your video…'}
        doneLabel={isCompleted ? 'Video ready' : isFailed ? 'Generation stopped' : ''}
        glyph="sparkle"
        fontSize={14}
        color="rgba(255,255,255,0.9)"
        breathPeriod={1.6}
        breathDepth={0.45}
        settleDuration={400}
        settleBlur={2}
        collapsible
        collapseOnSettle={false}
        showTimer
      />

      {/* Error display if failed */}
      {isFailed && generation.error && (
        <p className="mt-2 text-[12px] text-white/50 pl-1">{generation.error}</p>
      )}
    </div>
  );
};

