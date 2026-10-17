import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  HelpCircle,
  User,
  Film,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { GenerationRecord } from '../types/index.js';

interface AppShellProps {
  children: React.ReactNode;
  recentGenerations?: GenerationRecord[];
  activeGenerationId?: string;
  onSelectGeneration?: (gen: GenerationRecord) => void;
  onNewGeneration?: () => void;
  onOpenSettings?: () => void;
  onOpenHowToUse?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  recentGenerations = [],
  activeGenerationId,
  onSelectGeneration,
  onNewGeneration,
  onOpenSettings,
  onOpenHowToUse,
}) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const libraryRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (libraryRef.current && !libraryRef.current.contains(e.target as Node)) {
        setIsLibraryOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#212121] text-white overflow-hidden select-none font-sans relative">
      {/* ========================================================
          TOP-LEFT CORNER BUTTONS: Settings & How to Use
          ======================================================== */}
      <div className="fixed top-4 left-5 z-40 flex items-center gap-2">
        {/* 1. Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          title="Settings & Diagnostics"
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#16161C] hover:bg-[#202028] border border-[#2A2A36] hover:border-white/40 text-white/70 hover:text-white transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* 2. How to Use Button */}
        <button
          type="button"
          onClick={onOpenHowToUse}
          title="How to Use Frame AI"
          className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-[#16161C] hover:bg-[#202028] border border-[#2A2A36] hover:border-white/40 text-white/80 hover:text-white text-xs font-medium transition-all shadow-lg active:scale-95 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-white/70" />
          <span className="hidden sm:inline">How to Use</span>
        </button>
      </div>

      {/* ========================================================
          TOP-RIGHT CORNER BUTTONS: Account & Library Dropdown
          ======================================================== */}
      <div className="fixed top-4 right-5 z-40 flex items-center gap-2">
        {/* 3. Account Button & Popover */}
        <div className="relative" ref={accountRef}>
          <button
            type="button"
            onClick={() => {
              setIsAccountOpen((prev) => !prev);
              setIsLibraryOpen(false);
            }}
            title="Account & Profile"
            className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all shadow-lg active:scale-95 cursor-pointer ${
              isAccountOpen
                ? 'bg-white text-black border-white'
                : 'bg-[#16161C] hover:bg-[#202028] border-[#2A2A36] hover:border-white/40 text-white/80 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
          </button>

          {/* Account Popover */}
          {isAccountOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-[#16161C] border border-[#2A2A36] rounded-2xl shadow-2xl p-4 z-50 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-[#252530]">
                <div className="w-10 h-10 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shrink-0">
                  FA
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate text-[13px]">Frame Creator</div>
                  <div className="text-[11px] text-white/50 truncate">creator@frameai.local</div>
                </div>
              </div>

              <div className="py-3 space-y-2 border-b border-[#252530]">
                <div className="text-[10px] uppercase font-semibold text-white/40 tracking-wider">
                  Connected Engines
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    GroqCloud (120B)
                  </span>
                  <span className="text-[11px] text-white/50">Online</span>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    ElevenLabs Audio
                  </span>
                  <span className="text-[11px] text-white/50">Active</span>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    FFmpeg Engine
                  </span>
                  <span className="text-[11px] text-white/50">v6.0 Ready</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    onOpenSettings?.();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#22222C] hover:bg-[#2C2C38] text-white text-center font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Open Diagnostics & API Keys</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Library Button & Dropdown */}
        <div className="relative" ref={libraryRef}>
          <button
            type="button"
            onClick={() => {
              setIsLibraryOpen((prev) => !prev);
              setIsAccountOpen(false);
            }}
            className={`flex items-center gap-2 px-3.5 h-9 rounded-xl border text-xs font-semibold transition-all shadow-lg active:scale-95 cursor-pointer ${
              isLibraryOpen
                ? 'bg-white text-black border-white'
                : 'bg-[#16161C] hover:bg-[#202028] border-[#2A2A36] hover:border-white/40 text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Library</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-150 ${
                isLibraryOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Library Dropdown Menu */}
          {isLibraryOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#16161C] border border-[#2A2A36] rounded-2xl shadow-2xl p-2 z-50 flex flex-col text-xs max-h-[80vh]">
              {/* "+ New Generation" button at the top */}
              <button
                type="button"
                onClick={() => {
                  setIsLibraryOpen(false);
                  onNewGeneration?.();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-all cursor-pointer shadow-sm active:scale-98"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>+ New Generation</span>
              </button>

              <div className="h-px bg-[#262632] my-2" />

              <div className="px-2 py-1 text-[10px] uppercase font-semibold text-white/40 tracking-wider flex items-center justify-between">
                <span>Recent Projects</span>
                <span>{recentGenerations.length}</span>
              </div>

              {/* Projects List */}
              <div className="overflow-y-auto space-y-1 max-h-80 pr-1 mt-1">
                {recentGenerations.length === 0 ? (
                  <div className="py-6 text-center text-white/40 text-xs">
                    No generated projects yet.
                  </div>
                ) : (
                  recentGenerations.map((gen) => {
                    const isSelected = gen.id === activeGenerationId;
                    const title = gen.script?.title || gen.originalPrompt;
                    return (
                      <button
                        key={gen.id}
                        type="button"
                        onClick={() => {
                          setIsLibraryOpen(false);
                          onSelectGeneration?.(gen);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl transition-colors cursor-pointer border flex flex-col gap-1 ${
                          isSelected
                            ? 'bg-[#22222D] border-white/40 text-white'
                            : 'bg-[#141418] border-[#22222B] hover:border-white/20 text-white/80 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-white truncate max-w-[190px]">
                            {title}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-medium uppercase shrink-0 ${
                              gen.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                : gen.status === 'failed'
                                ? 'bg-red-500/10 text-red-300 border border-red-500/30'
                                : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {gen.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/40">
                          <span>{gen.scenes?.length || 0} scenes</span>
                          <span>•</span>
                          <span>{new Date(gen.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main App Content Canvas */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#212121] pt-14">
        {children}
      </main>
    </div>
  );
};
