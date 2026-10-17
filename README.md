#FrameCinematic Engine

> **Qoneqt × CTRL FREAK AI Engineering Challenge**  
> Production LLM-powered content pipeline transforming topics, ideas, and trends into ready-to-publish Qoneqt Global Feed video content.

---

## Overview

The **Qoneqt Content Engine** is a full-stack AI video production workspace that operates like a conversational IDE. A single natural-language prompt drives an autonomous pipeline that researches, scripts, visualizes, narrates, and composes a ready-to-publish vertical video — all inside a calm, ChatGPT-style interface.

```
USER IDEA
    ↓
AI UNDERSTANDING  (GPT-OSS 120B via Group Cloud)
    ↓
SCRIPT / STORY    (Narrative, hook, scenes, CTA)
    ↓
SCENE PLANNING    (9:16 storyboard, timing, motion)
    ↓
VISUAL GENERATION (1080×1920 PNG per scene)
    ↓
VOICE GENERATION  (Narration audio per scene)
    ↓
VIDEO COMPOSITION (FFmpeg H.264 / AAC MP4)
    ↓
QUALITY CONTROL   (Technical + AI semantic checks)
    ↓
READY-TO-PUBLISH  (Download, preview, share)
    ↓
QONEQT GLOBAL FEED (One-click publishing integration)
```

---

## Architecture

```
React/Vite (localhost:5173)
    ↓  /api proxy
Node.js/Express (localhost:3000)
    ↓
AI Provider Adapter  ──→  Group Cloud API  ──→  GPT-OSS 120B
    ↓                      ↓
Visual Provider        Image Synthesis (1080×1920 9:16)
    ↓
Audio Provider         TTS Narration (WAV/MP3 per scene)
    ↓
FFmpeg Compositor      MP4 (H.264 / AAC, 1080×1920)
    ↓
QA Service             Technical + AI quality checks
    ↓
Qoneqt Publisher       Global Feed REST API
```

### Provider Abstractions

All external providers are isolated behind clean interfaces — swapping providers requires only changing configuration, not application logic.

```typescript
interface LLMProvider {
  generateText(prompt: string): Promise<string>;
  generateJSON<T>(prompt: string): Promise<T>;
}

interface VisualProvider {
  generateImage(prompt: string, outputPath: string, options): Promise<string>;
}

interface AudioProvider {
  generateSpeech(text: string, outputPath: string, options): Promise<AudioGenerationResult>;
}
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vite, React 18, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript (tsx watch) |
| AI Reasoning | Group Cloud API — GPT-OSS 120B |
| Visual Synthesis | Neural Canvas Compositor (SVG+Sharp) / Group Cloud Vision |
| Voice Narration | Neural TTS Engine (Google TTS / ElevenLabs / built-in Synth) |
| Video Composition | FFmpeg 9.x (H.264 + AAC, 1080×1920 9:16) |
| JSON Validation | Zod |
| Icons | Lucide React |

---

## Environment Variables

Copy `.env.example` to `server/.env` and fill in credentials:

```env
# LLM Orchestration — required for real AI generation
GROUP_CLOUD_API_KEY=your_key_here
GROUP_CLOUD_BASE_URL=https://api.groupcloud.ai/v1
GROUP_CLOUD_MODEL=gpt-oss-120b

# Visual provider (leave VISUAL_PROVIDER=canvas for built-in high-res compositor)
VISUAL_API_KEY=
VISUAL_PROVIDER=canvas

# Text-to-speech provider (edge-tts = built-in; elevenlabs = premium)
TTS_API_KEY=
TTS_PROVIDER=edge-tts

# Qoneqt Global Feed publishing
QONEQT_API_URL=https://api.qoneqt.com/v1
QONEQT_API_KEY=your_qoneqt_key_here
QONEQT_COMMUNITY_ID=global-feed

# Runtime
PORT=3000
NODE_ENV=development
DEV_MOCK_MODE=false
FFMPEG_PATH=   # leave blank for auto-detection
```

> **Security**: `VITE_*` prefixed variables are never used. All API keys stay on the Node.js backend. They are never exposed to the browser.

---

## Local Development Setup

### Prerequisites

- Node.js 18+ 
- npm 10+
- FFmpeg (auto-installed via winget on Windows, or install manually)

### Install

```bash
# Clone repository
git clone <repo>
cd qoneqt-content-engine

