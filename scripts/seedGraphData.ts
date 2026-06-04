import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { mockData } from '../src/data.ts';

const outputPath = join(process.cwd(), 'server', 'data', 'graph-data.json');

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(mockData, null, 2)}\n`, 'utf8');

console.log(`Seeded ${mockData.nodes.length} nodes and ${mockData.edges.length} edges to ${outputPath}`);
