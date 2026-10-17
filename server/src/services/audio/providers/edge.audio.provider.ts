import fs from 'fs';
import path from 'path';
import { AudioProvider, AudioGenerationOptions, AudioGenerationResult } from '../audio.provider.js';
import { LocalAudioProvider } from './local.audio.provider.js';
import { config } from '../../../config/index.js';

/**
 * ElevenLabs Primary TTS Provider with Resilient Local Voice Fallback
 *
 * Rules:
 *  1. Uses ElevenLabs API whenever configured and operational.
 *  2. If and ONLY IF ElevenLabs fails (e.g. 401/402 quota exceeded, "tokens over", rate limit, network error),
 *     automatically engages LocalAudioProvider (Windows SAPI / offline speech) so video generation NEVER halts.
 *  3. Under normal working conditions, ElevenLabs voice is always used.
 */
export class EdgeTTSProvider implements AudioProvider {
  public readonly name = 'ElevenLabs TTS (with Local Voice Backup)';
  private readonly localBackup: LocalAudioProvider;

  constructor() {
    this.localBackup = new LocalAudioProvider();
  }

  public isConfigured(): boolean {
    return Boolean(config.elevenlabs.apiKey && config.elevenlabs.apiKey.trim().length > 0);
  }

  public async generateSpeech(
    text: string,
    outputPath: string,
    options?: AudioGenerationOptions
  ): Promise<AudioGenerationResult> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // ── Primary Attempt: ElevenLabs API ───────────────────────────────────────
    if (this.isConfigured()) {
      try {
        const voiceId = config.elevenlabs.voiceId;
        const model = config.elevenlabs.model;

        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': config.elevenlabs.apiKey,
              'Content-Type': 'application/json',
              Accept: 'audio/mpeg',
            },
            body: JSON.stringify({
              text,
              model_id: model,
              voice_settings: {
                stability: 0.45,
                similarity_boost: 0.80,
                style: 0.15,
                use_speaker_boost: true,
              },
            }),
            signal: AbortSignal.timeout(20000),
          }
        );

        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          const mp3Path = outputPath.endsWith('.mp3')
            ? outputPath
            : outputPath.replace(/\.[^.]+$/, '.mp3');
          fs.writeFileSync(mp3Path, buffer);
          const words = text.split(/\s+/).length;
          const estimatedDuration = Math.max(
            options?.targetDuration ?? 4,
            Math.ceil(words / 2.5) // ElevenLabs speaks ~150 wpm
          );
          console.log(`[ElevenLabs] Successfully generated ${words} words → ${path.basename(mp3Path)} (~${estimatedDuration}s)`);
          return { filePath: mp3Path, duration: estimatedDuration };
        }

        // Handle specific ElevenLabs quota/token/auth errors
        const errBody = await response.text().catch(() => '');
        console.warn(
          `[ElevenLabs Error ${response.status}] Voice generation failed: ${errBody.slice(0, 160)}. Engaging Local Voice Backup!`
        );
      } catch (err) {
        console.warn(
          `[ElevenLabs Request Failure] ${(err as Error).message}. Engaging Local Voice Backup!`
        );
      }
    } else {
      console.warn('[ElevenLabs] No API key configured. Engaging Local Voice Backup.');
    }

    // ── Resilient Fallback: Local Voice (Windows SAPI / System Speech) ────────
    console.log('[AudioService] Generating narration using Local Voice Backup...');
    return this.localBackup.generateSpeech(text, outputPath, options);
  }
}
