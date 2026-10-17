import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Palette,
  Radio,
  LayoutTemplate,
  Smile,
  Clapperboard,
  Video,
  Terminal,
  Check,
  Play,
  Pause,
  Maximize2,
  Volume2,
  X,
  Layers,
  Sparkle,
} from 'lucide-react';
import { VideoTemplate } from '../types/index.js';

export interface TemplateDefinition {
  id: VideoTemplate;
  name: string;
  tag: string;
  desc: string;
  badgeColor: string;
  subtitleSample: string;
  subtitleStyle: {
    fontColor: string;
    boxColor: string;
    fontFamily: string;
    border?: string;
    textShadow?: string;
  };
  filterCss: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'anime',
    name: 'Anime Style',
    tag: 'Manga',
    desc: 'Cel-shaded Japanese animation • Twilight clouds • Action lines',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    subtitleSample: '「Beyond the horizon, where past and future collide...」',
    subtitleStyle: {
      fontColor: '#FFFFFF',
      boxColor: 'rgba(15, 23, 42, 0.88)',
      fontFamily: "'Poppins', sans-serif",
      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
    },
    filterCss: 'contrast(1.15) saturate(1.35) brightness(1.02)',
    icon: Sparkles,
  },
  {
    id: 'comic',
    name: 'Comic Book',
    tag: 'Pop Art',
    desc: 'Graphic novel halftone dots • Bold black ink lines • Punchy bursts',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    subtitleSample: 'MEANWHILE, ACROSS THE COSMIC MULTIVERSE...',
    subtitleStyle: {
      fontColor: '#000000',
      boxColor: '#FFEE00',
      fontFamily: "'Poppins', sans-serif",
      border: '2px solid #000000',
    },
    filterCss: 'contrast(1.28) saturate(1.45) brightness(0.98)',
    icon: Palette,
  },
  {
    id: 'retro',
    name: 'Retro Synthwave',
    tag: '80s Neon',
    desc: 'Neon wireframe grid • 80s striped sun • Violet glow & scanlines',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    subtitleSample: 'CRUISING THE NEON HIGHWAY // 1984 SOUNDTRACK',
    subtitleStyle: {
      fontColor: '#00FFFF',
      boxColor: 'rgba(21, 0, 42, 0.90)',
      fontFamily: "'Poppins', sans-serif",
      textShadow: '0 0 10px #00FFFF, 0 0 20px #00FFFF',
    },
    filterCss: 'contrast(1.20) saturate(1.35) hue-rotate(280deg)',
    icon: Radio,
  },
  {
    id: 'minimal',
    name: 'Minimalist Clean',
    tag: 'Nordic',
    desc: 'Monochrome architectural tone • Pristine negative space • Swiss grid',
    badgeColor: 'bg-white/10 text-white/90 border-white/20',
    subtitleSample: '01 // Form follows function. Pure clarity in every cut.',
    subtitleStyle: {
      fontColor: '#FFFFFF',
      boxColor: 'rgba(24, 24, 27, 0.92)',
      fontFamily: "'Poppins', sans-serif",
    },
    filterCss: 'contrast(1.03) saturate(0.40) brightness(1.02)',
    icon: LayoutTemplate,
  },
  {
    id: 'animated',
    name: '3D Animated',
    tag: 'Pixar CGI',
    desc: 'Volumetric studio lighting • Soft 3D shapes • Ambient occlusion',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    subtitleSample: 'Every spark of imagination becomes reality in 3D!',
    subtitleStyle: {
      fontColor: '#FFFFFF',
      boxColor: 'rgba(30, 27, 75, 0.88)',
      fontFamily: "'Poppins', sans-serif",
      textShadow: '0 2px 8px rgba(0,0,0,0.6)',
    },
    filterCss: 'contrast(1.08) saturate(1.25) brightness(1.03)',
    icon: Smile,
  },
  {
    id: 'cinematic',
    name: 'Cinematic Film',
    tag: '35mm',
    desc: '2.39:1 widescreen letterbox • Anamorphic blue flare • Kodak movie grade',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    subtitleSample: 'Some stories are written in the stars, forever.',
    subtitleStyle: {
      fontColor: '#EDEAE0',
      boxColor: 'rgba(8, 8, 10, 0.90)',
      fontFamily: "'Poppins', sans-serif",
    },
    filterCss: 'contrast(1.18) saturate(0.92) sepia(0.12)',
    icon: Clapperboard,
  },
  {
    id: 'vintage_vhs',
    name: 'Vintage VHS',
    tag: '90s Tape',
    desc: 'Analog CRT scanlines • PLAY ▶ OSD • Bottom tracking static roll',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    subtitleSample: 'TAPE 04 • RECORDED LIVE // DO NOT EJECT',
    subtitleStyle: {
      fontColor: '#FFFF77',
      boxColor: 'rgba(0, 0, 0, 0.82)',
      fontFamily: "monospace, 'Poppins', sans-serif",
    },
    filterCss: 'contrast(1.10) saturate(0.85) brightness(1.04)',
    icon: Video,
  },
  {
    id: 'cyber_hud',
    name: 'Cyber Sci-Fi',
    tag: 'HUD Tech',
    desc: 'Holographic targeting reticle • Degree telemetry • Matrix green readout',
    badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
    subtitleSample: '[SYS_ANALYSIS: 99.4% // QUANTUM TARGET ACQUIRED]',
    subtitleStyle: {
      fontColor: '#00FFAA',
      boxColor: 'rgba(0, 17, 36, 0.94)',
      fontFamily: "monospace, 'Poppins', sans-serif",
      textShadow: '0 0 8px #00FFAA',
    },
    filterCss: 'contrast(1.22) saturate(1.30) hue-rotate(160deg)',
    icon: Terminal,
  },
];

