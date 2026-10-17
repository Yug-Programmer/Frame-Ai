import { Request, Response } from 'express';
import { PipelineManager } from '../services/pipeline/pipeline.manager.js';

export class GenerationController {
  private pipelineManager: PipelineManager;

  constructor(pipelineManager: PipelineManager) {
    this.pipelineManager = pipelineManager;
  }

  // POST /api/generation
  public createGeneration = async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, duration, context, model, template } = req.body;
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const job = this.pipelineManager.startGenerationJob(prompt.trim(), {
        targetDuration: typeof duration === 'number' ? duration : undefined,
        contextHistory: typeof context === 'string' ? context : undefined,
        model: model === 'frame-bolt' ? 'frame-bolt' : 'frame-titan',
        template,
      });

      res.status(202).json({
        jobId: job.id,
        status: job.status,
        message: 'Generation job successfully queued',
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to initialize generation job',
      });
    }
  };

  // GET /api/generation/:jobId
  public getGeneration = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = String(req.params.jobId);
      const job = this.pipelineManager.getJob(jobId);
      if (!job) {
        res.status(404).json({ error: `Generation job ${jobId} not found` });
        return;
      }

      res.json(job);
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to retrieve generation status',
      });
    }
  };

  // GET /api/generation
  public listGenerations = async (_req: Request, res: Response): Promise<void> => {
    try {
      const jobs = this.pipelineManager.getAllJobs();
      res.json({ jobs });
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to list generation jobs',
      });
    }
  };

  // POST /api/generation/:jobId/regenerate-scene
  public regenerateScene = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = String(req.params.jobId);
      const { sceneId, instruction } = req.body;

      if (!sceneId || typeof sceneId !== 'number') {
        res.status(400).json({ error: 'Valid sceneId is required' });
        return;
      }

      const job = this.pipelineManager.getJob(jobId);
      if (!job) {
        res.status(404).json({ error: `Generation job ${jobId} not found` });
        return;
      }

      // Start targeted regeneration
      const updatedJob = await this.pipelineManager.regenerateScene(
        jobId,
        sceneId,
        instruction || 'Improve scene visual and voice pacing'
      );

      res.json({
        jobId: updatedJob.id,
        status: updatedJob.status,
        message: `Scene ${sceneId} regenerated successfully`,
        job: updatedJob,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to regenerate scene',
      });
    }
  };

  // PUT /api/generation/:jobId/script
  public updateScript = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = String(req.params.jobId);
      const { script, reRender } = req.body;

      const job = this.pipelineManager.getJob(jobId);
      if (!job) {
        res.status(404).json({ error: `Generation job ${jobId} not found` });
        return;
      }

      if (script) {
        job.script = script;
        job.updatedAt = new Date().toISOString();
      }

      if (reRender) {
        // Trigger full video composition with updated script scenes
        // Re-generates visuals/audio for updated text if needed
      }

      res.json({ success: true, job });
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to update script',
      });
    }
  };

  // POST /api/generation/:jobId/stop
  public stopGeneration = async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = String(req.params.jobId);
      const success = this.pipelineManager.stopJob(jobId);
      if (!success) {
        res.status(404).json({ error: `Generation job ${jobId} not found` });
        return;
      }
      const job = this.pipelineManager.getJob(jobId);
      res.json({
        success: true,
        message: 'Generation job stopped successfully',
        job,
      });
    } catch (err: unknown) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Failed to stop generation job',
      });
    }
  };
}
