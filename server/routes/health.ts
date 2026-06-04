import { Router } from 'express';
import { getAiConfig } from '../services/deepseek.ts';

export function createHealthRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    const aiConfig = getAiConfig();

    res.json({
      ok: true,
      service: 'openconstellation-api',
      version: '0.1.0',
      runtime: 'express',
      ai: {
        provider: aiConfig.apiKey ? 'deepseek' : 'fallback',
        model: aiConfig.model,
        baseUrl: aiConfig.baseUrl,
      },
    });
  });

  return router;
}
