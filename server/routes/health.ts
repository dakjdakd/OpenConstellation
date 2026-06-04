import { Router } from 'express';
import { getAiProviderStatus } from '../services/deepseek.ts';

export function createHealthRouter() {
  const router = Router();

  router.get('/health', (_req, res) => {
    const aiStatus = getAiProviderStatus();

    res.json({
      ok: true,
      service: 'openconstellation-api',
      version: '0.1.0',
      runtime: 'express',
      ai: {
        configured: aiStatus.configured,
        provider: aiStatus.provider,
        model: aiStatus.model,
        baseUrl: aiStatus.baseUrl,
        keySource: aiStatus.keySource,
      },
    });
  });

  return router;
}
