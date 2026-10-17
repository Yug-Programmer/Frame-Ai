import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { config } from './config/index.js';
import { createApiRouter } from './routes/api.routes.js';

const app = express();

// Security and middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static media routes for video preview, images, audio clips
app.use('/media/output', express.static(config.paths.output));
app.use('/media/temp', express.static(config.paths.temp));

// Mount main API
app.use('/api', createApiRouter());

// Production frontend static assets serving
const clientDistCandidates = [
  path.resolve(process.cwd(), '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(__dirname, '../../client/dist'),
];

let clientDistPath: string | null = null;
for (const candidate of clientDistCandidates) {
  if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
    clientDistPath = candidate;
    break;
  }
}

if (clientDistPath) {
  app.use(express.static(clientDistPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath!, 'index.html'));
  });
}

// Global error handler (never leaks credentials or stack traces)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({
    error: err.message || 'Internal server error occurred',
  });
});

app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` Qoneqt Content Engine — Backend Server`);
  console.log(` Status: Running on http://localhost:${config.port}`);
  console.log(` Environment: ${config.nodeEnv} (Mock Mode: ${config.devMockMode})`);
  console.log(` LLM: ${config.groq.model} via GroqCloud`);
  console.log(` TTS: ${config.elevenlabs.apiKey ? 'ElevenLabs (' + config.elevenlabs.model + ')' : 'Built-in fallback'}`);
  console.log(` FFmpeg: ${config.paths.ffmpeg}`);
  console.log(` Output: ${config.paths.output}`);
  console.log(`=======================================================`);
});
