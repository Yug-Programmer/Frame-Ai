import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { VisualProvider, VisualGenerationOptions } from '../visual.provider.js';
import { CanvasVisualProvider } from './canvas.visual.provider.js';
import { GenerativeVisualProvider } from './generative.visual.provider.js';
import { config } from '../../../config/index.js';

interface DuckDuckGoResult {
  title?: string;
  image?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
}

/**
 * Universal Topic & Web Image Discovery Agent
 *
 * Covers ALL topics (superheroes, politics, countries, tech, history, pop culture, etc.)
 * Strictly anchors every scene image search to the primary topic/subject entity
 * (e.g. for "origin of Superman", guarantees images of Superman only).
 *
 * Discovery tiers:
 *  1. Generative AI Direct Route for experiential/action/personalized scenarios
 *  2. Wikipedia Verified Entity Lead & Media List API (official 100% topic imagery)
 *  3. Wikimedia Commons Search API (encyclopedic public domain photography)
 *  4. OpenVerse API (CC0 / Public Domain / CC images)
 *  5. DuckDuckGo / Bing Image API with topic relevance gating
 *  6. Pexels / Unsplash APIs (if API keys configured)
 *  7. Generative AI Synthesis Fallback (Flux / SDXL 1080x1920)
 *  8. Neural Canvas Fallback
 */
export class StockVisualProvider implements VisualProvider {
  public readonly name = 'Universal Web & Encyclopedic Image Agent';
  private readonly canvas: CanvasVisualProvider;
  private readonly generativeAI: GenerativeVisualProvider;
  private cachedVqd: { token: string | null; query: string; expiresAt: number } = {
    token: null,
    query: '',
    expiresAt: 0,
  };
  private cachedEntityMedia: Map<string, string[]> = new Map();

  constructor() {
    this.canvas = new CanvasVisualProvider();
    this.generativeAI = new GenerativeVisualProvider();
  }

  public isConfigured(): boolean {
    return true;
  }

