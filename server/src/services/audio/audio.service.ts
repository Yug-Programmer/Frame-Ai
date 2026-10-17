import path from 'path';
import { AudioProvider } from './audio.provider.js';
import { EdgeTTSProvider } from './providers/edge.audio.provider.js';
import { SynthAudioProvider } from './providers/synth.audio.provider.js';
import { LocalAudioProvider } from './providers/local.audio.provider.js';
import { Scene } from '../../types/index.js';
import { config } from '../../config/index.js';

export class AudioService {
  private provider: AudioProvider;
  private localProvider: LocalAudioProvider;

  constructor(provider?: AudioProvider) {
    this.localProvider = new LocalAudioProvider();
    if (provider) {
      this.provider = provider;
    } else if (config.tts.provider === 'synth') {
      this.provider = new SynthAudioProvider();
    } else {
      this.provider = new EdgeTTSProvider();
    }
  }

  public getProvider(): AudioProvider {
    return this.provider;
  }

  public async generateScenesAudio(
    scenes: Scene[],
    generationId: string,
    onProgress?: (completed: number, total: number) => void,
    options?: { forceLocalVoice?: boolean }
  ): Promise<Scene[]> {
    const total = scenes.length;
    let completed = 0;
    const activeProvider = options?.forceLocalVoice ? this.localProvider : this.provider;

    const updatedScenes = await Promise.all(
      scenes.map(async (scene) => {
        const filename = `scene_${scene.id}_audio_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.wav`;
        const outputPath = path.join(config.paths.temp, `${generationId}_${filename}`);

        const result = await activeProvider.generateSpeech(scene.narration, outputPath, {
          targetDuration: scene.duration,
        });

        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }

        // Ensure scene duration matches narration timing
        const actualDuration = Math.max(scene.duration, Math.round(result.duration));

        return {
          ...scene,
          duration: actualDuration,
          audioPath: result.filePath,
          audioUrl: `/media/temp/${path.basename(result.filePath)}`,
        };
      })
    );

    return updatedScenes;
  }

  public async regenerateSingleSceneAudio(scene: Scene, generationId: string): Promise<Scene> {
    const filename = `scene_${scene.id}_audio_regen_${Date.now()}.wav`;
    const outputPath = path.join(config.paths.temp, `${generationId}_${filename}`);

    const result = await this.provider.generateSpeech(scene.narration, outputPath, {
      targetDuration: scene.duration,
    });

    const actualDuration = Math.max(scene.duration, Math.round(result.duration));

    return {
      ...scene,
      duration: actualDuration,
      audioPath: result.filePath,
      audioUrl: `/media/temp/${path.basename(result.filePath)}`,
    };
  }
}
