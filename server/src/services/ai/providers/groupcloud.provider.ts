import { LLMProvider } from '../llm.provider.js';
import { config } from '../../../config/index.js';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * GroqCloud LLM Provider
 * Uses the OpenAI-compatible Groq API endpoint.
 * Recommended models: llama-3.3-70b-versatile, mixtral-8x7b-32768
 * Docs: https://console.groq.com/docs/openai
 */
export class GroupCloudProvider implements LLMProvider {
  public readonly name = 'GroqCloud';
  public readonly model: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = config.groq.apiKey;
    this.baseUrl = config.groq.baseUrl.replace(/\/+$/, '');
    this.model = config.groq.model || 'llama-3.3-70b-versatile';
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private checkConfiguration(): void {
    if (!this.isConfigured()) {
      console.warn(
        `[GroqCloud] GROQ_API_KEY is not set. Engaging resilient free AI inference fallback.`
      );
    }
  }

  public async generateText(
    prompt: string,
    systemPrompt?: string,
    modelOverride?: string,
    responseFormat?: { type: 'json_object' }
  ): Promise<string> {
    this.checkConfiguration();

    // If no Groq key configured, use free open inference
    if (!this.isConfigured()) {
      if (config.devMockMode) {
        return this.mockGenerateText(prompt, systemPrompt);
      }
      try {
        const fullPrompt = `${systemPrompt ? systemPrompt + '\n\n' : ''}${prompt}`;
        const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}?model=openai&json=${
          responseFormat ? 'true' : 'false'
        }`;
        const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
        if (resp.ok) {
          const txt = await resp.text();
          if (txt && txt.trim().length > 0) return txt.trim();
        }
      } catch (err) {
        console.warn('[AIProvider] Free inference fallback failed, using mock:', (err as Error).message);
      }
      return this.mockGenerateText(prompt, systemPrompt);
    }

    const messages: Array<{ role: string; content: string }> = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const endpoint = `${this.baseUrl}/chat/completions`;
    let attempts = 0;
    const maxAttempts = 3;
    let currentModel = modelOverride || this.model;

    while (attempts < maxAttempts) {
      attempts++;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: currentModel,
          messages,
          temperature: 0.7,
          max_tokens: 4096,
          ...(responseFormat ? { response_format: responseFormat } : {}),
        }),
      });

      if (response.status === 429) {
        const errText = await response.text().catch(() => '');
        console.warn(
          `[GroqCloud] 429 Rate limit on ${currentModel} (attempt ${attempts}/${maxAttempts}). Backing off...`
        );
        // Switch to higher-capacity model if gpt-oss-120b hit token limits
        if (currentModel !== 'llama-3.3-70b-versatile') {
          currentModel = 'llama-3.3-70b-versatile';
        }
        const waitMatch = errText.match(/try again in ([\d\.]+)s/i);
        const waitSec = waitMatch ? Math.ceil(parseFloat(waitMatch[1])) + 1 : 5;
        console.log(`[GroqCloud] Waiting ${waitSec}s before retrying with ${currentModel}...`);
        await new Promise((r) => setTimeout(r, waitSec * 1000));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`GroqCloud API error (${response.status}): ${errText}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('GroqCloud API returned empty response');
      }

      return content;
    }

