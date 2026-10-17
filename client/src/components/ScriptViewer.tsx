import React, { useState } from 'react';
import { Script } from '../types/index.js';
import { X, Save, Edit2, RotateCw } from 'lucide-react';

interface ScriptViewerProps {
  script: Script;
  onClose: () => void;
  onSaveScript: (updatedScript: Script, reRender: boolean) => Promise<void>;
}

export const ScriptViewer: React.FC<ScriptViewerProps> = ({
  script,
  onClose,
  onSaveScript,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedScript, setEditedScript] = useState<Script>(JSON.parse(JSON.stringify(script)));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (reRender: boolean) => {
    setIsSaving(true);
    try {
      await onSaveScript(editedScript, reRender);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="bg-[#121217] border border-[#23232C] rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23232C]">
          <div>
            <h3 className="text-[16px] font-semibold text-white">Production Script</h3>
            <p className="text-[12px] text-zinc-400 mt-0.5">Narrative structure and scene voiceover</p>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 bg-[#1A1A22] hover:bg-[#252530] border border-[#2A2A36] rounded-md transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                Edit Script
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-200 bg-[#1A1A22] hover:bg-[#252530] border border-[#2A2A36] rounded-md transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-zinc-400" />
                  Save
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  Save & Regenerate Video
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-[#1C1C24] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Script Document Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Title */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Video Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedScript.title}
                onChange={(e) => setEditedScript({ ...editedScript, title: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-[15px] font-semibold text-white bg-[#181820] border border-[#2B2B38] rounded-md focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <h2 className="text-[18px] font-bold text-white mt-0.5">{editedScript.title}</h2>
            )}
          </div>

          {/* Hook */}
          <div className="p-3.5 bg-[#16161D] border border-[#23232C] rounded-lg">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Hook (First 2 Seconds)
            </label>
            {isEditing ? (
              <textarea
                value={editedScript.hook}
                onChange={(e) => setEditedScript({ ...editedScript, hook: e.target.value })}
                rows={2}
                className="w-full mt-1 p-2 text-sm text-white bg-[#181820] border border-[#2B2B38] rounded focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <p className="text-[14px] font-medium text-zinc-100 mt-1 leading-relaxed">
                "{editedScript.hook}"
              </p>
            )}
          </div>

          {/* Scenes Storyboard Narration */}
          <div className="space-y-4">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Scenes ({editedScript.scenes.length})
            </label>
            {editedScript.scenes.map((scene, idx) => (
              <div
                key={scene.id}
                className="p-4 bg-[#16161D] border border-[#23232C] rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-white">Scene {String(idx + 1).padStart(2, '0')}</span>
                  <span>{scene.duration} seconds</span>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-zinc-400">Narration:</span>
                  {isEditing ? (
                    <textarea
                      value={scene.narration}
                      onChange={(e) => {
                        const scenes = [...editedScript.scenes];
                        scenes[idx].narration = e.target.value;
                        setEditedScript({ ...editedScript, scenes });
                      }}
                      rows={2}
                      className="w-full mt-1 p-2 text-xs text-white bg-[#181820] border border-[#2B2B38] rounded focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-[13px] text-zinc-200 mt-0.5 leading-relaxed">
                      {scene.narration}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-mono text-zinc-400">Caption text:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={scene.caption}
                      onChange={(e) => {
                        const scenes = [...editedScript.scenes];
                        scenes[idx].caption = e.target.value;
                        setEditedScript({ ...editedScript, scenes });
                      }}
                      className="w-full mt-1 px-2 py-1 text-xs text-white bg-[#181820] border border-[#2B2B38] rounded focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <p className="text-[12px] font-mono text-zinc-300 mt-0.5">
                      "{scene.caption}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="p-3.5 bg-[#16161D] border border-[#23232C] rounded-lg">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Call to Action (CTA)
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedScript.cta}
                onChange={(e) => setEditedScript({ ...editedScript, cta: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 text-xs text-white bg-[#181820] border border-[#2B2B38] rounded focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <p className="text-[13px] font-medium text-zinc-100 mt-1">{editedScript.cta}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
