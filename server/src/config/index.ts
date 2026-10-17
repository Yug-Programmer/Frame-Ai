import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Load environment variables from project root or server directory
const rootEnvPath = path.resolve(process.cwd(), '../.env');
const localEnvPath = path.resolve(process.cwd(), '.env');

if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

// Temporary and output asset paths
const tempDir = path.resolve(process.cwd(), 'temp');
const outputDir = path.resolve(process.cwd(), 'output');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Locate FFmpeg and FFprobe binary paths dynamically
function resolveFFmpegPaths(): { ffmpegPath: string; ffprobePath: string } {
  // 1. Explicit env variables
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    const ffprobeCandidate = path.join(path.dirname(process.env.FFMPEG_PATH), process.platform === 'win32' ? 'ffprobe.exe' : 'ffprobe');
    return {
      ffmpegPath: process.env.FFMPEG_PATH,
      ffprobePath: fs.existsSync(ffprobeCandidate) ? ffprobeCandidate : 'ffprobe'
    };
  }

  // 2. Check if 'ffmpeg' is directly available in PATH
  try {
    const testCmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    const found = execSync(testCmd, { stdio: 'pipe' }).toString().trim().split(/\r?\n/)[0];
    if (found && fs.existsSync(found)) {
      const probeCmd = process.platform === 'win32' ? 'where ffprobe' : 'which ffprobe';
      const probeFound = execSync(probeCmd, { stdio: 'pipe' }).toString().trim().split(/\r?\n/)[0];
      return { ffmpegPath: found, ffprobePath: probeFound || 'ffprobe' };
    }
  } catch {
    // Not found directly in standard path
  }

  // 3. Check Windows WinGet standard installation folder
  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
    const wingetPackagesDir = path.join(localAppData, 'Microsoft', 'WinGet', 'Packages');
    if (fs.existsSync(wingetPackagesDir)) {
      try {
        const findBin = (name: string): string | null => {
          const files = fs.readdirSync(wingetPackagesDir);
          for (const f of files) {
            if (f.toLowerCase().includes('ffmpeg')) {
              const binDir = path.join(wingetPackagesDir, f);
              const subItems = fs.readdirSync(binDir);
              for (const sub of subItems) {
                const target = path.join(binDir, sub, 'bin', name);
                if (fs.existsSync(target)) return target;
              }
            }
          }
          return null;
        };
        const ffmpegWin = findBin('ffmpeg.exe');
        const ffprobeWin = findBin('ffprobe.exe');
        if (ffmpegWin && fs.existsSync(ffmpegWin)) {
          return { ffmpegPath: ffmpegWin, ffprobePath: ffprobeWin || 'ffprobe' };
        }
      } catch {
        // Fallback below
      }
    }
  }

  // 4. Fallback to @ffmpeg-installer if available
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
    return {
      ffmpegPath: ffmpegInstaller.path,
      ffprobePath: ffprobeInstaller.path,
    };
  } catch {
    return { ffmpegPath: 'ffmpeg', ffprobePath: 'ffprobe' };
  }
}

const { ffmpegPath, ffprobePath } = resolveFFmpegPaths();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  devMockMode: process.env.DEV_MOCK_MODE === 'true',

  // GroqCloud API (OpenAI-compatible — llama-3.3-70b-versatile, mixtral-8x7b, etc.)
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  },

  // Visual Provider
  visual: {
    provider: process.env.VISUAL_PROVIDER || 'stock', // 'stock' | 'canvas'
    apiKey: process.env.VISUAL_API_KEY || '',
  },

  // Pexels stock photo API (free)
  pexels: {
    apiKey: process.env.PEXELS_API_KEY || '',
  },

  // Unsplash stock photo API (free)
  unsplash: {
    accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
  },

  // ElevenLabs TTS
  elevenlabs: {
    apiKey: process.env.ELEVENLABS_API_KEY || '',
    voiceId: process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9',  // Daniel - Steady Broadcaster (free premade)
    model: process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  },

  // Audio (TTS) Provider (kept for fallback logic)
  tts: {
    provider: process.env.TTS_PROVIDER || 'elevenlabs',
    apiKey: process.env.ELEVENLABS_API_KEY || '',
  },

  paths: {
    temp: tempDir,
    output: outputDir,
    ffmpeg: ffmpegPath,
    ffprobe: ffprobePath,
  },
};
