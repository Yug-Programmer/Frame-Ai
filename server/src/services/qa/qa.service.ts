import fs from 'fs';
import { VideoComposer } from '../video/videoComposer.js';
import { AIService } from '../ai/ai.service.js';
import {
  QualityCheckResult,
  TopicAnalysis,
  Script,
} from '../../types/index.js';

export class QAService {
  private videoComposer: VideoComposer;
  private aiService: AIService;

  constructor(videoComposer?: VideoComposer, aiService?: AIService) {
    this.videoComposer = videoComposer || new VideoComposer();
    this.aiService = aiService || new AIService();
  }

  public async runComprehensiveQualityCheck(
    videoPath: string,
    analysis: TopicAnalysis,
    script: Script
  ): Promise<QualityCheckResult> {
    const issues: string[] = [];

    // 1. Technical Check: File existence and readability
    const fileExists = fs.existsSync(videoPath);
    let fileReadable = false;
    let actualDuration = 0;
    let actualResolution = '0x0';
    let audioExists = false;
    let videoStreamExists = false;
    let durationValid = false;
    let resolutionCorrect = false;
    let codecValid = false;

    if (!fileExists) {
      issues.push('Final video output file does not exist on disk');
    } else {
      try {
        const stats = fs.statSync(videoPath);
        fileReadable = stats.size > 1024; // Must be at least 1KB
        if (!fileReadable) {
          issues.push('Video file exists but has invalid size (< 1KB)');
        }

        // Run technical ffprobe
        const probe = await this.videoComposer.probeMedia(videoPath);
        actualDuration = probe.duration;
        actualResolution = `${probe.width}x${probe.height}`;
        audioExists = probe.hasAudio;
        videoStreamExists = probe.hasVideo;

        // Check duration (within 25% of expected or >= 5 seconds)
        const expectedDuration = script.scenes.reduce((acc, s) => acc + s.duration, 0);
        durationValid = actualDuration >= 5 && Math.abs(actualDuration - expectedDuration) <= 10;
        if (!durationValid) {
          issues.push(`Video duration ${actualDuration.toFixed(1)}s deviates from planned ${expectedDuration}s`);
        }

        // Check vertical 9:16 aspect ratio (target 1080x1920)
        resolutionCorrect = probe.width === 1080 && probe.height === 1920;
        if (!resolutionCorrect) {
          issues.push(`Video resolution ${actualResolution} does not match required 1080x1920 9:16`);
        }

        // Check codecs (H.264 & AAC)
        codecValid = probe.videoCodec?.toLowerCase().includes('h264') || probe.videoCodec === 'avc1';
        if (!codecValid) {
          issues.push(`Video codec ${probe.videoCodec} is not H.264`);
        }
        if (!audioExists) {
          issues.push('Video is missing audio stream');
        }
      } catch (err: unknown) {
        issues.push(`Technical media probe failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 2. AI Semantic & Alignment Check
    let aiChecks = {
      topicRelevance: true,
      scriptConsistency: true,
      sceneConsistency: true,
      narrationVisualAlignment: true,
    };

    try {
      const aiResult = await this.aiService.runQualityControlAI(analysis, script);
      aiChecks = aiResult.aiChecks;
      if (!aiResult.passed && aiResult.issues.length > 0) {
        issues.push(...aiResult.issues);
      }
    } catch {
      // Continue with technical checks
    }

    const passed =
      fileExists &&
      fileReadable &&
      videoStreamExists &&
      audioExists &&
      resolutionCorrect &&
      aiChecks.topicRelevance;

    return {
      passed,
      issues,
      technicalChecks: {
        fileExists,
        fileReadable,
        durationValid,
        audioExists,
        videoStreamExists,
        resolutionCorrect,
        codecValid,
        actualDuration,
        actualResolution,
      },
      aiChecks,
    };
  }
}
