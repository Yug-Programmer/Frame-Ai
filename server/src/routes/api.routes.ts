import { Router } from 'express';
import { PipelineManager } from '../services/pipeline/pipeline.manager.js';
import { GenerationController } from '../controllers/generation.controller.js';
import { ChatController } from '../controllers/chat.controller.js';
import { PublishController } from '../controllers/publish.controller.js';
import { SystemController } from '../controllers/system.controller.js';

export function createApiRouter(): Router {
  const router = Router();
  const pipelineManager = new PipelineManager();

  const generationController = new GenerationController(pipelineManager);
  const chatController = new ChatController(pipelineManager);
  const publishController = new PublishController();
  const systemController = new SystemController();

  // Chat conversational control endpoints
  router.post('/chat', chatController.handleMessage);

  // Video generation pipeline job endpoints
  router.post('/generation', generationController.createGeneration);
  router.get('/generation', generationController.listGenerations);
  router.get('/generation/:jobId', generationController.getGeneration);
  router.post('/generation/:jobId/regenerate-scene', generationController.regenerateScene);
  router.post('/generation/:jobId/stop', generationController.stopGeneration);
  router.put('/generation/:jobId/script', generationController.updateScript);

  // Qoneqt publishing endpoint
  router.post('/publish', publishController.publishToQoneqt);

  // System & Provider diagnostics
  router.get('/system/status', systemController.getStatus);

  return router;
}
