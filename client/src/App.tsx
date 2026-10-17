import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppShell } from './components/AppShell.js';
import { Conversation } from './components/Conversation.js';
import { Composer } from './components/Composer.js';
import { SettingsPanel } from './components/SettingsPanel.js';
import { HowToUseModal } from './components/HowToUseModal.js';
import { ChatMessage, GenerationRecord } from './types/index.js';
import { api } from './services/api.js';

export const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<GenerationRecord[]>([]);
  const [activeGenerationId, setActiveGenerationId] = useState<string | undefined>();
  const [activeGeneration, setActiveGeneration] = useState<GenerationRecord | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load recent generations on startup
  const loadRecentGenerations = useCallback(async () => {
    try {
      const data = await api.listGenerations();
      if (data?.jobs && data.jobs.length > 0) {
        setRecentGenerations(data.jobs);
        const latest = data.jobs[0];
        setActiveGeneration((curr) => {
          if (!curr) {
            setActiveGenerationId(latest.id);
            setMessages((prevMsgs) => {
              if (prevMsgs.length === 0) {
                const title = latest.script?.title || latest.originalPrompt;
                return [
                  {
                    id: `init_user_${latest.id}`,
                    role: 'user',
                    content: latest.originalPrompt,
                    timestamp: new Date(latest.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                  {
                    id: `init_asst_${latest.id}`,
                    role: 'assistant',
                    content: latest.status === 'completed'
                      ? `Project "${title}" (${latest.scenes.length} scenes, ready for preview).`
                      : `Project "${title}" (Status: ${latest.status}).`,
                    timestamp: new Date(latest.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    generation: latest,
                  },
                ];
              }
              return prevMsgs;
            });
            return latest;
          }
          return curr;
        });
      }
    } catch {
      // Backend may be starting up
    }
  }, []);

  useEffect(() => {
    loadRecentGenerations();
  }, [loadRecentGenerations]);

  // Sync theme to DOM
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Polling active generation job status
  const pollActiveJob = useCallback(async (jobId: string) => {
    try {
      const job = await api.getGeneration(jobId);
      setActiveGeneration(job);

      if (job.status === 'completed' || job.status === 'failed') {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        loadRecentGenerations();
      }
    } catch {
      // transient network poll error
    }
  }, [loadRecentGenerations]);

  useEffect(() => {
    if (!activeGenerationId) return;

    // Immediate poll
    pollActiveJob(activeGenerationId);

    // Setup periodic polling while active
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(() => {
      pollActiveJob(activeGenerationId);
    }, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeGenerationId, pollActiveJob]);

  // Handle message sending through conversational control layer
  const handleSendMessage = async (
    text: string,
    duration?: number,
    aspectRatio?: string,
    model?: 'frame-bolt' | 'frame-titan',
    template?: any
  ) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      // Forward duration, aspect ratio, model, and template
      const res = await api.sendChatMessage(text, activeGenerationId, messages, aspectRatio, duration, model, template);

      setMessages((prev) => [...prev, res.message]);

      if (res.generationId) {
        setActiveGenerationId(res.generationId);
      }

      loadRecentGenerations();
    } catch (err: unknown) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `Error: ${err instanceof Error ? err.message : 'Failed to process message'}. Please verify backend configuration in Settings.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Stop active generation in progress
  const handleStopGeneration = async () => {
    if (!activeGenerationId) return;
    try {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      await api.stopGeneration(activeGenerationId);
      setActiveGeneration((prev) =>
        prev
          ? {
              ...prev,
              status: 'failed',
              error: 'Generation stopped by user.',
              currentStageText: 'Generation stopped by user.',
            }
          : undefined
      );
      setIsSending(false);
      loadRecentGenerations();
    } catch (err) {
      console.error('Failed to stop generation:', err);
    }
  };

  // Start a fresh generation workspace
  const handleNewGeneration = () => {
    setActiveGenerationId(undefined);
    setActiveGeneration(undefined);
    setMessages([]);
  };

  // Load a historical generation from the Library
  const handleSelectGeneration = (gen: GenerationRecord) => {
    setActiveGenerationId(gen.id);
    setActiveGeneration(gen);

    const title = gen.script?.title || gen.originalPrompt;
    setMessages([
      {
        id: `hist_user_${gen.id}`,
        role: 'user',
        content: gen.originalPrompt,
        timestamp: new Date(gen.createdAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
      {
        id: `hist_asst_${gen.id}`,
        role: 'assistant',
        content:
          gen.status === 'completed'
            ? `Loaded project: "${title}". Generated ${gen.scenes.length} scenes, ready for preview and publishing.`
            : `Loaded project: "${title}" (Status: ${gen.status}).`,
        timestamp: new Date(gen.updatedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        generation: gen,
      },
    ]);
  };

  const isGenerating =
    isSending ||
    (!!activeGeneration &&
      activeGeneration.status !== 'completed' &&
      activeGeneration.status !== 'failed');

  return (
    <AppShell
      recentGenerations={recentGenerations}
      activeGenerationId={activeGenerationId}
      onSelectGeneration={handleSelectGeneration}
      onNewGeneration={handleNewGeneration}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onOpenHowToUse={() => setIsHowToUseOpen(true)}
    >
      {/* Central Conversation Workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        <Conversation
          messages={messages}
          activeGeneration={activeGeneration}
          onSelectSuggestion={(prompt) => handleSendMessage(prompt, 30)}
          onRegenerateGeneration={(gen) => handleSendMessage(`Create the video again: ${gen.originalPrompt}`, 30)}
          onRefreshActiveGeneration={() => {
            if (activeGenerationId) pollActiveJob(activeGenerationId);
          }}
        />

        {/* Composer with Model Dropdown, Aspect Ratio, Duration & Stop Generation button */}
        <Composer
          onSendMessage={handleSendMessage}
          disabled={isGenerating}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
        />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsPanel
          theme={theme}
          onToggleTheme={setTheme}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* How to Use Modal */}
      {isHowToUseOpen && (
        <HowToUseModal onClose={() => setIsHowToUseOpen(false)} />
      )}
    </AppShell>
  );
};

export default App;