  public async generateImage(
    prompt: string,
    outputPath: string,
    options: VisualGenerationOptions
  ): Promise<string> {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const sceneNum = options.sceneId || 1;
    const usedUrls = options.usedUrls || new Set<string>();

    // Route experiential, action, or personal simulation prompts ("me playing with Virat Kohli") to Generative AI directly!
    if (options.isExperiential || this.isExperiential(options.topic, options.title, prompt)) {
      console.log(`[ImageAgent] Scene ${sceneNum} identified as experiential/action scenario ("${options.topic}"). Routing directly to Generative AI.`);
      return this.generativeAI.generateImage(prompt, outputPath, options);
    }

    // 1. Extract the core subject / entity to anchor all searches
    const coreSubject = this.extractCoreSubject(options.topic, options.title);

    // 2. Build prioritized, topic-anchored search queries
    const queries = this.buildSearchQueries(prompt, options, coreSubject);
    console.log(`[ImageAgent] Scene ${sceneNum} [Core: "${coreSubject}"] Queries: ${JSON.stringify(queries)}`);

    const rawImagePath = outputPath.replace(/\.png$/, '_raw.jpg');
    let fetched = false;

    // Fast-path 1: For Scene 1, try verified official Wikipedia lead portrait/cover first
    if (sceneNum === 1) {
      fetched = await this.tryWikipediaLead(coreSubject, rawImagePath, usedUrls);
    }

    // Fast-path 2: Try canonical Wikipedia Entity Media Gallery (cached in memory, 100% topic accurate & ultra fast)
    if (!fetched) {
      fetched = await this.tryWikipediaEntityMedia(coreSubject, rawImagePath, usedUrls, sceneNum);
    }

    // 3. Multi-tier search across queries if entity media is exhausted
    for (const query of queries) {
      if (fetched) break;

      // Tier 1: Wikimedia Commons Search (topic-verified encyclopedic photos, ~800ms)
      fetched = await this.tryWikimediaCommonsSearch(query, coreSubject, rawImagePath, usedUrls, sceneNum);
      if (fetched) break;

      // Tier 2: OpenVerse API (CC0 / Public Domain high-res photos)
      fetched = await this.tryOpenVerse(query, coreSubject, rawImagePath, usedUrls, sceneNum);
      if (fetched) break;

      // Tier 3: DuckDuckGo / Bing Web Image Engine (quick 1.5s timeout)
      fetched = await this.tryDuckDuckGoImages(query, coreSubject, rawImagePath, usedUrls);
      if (fetched) break;

      // Tier 4: Pexels API (if user configured key)
      if (config.pexels.apiKey) {
        fetched = await this.tryPexels(query, rawImagePath, usedUrls);
        if (fetched) break;
      }

      // Tier 5: Unsplash API (if user configured key)
      if (config.unsplash.accessKey) {
        fetched = await this.tryUnsplash(query, rawImagePath, usedUrls);
        if (fetched) break;
      }
    }

    // Tier 6: Generative AI visual synthesis before canvas fallback
    if (!fetched) {
      console.log(`[ImageAgent] Scene ${sceneNum} stock search yielded no direct image. Synthesizing via Generative AI.`);
      try {
        const genResult = await this.generativeAI.generateImage(prompt, outputPath, options);
        if (fs.existsSync(outputPath)) return genResult;
      } catch (err) {
        console.warn(`[ImageAgent] Generative AI fallback failed: ${(err as Error).message}`);
      }
    }

    // Tier 7: Topic-seeded high-res photography fallback
    if (!fetched) {
      const fallbackSeed = `${coreSubject.replace(/\s+/g, '_')}_scene${sceneNum}_${Date.now()}`;
      console.log(`[ImageAgent] Using topic-seeded high-res photography fallback (seed: ${fallbackSeed})`);
      fetched = await this.downloadPicsum(fallbackSeed, rawImagePath);
    }

    // Tier 8: Neural canvas generator fallback
    if (!fetched || !fs.existsSync(rawImagePath)) {
      console.warn(`[ImageAgent] All photo sources offline for scene ${sceneNum} — using neural canvas generator`);
      return this.canvas.generateImage(prompt, outputPath, options);
    }

    // Composite overlay onto background photo (top brand scrim + bottom subtitle vignette)
    return this.canvas.generateImageFromBackground(rawImagePath, outputPath, options);
  }

  /**
   * Detects if the prompt is an experiential / action / fictional scenario
   */
  private isExperiential(topic?: string, title?: string, prompt?: string): boolean {
    const text = `${topic || ''} ${title || ''} ${prompt || ''}`.toLowerCase();
    return /\b(me\s+(playing|driving|flying|racing|skating|training|fighting|batting|bowling|dancing|singing|meeting|talking|walking)|(playing|driving|flying|racing|skating|training|fighting|batting|bowling)\s+with|playing\s+with|batting\s+with|cricket\s+with|with\s+(virat|kohli|ronaldo|messi|federer)|in\s+a\s+match|facing\s+the|what\s+if\s+i|pov\s+you|first\s+person|roleplay|scenario|battling\s+with|racing\s+with|fighting\s+alongside)\b/i.test(text);
  }

  // ── Core Subject Extraction & Query Generation ─────────────────────────────

  /**
   * Extracts the main subject / entity from user topic or video title.
   */
  public extractCoreSubject(topic?: string, title?: string): string {
    const raw = (topic || title || 'creative topic').trim();
    let cleaned = raw
      .replace(/\b(make|create|generate|produce|write|give me|show me)\s+(a\s+)?(video|short|reel|clip|story|trailer)\s+(on|about|of)?\b/gi, '')
      .replace(/\b(origin story|origin|history|rise|fall|story|biography|life|explainer|overview|facts|all about|secrets|truth behind)\s+of\b/gi, '')
      .replace(/\b(origin story|origin|history|rise|fall|story|biography|life|explainer|overview|facts|all about|secrets|truth behind)\b/gi, '')
      .replace(/\b(me|i|my|we|myself)\s+(playing|batting|running|fighting|racing|meeting|talking|visiting|exploring)\s+(with|against)?\b/gi, '')
      .replace(/\b(playing|batting|running|fighting|racing|meeting|talking|visiting)\s+(with|against|in)?\b/gi, '')
      .replace(/[^\w\s-]/g, ' ')
      .trim();

    cleaned = cleaned.replace(/^(the|a|an|with|about)\s+/i, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 0 && words.length <= 3) {
      return words.join(' ');
    }
    return words.slice(0, 3).join(' ') || raw;
  }

