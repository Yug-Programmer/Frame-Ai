import React from 'react';
import { X, Sparkles, Sliders, Film, Volume2, Share2, SquareCheck } from 'lucide-react';

interface HowToUseModalProps {
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="bg-[#121217] border border-[#2A2A36] rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2A2A36]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-wide">How to Use Frame AI</h3>
              <p className="text-xs text-white/50 mt-0.5">Quick guide to creating cinematic short-form videos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white rounded-lg hover:bg-[#1E1E26] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-white/80">
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16161C] border border-[#22222B]">
            <div className="w-7 h-7 rounded-lg bg-white text-black font-semibold flex items-center justify-center shrink-0 text-xs">
              1
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-[14px]">Describe Your Idea</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Type your topic, concept, or creative goal into the prompt bar. Frame AI understands educational explainers, tech breakthroughs, storytelling narratives, and social hooks.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16161C] border border-[#22222B]">
            <div className="w-7 h-7 rounded-lg bg-white text-black font-semibold flex items-center justify-center shrink-0 text-xs">
              2
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-[14px]">Choose Duration & Aspect Ratio</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Pick your video runtime (20s to 60s) and framing: 9:16 Vertical (Shorts, Reels, TikTok), 16:9 Widescreen (YouTube, Desktop), 1:1 Square, or exclusive Qoneqt Feed format.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16161C] border border-[#22222B]">
            <div className="w-7 h-7 rounded-lg bg-white text-black font-semibold flex items-center justify-center shrink-0 text-xs">
              3
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-[14px]">Automated Multi-Stage Generation</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Watch the autonomous pipeline script narrative hooks, render custom visual storyboard frames, synthesize studio voiceovers with ElevenLabs, and assemble the master video in FFmpeg.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16161C] border border-[#22222B]">
            <div className="w-7 h-7 rounded-lg bg-white text-black font-semibold flex items-center justify-center shrink-0 text-xs">
              4
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-[14px]">Stop Option & Scene Regeneration</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Need to cancel mid-generation? Click the <strong>Stop Generation</strong> button directly in the search bar. Once generated, inspect individual scenes and regenerate any scene with targeted feedback.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#16161C] border border-[#22222B]">
            <div className="w-7 h-7 rounded-lg bg-white text-black font-semibold flex items-center justify-center shrink-0 text-xs">
              5
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-white text-[14px]">Library & Qoneqt Publishing</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                Access your past projects anytime via the top-right <strong>Library</strong> menu. Directly publish your finished video to the Qoneqt Global Video Feed or download it locally.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#2A2A36] bg-[#16161C] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer"
          >
            Got it, Let&apos;s Create
          </button>
        </div>
      </div>
    </div>
  );
};
