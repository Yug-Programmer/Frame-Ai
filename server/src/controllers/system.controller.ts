import { Request, Response } from 'express';
import fs from 'fs';
import { config } from '../config/index.js';
import { SystemStatus } from '../types/index.js';

export class SystemController {
  // GET /api/system/status
  public getStatus = async (_req: Request, res: Response): Promise<void> => {
    try {
      const ffmpegExists = fs.existsSync(config.paths.ffmpeg);

      const isLLMConfigured = Boolean(
        config.groq.apiKey && config.groq.apiKey.trim().length > 0
      );

      const isVisualConfigured = Boolean(
        config.visual.provider === 'stock' ||   // stock uses free APIs, no key needed
        config.visual.provider === 'canvas' ||
        config.visual.apiKey
      );

      const isElevenLabsConfigured = Boolean(
        config.elevenlabs.apiKey && config.elevenlabs.apiKey.trim().length > 0
      );

      const status: SystemStatus = {
        llm: {
          provider: 'GroqCloud',
          model: config.groq.model,
          configured: isLLMConfigured,
          status: isLLMConfigured
            ? `Connected (${config.groq.model})`
            : config.devMockMode
            ? 'Development Mock Mode Active'
            : 'Not configured — add GROQ_API_KEY to server/.env',
        },
        visual: {
          provider:
            config.visual.provider === 'stock'
              ? 'Free Image Agent (OpenVerse + Wikimedia Commons)'
              : config.visual.provider === 'canvas'
              ? 'Neural Canvas Compositor (1080×1920 9:16)'
              : 'External Visual API',
          configured: isVisualConfigured,
          status: isVisualConfigured ? 'Ready' : 'Not configured',
        },
        tts: {
          provider: isElevenLabsConfigured
            ? `ElevenLabs (${config.elevenlabs.model})`
            : 'Built-in TTS fallback',
          configured: true,  // always works, ElevenLabs improves quality
          status: isElevenLabsConfigured
            ? `ElevenLabs ready (Voice: Daniel / ${config.elevenlabs.voiceId})`
            : 'ELEVENLABS_API_KEY not set — using free fallback TTS',
        },
        ffmpeg: {
          available: ffmpegExists,
          path: ffmpegExists ? 'Detected (Host Binary)' : 'Not detected',
          version: ffmpegExists ? 'FFmpeg detected (H.264 / AAC)' : 'Not detected',
        },
        // Qoneqt publishing configured
        qoneqt: {
          configured: true,
          url: 'https://qoneqt.com/home',
          status: 'Ready to Publish (Global Feed)',
        },
        environment: config.nodeEnv,
        mockMode: config.devMockMode,
      };

      res.json(status);
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to query system status',
      });
    }
  };
}
