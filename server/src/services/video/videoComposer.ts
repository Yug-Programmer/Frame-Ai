import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { Scene, VideoTemplate } from '../../types/index.js';
import { config } from '../../config/index.js';

export interface ComposeProgressCallback {
  (stage: string, percent: number): void;
}

export class VideoComposer {
  private ffmpegPath: string;
  private ffprobePath: string;

  constructor() {
    this.ffmpegPath = config.paths.ffmpeg;
    this.ffprobePath = config.paths.ffprobe;
  }

  // Safe process execution with argument arrays (NO shell string interpolation)
  private runFFmpegProcess(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.ffmpegPath, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let stderrData = '';
      child.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      child.on('error', (err) => {
        reject(new Error(`Failed to spawn FFmpeg at ${this.ffmpegPath}: ${err.message}`));
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          // Truncate stderr for clean logging without leaking paths
          const lastLines = stderrData.split(/\r?\n/).slice(-15).join('\n');
          reject(new Error(`FFmpeg exited with code ${code}. Error: ${lastLines}`));
        }
      });
    });
  }

  // Compose a single scene into an isolated 1080x1920 MP4 clip with burned-in captions & template grading
  public async renderSceneClip(
    scene: Scene,
    generationId: string,
    outputPath: string,
    template?: VideoTemplate
  ): Promise<string> {
    const isVideoAsset = Boolean(
      (scene.videoClipPath && fs.existsSync(scene.videoClipPath)) ||
      (scene.imagePath && /\.(mp4|webm|mov|mkv)$/i.test(scene.imagePath) && fs.existsSync(scene.imagePath))
    );
    const mediaPath = isVideoAsset
      ? (scene.videoClipPath || scene.imagePath!)
      : scene.imagePath;

    if (!mediaPath || !fs.existsSync(mediaPath)) {
      throw new Error(`Scene ${scene.id} is missing visual/video asset: ${mediaPath}`);
    }
    if (!scene.audioPath || !fs.existsSync(scene.audioPath)) {
      throw new Error(`Scene ${scene.id} is missing audio asset: ${scene.audioPath}`);
    }

    const duration = Math.max(2, Math.round(scene.duration));
    const fps = 25;
    const totalFrames = duration * fps;

    // Build motion filter according to scene motion type
    let motionFilter = '';
    switch (scene.motion) {
      case 'crash-zoom':
        // High-energy dramatic punch-in
        motionFilter = `zoompan=z='min(1.0 + 0.38*pow(on/${totalFrames}, 0.5), 1.38)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        break;
      case 'action-shake':
        // Camera rumble & impact shake on hits/shots
        motionFilter = `zoompan=z=1.16:x='(iw-iw/zoom)/2 + 16*sin(on*0.9)*max(0, 1-on/(${fps}*1.5))':y='(ih-ih/zoom)/2 + 12*cos(on*1.1)*max(0, 1-on/(${fps}*1.5))':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
      case 'whip-pan':
        // Fast dynamic lateral sweep
        motionFilter = `zoompan=z=1.18:x='if(lte(on,1), 0, min(iw-iw/zoom, x + 3.2))':y='(ih-ih/zoom)/2':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
      case 'dynamic-orbit':
        // Cinematic arc motion
        motionFilter = `zoompan=z='1.12 + 0.08*sin(2*PI*on/${totalFrames})':x='(iw-iw/zoom)/2 + 25*sin(2*PI*on/${totalFrames})':y='(ih-ih/zoom)/2':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        break;
      case 'slow-zoom':
        motionFilter = `zoompan=z='min(zoom+0.0015,1.24)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        break;
      case 'zoom-in':
        motionFilter = `zoompan=z='min(zoom+0.0024,1.32)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        break;
      case 'zoom-out':
        motionFilter = `zoompan=z='max(1.04,1.26-0.0020*on)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        break;
      case 'pan-left':
        motionFilter = `zoompan=z=1.16:x='if(lte(on,1),(iw-iw/zoom)/2,max(0,x-1.2))':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}:d=${totalFrames}`;
        break;
      case 'pan-right':
        motionFilter = `zoompan=z=1.16:x='if(lte(on,1),0,min(iw-iw/zoom,x+1.2))':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}:d=${totalFrames}`;
        break;
      default: {
        // Dynamic alternating Ken Burns motion so each scene feels lively and fresh
        const motionCycle = ['crash-zoom', 'zoom-in', 'pan-right', 'action-shake', 'zoom-out', 'pan-left', 'slow-zoom'];
        const chosen = motionCycle[(scene.id || 1) % motionCycle.length];
        if (chosen === 'crash-zoom') {
          motionFilter = `zoompan=z='min(1.0 + 0.36*pow(on/${totalFrames}, 0.5), 1.36)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        } else if (chosen === 'action-shake') {
          motionFilter = `zoompan=z=1.16:x='(iw-iw/zoom)/2 + 14*sin(on*0.9)*max(0, 1-on/(${fps}*1.5))':y='(ih-ih/zoom)/2 + 10*cos(on*1.1)*max(0, 1-on/(${fps}*1.5))':d=${totalFrames}:s=1080x1920:fps=${fps}`;
        } else if (chosen === 'zoom-in') {
          motionFilter = `zoompan=z='min(zoom+0.0022,1.30)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        } else if (chosen === 'zoom-out') {
          motionFilter = `zoompan=z='max(1.04,1.26-0.0020*on)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${fps}`;
        } else if (chosen === 'pan-right') {
          motionFilter = `zoompan=z=1.16:x='if(lte(on,1),0,min(iw-iw/zoom,x+1.2))':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}:d=${totalFrames}`;
        } else {
          motionFilter = `zoompan=z=1.16:x='if(lte(on,1),(iw-iw/zoom)/2,max(0,x-1.2))':y='(ih-ih/zoom)/2':s=1080x1920:fps=${fps}:d=${totalFrames}`;
        }
        break;
      }
    }

    // Dynamic template grading and subtitle styling
    let templateVisualFilter = 'eq=contrast=1.06:brightness=0.01:saturation=1.12';
    let subtitleFontColor = 'white';
    let subtitleBoxColor = 'black@0.75';
    let subtitleBorderW = 18;

    switch (template) {
      case 'anime':
        templateVisualFilter = 'eq=contrast=1.15:saturation=1.35:brightness=0.02';
        subtitleFontColor = 'white';
        subtitleBoxColor = '0x0F172A@0.85';
        break;
      case 'comic':
        templateVisualFilter = 'eq=contrast=1.28:saturation=1.45:brightness=-0.02';
        subtitleFontColor = 'black';
        subtitleBoxColor = '0xFFEE00@0.92';
        subtitleBorderW = 20;
        break;
      case 'retro':
        templateVisualFilter = 'colorbalance=rs=0.18:bs=0.28:gs=-0.08,eq=contrast=1.20:saturation=1.35';
        subtitleFontColor = '0x00FFFF';
        subtitleBoxColor = '0x15002A@0.88';
        break;
      case 'minimal':
        templateVisualFilter = 'eq=contrast=1.03:saturation=0.50:brightness=0.02';
        subtitleFontColor = 'white';
        subtitleBoxColor = '0x18181B@0.85';
        break;
      case 'animated':
        templateVisualFilter = 'eq=contrast=1.08:brightness=0.03:saturation=1.22';
        subtitleFontColor = 'white';
        subtitleBoxColor = '0x1E1B4B@0.85';
        break;
      case 'cinematic':
        templateVisualFilter = 'colorbalance=rs=0.08:bs=-0.06:gs=0.01,eq=contrast=1.16:saturation=0.92:brightness=-0.01';
        subtitleFontColor = '0xEDEAE0';
        subtitleBoxColor = '0x08080A@0.85';
        break;
      case 'vintage_vhs':
        templateVisualFilter = 'colorchannelmixer=rr=1.08:rg=0.06:rb=0:gr=0:gg=0.98:gb=0.06:br=0.04:bg=0:bb=0.88,eq=contrast=1.10:brightness=0.03:saturation=0.85';
        subtitleFontColor = '0xFFFF77';
        subtitleBoxColor = '0x000000@0.80';
        break;
      case 'cyber_hud':
        templateVisualFilter = 'colorbalance=bs=0.25:gs=0.12:rs=-0.16,eq=contrast=1.22:saturation=1.30';
        subtitleFontColor = '0x00FFAA';
        subtitleBoxColor = '0x001124@0.90';
        break;
      default:
        break;
    }

    // Build synced typewriter subtitle drawtext filters
    const subtitleFilters = this.buildSubtitleFilters(scene.narration || '', duration, {
      fontColor: subtitleFontColor,
      boxColor: subtitleBoxColor,
      borderW: subtitleBorderW,
    });

    // Handle motion video clip vs still image with dynamic motion camera
    let visualFilters = '';
    if (isVideoAsset) {
      // Scale and center-crop video footage to 1080x1920 9:16 vertical
      visualFilters = `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=${fps},${templateVisualFilter},fade=t=in:st=0:d=0.25,format=yuv420p${subtitleFilters}[v]`;
    } else {
      // Image asset with dynamic camera motion
      visualFilters = `[0:v]${motionFilter},${templateVisualFilter},fade=t=in:st=0:d=0.25,format=yuv420p${subtitleFilters}[v]`;
    }

    // Contextual sound effects: impact crack on hits + smooth transition swoosh
    const isActionScene =
      scene.motion === 'action-shake' ||
      scene.motion === 'crash-zoom' ||
      /cricket|bat|shot|six|wicket|goal|hit|strike|ball|smash|power/i.test(
        `${scene.caption || ''} ${scene.narration || ''}`
      );

    const audioFilters = isActionScene
      ? `;aevalsrc='(0.40*sin(2*PI*(240+30*t)*t)*exp(-22*t) + 0.15*sin(2*PI*(90+520*t)*t)*exp(-8.5*t))':s=44100:d=0.45[sfx];[1:a][sfx]amix=inputs=2:duration=first:weights='1 0.35'[a]`
      : `;aevalsrc=0.18*sin(2*PI*(90+520*t)*t)*exp(-8.5*t):s=44100:d=0.35[sfx];[1:a][sfx]amix=inputs=2:duration=first:weights='1 0.25'[a]`;

    const filterGraph = `${visualFilters}${audioFilters}`;

    const args: string[] = ['-y'];

    if (isVideoAsset) {
      args.push('-stream_loop', '-1', '-t', `${duration}`, '-i', mediaPath);
    } else {
      args.push('-i', mediaPath);
    }

    args.push(
      '-i', scene.audioPath,
      '-filter_complex', filterGraph,
      '-map', '[v]',
      '-map', '[a]',
      '-t', `${duration}`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '23',
      '-threads', '2',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-ar', '44100',
      outputPath
    );

    await this.runFFmpegProcess(args);
    return outputPath;
  }

  /**
   * Inject contextual icons/emojis into subtitles based on scene semantics
   */
  private injectContextIcon(card: string, isFirstCard: boolean, isLastCard: boolean): string {
    if (/[\u{1F300}-\u{1F9FF}]/u.test(card)) return card;

    const lower = card.toLowerCase();
    let prefix = '';
    let suffix = '';

    if (isFirstCard) {
      prefix = '⚡ ';
    } else if (isLastCard) {
      suffix = ' 🏆';
    } else if (/\b(space|star|galaxy|black hole|universe|cosmic|orbit)\b/.test(lower)) {
      suffix = ' 🌌';
    } else if (/\b(mind|brain|think|memory|smart|idea|theory)\b/.test(lower)) {
      suffix = ' 🧠';
    } else if (/\b(time|gravity|infinite|speed|light|quantum)\b/.test(lower)) {
      suffix = ' ⏳';
    } else if (/\b(explode|bomb|shock|giant|massive|energy|fire)\b/.test(lower)) {
      suffix = ' 🔥';
    } else if (/\b(earth|world|planet|human|nature)\b/.test(lower)) {
      suffix = ' 🌍';
    } else if (/\b(secret|discover|mystery|hidden|truth)\b/.test(lower)) {
      prefix = '🔍 ';
    } else if (/\b(magic|glow|shine|future|vision)\b/.test(lower)) {
      suffix = ' ✨';
    }

    return `${prefix}${card}${suffix}`.trim();
  }

  /**
   * Format words for a subtitle card, balancing them into 1 or 2 lines
   * to guarantee the text never overflows screen boundaries.
   */
  private formatSubtitleCard(words: string[], isFirstCard: boolean = false, isLastCard: boolean = false): string {
    const rawSingleLine = words.join(' ');
    const singleLine = this.injectContextIcon(rawSingleLine, isFirstCard, isLastCard);

    // Keep single line if short (<= 20 chars) or 1-2 words
    if (singleLine.length <= 20 || words.length <= 2) {
      return singleLine;
    }
    // Balance evenly across two centered lines
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    return this.injectContextIcon(`${line1}\n${line2}`, isFirstCard, isLastCard);
  }

  /**
   * Build FFmpeg drawtext filter chains that show narration text
   * as synced, word-grouped, centered subtitles with automatic line wrapping.
   *
   * Solves horizontal clipping ("sentence out problem") by keeping each line
   * under 20-22 characters at 46px font on a 1080px frame.
   */
  private buildSubtitleFilters(
    narration: string,
    totalDuration: number,
    styleOptions?: { fontColor?: string; boxColor?: string; borderW?: number }
  ): string {
    if (!narration || narration.trim().length === 0) return '';

    // Micro-chunk words into short, punchy phrases (max 4 words or ~20 chars)
    const words = narration.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '';

    const cards: string[][] = [];
    let currentWords: string[] = [];
    let currentLen = 0;

    for (const rawWord of words) {
      const word = rawWord.length > 24 ? rawWord.slice(0, 24) : rawWord;
      const nextLen = currentLen + (currentLen > 0 ? 1 : 0) + word.length;

      if (currentWords.length >= 4 || (currentWords.length >= 2 && nextLen > 20)) {
        cards.push(currentWords);
        currentWords = [word];
        currentLen = word.length;
      } else {
        currentWords.push(word);
        currentLen = nextLen;
      }
    }

    if (currentWords.length > 0) {
      cards.push(currentWords);
    }

    // Detect modern font with emoji/icon support
    let fontParam = '';
    const winEmoji = 'C:\\Windows\\Fonts\\seguiemj.ttf';
    const winBold = 'C:\\Windows\\Fonts\\arialbd.ttf';
    const winRegular = 'C:\\Windows\\Fonts\\arial.ttf';
    if (fs.existsSync(winEmoji)) {
      fontParam = `fontfile='C\\:/Windows/Fonts/seguiemj.ttf':`;
    } else if (fs.existsSync(winBold)) {
      fontParam = `fontfile='C\\:/Windows/Fonts/arialbd.ttf':`;
    } else if (fs.existsSync(winRegular)) {
      fontParam = `fontfile='C\\:/Windows/Fonts/arial.ttf':`;
    }

    const chunkDuration = totalDuration / cards.length;
    const filters: string[] = [];
    const fontColor = styleOptions?.fontColor || 'white';
    const boxColor = styleOptions?.boxColor || 'black@0.75';
    const borderW = styleOptions?.borderW || 18;

    cards.forEach((cardWords, idx) => {
      const cardStart = idx * chunkDuration;
      const cardEnd = (idx + 1) * chunkDuration;
      const numWords = cardWords.length;
      const wordStep = chunkDuration / numWords;

      // Typewriter progressive word-by-word reveal with spring bounce
      for (let step = 1; step <= numWords; step++) {
        const stepStart = (cardStart + (step - 1) * wordStep).toFixed(2);
        const stepEnd = (step === numWords ? cardEnd : cardStart + step * wordStep).toFixed(2);

        const displayedWords = cardWords.slice(0, step);
        const isFirstCard = idx === 0;
        const isLastCard = idx === cards.length - 1 && step === numWords;
        const formatted = this.formatSubtitleCard(displayedWords, isFirstCard, isLastCard);

        // Safe character escaping for FFmpeg drawtext
        const safeText = formatted
          .replace(/\\/g, '\\\\')
          .replace(/'/g, '’')
          .replace(/:/g, '\\:')
          .replace(/,/g, '\\,')
          .replace(/\[/g, '\\[')
          .replace(/\]/g, '\\]')
          .replace(/\n/g, '\\\n');

        // Typing spring animation: pops up 14px into position with quick opacity fade-in
        const yExpr = `(h-340)+14*max(0\\,1-(t-${stepStart})/0.12)`;
        const alphaExpr = `min(1\\,(t-${stepStart})/0.10)`;

        filters.push(
          `,drawtext=${fontParam}text='${safeText}'` +
          `:fontsize=46` +
          `:line_spacing=14` +
          `:fontcolor=${fontColor}` +
          `:fix_bounds=true` +
          `:x=(w-text_w)/2` +
          `:y='${yExpr}'` +
          `:alpha='${alphaExpr}'` +
          `:box=1` +
          `:boxcolor=${boxColor}` +
          `:boxborderw=${borderW}` +
          `:shadowcolor=black@0.9` +
          `:shadowx=2:shadowy=2` +
          `:enable='between(t\\,${stepStart}\\,${stepEnd})'`
        );
      }
    });

    return filters.join('');
  }

  // Concatenate multiple scene clips and mix subtle background music theme
  public async concatScenes(
    clipPaths: string[],
    finalOutputPath: string,
    knownDuration?: number
  ): Promise<string> {
    if (clipPaths.length === 0) {
      throw new Error('No scene clips provided to concatenate');
    }

    const tempConcatVideo = path.join(
      path.dirname(finalOutputPath),
      `raw_concat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp4`
    );

    // Write concat file list
    const concatListPath = path.join(
      path.dirname(finalOutputPath),
      `concat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.txt`
    );

    const listContent = clipPaths
      .map((p) => `file '${p.replace(/\\/g, '/')}'`)
      .join('\n');
    fs.writeFileSync(concatListPath, listContent, 'utf8');

    try {
      // 1. Join scene clips cleanly
      const args: string[] = [
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        '-movflags', '+faststart',
        tempConcatVideo,
      ];

      await this.runFFmpegProcess(args);

      // 2. Mix subtle background music theme (very slow & ambient, voice stays sensitive & clear)
      await this.applyBackgroundTheme(tempConcatVideo, finalOutputPath, knownDuration);
      return finalOutputPath;
    } finally {
      if (fs.existsSync(concatListPath)) {
        try {
          fs.unlinkSync(concatListPath);
        } catch {
          // ignore cleanup error
        }
      }
      if (fs.existsSync(tempConcatVideo)) {
        try {
          fs.unlinkSync(tempConcatVideo);
        } catch {
          // ignore cleanup error
        }
      }
    }
  }

  /**
   * Mix subtle background music under the narration.
   * Keeps music very soft (-23dB / volume=0.07) so the voice narration is sensitive and prominent.
   */
  private async applyBackgroundTheme(inputVideo: string, outputVideo: string, knownDuration?: number): Promise<void> {
    try {
      let duration = knownDuration;
      if (!duration || duration <= 0) {
        const probe = await this.probeMedia(inputVideo);
        duration = Math.max(1, probe.duration || 10);
      }
      const fadeOutStart = Math.max(0, duration - 2.0).toFixed(2);

      // Check bundled open-source ambient theme music track
      const candidatePaths = [
        path.resolve(process.cwd(), 'server/assets/audio/ambient_theme.mp3'),
        path.resolve(process.cwd(), 'assets/audio/ambient_theme.mp3'),
        path.resolve('d:/Ctrl freak antigravity/server/assets/audio/ambient_theme.mp3'),
      ];
      const musicPath = candidatePaths.find((p) => fs.existsSync(p));

      let mixArgs: string[];
      if (musicPath) {
        // Use authentic open-source ambient theme loop
        mixArgs = [
          '-y',
          '-i', inputVideo,
          '-stream_loop', '-1',
          '-i', musicPath,
          '-filter_complex',
          `[1:a]volume=0.07,afade=t=in:ss=0:d=1.5,afade=t=out:st=${fadeOutStart}:d=2.0[bgm];[0:a][bgm]amix=inputs=2:duration=first:weights='1 0.15'[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart',
          '-shortest',
          outputVideo,
        ];
      } else {
        // Synthesize slow harmonic ambient chord pad on the fly
        const chordExpr =
          '0.14*sin(2*PI*65.4*t)+0.11*sin(2*PI*130.8*t+0.1*sin(0.4*t))+0.08*sin(2*PI*196.0*t)+0.05*sin(2*PI*329.6*t)';
        mixArgs = [
          '-y',
          '-i', inputVideo,
          '-f', 'lavfi',
          '-t', `${duration}`,
          '-i', `aevalsrc=${chordExpr}:s=44100`,
          '-filter_complex',
          `[1:a]volume=0.07,lowpass=f=800,afade=t=in:ss=0:d=1.5,afade=t=out:st=${fadeOutStart}:d=2.0[bgm];[0:a][bgm]amix=inputs=2:duration=first:weights='1 0.15'[a]`,
          '-map', '0:v',
          '-map', '[a]',
          '-c:v', 'copy',
          '-c:a', 'aac',
          '-b:a', '192k',
          '-movflags', '+faststart',
          '-shortest',
          outputVideo,
        ];
      }

      await this.runFFmpegProcess(mixArgs);
    } catch (err) {
      console.warn('[VideoComposer] Ambient music mix warning (using direct video):', (err as Error).message);
      if (inputVideo !== outputVideo && fs.existsSync(inputVideo)) {
        fs.copyFileSync(inputVideo, outputVideo);
      }
    }
  }

  // Probe media file technical specs using ffprobe
  public async probeMedia(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    hasAudio: boolean;
    hasVideo: boolean;
    videoCodec?: string;
    audioCodec?: string;
  }> {
    return new Promise((resolve, reject) => {
      const args = [
        '-v', 'error',
        '-show_entries', 'stream=codec_type,codec_name,width,height:format=duration',
        '-of', 'json',
        filePath,
      ];

      const child = spawn(this.ffprobePath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (d) => { stdout += d.toString(); });
      child.stderr.on('data', (d) => { stderr += d.toString(); });

      child.on('error', (err) => reject(err));
      child.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`ffprobe error: ${stderr}`));
        }
        try {
          const data = JSON.parse(stdout);
          const streams = data.streams || [];
          const videoStream = streams.find((s: { codec_type: string }) => s.codec_type === 'video');
          const audioStream = streams.find((s: { codec_type: string }) => s.codec_type === 'audio');
          const duration = parseFloat(data.format?.duration || '0');

          resolve({
            duration,
            width: videoStream?.width || 0,
            height: videoStream?.height || 0,
            hasAudio: Boolean(audioStream),
            hasVideo: Boolean(videoStream),
            videoCodec: videoStream?.codec_name,
            audioCodec: audioStream?.codec_name,
          });
        } catch (e) {
          reject(e);
        }
      });
    });
  }
}
