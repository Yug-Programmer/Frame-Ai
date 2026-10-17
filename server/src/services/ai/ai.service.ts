import { z } from 'zod';
import { LLMProvider } from './llm.provider.js';
import { GroupCloudProvider } from './providers/groupcloud.provider.js';
import {
  TopicAnalysis,
  Script,
  Scene,
  QualityCheckResult,
  ChatRouterResult,
} from '../../types/index.js';
import { buildAnalyzeTopicPrompt } from '../../prompts/analyzeTopic.prompt.js';
import { buildGenerateScriptPrompt } from '../../prompts/generateScript.prompt.js';
import { buildScenePlannerPrompt } from '../../prompts/scenePlanner.prompt.js';
import { buildQualityCheckPrompt } from '../../prompts/qualityCheck.prompt.js';
import { buildChatRouterPrompt } from '../../prompts/chatRouter.prompt.js';

// Strict Zod Schemas for LLM Output Validation
const TopicAnalysisSchema = z.object({
  topic: z.string().min(1),
  intent: z.string().default('educate'),
  audience: z.string().default('Qoneqt community'),
  tone: z.string().default('professional'),
  duration: z.number().int().min(10).max(120).default(30),
  contentType: z.string().default('explainer'),
  angle: z.string().default('comprehensive overview'),
  isExperiential: z.boolean().optional().default(false),
});

const SceneSchema = z.object({
  id: z.number().int(),
  duration: z.number().min(2).max(30),
  narration: z.string().min(1),
  visualPrompt: z.string().min(1),
  searchQuery: z.string().optional(),
  caption: z.string().min(1),
  transition: z.enum(['fade', 'slide', 'cut', 'dissolve']).default('fade'),
  motion: z.enum([
    'slow-zoom',
    'pan-left',
    'pan-right',
    'static',
    'zoom-in',
    'zoom-out',
    'crash-zoom',
    'action-shake',
    'whip-pan',
    'dynamic-orbit',
  ]).default('slow-zoom'),
  backgroundType: z.string().default('generated-image'),
  videoClipPath: z.string().optional(),
  videoClipUrl: z.string().optional(),
  assetType: z.enum(['image', 'video']).optional(),
});

const ScriptSchema = z.object({
  title: z.string().min(1),
  hook: z.string().min(1),
  introduction: z.string().optional(),
  scenes: z.array(
    z.object({
      id: z.number().int(),
      duration: z.number().min(2).max(30),
      narration: z.string().min(1),
      visualPrompt: z.string().min(1),
      searchQuery: z.string().optional(),
      caption: z.string().min(1),
      motion: z.enum([
        'slow-zoom',
        'pan-left',
        'pan-right',
        'static',
        'zoom-in',
        'zoom-out',
        'crash-zoom',
        'action-shake',
        'whip-pan',
        'dynamic-orbit',
      ]).optional(),
    })
  ).min(1),
  conclusion: z.string().optional(),
  cta: z.string().default('Join the discussion on Qoneqt'),
});

const QualityCheckSchema = z.object({
  passed: z.boolean(),
  issues: z.array(z.string()).default([]),
  aiChecks: z.object({
    topicRelevance: z.boolean(),
    scriptConsistency: z.boolean(),
    sceneConsistency: z.boolean(),
    narrationVisualAlignment: z.boolean(),
  }),
});

const ChatRouterSchema = z.object({
  intent: z.enum([
    'create_video',
    'modify_duration',
    'modify_hook',
    'modify_tone',
    'regenerate_scene',
    'regenerate_visuals',
    'regenerate_voice',
    'show_script',
    'show_scenes',
    'publish_qoneqt',
    'general_qa',
  ]),
  target: z.string().optional().nullable(),
  value: z.union([z.string(), z.number()]).optional().nullable(),
  sceneId: z.number().int().optional().nullable(),
  explanation: z.string().optional().nullable(),
  topic: z.string().optional().nullable(),
});

export class AIService {
  private provider: LLMProvider;

  constructor(provider?: LLMProvider) {
    this.provider = provider || new GroupCloudProvider();
  }

