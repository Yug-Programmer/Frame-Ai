export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  isConfigured(): boolean;
  generateText(prompt: string, systemPrompt?: string, modelOverride?: string): Promise<string>;
  generateJSON<T>(prompt: string, systemPrompt?: string, modelOverride?: string): Promise<T>;
}
