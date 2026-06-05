import { createApp } from '../server/app.ts';

let server: ReturnType<ReturnType<typeof createApp>['listen']>;
const port = await listenOnFreePort();
const baseUrl = `http://127.0.0.1:${port}`;

try {
  await checkJson('/api/health', (data) => data.ok === true && data.service === 'openconstellation-api');
  await checkJson('/api/graph', (data) => Array.isArray(data.nodes) && data.nodes.length >= 50 && Array.isArray(data.edges) && data.edges.length >= 50);
  await checkJson('/api/nodes/openai', (data) => data.node?.id === 'openai' && Array.isArray(data.relatedNodes));
  await checkJson('/api/search?q=openai', (data) => Array.isArray(data.items) && data.items.length > 0 && data.items[0].id === 'openai');
  await checkJson(
    '/api/search?q=ai&type=Company&sort=popularity&limit=5',
    (data) =>
      Array.isArray(data.items) &&
      data.items.length > 0 &&
      data.items.length <= 5 &&
      data.items.every((node: any) => node.type === 'Company') &&
      data.facets?.types?.some((facet: any) => facet.value === 'Company') &&
      data.filters?.type === 'Company' &&
      data.filters?.sort === 'popularity',
  );
  await checkJson('/api/timeline', (data) => Array.isArray(data.items) && data.items.length > 0);
  await checkJson('/api/tech-tree', (data) => Array.isArray(data.tiers) && data.tiers.length > 0);
  await checkJson(
    '/api/graph/path?from=openai&to=cursor',
    (data) => data.found === true && Array.isArray(data.nodes) && data.nodes.some((node: any) => node.id === 'openai') && data.nodes.some((node: any) => node.id === 'cursor'),
  );
  await checkJson(
    '/api/graph/relationships?nodeId=openai&hops=2',
    (data) =>
      data.found === true &&
      data.center?.id === 'openai' &&
      Array.isArray(data.layers) &&
      data.layers.some((layer: any) => layer.depth === 1) &&
      Array.isArray(data.relationCounts),
  );
  await checkJson('/api/admin/data-health', (data) => data.ok === true && data.counts?.nodes >= 50);
  await checkJson('/api/admin/user-state/prune-stale-node-references?dryRun=true', (data) => data.dryRun === true && data.removed && data.dataHealth?.ok === true, {
    method: 'POST',
    body: JSON.stringify({ dryRun: true }),
    headers: { 'Content-Type': 'application/json' },
  });
  console.log(`API smoke passed at ${baseUrl}`);
} finally {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function checkJson(path: string, predicate: (data: any) => boolean, init?: RequestInit) {
  const response = await fetch(`${baseUrl}${path}`, init);
  if (!response.ok) {
    throw new Error(`${path} returned HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!predicate(data)) {
    throw new Error(`${path} returned unexpected payload: ${JSON.stringify(data).slice(0, 500)}`);
  }
}

async function listenOnFreePort() {
  const app = createApp();
  return await new Promise<number>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });
}
