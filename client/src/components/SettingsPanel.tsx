import React, { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { SystemStatus } from '../types/index.js';
import { X, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SettingsPanelProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: (t: 'light' | 'dark') => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  onClose,
  theme,
  onToggleTheme,
}) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await api.getSystemStatus();
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-[#121217] border border-[#23232C] rounded-xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232C]">
          <div>
            <h3 className="text-[16px] font-semibold text-white">Settings & Diagnostics</h3>
            <p className="text-[12px] text-zinc-400 mt-0.5">System configuration and provider status</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              className="p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-[#1C1C24] transition-colors"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-[#1C1C24] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Appearance Section */}
          <div>
            <h4 className="text-[13px] font-semibold text-zinc-300 uppercase tracking-wider mb-3">
              Appearance
            </h4>
            <div className="flex items-center justify-between p-3.5 bg-[#181822] border border-[#232330] rounded-lg">
              <div>
                <p className="text-[14px] font-medium text-white">Workspace Theme</p>
                <p className="text-[12px] text-zinc-400">
                  Modern dark mode optimized for creative vertical video composition
                </p>
              </div>
              <div className="flex items-center gap-1 bg-[#121218] border border-[#2B2B38] rounded-md p-1">
                <button
                  onClick={() => onToggleTheme('light')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    theme === 'light' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => onToggleTheme('dark')}
                  className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                    theme === 'dark' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>

          {/* Connection & LLM Provider */}
          <div>
            <h4 className="text-[13px] font-semibold text-zinc-300 uppercase tracking-wider mb-3">
              LLM Orchestration
            </h4>
            <div className="p-4 bg-[#181822] border border-[#232330] rounded-lg space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Provider:</span>
                <span className="font-medium text-white">{status?.llm.provider || 'Groq Cloud'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Reasoning Model:</span>
                <span className="font-mono font-medium text-indigo-400">
                  {status?.llm.model || 'gpt-oss-120b'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#232330]">
                <span className="text-zinc-400">Status:</span>
                <span className="flex items-center gap-1.5 font-medium">
                  {status?.llm.configured ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">{status?.llm.status || 'Not configured'}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Multimodal & Pipeline Services */}
          <div>
            <h4 className="text-[13px] font-semibold text-zinc-300 uppercase tracking-wider mb-3">
              Pipeline Providers
            </h4>
            <div className="space-y-2">
              {/* Visual Provider */}
              <div className="flex items-center justify-between p-3 bg-[#181822] border border-[#232330] rounded-lg text-xs">
                <div>
                  <p className="font-medium text-white">Visual Synthesizer</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{status?.visual.provider}</p>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {status?.visual.status || 'Ready'}
                </span>
              </div>

              {/* TTS Voice Provider */}
              <div className="flex items-center justify-between p-3 bg-[#181822] border border-[#232330] rounded-lg text-xs">
                <div>
                  <p className="font-medium text-white">Voice Narration Engine</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{status?.tts.provider}</p>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {status?.tts.status || 'Ready'}
                </span>
              </div>

              {/* FFmpeg Binary */}
              <div className="flex items-center justify-between p-3 bg-[#181822] border border-[#232330] rounded-lg text-xs">
                <div>
                  <p className="font-medium text-white">FFmpeg Compositor</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{status?.ffmpeg.version}</p>
                </div>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Detected
                </span>
              </div>

              {/* Qoneqt Publishing */}
              <div className="flex items-center justify-between p-3 bg-[#181822] border border-[#232330] rounded-lg text-xs">
                <div>
                  <p className="font-medium text-white">Qoneqt Global Feed</p>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{status?.qoneqt.url}</p>
                </div>
                <span className="flex items-center gap-1 font-medium">
                  {status?.qoneqt.configured ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Connected</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-zinc-400">Set QONEQT_API_KEY</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