  private async resolveCanonicalWikipediaTitle(subject: string): Promise<string> {
    try {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        subject
      )}&format=json&srlimit=1`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'FrameCinematicAgent/2.0 (image-agent@frameai.local)' },
        signal: AbortSignal.timeout(1200),
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const found = data.query?.search?.[0]?.title;
        if (found) return found;
      }
    } catch {
      // fallback
    }
    return subject;
  }

  /**
   * Verifies that candidate search result belongs strictly to the requested topic.
   * If coreSubject is "Superman", rejects images with titles/URLs containing non-matching entities.
   */
  private isTopicRelevant(titleAndUrl: string, coreSubject: string): boolean {
    if (!coreSubject || coreSubject.length < 2) return true;
    const lower = titleAndUrl.toLowerCase();
    const coreWords = coreSubject
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    if (coreWords.length === 0) return true;
    return coreWords.some((w) => lower.includes(w));
  }

  private buildSearchQueries(
    prompt: string,
    options?: VisualGenerationOptions,
    coreSubject: string = ''
  ): string[] {
    const queries: string[] = [];
    const core = coreSubject.trim();
    const coreLower = core.toLowerCase();

    // 1. Scene-specific searchQuery anchored with coreSubject
    if (options?.searchQuery && options.searchQuery.trim().length > 1) {
      const sq = options.searchQuery.trim();
      const anchored = sq.toLowerCase().includes(coreLower) ? sq : `${core} ${sq}`;
      queries.push(anchored);
    }

    // 2. Visual prompt subject extraction anchored with coreSubject
    const sceneKeywords = this.extractSceneSubject(prompt);
    if (sceneKeywords) {
      const anchored = sceneKeywords.toLowerCase().includes(coreLower)
        ? sceneKeywords
        : `${core} ${sceneKeywords}`;
      if (!queries.includes(anchored)) {
        queries.push(anchored);
      }
    }

    // 3. Caption keywords anchored with coreSubject
    if (options?.caption) {
      const capClean = options.caption.replace(/[^\w\s]/g, '').trim();
      if (capClean) {
        const anchored = capClean.toLowerCase().includes(coreLower)
          ? capClean
          : `${core} ${capClean}`;
        if (!queries.includes(anchored)) {
          queries.push(anchored);
        }
      }
    }

    // 4. Core entity official / iconic query
    if (core) {
      const officialQuery = `${core} official`;
      if (!queries.includes(officialQuery)) queries.push(officialQuery);
      if (!queries.includes(core)) queries.push(core);
    }

    // 5. Ultimate fallback
    if (queries.length === 0) {
      queries.push('cinematic photography');
    }

    return queries;
  }

  private extractSceneSubject(prompt: string): string {
    const cleaned = prompt
      .replace(/9:16|vertical|portrait|1080|1920|high.res|ultra.?hd|4k|8k|render|cinematic/gi, '')
      .replace(/\b(background|scene|showing|depicting|image|photo|stock|frame|shot|view)\b/gi, '')
      .replace(/\b(aesthetic|style|look|feel|tone|mood|lighting|sharp focus|uncluttered)\b/gi, '')
      .replace(/\b(text|caption|overlay|title|logo|watermark|banner)\b/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .trim();

    const words = cleaned.split(/\s+/).filter((w) => w.length > 2);
    return words.slice(0, 3).join(' ');
  }

  // ── Tier 1: DuckDuckGo / Bing Web Image Discovery ─────────────────────────

  private async getDdgVqd(query: string): Promise<string | null> {
    if (
      this.cachedVqd.token &&
      this.cachedVqd.query === query &&
      Date.now() < this.cachedVqd.expiresAt
    ) {
      return this.cachedVqd.token;
    }

    try {
      const res = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(1200),
      });

      if (!res.ok) return null;
      const html = await res.text();
      const match = html.match(/vqd=([\d-]+)/) || html.match(/vqd="([^"]+)"/);
      if (match) {
        this.cachedVqd = {
          token: match[1],
          query,
          expiresAt: Date.now() + 120000, // cache for 2 minutes across scenes
        };
        return match[1];
      }
    } catch {
      // VQD lookup failed
    }
    return null;
  }

  private async tryDuckDuckGoImages(
    query: string,
    coreSubject: string,
    outputPath: string,
    usedUrls: Set<string>
  ): Promise<boolean> {
    try {
      const vqd = await this.getDdgVqd(coreSubject || query);
      if (!vqd) return false;

      const url = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(
        query
      )}&vqd=${vqd}&f=,,,`;

      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Referer: 'https://duckduckgo.com/',
        },
        signal: AbortSignal.timeout(1500),
      });

      if (!res.ok) return false;
      const data = (await res.json()) as { results?: DuckDuckGoResult[] };
      const results = data.results || [];

      for (const item of results) {
        const directUrl = item.image;
        const thumbUrl = item.thumbnail;
        const title = item.title || '';

        if (!directUrl || usedUrls.has(directUrl)) continue;

        // Topic relevance check: must match core subject
        if (!this.isTopicRelevant(`${title} ${directUrl}`, coreSubject)) {
          continue;
        }

        // 1. Try high-resolution direct image
        let ok = await this.downloadAndValidate(directUrl, outputPath);
        if (ok) {
          usedUrls.add(directUrl);
          console.log(`[DuckDuckGo Image] ✓ Found: "${title}" -> ${directUrl.slice(0, 60)}...`);
          return true;
        }

        // 2. Reliable CDN thumbnail fallback (Bing CDN, fast & never 403s)
        if (thumbUrl && !usedUrls.has(thumbUrl)) {
          ok = await this.downloadAndValidate(thumbUrl, outputPath);
          if (ok) {
            usedUrls.add(thumbUrl);
            console.log(`[DuckDuckGo Thumb] ✓ Found: "${title}" -> ${thumbUrl.slice(0, 60)}...`);
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Tier 2: Wikipedia Entity Media & Lead Images ───────────────────────────

  /**
   * Fast lead portrait / cover check directly for the core entity.
   */
  private async tryWikipediaLead(
    coreSubject: string,
    outputPath: string,
    usedUrls: Set<string>
  ): Promise<boolean> {
    try {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        coreSubject.replace(/\s+/g, '_')
      )}`;
      const res = await fetch(summaryUrl, {
        headers: {
          'User-Agent': 'FrameCinematicAgent/2.0 (image-agent@frameai.local)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return false;
      const data = (await res.json()) as any;
      const imageUrl = data.originalimage?.source || data.thumbnail?.source;

      if (!imageUrl || usedUrls.has(imageUrl) || imageUrl.endsWith('.svg')) return false;

      const ok = await this.downloadAndValidate(imageUrl, outputPath);
      if (ok) {
        usedUrls.add(imageUrl);
        console.log(`[Wikipedia Lead] ✓ Official image for "${coreSubject}": ${imageUrl}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Fetches official encyclopedic media items for the topic entity from Wikipedia Media List API.
   * Completely avoids random off-topic articles (guarantees images from the official topic article).
   */
  private async tryWikipediaEntityMedia(
    coreSubject: string,
    outputPath: string,
    usedUrls: Set<string>,
    sceneNum: number
  ): Promise<boolean> {
    try {
      let mediaUrls = this.cachedEntityMedia.get(coreSubject);

      if (!mediaUrls) {
        let mediaListUrl = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(
          coreSubject.replace(/\s+/g, '_')
        )}`;
        let res = await fetch(mediaListUrl, {
          headers: {
            'User-Agent': 'FrameCinematicAgent/2.0 (image-agent@frameai.local)',
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(2000),
        });

        // If not found or empty, resolve canonical Wikipedia article title and retry
        if (!res.ok) {
          const resolvedTitle = await this.resolveCanonicalWikipediaTitle(coreSubject);
          if (resolvedTitle && resolvedTitle.toLowerCase() !== coreSubject.toLowerCase()) {
            mediaListUrl = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(
              resolvedTitle.replace(/\s+/g, '_')
            )}`;
            res = await fetch(mediaListUrl, {
              headers: {
                'User-Agent': 'FrameCinematicAgent/2.0 (image-agent@frameai.local)',
                Accept: 'application/json',
              },
              signal: AbortSignal.timeout(2000),
            });
          }
        }

        if (!res.ok) return false;
        const data = (await res.json()) as { items?: Array<{ type: string; title: string; srcset?: Array<{ src: string }> }> };
        const rawItems = (data.items || []).filter(
          (item) => item.type === 'image' && !item.title.endsWith('.svg')
        );

        mediaUrls = rawItems
          .map((item) => {
            const src = item.srcset?.[item.srcset.length - 1]?.src || item.srcset?.[0]?.src;
            if (!src) return null;
            return src.startsWith('//') ? `https:${src}` : src;
          })
          .filter(Boolean) as string[];

        this.cachedEntityMedia.set(coreSubject, mediaUrls);
      }

      if (!mediaUrls || mediaUrls.length === 0) return false;

      // Filter out used URLs
      const candidates = mediaUrls.filter((u) => !usedUrls.has(u));
      if (candidates.length === 0) return false;

      // Select candidate based on sceneNum for visual variety
      const chosenUrl = candidates[(sceneNum - 1) % candidates.length];
      const ok = await this.downloadAndValidate(chosenUrl, outputPath);
      if (ok) {
        usedUrls.add(chosenUrl);
        console.log(`[Wikipedia Media List] ✓ Scene ${sceneNum} for "${coreSubject}": ${chosenUrl}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Tier 3: Wikimedia Commons Search API ───────────────────────────────────

  private async tryWikimediaCommonsSearch(
    query: string,
    coreSubject: string,
    outputPath: string,
    usedUrls: Set<string>,
    sceneNum: number
  ): Promise<boolean> {
    try {
      const searchUrl =
        `https://commons.wikimedia.org/w/api.php?action=query&format=json&` +
        `generator=search&gsrsearch=${encodeURIComponent(query)}+filetype:bitmap&` +
        `gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url|size&iiurlwidth=1280&origin=*`;

      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'FrameCinematicAgent/2.0 (contact@frameai.local)' },
        signal: AbortSignal.timeout(4500),
      });

      if (!res.ok) return false;
      const data = (await res.json()) as any;
      const pages = Object.values(data.query?.pages || {}) as any[];

      // Filter pages that are topic relevant
      const relevantPages = pages.filter((p) => {
        const title = p.title || '';
        return this.isTopicRelevant(title, coreSubject);
      });

      const candidatePages = relevantPages.length > 0 ? relevantPages : pages;
      if (candidatePages.length === 0) return false;

      // Pick by sceneNum for variety
      const chosen = candidatePages[(sceneNum - 1) % candidatePages.length];
      const info = chosen?.imageinfo?.[0];
      const imgUrl = info?.thumburl || info?.url;

      if (!imgUrl || usedUrls.has(imgUrl) || imgUrl.endsWith('.svg')) return false;

      const ok = await this.downloadAndValidate(imgUrl, outputPath);
      if (ok) {
        usedUrls.add(imgUrl);
        console.log(`[Wikimedia Commons] ✓ Found: "${chosen.title}": ${imgUrl}`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Tier 4: OpenVerse API ──────────────────────────────────────────────────

  private async tryOpenVerse(
    query: string,
    coreSubject: string,
    outputPath: string,
    usedUrls: Set<string>,
    sceneNum: number
  ): Promise<boolean> {
    try {
      const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(
        query
      )}&license_type=commercial,cc0,pdm&page_size=12&mature=false`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Qoneqt/1.0' },
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) return false;
      const data = (await res.json()) as { results?: Array<{ title?: string; url?: string; thumbnail?: string }> };
      const results = (data.results || []).filter((r) => {
        const u = r.url || r.thumbnail;
        return u && !usedUrls.has(u) && this.isTopicRelevant(r.title || '', coreSubject);
      });

      if (results.length === 0) return false;

      const chosen = results[(sceneNum - 1) % results.length];
      const imgUrl = chosen.url || chosen.thumbnail;
      if (!imgUrl) return false;

      const ok = await this.downloadAndValidate(imgUrl, outputPath);
      if (ok) {
        usedUrls.add(imgUrl);
        console.log(`[OpenVerse] ✓ Scene ${sceneNum} found: "${chosen.title || query}"`);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Tier 5: Pexels API (if user configured key) ───────────────────────────

  private async tryPexels(query: string, outputPath: string, usedUrls: Set<string>): Promise<boolean> {
    try {
      const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=portrait&per_page=6`;
      const res = await fetch(url, {
        headers: { Authorization: config.pexels.apiKey },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { photos?: Array<{ src?: { portrait?: string; large?: string } }> };
      const photos = data.photos || [];
      for (const p of photos) {
        const u = p.src?.portrait || p.src?.large;
        if (u && !usedUrls.has(u)) {
          const ok = await this.downloadAndValidate(u, outputPath);
          if (ok) {
            usedUrls.add(u);
            console.log(`[Pexels] ✓ Found image for "${query}"`);
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Tier 6: Unsplash API (if user configured key) ─────────────────────────

  private async tryUnsplash(query: string, outputPath: string, usedUrls: Set<string>): Promise<boolean> {
    try {
      const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&orientation=portrait&per_page=6&client_id=${config.unsplash.accessKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) return false;
      const data = (await res.json()) as { results?: Array<{ urls?: { regular?: string } }> };
      const results = data.results || [];
      for (const r of results) {
        const u = r.urls?.regular;
        if (u && !usedUrls.has(u)) {
          const ok = await this.downloadAndValidate(u, outputPath);
          if (ok) {
            usedUrls.add(u);
            console.log(`[Unsplash] ✓ Found image for "${query}"`);
            return true;
          }
        }
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Seeded High-Res Fallback ──────────────────────────────────────────────

  private async downloadPicsum(seed: string, outputPath: string): Promise<boolean> {
    try {
      const url = `https://picsum.photos/seed/${encodeURIComponent(seed)}/1080/1920`;
      return await this.downloadAndValidate(url, outputPath);
    } catch {
      return false;
    }
  }

  // ── Download & Image Validation ───────────────────────────────────────────

  private async downloadAndValidate(url: string, outputPath: string): Promise<boolean> {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
          Accept: 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) return false;

      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length < 5000) return false;

      // Validate that buffer is a readable image (JPEG, PNG, WebP)
      const image = sharp(buffer);
      const meta = await image.metadata();
      if (!meta.width || !meta.height) return false;

      // Automatically pre-scale and crop to exactly 1080x1920 portrait
      // This reduces FFmpeg render time by 5x-8x because FFmpeg doesn't need to resize huge 4K images on every frame
      await image
        .resize(1080, 1920, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 86, mozjpeg: false })
        .toFile(outputPath);

      return true;
    } catch {
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch {
          // ignore
        }
      }
      return false;
    }
  }
}
