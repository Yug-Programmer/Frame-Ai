import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { AudioProvider, AudioGenerationOptions, AudioGenerationResult } from '../audio.provider.js';
import { SynthAudioProvider } from './synth.audio.provider.js';
import { config } from '../../../config/index.js';

/**
 * Local System Speech Provider (High-Quality Offline Spoken Voice Backup)
 * Uses native Windows SAPI / System.Speech.Synthesis to produce real spoken voiceover
 * completely offline with zero API keys and zero token limits.
 *
 * Used strictly as an automatic fallback when ElevenLabs API fails (e.g. 402 quota exceeded).
 */
export class LocalAudioProvider implements AudioProvider {
  public readonly name = 'Local System Voice (Offline Backup)';
  private readonly fallbackSynth: SynthAudioProvider;

  constructor() {
    this.fallbackSynth = new SynthAudioProvider();
  }

  public isConfigured(): boolean {
    return true; // Always available on Windows systems
  }

  public async generateSpeech(
    text: string,
    outputPath: string,
    options?: AudioGenerationOptions
  ): Promise<AudioGenerationResult> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const wavPath = outputPath.endsWith('.wav')
      ? outputPath
      : outputPath.replace(/\.[^.]+$/, '.wav');

    // 1. Try Windows native SpeechSynthesizer (real spoken voice)
    if (process.platform === 'win32') {
      try {
        const result = await this.synthesizeWithWindowsSAPI(text, wavPath, options);
        if (result) {
          console.log(`[Local Voice Backup] Successfully synthesized spoken audio via Windows SAPI (${result.duration}s)`);
          return result;
        }
      } catch (err) {
        console.warn('[Local Voice Backup] Windows SAPI failed:', (err as Error).message);
      }
    }

    // 2. Try Google web TTS if online
    try {
      const gttsResult = await this.synthesizeWithGoogleTTS(text, outputPath, options);
      if (gttsResult) {
        console.log(`[Local Voice Backup] Successfully synthesized speech via free web TTS (${gttsResult.duration}s)`);
        return gttsResult;
      }
    } catch {
      // ignore
    }

    // 3. Fallback to tone synthesizer if all else fails
    console.warn('[Local Voice Backup] Using audio frequency synthesizer fallback');
    return this.fallbackSynth.generateSpeech(text, wavPath, options);
  }

  private synthesizeWithWindowsSAPI(
    text: string,
    wavPath: string,
    options?: AudioGenerationOptions
  ): Promise<AudioGenerationResult | null> {
    return new Promise((resolve) => {
      const textFile = `${wavPath}.txt`;
      try {
        fs.writeFileSync(textFile, text, 'utf-8');
      } catch {
        resolve(null);
        return;
      }

      const cleanup = () => {
        if (fs.existsSync(textFile)) {
          try {
            fs.unlinkSync(textFile);
          } catch {
            // ignore cleanup error
          }
        }
      };

      const safeWavPath = wavPath.replace(/'/g, "''");
      const safeTextPath = textFile.replace(/'/g, "''");

      // Pass script via UTF-16LE Base64 -EncodedCommand to prevent shell parsing errors
      const psScript = `
Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.SetOutputToWaveFile('${safeWavPath}')
$content = [System.IO.File]::ReadAllText('${safeTextPath}', [System.Text.Encoding]::UTF8)
$synth.Speak($content)
$synth.Dispose()
`;
      const encodedScript = Buffer.from(psScript, 'utf16le').toString('base64');

      const child = spawn(
        'powershell',
        ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedScript],
        { windowsHide: true }
      );

      child.on('close', async (code) => {
        cleanup();
        if (code === 0 && fs.existsSync(wavPath) && fs.statSync(wavPath).size > 1000) {
          const duration = await this.probeDuration(wavPath, text, options?.targetDuration);
          resolve({ filePath: wavPath, duration });
        } else {
          resolve(null);
        }
      });

      child.on('error', () => {
        cleanup();
        resolve(null);
      });
    });
  }

  private async synthesizeWithGoogleTTS(
    text: string,
    outputPath: string,
    options?: AudioGenerationOptions
  ): Promise<AudioGenerationResult | null> {
    const mp3Path = outputPath.endsWith('.mp3')
      ? outputPath
      : outputPath.replace(/\.[^.]+$/, '.mp3');

    const encodedText = encodeURIComponent(text.slice(0, 200));
    const gttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=en&client=tw-ob`;

    const res = await fetch(gttsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length > 1000) {
        fs.writeFileSync(mp3Path, buffer);
        const duration = await this.probeDuration(mp3Path, text, options?.targetDuration);
        return { filePath: mp3Path, duration };
      }
    }
    return null;
  }

  private async probeDuration(
    filePath: string,
    text: string,
    targetDuration?: number
  ): Promise<number> {
    try {
      const ffprobe = config.paths.ffprobe;
      if (fs.existsSync(ffprobe)) {
        return new Promise((resolve) => {
          const child = spawn(
            ffprobe,
            [
              '-v',
              'error',
              '-show_entries',
              'format=duration',
              '-of',
              'default=noprint_wrappers=1:nokey=1',
              filePath,
            ],
            { windowsHide: true }
          );

          let output = '';
          child.stdout.on('data', (d) => {
            output += d.toString();
          });
          child.on('close', (c) => {
            const parsed = parseFloat(output.trim());
            if (c === 0 && !isNaN(parsed) && parsed > 0) {
              resolve(Math.round(parsed));
            } else {
              const words = text.split(/\s+/).length;
              resolve(Math.max(targetDuration || 3, Math.ceil(words / 2.3)));
            }
          });
          child.on('error', () => {
            const words = text.split(/\s+/).length;
            resolve(Math.max(targetDuration || 3, Math.ceil(words / 2.3)));
          });
        });
      }
    } catch {
      // fallback calculation
    }

    const words = text.split(/\s+/).length;
    return Math.max(targetDuration || 3, Math.ceil(words / 2.3));
  }
}
