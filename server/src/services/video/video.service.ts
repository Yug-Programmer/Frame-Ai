import path from 'path';
import fs from 'fs';
import { VideoComposer } from './videoComposer.js';
import { Scene, VideoTemplate } from '../../types/index.js';
import { config } from '../../config/index.js';

export class VideoService {
  private composer: VideoComposer;

  constructor(composer?: VideoComposer) {
    this.composer = composer || new VideoComposer();
  }

  public getComposer(): VideoComposer {
    return this.composer;
  }

  // Compose all scenes into final video
  public async composeFullVideo(
    scenes: Scene[],
    generationId: string,
    onProgress?: (step: string, percent: number) => void,
    template?: VideoTemplate
  ): Promise<{ videoPath: string; videoUrl: string; clipPaths: string[] }> {
    const total = scenes.length;
    let completed = 0;

    if (onProgress) {
      onProgress(`Rendering ${total} scene clips in parallel`, 10);
    }

    const clipPaths = await Promise.all(
      scenes.map(async (scene) => {
        const clipFilename = `${generationId}_clip_scene_${scene.id}.mp4`;
        const clipPath = path.join(config.paths.temp, clipFilename);

        await this.composer.renderSceneClip(scene, generationId, clipPath, template);

        completed++;
        if (onProgress) {
          onProgress(`Rendered scene ${scene.id} (${completed} of ${total})`, Math.round((completed / total) * 80));
        }

        return clipPath;
      })
    );

    if (onProgress) {
      onProgress('Concatenating scenes into final video', 90);
    }

    const finalFilename = `${generationId}.mp4`;
    const finalOutputPath = path.join(config.paths.output, finalFilename);
    const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0);

    await this.composer.concatScenes(clipPaths, finalOutputPath, totalDuration);

    if (onProgress) {
      onProgress('Video composition complete', 100);
    }

    return {
      videoPath: finalOutputPath,
      videoUrl: `/media/output/${finalFilename}`,
      clipPaths,
    };
  }

  // Fast re-render of a single scene clip and immediate re-concatenation
  public async recomposeWithUpdatedScene(
    scenes: Scene[],
    updatedSceneId: number,
    generationId: string
  ): Promise<{ videoPath: string; videoUrl: string }> {
    const updatedScene = scenes.find((s) => s.id === updatedSceneId);
    if (!updatedScene) {
      throw new Error(`Scene ${updatedSceneId} not found in project`);
    }

    const clipFilename = `${generationId}_clip_scene_${updatedScene.id}.mp4`;
    const clipPath = path.join(config.paths.temp, clipFilename);

    // Re-render only this scene clip
    await this.composer.renderSceneClip(updatedScene, generationId, clipPath);

    // Gather all clip paths in order
    const clipPaths = scenes.map((s) => path.join(config.paths.temp, `${generationId}_clip_scene_${s.id}.mp4`));

    // Verify all clips exist
    for (const p of clipPaths) {
      if (!fs.existsSync(p)) {
        // If an older clip was lost, re-render it
        const sc = scenes.find((s) => path.basename(p).includes(`_scene_${s.id}.mp4`));
        if (sc) {
          await this.composer.renderSceneClip(sc, generationId, p);
        }
      }
    }

    const finalFilename = `${generationId}.mp4`;
    const finalOutputPath = path.join(config.paths.output, finalFilename);

    await this.composer.concatScenes(clipPaths, finalOutputPath);

    return {
      videoPath: finalOutputPath,
      videoUrl: `/media/output/${finalFilename}`,
    };
  }
}
