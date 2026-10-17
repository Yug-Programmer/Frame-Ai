import React from 'react';
import { ChatMessage, GenerationRecord } from '../types/index.js';
import { VideoPlayer } from './VideoPlayer.js';
import ThoughtLine from './ThoughtLine.js';
import RefineFrame from './RefineFrame.js';
import type { RefineFrameStatus } from './RefineFrame.js';

interface AssistantMessageProps {
  message: ChatMessage;
  generation?: GenerationRecord;
  onShowScript: (generation: GenerationRecord) => void;
  onShowScenes: (generation: GenerationRecord) => void;
  onRegenerate: (generation: GenerationRecord) => void;
  onPublishToQoneqt: (generation: GenerationRecord) => void;
  isPublishing?: boolean;
}

/** Map pipeline status → RefineFrame status */
function toRefineStatus(status: string): RefineFrameStatus {
  if (status === 'completed') return 'complete';
  if (status === 'failed') return 'error';
  if (status === 'refining' || status === 'quality') return 'refining';
  if (status === 'queued') return 'queued';
  return 'generating';
}

/** Minimal inline renderer: bold, inline code, italic */
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part)) return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    if (/^`(.+)`$/.test(part)) return <code key={i} className="bg-white/10 text-white/90 text-[13px] px-1.5 py-0.5 rounded font-mono">{part.slice(1, -1)}</code>;
    if (/^\*(.+)\*$/.test(part)) return <em key={i} className="italic text-white/80">{part.slice(1, -1)}</em>;
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

function renderContent(text: string) {
  return text.split('\n').map((line, li) => {
    const h3 = line.match(/^### (.+)/);
    if (h3) return <p key={li} className="text-[15px] font-bold text-white mt-3 mb-0.5">{h3[1]}</p>;
    const h2 = line.match(/^## (.+)/);
    if (h2) return <p key={li} className="text-[17px] font-bold text-white mt-4 mb-1">{h2[1]}</p>;
    const h1 = line.match(/^# (.+)/);
    if (h1) return <p key={li} className="text-[20px] font-bold text-white mt-4 mb-1">{h1[1]}</p>;
    const bullet = line.match(/^[-*•]\s+(.+)/);
    if (bullet) return (
      <div key={li} className="flex items-start gap-2 my-0.5">
        <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-white/50 shrink-0" />
        <span className="text-[15px] text-white/90 leading-relaxed">{renderInline(bullet[1])}</span>
      </div>
    );
    const numbered = line.match(/^(\d+)\.\s+(.+)/);
    if (numbered) return (
      <div key={li} className="flex items-start gap-2 my-0.5">
        <span className="text-[13px] text-white/50 shrink-0 mt-0.5 tabular-nums">{numbered[1]}.</span>
        <span className="text-[15px] text-white/90 leading-relaxed">{renderInline(numbered[2])}</span>
      </div>
    );
    if (line.trim() === '') return <div key={li} className="h-2" />;
    return <p key={li} className="text-[15px] text-white/90 leading-relaxed">{renderInline(line)}</p>;
  });
}

/** Lines that are just the pipeline-kick-off message — suppress when generating */
const PIPELINE_INTRO_RE = /initiating the production pipeline|I'll transform this into/i;

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  generation,
  onShowScript,
  onShowScenes,
  onRegenerate,
  onPublishToQoneqt,
  isPublishing = false,
}) => {
  const activeGen = generation || message.generation;
  const isGenerating = activeGen && activeGen.status !== 'completed' && activeGen.status !== 'failed';
  const isCompleted = activeGen && activeGen.status === 'completed';
  const isFailed = activeGen && activeGen.status === 'failed';

  // Suppress the boilerplate intro line when the pipeline is running/done
  const showText = message.content && !(activeGen && PIPELINE_INTRO_RE.test(message.content));

  const thoughtSteps = [
    'Understanding topic & intent',
    'Writing narrative script',
    'Planning scenes & storyboard',
    'Generating visual assets',
    'Generating speech narration',
    'Composing video in FFmpeg',
    'Quality control',
  ];

  const STAGE_IDX: Record<string, number> = {
    queued: 0, analyzing: 1, scripting: 2, planning: 3,
    visuals: 4, audio: 5, composing: 6, quality: 7,
  };

  const visibleSteps = activeGen
    ? thoughtSteps.slice(0, Math.max(1, STAGE_IDX[activeGen.status] ?? 0))
    : [];

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-3xl mx-auto flex items-start gap-3">

        {/* Frame logo — no border, no bg */}
        <img
          src="/Frame Ai Logo.png"
          alt="Frame"
          className="w-7 h-7 shrink-0 object-contain mt-0.5 select-none"
          draggable={false}
        />

        {/* Content column */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* ThoughtLine — shown while pipeline is running or failed */}
          {activeGen && (isGenerating || isFailed) && (
            <ThoughtLine
              working={!!isGenerating}
              steps={visibleSteps}
              label={activeGen.currentStageText || 'Generating your video…'}
              doneLabel={isFailed ? 'Generation stopped' : ''}
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
          )}

          {/* RefineFrame video rendering animation — below ThoughtLine while active */}
          {activeGen && isGenerating && (
            <RefineFrame
              status={toRefineStatus(activeGen.status)}
              aspectRatio="16 / 9"
              width={480}
              radius={12}
              background="#111"
              color="#f5f5f5"
              stageDuration={400}
              sweep
              showStatus
            />
          )}

          {/* Error note */}
          {isFailed && activeGen.error && (
            <p className="text-[13px] text-white/40 mt-1">{activeGen.error}</p>
          )}

          {/* Plain text content for non-pipeline messages */}
          {showText && (
            <div className="space-y-1">
              {renderContent(message.content)}
            </div>
          )}

          {/* Video Player when done */}
          {activeGen && isCompleted && (
            <VideoPlayer
              generation={activeGen}
              onShowScript={() => onShowScript(activeGen)}
              onShowScenes={() => onShowScenes(activeGen)}
              onRegenerate={() => onRegenerate(activeGen)}
              onPublishToQoneqt={() => onPublishToQoneqt(activeGen)}
              isPublishing={isPublishing}
            />
          )}
        </div>
      </div>
    </div>
  );
};
