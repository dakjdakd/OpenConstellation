import { Router } from 'express';
import { buildDataHealthReport, type DataHealthStoreSet } from '../data/dataHealth.ts';

export function createAdminRouter(stores: DataHealthStoreSet) {
  const router = Router();

  router.get('/admin/data-health', (_req, res) => {
    const report = buildDataHealthReport(stores);
    res.status(report.ok ? 200 : 409).json(report);
  });

  router.post('/admin/user-state/prune-stale-node-references', (req, res) => {
    const graph = stores.graphStore.getGraph();
    const validNodeIds = new Set(graph.nodes.map((node) => node.id));
    const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
    const result = stores.userStore.pruneStaleNodeReferences(validNodeIds, { dryRun });
    const report = buildDataHealthReport(stores);

    res.json({
      dryRun,
      removed: result.removed,
      counts: {
        favorites: result.constellation.favorites.length,
        collections: result.constellation.collections.length,
        recentViews: result.constellation.recentViews.length,
      },
      dataHealth: {
        ok: report.ok,
        warnings: report.warnings,
      },
    });
  });

  return router;
}
