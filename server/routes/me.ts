import { Router } from 'express';
import type { GraphStore } from '../data/graphStore.ts';
import type { UserStore } from '../data/userStore.ts';

export function createMeRouter(graphStore: GraphStore, userStore: UserStore) {
  const router = Router();

  router.get('/me/constellation', (_req, res) => {
    res.json(userStore.getConstellation());
  });

  router.post('/me/favorites', (req, res) => {
    const nodeId = asString(req.body?.nodeId);
    if (!hasNode(graphStore, nodeId)) {
      res.status(400).json({ error: 'invalid_node_id' });
      return;
    }

    res.json(userStore.addFavorite(nodeId));
  });

  router.delete('/me/favorites/:nodeId', (req, res) => {
    res.json(userStore.removeFavorite(req.params.nodeId));
  });

  router.post('/me/collections', (req, res) => {
    const name = asString(req.body?.name).trim();
    if (!name) {
      res.status(400).json({ error: 'collection_name_required' });
      return;
    }

    res.status(201).json(userStore.createCollection({ name, color: asOptionalString(req.body?.color) }));
  });

  router.post('/me/collections/:collectionId/nodes', (req, res) => {
    const nodeId = asString(req.body?.nodeId);
    if (!hasNode(graphStore, nodeId)) {
      res.status(400).json({ error: 'invalid_node_id' });
      return;
    }

    const next = userStore.addNodeToCollection(req.params.collectionId, nodeId);
    if (!next) {
      res.status(404).json({ error: 'collection_not_found' });
      return;
    }

    res.json(next);
  });

  router.delete('/me/collections/:collectionId', (req, res) => {
    res.json(userStore.removeCollection(req.params.collectionId));
  });

  router.delete('/me/collections/:collectionId/nodes/:nodeId', (req, res) => {
    const next = userStore.removeNodeFromCollection(req.params.collectionId, req.params.nodeId);
    if (!next) {
      res.status(404).json({ error: 'collection_not_found' });
      return;
    }

    res.json(next);
  });

  router.post('/me/recent-views', (req, res) => {
    const nodeId = asString(req.body?.nodeId);
    if (!hasNode(graphStore, nodeId)) {
      res.status(400).json({ error: 'invalid_node_id' });
      return;
    }

    res.json(userStore.addRecentView(nodeId));
  });

  router.delete('/me/recent-views', (_req, res) => {
    res.json(userStore.clearRecentViews());
  });

  router.post('/me/search-history', (req, res) => {
    const query = asString(req.body?.query).trim();
    if (!query) {
      res.status(400).json({ error: 'search_query_required' });
      return;
    }

    res.json(userStore.addSearchHistory(query));
  });

  router.delete('/me/search-history', (_req, res) => {
    res.json(userStore.clearSearchHistory());
  });

  return router;
}

function hasNode(graphStore: GraphStore, nodeId: string) {
  return graphStore.getGraph().nodes.some((node) => node.id === nodeId);
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
