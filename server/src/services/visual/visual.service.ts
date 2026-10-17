import path from 'path';
import { VisualProvider } from './visual.provider.js';
import { GroupCloudVisualProvider } from './providers/groupcloud.visual.provider.js';
import { CanvasVisualProvider } from './providers/canvas.visual.provider.js';
import { StockVisualProvider } from './providers/stock.visual.provider.js';
import { Scene, VideoTemplate } from '../../types/index.js';
import { config } from '../../config/index.js';

export class VisualService {
  private provider: VisualProvider;

  constructor(provider?: VisualProvider) {
    if (provider) {
      this.provider = provider;
    } else if (config.visual.provider === 'stock') {
      this.provider = new StockVisualProvider();
    } else if (config.visual.provider === 'groupcloud' || config.visual.apiKey) {
      this.provider = new GroupCloudVisualProvider();
    } else {
      this.provider = new CanvasVisualProvider();
    }
  }

  public getProvider(): VisualProvider {
    return this.provider;
  }

  public async generateScenesVisuals(
    scenes: Scene[],
    generationId: string,
    topic: string,
    title: string,
    onProgress?: (completed: number, total: number) => void,
    options?: { template?: VideoTemplate; isExperiential?: boolean }
  ): Promise<Scene[]> {
    const total = scenes.length;
    let completed = 0;
    const usedUrls = new Set<string>();

    const updatedScenes = await Promise.all(
      scenes.map(async (scene) => {
        const filename = `scene_${scene.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.png`;
        const outputPath = path.join(config.paths.temp, `${generationId}_${filename}`);

        await this.provider.generateImage(scene.visualPrompt, outputPath, {
          width: 1080,
          height: 1920,
          sceneId: scene.id,
          title,
          caption: scene.caption,
          narration: scene.narration,
          topic,
          searchQuery: scene.searchQuery,
          usedUrls,
          template: options?.template,
          isExperiential: options?.isExperiential,
        });

        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }

        return {
          ...scene,
          imagePath: outputPath,
          imageUrl: `/media/temp/${path.basename(outputPath)}`,
        };
      })
    );

    return updatedScenes;
  }

  public async regenerateSingleSceneVisual(
    scene: Scene,
    generationId: string,
    topic: string,
    title: string
  ): Promise<Scene> {
    const filename = `scene_${scene.id}_regen_${Date.now()}.png`;
    const outputPath = path.join(config.paths.temp, `${generationId}_${filename}`);

    await this.provider.generateImage(scene.visualPrompt, outputPath, {
      width: 1080,
      height: 1920,
      sceneId: scene.id,
      title,
      caption: scene.caption,
      narration: scene.narration,
      topic,
      searchQuery: scene.searchQuery,
    });

    return {
      ...scene,
      imagePath: outputPath,
      imageUrl: `/media/temp/${path.basename(outputPath)}`,
    };
  }
}