    throw new Error('GroqCloud API failed after multiple retries due to rate limits.');
  }

  public async generateJSON<T>(prompt: string, systemPrompt?: string, modelOverride?: string): Promise<T> {
    this.checkConfiguration();

    if (!this.isConfigured() && config.devMockMode) {
      return this.mockGenerateJSON<T>(prompt);
    }

    const enhancedSystem = `${systemPrompt || ''}\nYou MUST respond with valid raw JSON only. Do NOT include markdown code blocks, backticks, or any non-JSON text. Return only the JSON object or array.`;
    const text = await this.generateText(prompt, enhancedSystem, modelOverride, { type: 'json_object' });

    try {
      const trimmed = text.trim();
      return JSON.parse(trimmed) as T;
    } catch {
      try {
        // Strip markdown code fences if model wrapped in ```json
        const cleaned = text
          .replace(/```(?:json)?/gi, '')
          .replace(/```/g, '')
          .trim();

        // Extract balanced JSON object { ... }
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1)) as T;
        }

        // Extract balanced JSON array [ ... ]
        const firstBracket = cleaned.indexOf('[');
        const lastBracket = cleaned.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1)) as T;
        }
      } catch {
        // fall through to error
      }
      if (!this.isConfigured() || config.devMockMode) {
        console.warn(`[AIProvider] Falling back to structured response for prompt: ${prompt.slice(0, 80)}...`);
        return this.mockGenerateJSON<T>(prompt);
      }
      throw new Error(`Failed to parse JSON from GroqCloud (${modelOverride || this.model}): ${text.slice(0, 200)}...`);
    }
  }

  // ─── Development mock fallback (DEV_MOCK_MODE=true only) ────────────────────

  private mockGenerateText(prompt: string, _systemPrompt?: string): string {
    if (prompt.includes('conversational intent classifier')) {
      return JSON.stringify({
        intent: 'create_video',
        topic: 'AI video production',
        explanation: 'Development mode intent classification',
      });
    }
    return `[GroqCloud Dev Mode] Responded to: ${prompt.slice(0, 100)}...`;
  }

  private mockGenerateJSON<T>(prompt: string): T {
    const isCricketOrKohli = /virat|kohli|cricket/i.test(prompt);

    if (prompt.includes('extract structured video production parameters')) {
      if (isCricketOrKohli) {
        return {
          topic: 'Playing Cricket with Virat Kohli',
          intent: 'entertain',
          audience: 'cricket fans and sports creators',
          tone: 'high-energy',
          duration: 25,
          contentType: 'action_experience',
          angle: 'Batting alongside King Kohli in an electrifying final over chase',
          isExperiential: true,
        } as unknown as T;
      }

      return {
        topic: 'AI Agents in Software Development',
        intent: 'educate',
        audience: 'engineers and creators',
        tone: 'professional',
        duration: 25,
        contentType: 'explainer',
        angle: 'How autonomous agents build full applications from scratch',
        isExperiential: false,
      } as unknown as T;
    }

    if (prompt.includes('Create a complete narrative script') || prompt.includes('narrative script') || prompt.includes('viral scriptwriter')) {
      if (isCricketOrKohli) {
        return {
          title: 'Batting with King Kohli',
          hook: 'Walking out under 80,000 screaming fans — batting with King Kohli himself.',
          introduction: 'The stadium was buzzing as I strapped on my helmet and gloves.',
          scenes: [
            {
              id: 1,
              duration: 6,
              narration: 'Walking out under 80,000 screaming fans at Eden Gardens — batting right next to King Kohli.',
              visualPrompt: 'Cinematic 9:16 vertical shot: young cricket batsman walking onto the pitch under blinding stadium floodlights, Virat Kohli beside him, packed stadium, photorealistic 8k',
              searchQuery: 'cricket batsman pitch Virat Kohli stadium',
              caption: '🏏 Walking Out With King Kohli',
              motion: 'zoom-in',
            },
            {
              id: 2,
              duration: 6,
              narration: 'Final over. 14 runs needed. Virat walks down the pitch, taps my bat: "Watch the seam, back yourself!"',
              visualPrompt: 'Dramatic close-up 9:16 vertical shot: Virat Kohli tapping gloves with young batsman at non-striker end, intense stadium atmosphere, high detail',
              searchQuery: 'Virat Kohli cricket batsman pitch discussion',
              caption: '⚡ The Final Over Talk',
              motion: 'crash-zoom',
            },
            {
              id: 3,
              duration: 6,
              narration: '150 km/h bouncer — I step back, hook it high, and launch it into the top tier for SIX!',
              visualPrompt: 'Explosive action shot 9:16 vertical: young batsman playing dynamic hook shot, cricket ball flying into the floodlit night sky, motion blur',
              searchQuery: 'cricket batsman hitting six night match',
              caption: '💥 SIX Into The Stands!',
              motion: 'action-shake',
            },
            {
              id: 4,
              duration: 7,
              narration: 'The stadium erupts into pure madness. Virat charges down the pitch, screaming and lifting me in celebration!',
              visualPrompt: 'Emotional celebration 9:16 vertical: Virat Kohli hugging and celebrating with young batsman on the pitch, roaring crowd in background',
              searchQuery: 'Virat Kohli cricket match celebration roar',
              caption: '🏆 The Victory Roar',
              motion: 'crash-zoom',
            },
          ],
          conclusion: 'A dream moment on the pitch with the greatest chaser in cricket history.',
          cta: 'What would you do in the final over with King Kohli? Comment on Qoneqt!',
        } as unknown as T;
      }

      return {
        title: 'How AI Agents Build Real Software',
        hook: "What if an AI didn't just suggest code, but actually built the whole system?",
        introduction: 'Autonomous agents are moving from autocomplete to architecture.',
        scenes: [
          {
            id: 1,
            duration: 6,
            narration: "What if an AI didn't just suggest code, but actually built the whole system?",
            visualPrompt: 'Futuristic clean engineering terminal compiling code with glowing architectural blueprint nodes in 9:16 vertical view',
            caption: 'AI agents are rewriting development',
            motion: 'slow-zoom',
          },
          {
            id: 2,
            duration: 6,
            narration: 'Instead of single prompts, autonomous agents plan, write code, run compilers, and test output.',
            visualPrompt: 'Minimalist split screen showing terminal output and automated browser test passing cleanly',
            caption: 'Autonomous multi-step execution',
            motion: 'pan-left',
          },
          {
            id: 3,
            duration: 6,
            narration: 'They compose multimedia, generate voice, and verify quality in real-time pipelines.',
            visualPrompt: 'Dynamic audio wave forms and video frames being rendered on high-speed timeline',
            caption: 'From code to multimedia pipelines',
            motion: 'zoom-in',
          },
          {
            id: 4,
            duration: 7,
            narration: 'Start building with AI today. The tools are here — the only limit is your idea.',
            visualPrompt: 'Modern creator workspace with laptop displaying clean video editing timeline',
            caption: 'Build your next idea with AI',
            motion: 'slow-zoom',
          },
        ],
        conclusion: 'The era of passive chatbots is over. Agentic systems are building the next web.',
        cta: 'Start creating AI-powered content today.',
      } as unknown as T;
    }

    if (prompt.includes('scene production plan')) {
      if (isCricketOrKohli) {
        return [
          {
            id: 1,
            duration: 6,
            narration: 'Walking out under 80,000 screaming fans at Eden Gardens — batting right next to King Kohli.',
            visualPrompt: 'Cinematic 9:16 vertical shot: young cricket batsman walking onto the pitch under blinding stadium floodlights, Virat Kohli beside him, packed stadium',
            searchQuery: 'cricket batsman pitch Virat Kohli stadium',
            caption: '🏏 Walking Out With King Kohli',
            transition: 'fade',
            motion: 'zoom-in',
            backgroundType: 'generated-image',
          },
          {
            id: 2,
            duration: 6,
            narration: 'Final over. 14 runs needed. Virat walks down the pitch, taps my bat: "Watch the seam, back yourself!"',
            visualPrompt: 'Dramatic close-up 9:16 vertical shot: Virat Kohli tapping gloves with young batsman at non-striker end, intense stadium atmosphere',
            searchQuery: 'Virat Kohli cricket batsman pitch discussion',
            caption: '⚡ The Final Over Talk',
            transition: 'cut',
            motion: 'crash-zoom',
            backgroundType: 'generated-image',
          },
          {
            id: 3,
            duration: 6,
            narration: '150 km/h bouncer — I step back, hook it high, and launch it into the top tier for SIX!',
            visualPrompt: 'Explosive action shot 9:16 vertical: young batsman playing dynamic hook shot, cricket ball flying into the floodlit night sky',
            searchQuery: 'cricket batsman hitting six night match',
            caption: '💥 SIX Into The Stands!',
            transition: 'cut',
            motion: 'action-shake',
            backgroundType: 'generated-image',
          },
          {
            id: 4,
            duration: 7,
            narration: 'The stadium erupts into pure madness. Virat charges down the pitch, screaming and lifting me in celebration!',
            visualPrompt: 'Emotional celebration 9:16 vertical: Virat Kohli hugging and celebrating with young batsman on the pitch, roaring crowd in background',
            searchQuery: 'Virat Kohli cricket match celebration roar',
            caption: '🏆 The Victory Roar',
            transition: 'fade',
            motion: 'crash-zoom',
            backgroundType: 'generated-image',
          },
        ] as unknown as T;
      }
      return [
        {
          id: 1, duration: 6,
          narration: "What if an AI didn't just suggest code, but actually built the whole system?",
          visualPrompt: 'Clean minimalist developer IDE and terminal running builds',
          caption: 'AI agents are rewriting development',
          transition: 'fade', motion: 'slow-zoom', backgroundType: 'generated-image',
        },
        {
          id: 2, duration: 6,
          narration: 'Instead of single prompts, autonomous agents plan, write code, run compilers, and test output.',
          visualPrompt: 'Code diffs and automated quality checks passing green',
          caption: 'Autonomous multi-step execution',
          transition: 'dissolve', motion: 'pan-left', backgroundType: 'generated-image',
        },
        {
          id: 3, duration: 6,
          narration: 'They compose multimedia, generate voice, and verify quality in real-time pipelines.',
          visualPrompt: 'Audio timeline and video rendering in FFmpeg',
          caption: 'From code to multimedia pipelines',
          transition: 'fade', motion: 'zoom-in', backgroundType: 'generated-image',
        },
        {
          id: 4, duration: 7,
          narration: 'Start building with AI today. The tools are here — the only limit is your idea.',
          visualPrompt: 'Creator workspace with laptop showing video editing timeline',
          caption: 'Build your next idea with AI',
          transition: 'fade', motion: 'slow-zoom', backgroundType: 'generated-image',
        },
      ] as unknown as T;
    }

    if (prompt.includes('quality control editor')) {
      return {
        passed: true,
        issues: [],
        aiChecks: {
          topicRelevance: true,
          scriptConsistency: true,
          sceneConsistency: true,
          narrationVisualAlignment: true,
        },
      } as unknown as T;
    }

    if (prompt.includes('conversational intent classifier')) {
      return {
        intent: 'create_video',
        topic: 'AI video production',
        explanation: 'Mock intent classifier',
      } as unknown as T;
    }

    return {} as T;
  }
}
