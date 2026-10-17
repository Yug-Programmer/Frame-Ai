import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { VisualProvider, VisualGenerationOptions } from '../visual.provider.js';
import { CanvasVisualProvider } from './canvas.visual.provider.js';

/**
 * Generative Visual Provider (Pollinations Flux / SDXL)
 *
 * Designed specifically for imaginative, experiential, personalized, and action scenarios
 * (e.g. "me playing cricket with Virat Kohli", "cyberpunk warrior in Neo-Tokyo", "space exploration").
 *
 * Synthesizes high-fidelity 1080x1920 9:16 vertical images directly from AI visual prompts.
 */
export class GenerativeVisualProvider implements VisualProvider {
  public readonly name = 'Generative AI Visual Engine (Flux / SDXL)';
  private readonly fallbackCanvas: CanvasVisualProvider;

  constructor() {
    this.fallbackCanvas = new CanvasVisualProvider();
  }

  public isConfigured(): boolean {
    return true; // Zero-config, always available
  }

  public async generateImage(
    prompt: string,
    outputPath: string,
    options: VisualGenerationOptions
  ): Promise<string> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const sceneNum = options.sceneId || 1;
    const width = options.width || 1080;
    const height = options.height || 1920;

    // Enhance prompt for vertical 9:16 cinematic action photography
    const cleanPrompt = prompt
      .replace(/[^\w\s,.-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const enhancedPrompt = `${cleanPrompt}, 9:16 vertical composition, portrait orientation, cinematic lighting, 8k resolution, photorealistic, ultra-detailed, vivid atmosphere, professional color grading, dynamic motion`;

    console.log(`[GenerativeAI] Scene ${sceneNum} generating: "${cleanPrompt.slice(0, 70)}..."`);

    // Try Pollinations Flux / SDXL
    const models = ['flux', 'turbo'];
    for (const model of models) {
      try {
        const seed = Math.floor(Math.random() * 1000000);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(
          enhancedPrompt
        )}?width=${width}&height=${height}&model=${model}&nologo=true&enhance=true&seed=${seed}`;

        const res = await fetch(url, {
          signal: AbortSignal.timeout(18000),
          headers: {
            'User-Agent': 'FrameCinematicAgent/2.0 (contact@frameai.local)',
            Accept: 'image/jpeg,image/png,image/webp,*/*',
          },
        });

        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);

          if (buffer.length > 5000) {
            // Process through sharp to guarantee exact 1080x1920 dimensions
            await sharp(buffer)
              .resize(width, height, { fit: 'cover', position: 'center' })
              .png({ quality: 90 })
              .toFile(outputPath);

            console.log(
              `[GenerativeAI] Scene ${sceneNum} generated successfully with ${model} (${(
                buffer.length / 1024
              ).toFixed(1)} KB)`
            );
            return outputPath;
          }
        }
      } catch (err) {
        console.warn(`[GenerativeAI] Scene ${sceneNum} model ${model} failed: ${(err as Error).message}`);
      }
    }

    // If generative AI is unreachable, fall back to high-res canvas compositor
    console.warn(`[GenerativeAI] Scene ${sceneNum} falling back to canvas synthesizer`);
    return this.fallbackCanvas.generateImage(prompt, outputPath, options);
  }
}
