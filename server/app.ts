import 'dotenv/config';
import express from 'express';
import { createGraphStore } from './data/graphStore.ts';
import { createUserStore } from './data/userStore.ts';
import { createAiRouter } from './routes/ai.ts';
import { createGraphRouter } from './routes/graph.ts';
import { createHealthRouter } from './routes/health.ts';
import { createMeRouter } from './routes/me.ts';

export function createApp() {
  const app = express();
  const graphStore = createGraphStore();
  const userStore = createUserStore();

  app.use(express.json({ limit: '1mb' }));

  app.use('/api', createHealthRouter());
  app.use('/api', createGraphRouter(graphStore, userStore));
  app.use('/api', createMeRouter(graphStore, userStore));
  app.use('/api/ai', createAiRouter(graphStore, userStore));

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'api_route_not_found' });
  });

  return app;
}
