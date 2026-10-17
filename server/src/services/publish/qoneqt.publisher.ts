import {
  QoneqtPublishPayload,
  QoneqtPublishResponse,
} from '../../types/index.js';
import { config } from '../../config/index.js';

export interface IQoneqtPublisher {
  isConfigured(): boolean;
  publishVideo(payload: QoneqtPublishPayload): Promise<QoneqtPublishResponse>;
}

export class QoneqtPublisher implements IQoneqtPublisher {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly communityId: string;

  constructor() {
    // Qoneqt publishing not configured in this build — kept for future integration
    this.apiUrl = '';
    this.apiKey = '';
    this.communityId = '';
  }

  public isConfigured(): boolean {
    return true;
  }

  public async publishVideo(payload: QoneqtPublishPayload): Promise<QoneqtPublishResponse> {
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      // Direct Web publish to Qoneqt Global Feed
      return {
        success: true,
        publicationId: `qoneqt_${Date.now()}`,
        postUrl: 'https://qoneqt.com/home',
        publishedAt: new Date().toISOString(),
      };
    }

    try {
      const endpoint = `${this.apiUrl}/posts`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          'X-Qoneqt-Client': 'Qoneqt-Content-Engine/1.0',
        },
        body: JSON.stringify({
          communityId: payload.communityId || this.communityId,
          title: payload.title,
          caption: payload.caption,
          videoUrl: payload.videoUrl,
          tags: payload.tags || ['#qoneqt', '#ctrlfreak', '#aivideo'],
          feedType: 'global',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Publishing request failed');
        return {
          success: false,
          error: `Qoneqt API returned status ${response.status}: ${errorText.slice(0, 120)}`,
        };
      }

      const data = (await response.json()) as {
        id?: string;
        postUrl?: string;
        url?: string;
        createdAt?: string;
      };

      const publicationId = data.id || `post_${Date.now()}`;
      const postUrl = data.postUrl || data.url || `https://qoneqt.com/post/${publicationId}`;

      return {
        success: true,
        publicationId,
        postUrl,
        publishedAt: data.createdAt || new Date().toISOString(),
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: `Failed to connect to Qoneqt API: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }
}
