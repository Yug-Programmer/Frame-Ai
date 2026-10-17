import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Clock,
  RectangleVertical,
  RectangleHorizontal,
  Square,
  Tv,
  Film,
  ShieldCheck,
  ChevronDown,
  Check,
  Zap,
  Brain,
} from 'lucide-react';
import { VideoTemplate } from '../types/index.js';

interface ComposerProps {
  onSendMessage: (
    message: string,
    duration?: number,
    aspectRatio?: string,
    model?: 'frame-bolt' | 'frame-titan',
    template?: VideoTemplate
  ) => void;
  disabled?: boolean;
  showSuggestions?: boolean;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

const MODEL_OPTIONS = [
  {
    id: 'frame-bolt' as const,
    name: 'Frame Bolt',
    desc: 'Lightning fast • Local voice • Max 30s',
    tag: 'Fast',
    icon: Zap,
    durations: [
      { value: 15, label: '15s', desc: 'Micro' },
      { value: 20, label: '20s', desc: 'Short' },
      { value: 30, label: '30s', desc: 'Standard' },
    ],
  },
  {
    id: 'frame-titan' as const,
    name: 'Frame Titan',
    desc: 'Deep reasoning • ElevenLabs studio • Max 60s',
    tag: 'Thinking',
    icon: Brain,
    durations: [
      { value: 20, label: '20s', desc: 'Short' },
      { value: 30, label: '30s', desc: 'Standard' },
      { value: 45, label: '45s', desc: 'Deep-dive' },
      { value: 60, label: '60s', desc: 'Full' },
    ],
  },
];

const ASPECT_OPTIONS = [
  {
    value: '9:16',
    label: '9:16 Vertical',
    hint: 'Shorts • Reels • TikTok',
    icon: RectangleVertical,
  },
  {
    value: '16:9',
    label: '16:9 Landscape',
    hint: 'YouTube • Desktop',
    icon: RectangleHorizontal,
  },
  {
    value: '1:1',
    label: '1:1 Square',
    hint: 'Instagram Feed',
    icon: Square,
  },
  {
    value: '4:5',
    label: '4:5 Portrait',
    hint: 'Social Feed',
    icon: RectangleVertical,
  },
  {
    value: '4:3',
    label: '4:3 Standard',
    hint: 'Classic Video',
    icon: Tv,
  },
  {
    value: '21:9',
    label: '21:9 Ultrawide',
    hint: 'Cinematic Frame',
    icon: Film,
  },
  {
    value: 'qoneqt',
    label: 'Qoneqt Feed',
    hint: 'Official Qoneqt Vertical',
    icon: ShieldCheck,
    isExclusive: true,
  },
];

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  disabled = false,
  isGenerating = false,
  onStopGeneration,
}) => {
  const [text, setText] = useState('');
  const [selectedModel, setSelectedModel] = useState<'frame-bolt' | 'frame-titan'>('frame-bolt');
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [selectedAspect, setSelectedAspect] = useState<string>('9:16');

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);
  const [isAspectOpen, setIsAspectOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const durationRef = useRef<HTMLDivElement>(null);
  const aspectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 180)}px`;
    }
  }, [text]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setIsModelOpen(false);
      }
      if (durationRef.current && !durationRef.current.contains(e.target as Node)) {
        setIsDurationOpen(false);
      }
      if (aspectRef.current && !aspectRef.current.contains(e.target as Node)) {
        setIsAspectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed, selectedDuration, selectedAspect, selectedModel);
    setText('');
    setIsModelOpen(false);
    setIsDurationOpen(false);
    setIsAspectOpen(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const currentModelOption = MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[0];
  const CurrentModelIcon = currentModelOption.icon;
  const currentAspectOption = ASPECT_OPTIONS.find((opt) => opt.value === selectedAspect) || ASPECT_OPTIONS[0];
  const CurrentAspectIcon = currentAspectOption.icon;

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 select-none">
      <div className="bg-[#2F2F2F] border border-white/10 rounded-2xl focus-within:border-white/30 transition-all p-2.5 flex flex-col relative">
        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask anything or describe the video you want to create..."
          rows={1}
          className="w-full px-3 py-2 text-[15px] text-white placeholder:text-white/40 bg-transparent resize-none focus:outline-none leading-relaxed max-h-[180px]"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between pt-1 px-1">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-white/60 flex-wrap">
            {/* 1. Custom Sleek Model Dropdown (Frame Bolt vs Frame Titan) */}
            <div className="relative" ref={modelRef}>
              <button
                type="button"
                onClick={() => {
                  setIsModelOpen((prev) => !prev);
                  setIsDurationOpen(false);
                  setIsAspectOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer select-none ${
                  isModelOpen
                    ? 'bg-white text-black border-white'
                    : 'bg-[#3A3A3A] border-white/10 hover:border-white/30 text-white/90 hover:text-white'
                }`}
                title="AI Model Engine"
              >
                <CurrentModelIcon className="w-3.5 h-3.5 text-current shrink-0" />
                <span>{currentModelOption.name}</span>
                <ChevronDown
                  className={`w-3 h-3 text-current transition-transform duration-150 ${
                    isModelOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Upward Popover Menu */}
              {isModelOpen && (
                <div className="absolute bottom-full mb-1.5 left-0 min-w-[250px] bg-[#2A2A2A] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-1">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Select AI Model
                  </div>
                  {MODEL_OPTIONS.map((opt) => {
                    const isSelected = selectedModel === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(opt.id);
                          if (opt.id === 'frame-bolt' && selectedDuration > 30) {
                            setSelectedDuration(30);
                          }
                          setIsModelOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                          isSelected
                            ? 'bg-white text-black font-semibold'
                            : 'text-white/80 hover:text-white hover:bg-[#22222B]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-black text-white' : 'bg-[#22222B] text-white'
                            }`}
                          >
                            <IconComp className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-[12px]">{opt.name}</span>
                              <span
                                className={`px-1 py-0.2 text-[9px] font-semibold rounded border ${
                                  isSelected
                                    ? 'text-black bg-black/10 border-black/30'
                                    : 'text-white/70 bg-white/5 border-white/20'
                                }`}
                              >
                                {opt.tag}
                              </span>
                            </div>
                            <span className="text-[10px] opacity-65 block leading-tight mt-0.5">
                              {opt.desc}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Custom Sleek Duration Dropdown (Bound to Selected Model) */}
            <div className="relative" ref={durationRef}>
              <button
                type="button"
                onClick={() => {
                  setIsDurationOpen((prev) => !prev);
                  setIsModelOpen(false);
                  setIsAspectOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer select-none ${
                  isDurationOpen
                    ? 'bg-white text-black border-white'
                    : 'bg-[#3A3A3A] border-white/10 hover:border-white/30 text-white/90 hover:text-white'
                }`}
                title="Target video duration"
              >
                <Clock className="w-3 h-3 text-current shrink-0" />
                <span>{selectedDuration}s</span>
                <ChevronDown
                  className={`w-3 h-3 text-current transition-transform duration-150 ${
                    isDurationOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Upward Popover Menu */}
              {isDurationOpen && (
                <div className="absolute bottom-full mb-1.5 left-0 min-w-[140px] bg-[#2A2A2A] border border-white/10 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-0.5">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Duration ({currentModelOption.name})
                  </div>
                  {currentModelOption.durations.map((opt) => {
                    const isSelected = selectedDuration === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSelectedDuration(opt.value);
                          setIsDurationOpen(false);
                        }}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                          isSelected
                            ? 'bg-white text-black font-semibold'
                            : 'text-white/80 hover:text-white hover:bg-[#22222B]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold">{opt.label}</span>
                          <span className="text-[11px] opacity-60">({opt.desc})</span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-black shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Custom Sleek Video Aspect Ratio Dropdown */}
            <div className="relative" ref={aspectRef}>
              <button
                type="button"
                onClick={() => {
                  setIsAspectOpen((prev) => !prev);
                  setIsModelOpen(false);
                  setIsDurationOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors cursor-pointer select-none ${
                  isAspectOpen
                    ? 'bg-white text-black border-white'
                    : 'bg-[#3A3A3A] border-white/10 hover:border-white/30 text-white/90 hover:text-white'
                }`}
                title="Video Aspect Ratio"
              >
                <CurrentAspectIcon className="w-3 h-3 text-current shrink-0" />
                <span>{currentAspectOption.label}</span>
                {currentAspectOption.isExclusive && (
                  <span
                    className={`px-1 py-0.2 text-[9px] font-semibold rounded border ${
                      isAspectOpen
                        ? 'text-black bg-black/10 border-black/30'
                        : 'text-white bg-white/10 border-white/30'
                    }`}
                  >
                    Exclusive
                  </span>
                )}
                <ChevronDown
                  className={`w-3 h-3 text-current transition-transform duration-150 ${
                    isAspectOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Upward Popover Menu */}
              {isAspectOpen && (
                <div className="absolute bottom-full mb-1.5 left-0 min-w-[230px] bg-[#2A2A2A] border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5">
                  <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-white/40">
                    Video Aspect Ratio
                  </div>
                  {ASPECT_OPTIONS.map((opt) => {
                    const isSelected = selectedAspect === opt.value;
                    const IconComp = opt.icon;
                    return (
                      <React.Fragment key={opt.value}>
                        {opt.isExclusive && <div className="h-px bg-white/15 my-1" />}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAspect(opt.value);
                            setIsAspectOpen(false);
                          }}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors text-left ${
                            isSelected
                              ? 'bg-white text-black font-semibold'
                              : 'text-white/80 hover:text-white hover:bg-[#22222B]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <IconComp className="w-3.5 h-3.5 shrink-0 text-current" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium">{opt.label}</span>
                                {opt.isExclusive && (
                                  <span
                                    className={`px-1.5 py-0.2 text-[9px] font-semibold rounded border ${
                                      isSelected
                                        ? 'text-black bg-black/10 border-black/30'
                                        : 'text-white bg-white/10 border-white/30'
                                    }`}
                                  >
                                    Exclusive
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] opacity-60 block leading-tight">
                                {opt.hint}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-black shrink-0 ml-2" />}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action buttons on right: Stop button during generation, Send button otherwise */}
          <div className="flex items-center gap-2">
            {isGenerating && (
              <button
                type="button"
                onClick={onStopGeneration}
                title="Stop current video generation"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm select-none"
              >
                <Square className="w-2.5 h-2.5 fill-current text-black shrink-0" />
                <span>Stop Generation</span>
              </button>
            )}

            {!isGenerating && (
              <button
                onClick={handleSend}
                disabled={!canSend}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  canSend
                    ? 'bg-white text-black hover:bg-white/90 active:scale-95 cursor-pointer'
                    : 'bg-[#1A1A22] border border-[#2A2A36] text-white/30 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4 text-current" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </div>
      <p className="text-[11px] text-center text-white/40 mt-2">
        Powered by GroqCloud GPT-OSS 120B, ElevenLabs, and Frame Cinematic Agent.
      </p>
    </div>
  );
};

