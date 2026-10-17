export interface VisualGenerationOptions {
  width: number;
  height: number;
  sceneId: number;
  title: string;
  caption: string;
  narration?: string;
  topic: string;
  searchQuery?: string;
  usedUrls?: Set<string>;
  template?: string;
  isExperiential?: boolean;
}

export interface VisualProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateImage(prompt: string, outputPath: string, options: VisualGenerationOptions): Promise<string>;
}