interface TemplateVideoPreviewProps {
  selectedTemplate: VideoTemplate;
  onSelectTemplate: (templateId: VideoTemplate) => void;
  onClose: () => void;
  initialAspect?: string;
}

export const TemplateVideoPreview: React.FC<TemplateVideoPreviewProps> = ({
  selectedTemplate,
  onSelectTemplate,
  onClose,
  initialAspect = '9:16',
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState<VideoTemplate>(selectedTemplate);
  const [isPlaying, setIsPlaying] = useState(true);
  const [previewAspect, setPreviewAspect] = useState<'9:16' | '16:9'>(
    initialAspect === '16:9' ? '16:9' : '9:16'
  );
  const [timerSeconds, setTimerSeconds] = useState(4.2);

  // Synchronize internal active template if prop changes
  useEffect(() => {
    setActiveTemplateId(selectedTemplate);
  }, [selectedTemplate]);

  // Animated timecode counter
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        const next = prev + 0.1;
        return next > 15 ? 0.5 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const activeDef =
    TEMPLATE_DEFINITIONS.find((t) => t.id === activeTemplateId) || TEMPLATE_DEFINITIONS[0];

  const handleCardClick = (id: VideoTemplate) => {
    setActiveTemplateId(id);
    onSelectTemplate(id);
  };

  const formattedTime = `00:${timerSeconds < 10 ? '0' : ''}${timerSeconds.toFixed(1)} / 00:15.0`;
  const progressPercent = Math.min(100, (timerSeconds / 15) * 100);

  return (
    <div className="bg-[#121217] border border-[#2A2A38] rounded-2xl shadow-2xl overflow-hidden flex flex-col w-[680px] max-w-[calc(100vw-32px)] text-white select-none animate-scene-shift">
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#22222E] bg-[#16161D]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-wide">Video Template Studio</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white text-black font-bold">
                8 STYLES
              </span>
            </div>
            <p className="text-[11px] text-white/50 leading-tight">
              Live simulation of how your generated video & subtitles will look
            </p>
          </div>
        </div>

        {/* Aspect Ratio Switcher + Close Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#0E0E12] p-0.5 rounded-lg border border-[#282834]">
            <button
              type="button"
              onClick={() => setPreviewAspect('9:16')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                previewAspect === '9:16'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              9:16 Vertical
            </button>
            <button
              type="button"
              onClick={() => setPreviewAspect('16:9')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-all cursor-pointer ${
                previewAspect === '16:9'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              16:9 Landscape
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Template Studio"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Live Video Preview Simulation Canvas */}
      <div className="relative bg-[#09090C] p-3 flex flex-col items-center justify-center border-b border-[#22222E]">
        <div
          className={`relative overflow-hidden rounded-xl border border-[#2F2F40] shadow-2xl transition-all duration-300 flex items-center justify-center bg-black ${
            previewAspect === '9:16' ? 'w-[200px] h-[310px]' : 'w-[480px] h-[270px] max-w-full'
          }`}
        >
          {/* A. Live Animated Video Background with Template Filters */}
          <div
            className="absolute inset-0 transition-all duration-500 overflow-hidden"
            style={{
              filter: activeDef.filterCss,
            }}
          >
            {/* Template Specific Dynamic Motion Layer */}
            {activeDef.id === 'anime' && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#2D1B69] via-[#8B3A8B] to-[#FF6B6B] flex items-center justify-center">
                {/* Anime Sun & Clouds */}
                <div className="absolute w-28 h-28 rounded-full bg-yellow-200/80 blur-sm top-8 animate-pulse" />
                <div className="absolute w-44 h-12 bg-white/20 rounded-full blur-md top-14 left-4" />
                <div className="absolute w-52 h-16 bg-white/25 rounded-full blur-md top-20 right-2" />
                {/* Floating Cel Particles */}
                <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-30 animate-pulse" />
                {/* Action Speed Lines */}
                <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_45%,#fff_49%,#fff_51%,transparent_55%)] [background-size:24px_24px]" />
                <div className="absolute bottom-12 font-mono text-[9px] text-white/40 tracking-widest uppercase">
                  「 STUDIO CEL SHADED MOTION 」
                </div>
              </div>
            )}

            {activeDef.id === 'comic' && (
              <div className="absolute inset-0 bg-[#FFD700] flex items-center justify-center overflow-hidden">
                {/* Halftone Dot Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(#000_2px,transparent_2px)] [background-size:12px_12px] opacity-25" />
                {/* Diagonal Pop Art Split */}
                <div
                  className="absolute inset-0 bg-[#00E5FF] opacity-40"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 60% 100%, 0 100%)' }}
                />
                {/* Comic Action Starburst */}
                <div className="absolute top-6 right-6 w-20 h-20 bg-[#FF1744] rotate-12 flex items-center justify-center shadow-lg border-2 border-black">
                  <span className="font-extrabold text-white text-[13px] tracking-wider italic">
                    POW!
                  </span>
                </div>
                {/* Bold Ink Lines */}
                <div className="absolute inset-2 border-4 border-black pointer-events-none" />
              </div>
            )}

            {activeDef.id === 'retro' && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#0F051D] via-[#240046] to-[#0A0017] flex items-center justify-center overflow-hidden">
                {/* Striped 80s Retro Sun */}
                <div className="absolute top-8 w-24 h-24 rounded-full bg-gradient-to-b from-[#FF8A00] to-[#E52E71] shadow-[0_0_30px_#E52E71] flex flex-col justify-around py-1 overflow-hidden">
                  <div className="h-1 bg-[#0F051D]" />
                  <div className="h-1.5 bg-[#0F051D]" />
                  <div className="h-2 bg-[#0F051D]" />
                  <div className="h-2.5 bg-[#0F051D]" />
                </div>
                {/* 3D Cyan Perspective Grid with forward motion */}
                <div
                  className="absolute bottom-0 w-full h-1/2 opacity-70"
                  style={{
                    background:
                      'linear-gradient(to bottom, transparent, rgba(0,255,255,0.4)), repeating-linear-gradient(90deg, #00FFFF 0, #00FFFF 1px, transparent 1px, transparent 20px), repeating-linear-gradient(0deg, #00FFFF 0, #00FFFF 1px, transparent 1px, transparent 16px)',
                    transform: 'perspective(120px) rotateX(60deg) scale(1.5)',
                    transformOrigin: 'bottom center',
                  }}
                />
                {/* CRT Scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%)] [background-size:100%_4px] pointer-events-none opacity-40" />
              </div>
            )}

            {activeDef.id === 'minimal' && (
              <div className="absolute inset-0 bg-[#141418] flex items-center justify-center overflow-hidden">
                {/* Clean Architectural Hairlines */}
                <div className="absolute inset-4 border border-white/15" />
                <div className="absolute w-28 h-28 rounded-full border border-white/10" />
                <div className="absolute w-44 h-44 rounded-full border border-white/5" />
                <div className="absolute top-8 left-8 text-[9px] font-mono text-white/40 tracking-widest">
                  01 / ARCHITECTURE
                </div>
                <div className="w-12 h-12 bg-white/5 rounded-lg border border-white/20 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white/40 rounded-sm" />
                </div>
              </div>
            )}

            {activeDef.id === 'animated' && (
              <div className="absolute inset-0 bg-gradient-to-tr from-[#1E1B4B] via-[#3B82F6] to-[#EC4899] flex items-center justify-center overflow-hidden">
                {/* Soft 3D Glossy Spheres */}
                <div className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-pink-300 via-rose-500 to-purple-800 shadow-2xl left-6 top-10" />
                <div className="absolute w-16 h-16 rounded-full bg-gradient-to-br from-cyan-200 via-blue-500 to-indigo-900 shadow-2xl right-8 bottom-14" />
                <div className="absolute w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-orange-600 shadow-xl top-16 right-10" />
                {/* Ambient Depth Bokeh */}
                <div className="absolute w-40 h-40 rounded-full bg-white/10 blur-xl top-4" />
              </div>
            )}

            {activeDef.id === 'cinematic' && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#181109] via-[#2A1B0E] to-[#0A0805] flex items-center justify-center overflow-hidden">
                {/* Warm Kodak Film Scene */}
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-600/30 via-stone-900/60 to-black" />
                {/* 2.39:1 Anamorphic Top/Bottom Letterbox Bars */}
                <div className="absolute top-0 left-0 right-0 h-7 bg-black z-10 border-b border-black" />
                <div className="absolute bottom-0 left-0 right-0 h-7 bg-black z-10 border-t border-black" />
                {/* Anamorphic Horizontal Blue Lens Flare Beam */}
                <div className="absolute w-full h-[2px] bg-cyan-400/80 shadow-[0_0_16px_#00E5FF] top-1/2 -translate-y-1/2" />
                <div className="absolute top-8 right-3 z-20 text-[8px] font-mono text-amber-200/60 tracking-widest uppercase">
                  35MM • 2.39:1 SCOPE
                </div>
              </div>
            )}

            {activeDef.id === 'vintage_vhs' && (
              <div className="absolute inset-0 bg-[#080B10] flex items-center justify-center overflow-hidden">
                {/* CRT Scanline Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.7)_50%)] [background-size:100%_3px] pointer-events-none z-10 opacity-70" />
                {/* VCR OSD in Phosphor Green */}
                <div className="absolute top-3 left-3 z-20 font-mono text-[10px] text-[#00FF66] tracking-wider drop-shadow-[0_0_6px_#00FF66]">
                  PLAY ▶  SP  00:04:12
                </div>
                <div className="absolute top-3 right-3 z-20 font-mono text-[9px] text-[#00FF66]/80 tracking-widest">
                  HI-FI STEREO
                </div>
                {/* Bottom Tracking Static Noise Line */}
                <div className="absolute bottom-2 left-0 right-0 h-3 bg-white/20 blur-[1px] animate-pulse z-20" />
                <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/20 animate-spin" />
              </div>
            )}

            {activeDef.id === 'cyber_hud' && (
              <div className="absolute inset-0 bg-[#020B14] flex items-center justify-center overflow-hidden">
                {/* Cyberspace Grid */}
                <div className="absolute inset-0 bg-[radial-gradient(#00FFAA_1px,transparent_1px)] [background-size:18px_18px] opacity-20" />
                {/* Concentric Rotating HUD Targeting Reticle */}
                <div className="absolute w-36 h-36 rounded-full border border-emerald-400/40 border-dashed animate-spin" />
                <div className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/60 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-ping" />
                </div>
                {/* Crosshairs */}
                <div className="absolute w-full h-[1px] bg-emerald-400/20" />
                <div className="absolute h-full w-[1px] bg-emerald-400/20" />
                {/* Telemetry Readouts */}
                <div className="absolute top-3 left-3 font-mono text-[8px] text-emerald-400/80 leading-tight">
                  SYS: ONLINE<br />
                  LOCK: 99.4%<br />
                  FREQ: 432.8 MHz
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1 font-mono text-[8px] text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                  REC
                </div>
              </div>
            )}
          </div>

          {/* B. Burned-In Subtitle Box Matching videoComposer.ts Styling */}
          <div className="absolute bottom-8 left-3 right-3 z-30 flex justify-center text-center pointer-events-none">
            <div
              className="px-2.5 py-1.5 rounded-md text-xs font-semibold max-w-[90%] leading-snug transition-all duration-300 shadow-xl"
              style={{
                backgroundColor: activeDef.subtitleStyle.boxColor,
                color: activeDef.subtitleStyle.fontColor,
                border: activeDef.subtitleStyle.border || 'none',
                textShadow: activeDef.subtitleStyle.textShadow || 'none',
                fontFamily: activeDef.subtitleStyle.fontFamily,
              }}
            >
              {activeDef.subtitleSample}
            </div>
          </div>

          {/* C. Player HUD Overlays */}
          {/* Top Info Bar */}
          <div className="absolute top-2 left-2 right-2 z-30 flex items-center justify-between text-[10px] pointer-events-none">
            <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-white font-mono font-medium flex items-center gap-1 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {activeDef.name}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/90 font-mono border border-white/10">
              {formattedTime}
            </span>
          </div>

          {/* Bottom Audio Visualizer & Play Controls */}
          <div className="absolute bottom-2 left-2 right-2 z-30 flex items-center justify-between text-[10px]">
            {/* Audio Waveform Simulator */}
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/10">
              <Volume2 className="w-3 h-3 text-white/70 mr-1" />
              <div className="w-0.5 h-2 bg-white/80 animate-pulse" />
              <div className="w-0.5 h-3.5 bg-white/90 animate-pulse delay-75" />
              <div className="w-0.5 h-2.5 bg-white/80 animate-pulse delay-150" />
              <div className="w-0.5 h-4 bg-white animate-pulse" />
              <div className="w-0.5 h-2 bg-white/70 animate-pulse delay-100" />
            </div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? <Pause className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current ml-0.5" />}
            </button>
          </div>

          {/* Animated Video Progress Scrubber */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
            <div
              className="h-full bg-white transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Current Template Feature Description Bar */}
        <div className="mt-2.5 flex items-center justify-between w-full px-2 text-xs">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${activeDef.badgeColor}`}>
              {activeDef.tag}
            </span>
            <span className="text-white/75 font-normal text-[11px] truncate max-w-[340px]">
              {activeDef.desc}
            </span>
          </div>
          <span className="text-[10px] text-white/40 font-mono">
            {previewAspect === '9:16' ? '1080×1920 (Reels/Shorts)' : '1920×1080 (Landscape)'}
          </span>
        </div>
      </div>

      {/* 3. 8 Interactive Template Selection Cards Grid */}
      <div className="p-3 bg-[#111116] flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono text-white/50 uppercase tracking-wider">
            Select Template Style ({TEMPLATE_DEFINITIONS.length} Options)
          </span>
          <span className="text-[10px] text-white/40">
            Click any card to preview & apply immediately
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[220px] overflow-y-auto pr-1">
          {TEMPLATE_DEFINITIONS.map((tpl) => {
            const isSelected = activeTemplateId === tpl.id;
            const IconComp = tpl.icon;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleCardClick(tpl.id)}
                className={`relative flex flex-col p-2 rounded-xl text-left transition-all border cursor-pointer select-none group ${
                  isSelected
                    ? 'bg-[#1E1E26] border-white text-white shadow-lg ring-1 ring-white/50'
                    : 'bg-[#16161D] border-[#262634] hover:border-[#3E3E50] hover:bg-[#1A1A22] text-white/80'
                }`}
              >
                {/* Mini Live Animated Preview Window for this Template */}
                <div
                  className="w-full h-12 rounded-lg overflow-hidden relative mb-2 border border-white/10 group-hover:border-white/20 transition-all"
                  style={{ filter: tpl.filterCss }}
                >
                  {/* Mini stylistic thumbnail representation */}
                  {tpl.id === 'anime' && (
                    <div className="w-full h-full bg-gradient-to-r from-purple-700 via-pink-600 to-rose-400 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-yellow-200/80 shadow-md" />
                    </div>
                  )}
                  {tpl.id === 'comic' && (
                    <div className="w-full h-full bg-[#FFD700] flex items-center justify-center bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:6px_6px]">
                      <span className="px-1 py-0.2 bg-red-600 text-white font-extrabold text-[8px] italic rotate-3 border border-black">
                        POW
                      </span>
                    </div>
                  )}
                  {tpl.id === 'retro' && (
                    <div className="w-full h-full bg-[#180033] flex items-center justify-center relative overflow-hidden">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-b from-orange-400 to-pink-600 mb-2" />
                      <div className="absolute bottom-0 w-full h-1/2 bg-[repeating-linear-gradient(90deg,#00FFFF_0,#00FFFF_1px,transparent_1px,transparent_8px)] opacity-60" />
                    </div>
                  )}
                  {tpl.id === 'minimal' && (
                    <div className="w-full h-full bg-[#15151A] flex items-center justify-center border border-white/10">
                      <div className="w-6 h-6 border border-white/20 rounded flex items-center justify-center text-[7px] font-mono text-white/60">
                        01
                      </div>
                    </div>
                  )}
                  {tpl.id === 'animated' && (
                    <div className="w-full h-full bg-gradient-to-r from-indigo-700 to-blue-500 flex items-center justify-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-pink-400 shadow-md" />
                      <div className="w-3 h-3 rounded-full bg-cyan-300 shadow-md" />
                    </div>
                  )}
                  {tpl.id === 'cinematic' && (
                    <div className="w-full h-full bg-stone-900 relative flex items-center justify-center">
                      <div className="absolute top-0 left-0 right-0 h-2 bg-black" />
                      <div className="absolute bottom-0 left-0 right-0 h-2 bg-black" />
                      <div className="w-full h-[1px] bg-cyan-400/90 shadow-[0_0_8px_#00E5FF]" />
                    </div>
                  )}
                  {tpl.id === 'vintage_vhs' && (
                    <div className="w-full h-full bg-black flex items-center justify-center relative bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.8)_50%)] [background-size:100%_2px]">
                      <span className="font-mono text-[7px] text-green-400">PLAY ▶</span>
                    </div>
                  )}
                  {tpl.id === 'cyber_hud' && (
                    <div className="w-full h-full bg-[#020D1A] flex items-center justify-center relative">
                      <div className="w-7 h-7 rounded-full border border-emerald-400/60 border-dashed animate-spin" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                  )}

                  {/* Selected Check Badge */}
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-xs text-white leading-tight truncate">
                    {tpl.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`px-1 py-0.2 rounded text-[8px] font-semibold border ${
                      isSelected
                        ? 'text-black bg-white border-white'
                        : 'text-white/70 bg-white/5 border-white/20'
                    }`}
                  >
                    {tpl.tag}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. Bottom Footer Action Confirmation */}
        <div className="flex items-center justify-between pt-2 border-t border-[#20202B] mt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Active:</span>
            <span className="text-xs font-semibold text-white">{activeDef.name}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 text-xs font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            Apply & Continue
          </button>
        </div>
      </div>
    </div>
  );
};
