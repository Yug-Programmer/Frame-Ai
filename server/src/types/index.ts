export type PipelineStatus =
  | 'queued'
  | 'analyzing'
  | 'scripting'
  | 'planning'
  | 'visuals'
  | 'audio'
  | 'composing'
  | 'quality'
  | 'completed'
  | 'failed';

export interface TopicAnalysis {
  topic: string;
  intent: string;
  audience: string;
  tone: string;
  duration: number;
  contentType: string;
  angle: string;
  isExperiential?: boolean;
}

export type SceneMotion =
  | 'slow-zoom'
  | 'pan-left'
  | 'pan-right'
  | 'static'
  | 'zoom-in'
  | 'zoom-out'
  | 'crash-zoom'
  | 'action-shake'
  | 'whip-pan'
  | 'dynamic-orbit';

export type SceneTransition = 'fade' | 'slide' | 'cut' | 'dissolve';

export interface Scene {
  id: number;
  duration: number;
  narration: string;
  visualPrompt: string;
  searchQuery?: string;
  caption: string;
  transition: SceneTransition;
  motion: SceneMotion;
  backgroundType: string;
  imagePath?: string;
  imageUrl?: string;
  videoClipPath?: string;
  videoClipUrl?: string;
  assetType?: 'image' | 'video';
  audioPath?: string;
  audioUrl?: string;
}

export interface Script {
  title: string;
  hook: string;
  introduction?: string;
  scenes: Scene[];
  conclusion?: string;
  cta: string;
}

export interface QualityCheckResult {
  passed: boolean;
  issues: string[];
  technicalChecks: {
    fileExists: boolean;
    fileReadable: boolean;
    durationValid: boolean;
    audioExists: boolean;
    videoStreamExists: boolean;
    resolutionCorrect: boolean;
    codecValid: boolean;
    actualDuration?: number;
    actualResolution?: string;
  };
  aiChecks: {
    topicRelevance: boolean;
    scriptConsistency: boolean;
    sceneConsistency: boolean;
    narrationVisualAlignment: boolean;
  };
}

export interface PipelineStageLog {
  stage: PipelineStatus;
  status: 'start' | 'success' | 'failure';
  message: string;
  timestamp: string;
  durationMs?: number;
}

export type VideoTemplate =
  | 'anime'
  | 'comic'
  | 'retro'
  | 'minimal'
  | 'animated'
  | 'cinematic'
  | 'vintage_vhs'
  | 'cyber_hud';

export interface GenerationRecord {
  id: string;
  userId?: string;
  originalPrompt: string;
  model?: 'frame-bolt' | 'frame-titan';
  template?: VideoTemplate;
  status: PipelineStatus;
  progress: number;
  currentStageText: string;
  analysis?: TopicAnalysis;
  script?: Script;
  scenes: Scene[];
  videoUrl?: string;
  videoPath?: string;
  qualityResult?: QualityCheckResult;
  logs: PipelineStageLog[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  generationId?: string;
  generation?: GenerationRecord;
  intent?: string;
}

export type RouterIntentType =
  | 'create_video'
  | 'modify_duration'
  | 'modify_hook'
  | 'modify_tone'
  | 'regenerate_scene'
  | 'regenerate_visuals'
  | 'regenerate_voice'
  | 'show_script'
  | 'show_scenes'
  | 'publish_qoneqt'
  | 'general_qa';

export interface ChatRouterResult {
  intent: RouterIntentType;
  target?: string;
  value?: string | number;
  sceneId?: number;
  explanation?: string;
  topic?: string;
}

export interface SystemStatus {
  llm: {
    provider: string;
    model: string;
    configured: boolean;
    status: string;
  };
  visual: {
    provider: string;
    configured: boolean;
    status: string;
  };
  tts: {
    provider: string;
    configured: boolean;
    status: string;
  };
  ffmpeg: {
    available: boolean;
    path: string;
    version?: string;
  };
  qoneqt: {
    configured: boolean;
    url: string;
    status: string;
  };
  environment: string;
  mockMode: boolean;
}

export interface QoneqtPublishPayload {
  title: string;
  caption: string;
  videoUrl: string;
  communityId?: string;
  tags?: string[];
}

export interface QoneqtPublishResponse {
  success: boolean;
  publicationId?: string;
  postUrl?: string;
  error?: string;
  publishedAt?: string;
}
