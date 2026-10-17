import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage, GenerationRecord, Script } from '../types/index.js';
import { UserMessage } from './UserMessage.js';
import { AssistantMessage } from './AssistantMessage.js';
import { SuggestionList } from './SuggestionList.js';
import { ScriptViewer } from './ScriptViewer.js';
import { SceneViewer } from './SceneViewer.js';
import { api } from '../services/api.js';

interface ConversationProps {
  messages: ChatMessage[];
  activeGeneration?: GenerationRecord;
  onSelectSuggestion: (prompt: string) => void;
  onRegenerateGeneration: (gen: GenerationRecord) => void;
  onRefreshActiveGeneration: () => void;
}

export const Conversation: React.FC<ConversationProps> = ({
  messages,
  activeGeneration,
  onSelectSuggestion,
  onRegenerateGeneration,
  onRefreshActiveGeneration,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [selectedScenesGen, setSelectedScenesGen] = useState<GenerationRecord | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishFeedback, setPublishFeedback] = useState<{
    success: boolean;
    message: string;
    url?: string;
  } | null>(null);

  // Auto-scroll on new messages or pipeline state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, activeGeneration?.progress, activeGeneration?.status]);

  const handleShowScript = (gen: GenerationRecord) => {
    if (gen.script) {
      setSelectedScript(gen.script);
    }
  };

  const handleShowScenes = (gen: GenerationRecord) => {
    setSelectedScenesGen(gen);
  };

  const handleSaveScript = async (updatedScript: Script, reRender: boolean) => {
    if (!activeGeneration) return;
    await api.updateScript(activeGeneration.id, updatedScript, reRender);
    setSelectedScript(null);
    onRefreshActiveGeneration();
  };

  const handleRegenerateScene = async (sceneId: number, instruction?: string) => {
    if (!selectedScenesGen) return;
    await api.regenerateScene(selectedScenesGen.id, sceneId, instruction);
    onRefreshActiveGeneration();
  };

  const handlePublishToQoneqt = async (gen: GenerationRecord) => {
    if (!gen.videoUrl) return;

    // Open Qoneqt website in a new tab immediately on user click
    window.open('https://qoneqt.com/home', '_blank', 'noopener,noreferrer');

    setIsPublishing(true);
    setPublishFeedback(null);
    try {
      const res = await api.publishToQoneqt({
        title: gen.script?.title || 'Frame AI Video',
        caption: gen.script?.hook || gen.script?.title || 'Created with Frame AI Video Engine',
        videoUrl: gen.videoUrl,
      });

      if (res.success) {
        setPublishFeedback({
          success: true,
          message: 'Successfully published to Qoneqt Global Feed!',
          url: res.postUrl || 'https://qoneqt.com/home',
        });
      } else {
        setPublishFeedback({
          success: false,
          message: res.error || 'Qoneqt publication failed.',
        });
      }
    } catch (err: unknown) {
      setPublishFeedback({
        success: false,
        message: err instanceof Error ? err.message : 'Publish request failed',
      });
    } finally {
      setIsPublishing(false);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-[#212121]">
        <SuggestionList onSelectSuggestion={onSelectSuggestion} />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#212121] pt-2 pb-8">
      {/* Messages Stream */}
      {messages.map((msg, index) => {
        const isLatest = index === messages.length - 1;
        const genForMsg = isLatest && activeGeneration ? activeGeneration : msg.generation;

        return msg.role === 'user' ? (
          <UserMessage key={msg.id} message={msg} />
        ) : (
          <AssistantMessage
            key={msg.id}
            message={msg}
            generation={genForMsg}
            onShowScript={handleShowScript}
            onShowScenes={handleShowScenes}
            onRegenerate={onRegenerateGeneration}
            onPublishToQoneqt={handlePublishToQoneqt}
            isPublishing={isPublishing}
          />
        );
      })}

      {/* Scroll sentinel — ensures last message is fully visible */}
      <div ref={bottomRef} className="h-px" />

      {/* Publish Feedback Toast / Alert */}
      {publishFeedback && (
        <div className="max-w-3xl mx-auto my-3 px-6">
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-xl ${
              publishFeedback.success
                ? 'bg-[#18181b] border-purple-500/50 text-white'
                : 'bg-[#18181b] border-red-500/40 text-white/90'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/qoneqt-icon.png"
                alt="Qoneqt"
                className="w-4 h-4 object-contain shrink-0"
                style={{ width: '16px', height: '16px' }}
              />
              <span>{publishFeedback.message}</span>
              {publishFeedback.url && (
                <a
                  href={publishFeedback.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline font-semibold ml-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View on Qoneqt ↗
                </a>
              )}
            </div>
            <button
              onClick={() => setPublishFeedback(null)}
              className="ml-3 font-mono opacity-60 hover:opacity-100 text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Script Viewer Modal */}
      {selectedScript && (
        <ScriptViewer
          script={selectedScript}
          onClose={() => setSelectedScript(null)}
          onSaveScript={handleSaveScript}
        />
      )}

      {/* Scene Viewer Modal */}
      {selectedScenesGen && (
        <SceneViewer
          scenes={selectedScenesGen.scenes}
          onClose={() => setSelectedScenesGen(null)}
          onRegenerateScene={handleRegenerateScene}
        />
      )}
    </div>
  );
};