# Install all dependencies
npm run install:all

# Copy environment file and add credentials
cp .env.example server/.env
# Edit server/.env and add GROUP_CLOUD_API_KEY at minimum
```

### FFmpeg Setup (Windows)

FFmpeg is auto-detected from:
1. `FFMPEG_PATH` env variable
2. System PATH
3. WinGet packages directory (`%LOCALAPPDATA%\Microsoft\WinGet\Packages`)
4. `@ffmpeg-installer/ffmpeg` npm package fallback

To install via winget:
```powershell
winget install Gyan.FFmpeg.Essentials
```

### Run Development Servers

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite HMR)
- **Backend**: http://localhost:3000 (Express + tsx watch)

API calls from the frontend are proxied through Vite to the backend.

---

## API Reference

### Chat (Conversational Control Layer)

```
POST /api/chat
Body: { message, activeGenerationId?, history? }
Response: { message: ChatMessage, intent, generationId? }
```

### Generation Jobs

```
POST   /api/generation                        → start job (returns jobId)
GET    /api/generation                        → list all jobs
GET    /api/generation/:jobId                 → poll job status + progress
POST   /api/generation/:jobId/regenerate-scene → targeted scene regeneration
PUT    /api/generation/:jobId/script           → update script
```

### Publishing

```
POST /api/publish
Body: { title, caption, videoUrl, communityId?, tags? }
Response: { success, publicationId, postUrl, publishedAt }
```

### System Diagnostics

```
GET /api/system/status → provider status (no secrets exposed)
```

---

## Pipeline Stages

| Stage | Status Key | Description |
|---|---|---|
| Job Queued | `queued` | Job registered, pipeline pending |
| Topic Analysis | `analyzing` | GPT-OSS 120B analyzes intent, tone, audience |
| Script Writing | `scripting` | Generates hook, scenes, CTA in structured JSON |
| Scene Planning | `planning` | Assigns motion, transitions, timing (9:16) |
| Visual Generation | `visuals` | 1080×1920 image per scene |
| Voice Narration | `audio` | TTS audio clip per scene |
| FFmpeg Composition | `composing` | Concatenates clips into MP4 |
| Quality Control | `quality` | Technical + AI semantic QA |
| Complete | `completed` | MP4 ready, QA passed |
| Failed | `failed` | Error with preserved state for retry |

---

## Qoneqt Publishing Integration

Publishing is handled by `QoneqtPublisher` which calls the official Qoneqt REST API:

```
POST https://api.qoneqt.com/v1/posts
Authorization: Bearer QONEQT_API_KEY
Body: { communityId, title, caption, videoUrl, tags, feedType: "global" }
```

The UI will:
- Show **"Qoneqt publishing is not configured"** if `QONEQT_API_KEY` is missing
- Show **"Published"** only when the backend receives a confirmed success response
- Never fake or simulate publication

---

## Demo Flow

1. Open **http://localhost:5173**
2. Type: *"Create a 30-second video explaining how AI agents are changing software development"*
3. Watch the live pipeline timeline (Understanding → Script → Scenes → Visuals → Audio → FFmpeg → QA)
4. Video appears inline — play, download, view script, view scenes
5. Edit: *"Make the hook more dramatic"* → only Scene 1 is regenerated
6. Click **Publish to Qoneqt** to send to Global Feed

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `GROUP_CLOUD_API_KEY not configured` | Add key to `server/.env` or set `DEV_MOCK_MODE=true` for testing |
| `FFmpeg not detected` | Set `FFMPEG_PATH` in `.env` or install via `winget install Gyan.FFmpeg.Essentials` |
| Vite proxy 502 errors | Ensure backend is running on port 3000 |
| Sharp native module error | Run `npm rebuild sharp` in `server/` |
| TTS generates silence | Network connectivity issue — system falls back to built-in WAV synthesizer |

---

## Security Notes

- All API keys live in `server/.env` only
- No `VITE_*` secrets ever reach the browser bundle
- FFmpeg is invoked using safe argument arrays (never string interpolation)
- User input is never interpolated into shell commands
- Stack traces and internal paths are never exposed in API error responses

---

## License

MIT — Built for the Qoneqt × CTRL FREAK AI Engineering Challenge.
