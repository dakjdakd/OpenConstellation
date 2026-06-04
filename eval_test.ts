import * as d3 from 'd3';
import { mockData } from './src/data';

try {
  const simNodes = mockData.nodes.map(d => ({ ...d }));
  const simEdges = mockData.edges.map(d => ({ ...d, source: d.sourceId, target: d.targetId }));

  const simulation = d3.forceSimulation(simNodes)
    .force('link', d3.forceLink(simEdges).id((d: any) => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-1000))
    .force('center', d3.forceCenter(500, 500))
    .force('collide', d3.forceCollide().radius((d: any) => (d.popularity * 3) + 25));

  simulation.tick(10);
  console.log("simEdges[0].source.x:", (simEdges[0] as any).source.x);
  
  simEdges.forEach((e: any, i) => {
    if (!e.source.x) console.log("Missing source x on edge", i, e.source);
    if (!e.target.x) console.log("Missing target x on edge", i, e.target);
  });
} catch(e: any) {
  console.error("Error:", e.stack);
}
