import fs from 'fs';
import path from 'path';
import { VisualProvider, VisualGenerationOptions } from '../visual.provider.js';
import { CanvasVisualProvider } from './canvas.visual.provider.js';
import { config } from '../../../config/index.js';

export class GroupCloudVisualProvider implements VisualProvider {
  public readonly name = 'Group Cloud Vision';
  private readonly fallbackProvider: CanvasVisualProvider;
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.visual.apiKey;
    this.fallbackProvider = new CanvasVisualProvider();
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async generateImage(
    prompt: string,
    outputPath: string,
    options: VisualGenerationOptions
  ): Promise<string> {
    if (!this.isConfigured()) {
      // Graceful fallback to local high-resolution canvas provider
      return this.fallbackProvider.generateImage(prompt, outputPath, options);
    }

    try {
      const endpoint = `${config.groq.baseUrl}/images/generations`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          prompt: `${prompt}. Vertical 9:16 aspect ratio, high resolution, photorealistic, professional lighting`,
          n: 1,
          size: '1024x1792',
          response_format: 'b64_json',
        }),
      });

      if (!response.ok) {
        throw new Error(`Group Cloud image generation failed with status ${response.status}`);
      }

      const data = (await response.json()) as {
        data?: Array<{ b64_json?: string; url?: string }>;
      };

      const item = data.data?.[0];
      if (item?.b64_json) {
        const buffer = Buffer.from(item.b64_json, 'base64');
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(outputPath, buffer);
        return outputPath;
      } else if (item?.url) {
        const imgResp = await fetch(item.url);
        const arrayBuf = await imgResp.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(arrayBuf));
        return outputPath;
      }
    } catch {
      // If remote provider fails, fallback to local canvas so generation job doesn't fail
      return this.fallbackProvider.generateImage(prompt, outputPath, options);
    }

    return this.fallbackProvider.generateImage(prompt, outputPath, options);
  }
}
