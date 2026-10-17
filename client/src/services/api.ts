import {
  GenerationRecord,
  ChatMessage,
  Script,
  Scene,
  SystemStatus,
  QoneqtPublishResponse,
  VideoTemplate,
} from '../types/index.js';

const API_BASE = '/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      ...options,
    });

    if (!res.ok) {
      let errorMsg = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.error) {
          errorMsg = errorJson.error;
        }
      } catch {
        // use default errorMsg
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  // Send message to conversational control layer
  public async sendChatMessage(
    message: string,
    activeGenerationId?: string,
    history?: ChatMessage[],
    aspectRatio?: string,
    duration?: number,
    model?: 'frame-bolt' | 'frame-titan',
    template?: VideoTemplate
  ): Promise<{ message: ChatMessage; intent: string; generationId?: string }> {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, activeGenerationId, history, aspectRatio, duration, model, template }),
    });
  }

  // Start new video generation job
  public async createGeneration(
    prompt: string,
    options?: { duration?: number; context?: string; model?: 'frame-bolt' | 'frame-titan'; template?: VideoTemplate }
  ): Promise<{ jobId: string; status: string; message: string }> {
    return this.request('/generation', {
      method: 'POST',
      body: JSON.stringify({ prompt, duration: options?.duration, context: options?.context, model: options?.model, template: options?.template }),
    });
  }

  // Get current status of a generation job
  public async getGeneration(jobId: string): Promise<GenerationRecord> {
    return this.request(`/generation/${jobId}`);
  }

  // List recent generations
  public async listGenerations(): Promise<{ jobs: GenerationRecord[] }> {
    return this.request('/generation');
  }

  // Get script for a generation
  public async getScript(jobId: string): Promise<Script | undefined> {
    const gen = await this.getGeneration(jobId);
    return gen.script;
  }

  // Get scenes for a generation
  public async getScenes(jobId: string): Promise<Scene[]> {
    const gen = await this.getGeneration(jobId);
    return gen.scenes || [];
  }

  // Regenerate a single scene
  public async regenerateScene(
    jobId: string,
    sceneId: number,
    instruction?: string
  ): Promise<{ jobId: string; status: string; message: string; job: GenerationRecord }> {
    return this.request(`/generation/${jobId}/regenerate-scene`, {
      method: 'POST',
      body: JSON.stringify({ sceneId, instruction }),
    });
  }

  // Stop generation job in progress
  public async stopGeneration(
    jobId: string
  ): Promise<{ success: boolean; message: string; job?: GenerationRecord }> {
    return this.request(`/generation/${jobId}/stop`, {
      method: 'POST',
    });
  }

  // Regenerate entire generation
  public async regenerateGeneration(
    _jobId: string,
    prompt: string,
    duration?: number
  ): Promise<{ jobId: string; status: string }> {
    return this.createGeneration(prompt, { duration });
  }

  // Update script
  public async updateScript(
    jobId: string,
    script: Script,
    reRender: boolean = false
  ): Promise<{ success: boolean; job: GenerationRecord }> {
    return this.request(`/generation/${jobId}/script`, {
      method: 'PUT',
      body: JSON.stringify({ script, reRender }),
    });
  }

  // Publish video to Qoneqt Global Feed
  public async publishToQoneqt(payload: {
    title: string;
    caption: string;
    videoUrl: string;
    communityId?: string;
    tags?: string[];
  }): Promise<QoneqtPublishResponse> {
    return this.request('/publish', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Retrieve system and provider connection status
  public async getSystemStatus(): Promise<SystemStatus> {
    return this.request('/system/status');
  }
}

export const api = new ApiClient();
