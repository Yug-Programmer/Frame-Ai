import { Scene } from '../types/index.js';

export function buildVisualPrompt(scene: Scene, videoTopic: string): string {
  return `Vertical 9:16 aspect ratio, high resolution, cinematic framing, modern editorial aesthetic.
Topic: ${videoTopic}.
Scene description: ${scene.visualPrompt}.
Caption context: "${scene.caption}".
Style: Clean, professional, high-contrast, uncluttered, photorealistic or minimal 3D design, sharp focus, 8k render.`;
}
