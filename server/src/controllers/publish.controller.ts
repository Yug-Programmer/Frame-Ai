import { Request, Response } from 'express';
import { QoneqtPublisher } from '../services/publish/qoneqt.publisher.js';

export class PublishController {
  private publisher: QoneqtPublisher;

  constructor(publisher?: QoneqtPublisher) {
    this.publisher = publisher || new QoneqtPublisher();
  }

  // POST /api/publish
  public publishToQoneqt = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, caption, videoUrl, communityId, tags } = req.body;

      if (!title || !videoUrl) {
        res.status(400).json({
          success: false,
          error: 'Title and videoUrl are required to publish to Qoneqt',
        });
        return;
      }

      const result = await this.publisher.publishVideo({
        title,
        caption: caption || title,
        videoUrl,
        communityId,
        tags,
      });

      if (!result.success) {
        res.status(result.error?.includes('not configured') ? 400 : 502).json(result);
        return;
      }

      res.json(result);
    } catch (err: unknown) {
      res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : 'Publishing execution failed',
      });
    }
  };
}