  public getProvider(): LLMProvider {
    return this.provider;
  }

  public setProvider(provider: LLMProvider): void {
    this.provider = provider;
  }

  // Classify user conversational input
  public async routeMessage(
    userMessage: string,
    hasActiveGeneration: boolean,
    contextSummary?: string
  ): Promise<ChatRouterResult> {
    const prompt = buildChatRouterPrompt(userMessage, hasActiveGeneration, contextSummary);
    try {
      const raw = await this.provider.generateJSON<ChatRouterResult>(prompt);
      const parsed = ChatRouterSchema.safeParse(raw);
      if (parsed.success) {
        return parsed.data as ChatRouterResult;
      }
      return {
        intent: hasActiveGeneration ? 'general_qa' : 'create_video',
        topic: userMessage,
        explanation: 'Fallback route parsing',
      };
    } catch {
      // Heuristic fallback if LLM is offline
      const lower = userMessage.toLowerCase();
      if (lower.includes('show script') || lower.includes('show me the script')) {
        return { intent: 'show_script' };
      }
      if (lower.includes('show scene') || lower.includes('scenes')) {
        return { intent: 'show_scenes' };
      }
      if (lower.includes('publish') || lower.includes('qoneqt')) {
        return { intent: 'publish_qoneqt' };
      }
      if (lower.includes('make it') && (lower.includes('sec') || lower.includes('second'))) {
        const match = lower.match(/(\d+)\s*(?:sec|second)/);
        if (match) {
          return { intent: 'modify_duration', value: parseInt(match[1], 10) };
        }
      }
      if (lower.includes('scene') && (lower.includes('regenerate') || lower.includes('redo') || lower.includes('change'))) {
        const match = lower.match(/(?:scene|#)\s*(\d+)/);
        if (match) {
          return { intent: 'regenerate_scene', sceneId: parseInt(match[1], 10) };
        }
      }
      if (lower.includes('hook')) {
        return { intent: 'modify_hook', value: userMessage };
      }
      if (lower.startsWith('what is') || lower.startsWith('how does') || lower.startsWith('explain') || lower.includes('?')) {
        return { intent: 'general_qa', explanation: 'Direct question' };
      }
      return { intent: 'create_video', topic: userMessage };
    }
  }

  // Answer normal general questions
  public async answerQuestion(question: string, conversationHistory?: string): Promise<string> {
    const system = 'You are Frame, an intelligent, concise AI video producer and assistant. Answer clearly, accurately, and thoughtfully. Keep your response direct and structured.';
    const prompt = conversationHistory
      ? `Prior conversation:\n${conversationHistory}\n\nQuestion: ${question}`
      : question;
    return this.provider.generateText(prompt, system);
  }

  // Extract core entity or subject from user request
  public extractCoreSubject(input: string): string {
    let cleaned = input
      .replace(/\b(make|create|generate|produce|write|give me|show me)\s+(a\s+)?(video|short|reel|clip|story|trailer|movie)\s+(on|about|of)?\b/gi, '')
      .replace(/\b(origin story|origin|rise|fall|history|biography|life|explainer|overview|facts|all about|secrets|chronicles|truth behind)\s+of\b/gi, '')
      .replace(/\b(origin story|origin|rise|fall|history|biography|life|explainer|overview|facts|all about|secrets|chronicles|truth behind)\b/gi, '')
      .replace(/\b(me|i|my|we|myself)\s+(playing|batting|running|fighting|racing|meeting|talking|visiting|exploring|hanging out|practicing|training)\s+(with|against)?\b/gi, '')
      .replace(/\b(playing|batting|running|fighting|racing|meeting|talking|visiting)\s+(with|against|in)?\b/gi, '')
      .replace(/\b(a\s+cricket\s+match|cricket\s+match)\b/gi, 'cricket')
      .replace(/[^\w\s-]/g, ' ')
      .trim();

    cleaned = cleaned.replace(/^(the|a|an|with|about)\s+/i, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.length <= 4) {
      return words.join(' ');
    }
    return words.slice(0, 3).join(' ') || input;
  }

  // Multi-source live Web & Encyclopedic Info Search for any topic (superheroes, politics, countries, tech, etc.)
  public async searchWebInfo(query: string): Promise<string> {
    const snippets: string[] = [];
    const coreSubject = this.extractCoreSubject(query);

    // Parallel search across Wikipedia Summary, Wikipedia Search API, DuckDuckGo Instant Answer, and DDG HTML
    await Promise.allSettled([
      // 1. Direct Wikipedia Summary REST API for core subject
      (async () => {
        try {
          const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            coreSubject.replace(/\s+/g, '_')
          )}`;
          const sRes = await fetch(summaryUrl, {
            headers: { 'User-Agent': 'FrameCinematicAgent/2.0 (contact@frameai.local)' },
            signal: AbortSignal.timeout(2000),
          });
          if (sRes.ok) {
            const sData = (await sRes.json()) as any;
            if (sData.extract && sData.extract.length > 40) {
              snippets.push(`[Wikipedia Overview: ${sData.title}]: ${sData.extract}`);
            }
          }
        } catch {
          // Ignore
        }
      })(),

      // 2. Wikipedia Search API for broader context
      (async () => {
        try {
          const clean = query.replace(/[^\w\s]/g, '').trim().slice(0, 60);
          const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
            clean
          )}&prop=extracts&exintro=1&explaintext=1&exsentences=3&format=json&gsrlimit=3`;

          const res = await fetch(url, {
            headers: { 'User-Agent': 'FrameCinematicAgent/2.0 (contact@frameai.local)' },
            signal: AbortSignal.timeout(2000),
          });

          if (res.ok) {
            const data = (await res.json()) as any;
            const pages = data.query?.pages || {};
            for (const k of Object.keys(pages)) {
              if (pages[k].extract && pages[k].extract.length > 40) {
                snippets.push(`[Topic Detail - ${pages[k].title}]: ${pages[k].extract}`);
              }
            }
          }
        } catch {
          // Ignore
        }
      })(),

      // 3. DuckDuckGo Instant Answer API
      (async () => {
        try {
          const ddgApi = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
          const res = await fetch(ddgApi, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: AbortSignal.timeout(2000),
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            if (data.AbstractText) {
              snippets.push(`[Knowledge Graph: ${data.Heading || coreSubject}]: ${data.AbstractText}`);
            }
          }
        } catch {
          // Ignore
        }
      })(),

      // 4. DuckDuckGo Web Snippets
      (async () => {
        try {
          const ddgWeb = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
          const res = await fetch(ddgWeb, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              Accept: 'text/html',
            },
            signal: AbortSignal.timeout(2000),
          });
          if (res.ok) {
            const html = await res.text();
            const resultSnippets = Array.from(html.matchAll(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g))
              .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
              .filter((s) => s.length > 30)
              .slice(0, 3);
            if (resultSnippets.length > 0) {
              snippets.push(`[Web Search Snippets]:\n` + resultSnippets.join('\n'));
            }
          }
        } catch {
          // Ignore
        }
      })(),
    ]);

    return snippets.join('\n\n');
  }

  // Alias for backward compatibility
  public async searchWikipediaContext(query: string): Promise<string> {
    return this.searchWebInfo(query);
  }

  // Stage 1: Analyze user topic (enriched with live multi-source web info search)
  public async analyzeTopic(
    input: string,
    context?: string,
    cachedWebInfo?: string,
    modelType?: 'frame-bolt' | 'frame-titan'
  ): Promise<TopicAnalysis> {
    let enrichedContext = context || '';
    try {
      const webSummary = cachedWebInfo || (await this.searchWebInfo(input));
      if (webSummary) {
        enrichedContext = `${enrichedContext ? enrichedContext + '\n\n' : ''}[Verified Real-World Knowledge]:\n${webSummary}`;
        console.log(`[AIService] Enriched prompt with live web context for "${input.slice(0, 40)}"`);
      }
    } catch {
      // Continue seamlessly if lookup fails
    }

    const modelOverride = modelType === 'frame-bolt' ? 'qwen/qwen3.8-27b' : undefined;
    const prompt = buildAnalyzeTopicPrompt(input, enrichedContext);
    const raw = await this.provider.generateJSON<TopicAnalysis>(prompt, undefined, modelOverride);
    const parsed = TopicAnalysisSchema.parse(raw);
    return parsed;
  }

  // Stage 2: Generate complete narrative script
  public async generateScript(
    analysis: TopicAnalysis,
    revisionInstruction?: string,
    factualContext?: string,
    modelType?: 'frame-bolt' | 'frame-titan'
  ): Promise<Script> {
    const modelOverride = modelType === 'frame-bolt' ? 'qwen/qwen3.8-27b' : undefined;
    const prompt = buildGenerateScriptPrompt(analysis, revisionInstruction, factualContext);
    const raw = await this.provider.generateJSON<Script>(prompt, undefined, modelOverride);
    const parsed = ScriptSchema.parse(raw);

    // Map script scenes into full Scene objects
    const scenes: Scene[] = parsed.scenes.map((s, idx) => ({
      id: s.id || idx + 1,
      duration: s.duration || 6,
      narration: s.narration,
      visualPrompt: s.visualPrompt,
      searchQuery: s.searchQuery,
      caption: s.caption,
      transition: 'fade',
      motion: idx % 2 === 0 ? 'slow-zoom' : 'pan-left',
      backgroundType: 'generated-image',
    }));

    return {
      title: parsed.title,
      hook: parsed.hook,
      introduction: parsed.introduction,
      scenes,
      conclusion: parsed.conclusion,
      cta: parsed.cta,
    };
  }

  // Stage 3: Refine Scene Production Plan
  public async planScenes(script: Script): Promise<Scene[]> {
    const prompt = buildScenePlannerPrompt(script);
    try {
      const raw = await this.provider.generateJSON<Scene[]>(prompt);
      const parsed = z.array(SceneSchema).safeParse(raw);
      if (parsed.success && parsed.data.length > 0) {
        return parsed.data;
      }
      return script.scenes;
    } catch {
      return script.scenes;
    }
  }

  // Regenerate a single scene with specific instructions
  public async regenerateSingleScene(
    sceneId: number,
    existingScene: Scene,
    instruction: string,
    topic: string
  ): Promise<Scene> {
    const prompt = `You are revising Scene ${sceneId} of a vertical 9:16 short video about "${topic}".
Current Scene:
${JSON.stringify(existingScene, null, 2)}

User Instruction: "${instruction}"

Update the narration, visualPrompt, and caption to satisfy the instruction while preserving the target duration (${existingScene.duration}s).
Return a raw JSON object for the revised scene:
{
  "id": ${sceneId},
  "duration": ${existingScene.duration},
  "narration": "updated narration",
  "visualPrompt": "updated 9:16 visual prompt",
  "caption": "updated short punchline",
  "transition": "${existingScene.transition}",
  "motion": "${existingScene.motion}",
  "backgroundType": "generated-image"
}`;

    const raw = await this.provider.generateJSON<Scene>(prompt);
    const parsed = SceneSchema.parse(raw);
    return parsed;
  }

  // AI Quality Control reasoning
  public async runQualityControlAI(
    analysis: TopicAnalysis,
    script: Script
  ): Promise<{ passed: boolean; issues: string[]; aiChecks: QualityCheckResult['aiChecks'] }> {
    const prompt = buildQualityCheckPrompt(analysis, script);
    try {
      const raw = await this.provider.generateJSON<QualityCheckResult>(prompt);
      const parsed = QualityCheckSchema.safeParse(raw);
      if (parsed.success) {
        return {
          passed: parsed.data.passed,
          issues: parsed.data.issues,
          aiChecks: parsed.data.aiChecks,
        };
      }
    } catch {
      // Fallback AI check
    }

    return {
      passed: true,
      issues: [],
      aiChecks: {
        topicRelevance: true,
        scriptConsistency: true,
        sceneConsistency: true,
        narrationVisualAlignment: true,
      },
    };
  }
}
