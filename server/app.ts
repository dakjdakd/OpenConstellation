import express from 'express';
import { createGraphStore } from './data/graphStore.ts';
import { createAiRouter } from './routes/ai.ts';
import { createHealthRouter } from './routes/health.ts';

export function createApp() {
  const app = express();
  const graphStore = createGraphStore();

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', createHealthRouter());
  app.use('/api/ai', createAiRouter(graphStore));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'api_route_not_found' });
  });

  return app;
}
