import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { VisualProvider, VisualGenerationOptions } from '../visual.provider.js';

export class CanvasVisualProvider implements VisualProvider {
  public readonly name = 'Neural Canvas Synthesizer';

  public isConfigured(): boolean {
    return true; // Always available built-in
  }

  public async generateImage(
    prompt: string,
    outputPath: string,
    options: VisualGenerationOptions
  ): Promise<string> {
    const { width = 1080, height = 1920, sceneId, title, caption, topic } = options;

    // Harmonious palettes matching clean dark editorial style for vertical video
    const palettes = [
      { bg1: '#0B0F17', bg2: '#161E2E', accent: '#3B82F6', cardBg: '#1E293B' },
      { bg1: '#0F172A', bg2: '#1E1B4B', accent: '#6366F1', cardBg: '#1E293B' },
      { bg1: '#111827', bg2: '#1F2937', accent: '#10B981', cardBg: '#1F2937' },
      { bg1: '#18181B', bg2: '#27272A', accent: '#F59E0B', cardBg: '#27272A' },
      { bg1: '#0A0A0A', bg2: '#171717', accent: '#EC4899', cardBg: '#1C1917' },
    ];

    const p = palettes[(sceneId - 1) % palettes.length];

    // Escape XML characters for SVG text rendering
    const escapeXml = (str: string): string => {
      return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    const cleanTitle = escapeXml(title || topic || 'Qoneqt Content');
    const cleanCaption = escapeXml(caption || '');
    const cleanPrompt = escapeXml(prompt.slice(0, 140));

    // Dynamic SVG template for 1080x1920 9:16 vertical video frame
    const svgTemplate = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${p.bg1}" />
            <stop offset="50%" stop-color="${p.bg2}" />
            <stop offset="100%" stop-color="#000000" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.3" />
          </linearGradient>
          <radialGradient id="glowGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stop-color="${p.accent}" stop-opacity="0.25" />
            <stop offset="100%" stop-color="${p.bg1}" stop-opacity="0" />
          </radialGradient>
        </defs>

        <!-- Main Background -->
        <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

        <!-- Atmospheric Glow -->
        <circle cx="540" cy="700" r="500" fill="url(#glowGrad)" />

        <!-- Subtle Grid Pattern -->
        <g stroke="#FFFFFF" stroke-opacity="0.04" stroke-width="1.5">
          <line x1="80" y1="0" x2="80" y2="${height}" />
          <line x1="1000" y1="0" x2="1000" y2="${height}" />
          <line x1="0" y1="200" x2="${width}" y2="200" />
          <line x1="0" y1="1720" x2="${width}" y2="1720" />
        </g>

        <!-- Main Central Visual Card -->
        <g transform="translate(100, 360)">
          <rect x="0" y="0" width="880" height="1060" rx="32" fill="${p.cardBg}" fill-opacity="0.6" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="2" />

          <!-- Inner Accent Border Bar -->
          <rect x="40" y="40" width="800" height="4" rx="2" fill="url(#accentGrad)" />

          <!-- Topic Tag -->
          <text x="60" y="110" fill="${p.accent}" font-family="Inter, system-ui, sans-serif" font-size="20" font-weight="700" letter-spacing="2">${escapeXml(topic || 'CONTENT')}</text>

          <!-- Title -->
          <text x="60" y="180" fill="#FFFFFF" font-family="Inter, system-ui, sans-serif" font-size="44" font-weight="700">
            ${cleanTitle}
          </text>

          <!-- Prompt description box -->
          <rect x="60" y="260" width="760" height="460" rx="16" fill="#000000" fill-opacity="0.35" stroke="#FFFFFF" stroke-opacity="0.06" />
          <text x="100" y="320" fill="#94A3B8" font-family="ui-monospace, monospace" font-size="20" font-weight="500">VISUAL SUBJECT:</text>
          
          <foreignObject x="100" y="350" width="680" height="340">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: #CBD5E1; font-family: Inter, system-ui, sans-serif; font-size: 26px; line-height: 1.5; font-weight: 400;">
              ${cleanPrompt}
            </div>
          </foreignObject>

          <!-- Caption Container at bottom of visual card -->
          <rect x="60" y="780" width="760" height="200" rx="20" fill="#000000" fill-opacity="0.65" stroke="${p.accent}" stroke-opacity="0.4" stroke-width="1.5" />
          <foreignObject x="90" y="805" width="700" height="150">
            <div xmlns="http://www.w3.org/1999/xhtml" style="color: #FFFFFF; font-family: Inter, system-ui, sans-serif; font-size: 34px; font-weight: 700; line-height: 1.4; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%;">
              "${cleanCaption}"
            </div>
          </foreignObject>
        </g>
      </svg>
    `;

    const svgBuffer = Buffer.from(svgTemplate);

    // Render SVG into crisp 1080x1920 PNG using sharp
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await sharp(svgBuffer)
      .resize(width, height)
      .png({ quality: 95 })
      .toFile(outputPath);

    return outputPath;
  }

  /**
   * Composite caption / title text over an existing background image (stock photo).
   * The background is rescaled to 1080x1920, then a semi-transparent gradient +
   * text overlay is composited on top.
   */
  public async generateImageFromBackground(
    backgroundPath: string,
    outputPath: string,
    options?: VisualGenerationOptions
  ): Promise<string> {
    const width = 1080;
    const height = 1920;
    const { caption, title, topic, sceneId = 1 } = options || {};

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const escapeXml = (str: string): string =>
      (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const cleanCaption = escapeXml(caption || '');
    const cleanTitle = escapeXml(title || topic || '');

    // Wrap caption into two lines if long
    const words = cleanCaption.split(' ');
    const midpoint = Math.ceil(words.length / 2);
    const captionLine1 = words.slice(0, midpoint).join(' ');
    const captionLine2 = words.slice(midpoint).join(' ');

    // SVG overlay: dark gradient at bottom + caption bar + title at top
    const overlaySvg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bottomFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
            <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
          </linearGradient>
        </defs>
        <!-- Subtle bottom gradient scrim for dynamic subtitle readability -->
        <rect y="${height - 420}" width="${width}" height="420" fill="url(#bottomFade)"/>
      </svg>
    `;

    // 1. Resize background stock photo to 1080×1920 (cover crop)
    const resizedBg = await sharp(backgroundPath)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    // 2. Render overlay SVG to buffer
    const overlayBuffer = await sharp(Buffer.from(overlaySvg))
      .resize(width, height)
      .png()
      .toBuffer();

    // 3. Composite overlay on top of background
    await sharp(resizedBg)
      .composite([{ input: overlayBuffer, blend: 'over' }])
      .png({ quality: 95 })
      .toFile(outputPath);

    return outputPath;
  }
}
