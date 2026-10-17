import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { PipelineManager } from '../services/pipeline/pipeline.manager.js';
import { AIService } from '../services/ai/ai.service.js';
import { ChatMessage } from '../types/index.js';

export class ChatController {
  private pipelineManager: PipelineManager;
  private aiService: AIService;

  constructor(pipelineManager: PipelineManager, aiService?: AIService) {
    this.pipelineManager = pipelineManager;
    this.aiService = aiService || new AIService();
  }

  // POST /api/chat
  public handleMessage = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, activeGenerationId, history, aspectRatio, duration, model, template } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const activeJob = activeGenerationId ? this.pipelineManager.getJob(activeGenerationId) : undefined;
      const hasActive = Boolean(activeJob && activeJob.status !== 'failed');

      // Summarize context if active job exists
      const contextSummary = activeJob
        ? `Project: "${activeJob.script?.title || activeJob.originalPrompt}". Duration: ${
            activeJob.analysis?.duration || 30
          }s. Scenes: ${activeJob.scenes.length}. Status: ${activeJob.status}.`
        : undefined;

      // Extract recent history text for conversational continuity
      const historyContext = Array.isArray(history)
        ? history
            .slice(-4)
            .map((h: ChatMessage) => `${h.role}: ${h.content}`)
            .join('\n')
        : undefined;

      // Classify user intent
      const routed = await this.aiService.routeMessage(message, hasActive, contextSummary);

      let assistantText = '';
      let triggeredJobId: string | undefined = activeGenerationId;

      switch (routed.intent) {
        case 'create_video': {
          const videoTopic = routed.topic || message;
          const targetDuration = typeof duration === 'number' ? duration : typeof routed.value === 'number' ? routed.value : 30;
          const aspectLabel = aspectRatio === 'qoneqt' ? 'Qoneqt Exclusive (9:16)' : (aspectRatio || '9:16');
          const aspectContext = `Target Aspect Ratio: ${aspectLabel}`;

          const newJob = this.pipelineManager.startGenerationJob(videoTopic, {
            targetDuration,
            contextHistory: historyContext ? `${historyContext}\n${aspectContext}` : aspectContext,
            model: model === 'frame-bolt' ? 'frame-bolt' : 'frame-titan',
            template,
          });
          triggeredJobId = newJob.id;
          assistantText = `I'll transform this into a ${targetDuration}-second video (${aspectLabel}). Initiating the production pipeline now.`;
          break;
        }

        case 'modify_hook': {
          if (!activeJob) {
            assistantText = "No active video project to modify. Please describe what video you'd like to create first.";
            break;
          }
          const hookText = typeof routed.value === 'string' ? routed.value : message;
          assistantText = `Refining the hook for "${activeJob.script?.title || 'the video'}". Regenerating Scene 1 narration and visuals.`;
          // Async trigger hook revision
          this.pipelineManager.modifyHook(activeJob.id, hookText).catch((err) => {
            console.error('Failed hook modification:', err);
          });
          break;
        }

        case 'modify_duration': {
          if (!activeJob) {
            assistantText = "No active video project. Please provide a topic to generate a video.";
            break;
          }
          const newDur = typeof routed.value === 'number' ? routed.value : 30;
          assistantText = `Adjusting target video duration to ${newDur} seconds. Re-orchestrating scene structure and timing.`;
          const newJob = await this.pipelineManager.modifyDuration(activeJob.id, newDur);
          triggeredJobId = newJob.id;
          break;
        }

        case 'regenerate_scene': {
          if (!activeJob) {
            assistantText = 'No active video project found. Please create a video first.';
            break;
          }
          const targetSceneId = routed.sceneId || 1;
          assistantText = `Regenerating Scene ${targetSceneId}. Updating visual prompt, narration audio, and recomposing video.`;
          this.pipelineManager
            .regenerateScene(activeJob.id, targetSceneId, message)
            .catch((err) => {
              console.error('Failed scene regen:', err);
            });
          break;
        }

        case 'show_script': {
          if (!activeJob?.script) {
            assistantText = 'No script available yet. Create a video first to see its narrative script.';
          } else {
            assistantText = `Here is the generated production script for "${activeJob.script.title}".`;
          }
          break;
        }

        case 'show_scenes': {
          if (!activeJob?.scenes.length) {
            assistantText = 'No scenes planned yet. Start a video generation to view storyboard scenes.';
          } else {
            assistantText = `Showing storyboard with ${activeJob.scenes.length} planned scenes for "${activeJob.script?.title || 'current video'}".`;
          }
          break;
        }

        case 'publish_qoneqt': {
          if (!activeJob?.videoUrl) {
            assistantText = 'Video must be finished before publishing to Qoneqt. Wait for composition to complete.';
          } else {
            assistantText = `Ready to publish "${activeJob.script?.title}" to Qoneqt Global Feed. Click 'Publish to Qoneqt' or confirm publication.`;
          }
          break;
        }

        case 'general_qa':
        default: {
          // Normal intelligent Q&A response
          assistantText = await this.aiService.answerQuestion(message, historyContext);
          break;
        }
      }

      const responseMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generationId: triggeredJobId,
        generation: triggeredJobId ? this.pipelineManager.getJob(triggeredJobId) : undefined,
        intent: routed.intent,
      };

      res.json({
        message: responseMessage,
        intent: routed.intent,
        generationId: triggeredJobId,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Chat processing error',
      });
    }
  };
}
