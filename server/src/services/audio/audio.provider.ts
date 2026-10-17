export interface AudioGenerationOptions {
  voice?: string;
  speed?: number;
  pitch?: string;
  targetDuration?: number;
}

export interface AudioGenerationResult {
  filePath: string;
  duration: number; // in seconds
}

export interface AudioProvider {
  readonly name: string;
  isConfigured(): boolean;
  generateSpeech(
    text: string,
    outputPath: string,
    options?: AudioGenerationOptions
  ): Promise<AudioGenerationResult>;
}
