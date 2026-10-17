import React from 'react';
import { GenerationRecord } from '../types/index.js';
import { Plus, Settings, Sliders, Activity } from 'lucide-react';

interface SidebarProps {
  recentGenerations: GenerationRecord[];
  activeGenerationId?: string;
  onSelectGeneration: (gen: GenerationRecord) => void;
  onNewGeneration: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  recentGenerations,
  activeGenerationId,
  onSelectGeneration,
  onNewGeneration,
  onOpenSettings,
}) => {
  const formatTime = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-[260px] h-full bg-[#0D0D10] border-r border-[#222228] flex flex-col justify-between select-none shrink-0 text-white font-sans">
      {/* Top Branding & New Generation */}
      <div className="p-4 border-b border-[#222228]">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[15px] font-bold tracking-tight text-white font-sans">
            Frame Cinematic Agent
          </h1>
        </div>

        <button
          onClick={onNewGeneration}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-white bg-[#16161B] hover:bg-[#202028] border border-[#2A2A34] hover:border-white/50 rounded-lg transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          New Generation
        </button>
      </div>

      {/* Recent Generations History */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        <div className="px-2 pb-1.5 text-[11px] font-mono uppercase tracking-wider text-white/40">
          Recent Generations
        </div>

        {recentGenerations.length === 0 ? (
          <div className="px-2 py-6 text-xs text-white/40 text-center">
            No previous projects yet
          </div>
        ) : (
          recentGenerations.map((gen) => {
            const isSelected = gen.id === activeGenerationId;
            const displayTitle = gen.script?.title || gen.originalPrompt.slice(0, 32);

            return (
              <button
                key={gen.id}
                onClick={() => onSelectGeneration(gen)}
                className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-white text-black font-semibold border-white shadow-sm'
                    : 'border-transparent text-white/70 hover:bg-[#16161B] hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate pr-1 font-medium">{displayTitle}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-semibold border ${
                      isSelected ? 'border-black/30 text-black' : 'border-white/30 text-white'
                    }`}
                  >
                    {gen.status === 'completed' ? 'Ready' : gen.status}
                  </span>
                </div>
                <span className={`text-[10px] ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                  {formatTime(gen.createdAt)}
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Bottom Settings & Status Navigation */}
      <div className="p-3 border-t border-[#222228] space-y-1 text-xs text-white/70">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#16161B] hover:text-white transition-colors"
        >
          <Settings className="w-3.5 h-3.5 text-current" />
          <span>Settings</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#16161B] hover:text-white transition-colors"
        >
          <Sliders className="w-3.5 h-3.5 text-current" />
          <span>API Configuration</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#16161B] hover:text-white transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-current" />
          <span>System Status</span>
        </button>
      </div>
    </aside>
  );
};
