import React, { useState } from 'react';
import { Scene } from '../types/index.js';
import {
  X,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutList,
  Sparkles,
  Volume2,
} from 'lucide-react';

interface SceneViewerProps {
  scenes: Scene[];
  onClose: () => void;
  onRegenerateScene: (sceneId: number, instruction?: string) => Promise<void>;
}

export const SceneViewer: React.FC<SceneViewerProps> = ({
  scenes,
  onClose,
  onRegenerateScene,
}) => {
  const [regeneratingId, setRegeneratingId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'shift' | 'list'>('shift');
  const [activeShiftIndex, setActiveShiftIndex] = useState(0);

  const handleRegenerate = async (sceneId: number) => {
    setRegeneratingId(sceneId);
    try {
      await onRegenerateScene(sceneId);
    } finally {
      setRegeneratingId(null);
    }
  };

  const currentShiftScene = scenes[activeShiftIndex] || scenes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-scene-shift">
      <div className="bg-[#101015] border border-[#23232C] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232C] bg-[#14141A]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[16px] font-semibold text-white">Scene Storyboard & Shift View</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full">
                {scenes.length} Scenes
              </span>
            </div>
            <p className="text-[12px] text-zinc-400 mt-0.5">
              Inspect visual prompts, captions with icons, narration and animated transitions
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#1B1B24] p-0.5 rounded-lg text-xs border border-[#262635]">
              <button
                onClick={() => setViewMode('shift')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'shift'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Shift View
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                List View
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-[#1E1E28] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0E0E12]">
          {viewMode === 'shift' && currentShiftScene ? (
            /* Interactive Shift / Carousel View */
            <div className="flex flex-col items-center">
              {/* Scene Stepper Bar */}
              <div className="flex items-center gap-2 mb-5 overflow-x-auto max-w-full pb-2">
                {scenes.map((s, idx) => (
                  <button
                    key={s.id || idx}
                    onClick={() => setActiveShiftIndex(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                      activeShiftIndex === idx
                        ? 'bg-indigo-600 text-white shadow-sm scale-105'
                        : 'bg-[#181822] text-zinc-400 hover:bg-[#222230] hover:text-zinc-200 border border-[#232330]'
                    }`}
                  >
                    <span>Scene {String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-[10px] opacity-75">({s.duration}s)</span>
                  </button>
                ))}
              </div>

              {/* Main Active Scene Card with Shift Animation */}
              <div
                key={currentShiftScene.id}
                className="w-full max-w-2xl bg-[#14141B] border border-[#23232C] rounded-xl p-5 shadow-lg animate-scene-shift relative"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#23232C]">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 px-2.5 py-1 rounded-md">
                      Scene {String(activeShiftIndex + 1).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs font-medium text-zinc-300">
                      {currentShiftScene.duration}s duration
                    </span>
                    <span className="text-xs text-zinc-500">•</span>
                    <span className="text-xs font-mono text-zinc-400 bg-[#1D1D28] px-2 py-0.5 rounded border border-[#282836]">
                      {currentShiftScene.motion} motion
                    </span>
                  </div>

                  <button
                    onClick={() => handleRegenerate(currentShiftScene.id)}
                    disabled={regeneratingId === currentShiftScene.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-200 bg-[#1F1F2B] hover:bg-[#282838] border border-[#2B2B3C] rounded-md transition-colors disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${regeneratingId === currentShiftScene.id ? 'animate-spin' : ''}`}
                    />
                    {regeneratingId === currentShiftScene.id ? 'Regenerating...' : 'Regenerate Scene'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Visual Frame Preview */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-full max-w-[240px] aspect-[9/16] bg-black rounded-lg overflow-hidden border border-[#282838] shadow-inner flex items-center justify-center group">
                      {currentShiftScene.imageUrl ? (
                        <>
                          <img
                            src={currentShiftScene.imageUrl}
                            alt={`Scene ${currentShiftScene.id}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <button
                            onClick={() => setPreviewImageUrl(currentShiftScene.imageUrl || null)}
                            className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 hover:bg-black text-white text-[11px] rounded-md flex items-center gap-1 border border-white/20 transition-all"
                          >
                            <Eye className="w-3 h-3" />
                            Expand
                          </button>
                        </>
                      ) : (
                        <div className="text-zinc-500 text-xs text-center p-3">
                          Generating frame visual...
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Audio Narration, Caption & Details */}
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-[#191924] rounded-lg border border-[#262638]">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-300 mb-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>On-Screen Subtitle Caption:</span>
                      </div>
                      <p className="text-sm font-bold text-white leading-snug">
                        "{currentShiftScene.caption}"
                      </p>
                    </div>

                    <div className="p-3 bg-[#191924] rounded-lg border border-[#262638]">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-300 mb-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Narration Voiceover:</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                        {currentShiftScene.narration}
                      </p>
                    </div>

                    <div className="p-3 bg-[#191924] rounded-lg border border-[#262638]">
                      <div className="font-semibold text-zinc-300 mb-1">
                        Visual Direction (9:16 vertical):
                      </div>
                      <p className="text-zinc-400 leading-relaxed">
                        {currentShiftScene.visualPrompt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Shift Navigation Footer */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-[#23232C]">
                  <button
                    onClick={() => setActiveShiftIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeShiftIndex === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-[#1D1D28] hover:bg-[#262635] disabled:opacity-40 rounded-md border border-[#282836] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous Scene
                  </button>

                  <span className="text-xs font-mono text-zinc-400">
                    {activeShiftIndex + 1} / {scenes.length}
                  </span>

                  <button
                    onClick={() => setActiveShiftIndex((prev) => Math.min(scenes.length - 1, prev + 1))}
                    disabled={activeShiftIndex === scenes.length - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-zinc-300 bg-[#1D1D28] hover:bg-[#262635] disabled:opacity-40 rounded-md border border-[#282836] transition-colors"
                  >
                    Next Scene
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Traditional List View */
            <div className="space-y-4">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.id}
                  className="p-4 bg-[#14141B] border border-[#23232C] rounded-lg hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#23232C]">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-white">
                        Scene {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs text-zinc-400">{scene.duration} seconds</span>
                      <span className="text-xs text-zinc-500">•</span>
                      <span className="text-xs font-mono text-zinc-400 bg-[#1D1D28] px-2 py-0.5 rounded border border-[#282836]">
                        {scene.motion}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {scene.imageUrl && (
                        <button
                          onClick={() => setPreviewImageUrl(scene.imageUrl || null)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-zinc-300 hover:text-white hover:bg-[#1E1E28] rounded border border-[#2A2A38] transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Preview Frame
                        </button>
                      )}

                      <button
                        onClick={() => handleRegenerate(scene.id)}
                        disabled={regeneratingId === scene.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-zinc-200 bg-[#1F1F2B] hover:bg-[#282838] border border-[#2B2B3C] rounded transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${regeneratingId === scene.id ? 'animate-spin' : ''}`}
                        />
                        {regeneratingId === scene.id ? 'Regenerating...' : 'Regenerate Scene'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-mono text-zinc-400">Narration:</span>
                      <p className="mt-1 text-[13px] text-zinc-200 leading-relaxed">
                        {scene.narration}
                      </p>
                    </div>

                    <div>
                      <span className="font-mono text-zinc-400">Visual Prompt (9:16):</span>
                      <p className="mt-1 text-zinc-400 leading-relaxed">{scene.visualPrompt}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#1F1F2C] flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      Caption: <strong className="text-white">"{scene.caption}"</strong>
                    </span>
                    <span className="text-zinc-500 text-[11px]">Transition: {scene.transition}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Frame Preview Lightbox */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-[#000000]/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-sm max-h-[85vh] bg-[#000000] rounded-lg overflow-hidden border border-[#333333]">
            <img src={previewImageUrl} alt="Scene Preview" className="w-full h-auto object-contain" />
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-2 right-2 p-1.5 bg-[#000000]/60 text-white rounded-full hover:bg-[#000000]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
