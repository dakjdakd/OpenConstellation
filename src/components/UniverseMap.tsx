import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';

export default function UniverseMap() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const {
    filteredNodes: nodes,
    filteredEdges: edges,
    selectedNodeId,
    setSelectedNodeId,
    hoveredNodeId,
    setHoveredNodeId,
    pathStartNodeId,
    pathEndNodeId,
    pathResult,
  } = useAppStore();

  const gRef = useRef<any>(null); // Keep reference to main group
  const simulationRef = useRef<any>(null);
  const zoomRef = useRef<any>(null);
  const didDragRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    if (!width || !height) return;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    
    filter.append('feDropShadow')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('stdDeviation', '3')
      .attr('flood-color', '#000000')
      .attr('flood-opacity', '0.08');

    // Grid Pattern for Parallax Background
    const pattern = defs.append('pattern')
      .attr('id', 'grid-pattern')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('circle')
      .attr('cx', 2)
      .attr('cy', 2)
      .attr('r', 1)
      .attr('fill', 'rgba(0,0,0,0.1)');

    // Parallax background container
    const bgG = svg.append('g').attr('class', 'parallax-bg');
    bgG.append('rect')
      .attr('width', width * 3)
      .attr('height', height * 3)
      .attr('x', -width)
      .attr('y', -height)
      .attr('fill', 'url(#grid-pattern)');

    // Container for zooming
    const g = svg.append('g');
    gRef.current = g;

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .wheelDelta((event: any) => {
        // Soften the zoom scroll to make it smoother
        const delta = -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
        return delta * 0.2; 
      })
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        bgG.attr('transform', `translate(${event.transform.x * 0.15}, ${event.transform.y * 0.15}) scale(${1 + (event.transform.k - 1)*0.05})`);
        
        // Semantic Zooming
        const k = event.transform.k;
        g.selectAll('.node-sublabel').attr('opacity', k > 0.8 ? 1 : 0);
        g.selectAll('.node-label').attr('opacity', function(this: any) {
           const d = d3.select(this).datum() as any;
           return (k > 0.5 || (d && d.popularity > 6)) ? 1 : 0;
        });
      });

    svg.call(zoom);
    zoomRef.current = zoom; // Save zoom behavior for programmatic zooming

    // Deep copy for simulation
    const simNodes = nodes.map(d => ({ ...d, x: d.x || (Math.random()-0.5) * width, y: d.y || (Math.random()-0.5) * height })) as any[];
    const simEdges = edges.map(d => {
       const s = d.sourceId || (d.source && typeof d.source === 'string' ? d.source : (d.source && (d.source as any).id ? (d.source as any).id : undefined));
       const t = d.targetId || (d.target && typeof d.target === 'string' ? d.target : (d.target && (d.target as any).id ? (d.target as any).id : undefined));
       return { ...d, source: s, target: t };
    }).filter(e => e.source && e.target) as any[];

    let simulation: any;
    try {
      simulation = d3.forceSimulation(simNodes)
        .force('link', d3.forceLink(simEdges).id((d: any) => d.id).distance(240))
        .force('charge', d3.forceManyBody().strength(-2000))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', d3.forceCollide().radius((d: any) => (d.popularity * 3) + 70));
    } catch (e: any) {
      console.error("D3 Simulation Error:", e);
      return;
    }

    simulationRef.current = simulation;

    const typeColors: Record<string, { fill: string, stroke: string, text: string }> = {
      'company': { fill: '#F8FAFC', stroke: '#0F172A', text: '#0F172A' },
      'model': { fill: '#F4F4F5', stroke: '#71717A', text: '#52525B' }, // Neutral for models
      'person': { fill: '#FAF5FF', stroke: '#9333EA', text: '#7E22CE' },
      'research': { fill: '#F0FDF4', stroke: '#16A34A', text: '#15803D' },
      'product': { fill: '#FFF7ED', stroke: '#EA580C', text: '#C2410C' },
    };

    // Gradient Edges
    const gradients = defs.selectAll('linearGradient.edge-grad')
      .data(simEdges)
      .join('linearGradient')
      .attr('id', d => `grad-${d.id}`)
      .attr('class', 'edge-grad')
      .attr('gradientUnits', 'userSpaceOnUse');

    gradients.append('stop').attr('offset', '0%').attr('stop-color', d => typeColors[d.source.type?.toLowerCase() || 'model']?.fill || '#cbd5e1');
    gradients.append('stop').attr('offset', '100%').attr('stop-color', d => typeColors[d.target.type?.toLowerCase() || 'model']?.fill || '#cbd5e1');

    // Draw Links
    const link = g.append('g')
      .selectAll('path')
      .data(simEdges)
      .join('path')
      .attr('class', 'graph-link')
      .attr('stroke', d => `url(#grad-${d.id})`)
      .attr('stroke-width', (d: any) => d.weight ? Math.sqrt(d.weight) * 2 : 1.5)
      .attr('fill', 'none')
      .attr('opacity', 0.8);

    // Draw Nodes
    const node = g.append('g')
      .selectAll('g.graph-node')
      .data(simNodes)
      .join('g')
      .attr('class', 'graph-node')
      .attr('id', d => `node-${d.id}`)
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('click', (event, d) => {
        event.stopPropagation();
        if (didDragRef.current) {
          didDragRef.current = false;
          return;
        }
        setSelectedNodeId(d.id);
        navigate(`/node/${d.id}`);
      })
      .on('contextmenu', (event, d) => {
        event.preventDefault(); // allow right click to toggle isolated branch mode
        const { isolatedNodeId, setIsolatedNodeId } = useAppStore.getState();
        if (isolatedNodeId === d.id) setIsolatedNodeId(null);
        else setIsolatedNodeId(d.id);
        event.stopPropagation();
      })
      .on('mouseenter', function (event, d) {
        setHoveredNodeId(d.id);
        d3.select(this).select('.node-inner').transition().duration(400).ease(d3.easeElastic).attr('transform', 'scale(1.15)');
        d3.select(this).select('text.node-label').transition().style('letter-spacing', '0.05em').attr('font-weight', '600');
      })
      .on('mouseleave', function (event, d) {
        setHoveredNodeId(null);
        d3.select(this).select('.node-inner').transition().duration(300).ease(d3.easeCubicOut).attr('transform', 'scale(1)');
        d3.select(this).select('text.node-label').transition().style('letter-spacing', 'normal').attr('font-weight', '500');
      });

    // Create an inner group for the entry/hover scale animation
    const nodeInner = node.append('g')
      .attr('class', 'node-inner')
      .attr('transform', 'scale(0)');
      
    // Trigger Spring Entry Animation
    nodeInner.transition()
      .duration(800)
      .delay((d: any, i) => Math.random() * 200 + i * 15)
      .ease(d3.easeElastic)
      .attr('transform', 'scale(1)');

    // Node circles - Main outer bubble
    nodeInner.append('circle')
      .attr('r', (d: any) => d.popularity * 2.5 + 8)
      .attr('fill', (d: any) => typeColors[d.type.toLowerCase()]?.fill || '#ffffff')
      .attr('stroke', (d: any) => typeColors[d.type.toLowerCase()]?.stroke || '#000000')
      .attr('stroke-width', 1.5)
      .attr('filter', 'url(#drop-shadow)')
      .attr('class', 'cursor-pointer node-circle');

    // Inner circle for dimension
    nodeInner.append('circle')
      .attr('r', (d: any) => (d.popularity * 2.5 + 8) * 0.75) // 75% of outer circle
      .attr('fill', '#ffffff')
      .attr('opacity', 0.6)
      .attr('class', 'pointer-events-none');

    // Decorative center dot
    nodeInner.append('circle')
      .attr('r', 2)
      .attr('fill', (d: any) => typeColors[d.type.toLowerCase()]?.stroke || '#000000')
      .attr('opacity', 0.8)
      .attr('class', 'pointer-events-none');

    // Node labels
    nodeInner.append('text')
      .text((d: any) => d.name)
      .attr('x', (d: any) => d.popularity * 2.5 + 16)
      .attr('y', -6)
      .attr('dy', '0') 
      .attr('class', 'node-label font-sans text-[13px] font-medium tracking-tight pointer-events-none transition-all')
      .attr('fill', '#111827')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke fill');
      
    // Type labels
    nodeInner.append('text')
      .text((d: any) => d.type.toUpperCase())
      .attr('x', (d: any) => d.popularity * 2.5 + 16)
      .attr('y', 17)
      .attr('class', 'node-sublabel font-mono text-[9px] font-semibold tracking-widest pointer-events-none')
      .attr('fill', (d: any) => typeColors[d.type.toLowerCase()]?.text || '#6B7280')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .attr('paint-order', 'stroke fill');


    simulation.on('tick', () => {
      try {
        link
          .attr('d', (d: any) => {
             const sx = d.source.x || 0;
             const sy = d.source.y || 0;
             const tx = d.target.x || 0;
             const ty = d.target.y || 0;
             const dx = tx - sx;
             const dy = ty - sy;
             const dist = Math.sqrt(dx * dx + dy * dy);
             
             if (dist === 0) return '';
             
             // Dynamic Radii checking the actual outer bubble size + padding
             const sr = (d.source.popularity * 2.5 + 8) + 4;
             const tr = (d.target.popularity * 2.5 + 8) + 4;
             
             if (dist <= sr + tr) return `M${sx},${sy} L${tx},${ty}`; // Fallback if overlapping
             
             // Trim positions to the edge of the circle
             const startX = sx + (dx * sr) / dist;
             const startY = sy + (dy * sr) / dist;
             const endX = tx - (dx * tr) / dist;
             const endY = ty - (dy * tr) / dist;
             
             // Create a mild bezier curve
             const dr = dist * 2.5; 
             
             // The sweep flag (1 or 0) helps separate back-and-forth edges,
             // but we can just use 1 to make it consistently curve.
             return `M${startX},${startY} A${dr},${dr} 0 0,1 ${endX},${endY}`;
          });

        d3.selectAll('.edge-grad')
          .attr('x1', (d: any) => d.source.x || 0)
          .attr('y1', (d: any) => d.source.y || 0)
          .attr('x2', (d: any) => d.target.x || 0)
          .attr('y2', (d: any) => d.target.y || 0);

        node
          .attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
          
      } catch (err) {
        console.error("Tick error", err);
      }
    });

    // Zoom out slightly at start to see the constellation
    svg.call(zoom.transform, d3.zoomIdentity.translate(width/2, height/2).scale(0.8).translate(-width/2, -height/2));

    function dragstarted(event: any) {
      didDragRef.current = false;
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      didDragRef.current = true;
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    // Handle bg click (Ripple effect & deselect)
    svg.on('click', (event) => {
       if (event.target.tagName === 'svg' || event.target.tagName === 'rect') {
         setSelectedNodeId(null);
         
         const coords = d3.pointer(event, gRef.current);
         const ripple = gRef.current.append('circle')
            .attr('cx', coords[0])
            .attr('cy', coords[1])
            .attr('r', 0)
            .attr('fill', 'none')
            .attr('stroke', 'rgba(0,0,0,0.15)')
            .attr('stroke-width', 2);
            
         ripple.transition().duration(600).ease(d3.easeCubicOut)
            .attr('r', 120)
            .attr('opacity', 0)
            .remove();
       }
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]); // Rebuild layout only when filtered graph changes

  // Update visual states based on selection/hover without restarting simulation
  useEffect(() => {
    if (!gRef.current) return;
    
    const g = gRef.current;
    
    // Path Finding Logic
    const pathNodes = new Set<string>();
    const pathEdges = new Set<string>();
    const { exploreMode } = useAppStore.getState();

    if (pathStartNodeId && pathEndNodeId) {
      if (pathResult?.found) {
        pathResult.nodeIds.forEach(id => pathNodes.add(id));
        pathResult.edges.forEach(edge => {
          pathEdges.add(`${edge.sourceId}-${edge.targetId}`);
          pathEdges.add(`${edge.targetId}-${edge.sourceId}`);
        });
      } else {
        // Fallback when the API is unavailable: local BFS over the currently rendered graph.
        const graph = new Map<string, string[]>();
        edges.forEach(e => {
          const u = e.sourceId || (typeof e.source === 'object' ? e.source.id : e.source);
          const v = e.targetId || (typeof e.target === 'object' ? e.target.id : e.target);
          if(!graph.has(u)) graph.set(u, []);
          if(!graph.has(v)) graph.set(v, []);
          graph.get(u)!.push(v);
          graph.get(v)!.push(u);
        });

        const queue = [pathStartNodeId];
        const visited = new Set<string>([pathStartNodeId]);
        const parent = new Map<string, string>();

        let found = false;
        while(queue.length > 0) {
          const curr = queue.shift()!;
          if (curr === pathEndNodeId) {
            found = true;
            break;
          }
          const neighbors = graph.get(curr) || [];
          for (const n of neighbors) {
            if (!visited.has(n)) {
              visited.add(n);
              parent.set(n, curr);
              queue.push(n);
            }
          }
        }

        if (found) {
          let curr = pathEndNodeId;
          while(curr !== pathStartNodeId) {
            pathNodes.add(curr);
            const p = parent.get(curr)!;
            pathEdges.add(`${p}-${curr}`);
            pathEdges.add(`${curr}-${p}`);
            curr = p;
          }
          pathNodes.add(pathStartNodeId);
        }
      }
    }
    
    // First, determine all connected node IDs for the active state
    const connectedNodeIds = new Set<string>();
    if (selectedNodeId) {
      connectedNodeIds.add(selectedNodeId);
      edges.forEach(e => {
        const sourceId = e.sourceId || (typeof e.source === 'object' ? e.source.id : e.source);
        const targetId = e.targetId || (typeof e.target === 'object' ? e.target.id : e.target);
        if (sourceId === selectedNodeId) connectedNodeIds.add(targetId);
        if (targetId === selectedNodeId) connectedNodeIds.add(sourceId);
      });
    } else if (hoveredNodeId) {
      connectedNodeIds.add(hoveredNodeId);
      edges.forEach(e => {
        const sourceId = e.sourceId || (typeof e.source === 'object' ? e.source.id : e.source);
        const targetId = e.targetId || (typeof e.target === 'object' ? e.target.id : e.target);
        if (sourceId === hoveredNodeId) connectedNodeIds.add(targetId);
        if (targetId === hoveredNodeId) connectedNodeIds.add(sourceId);
      });
    }

    g.selectAll('.graph-link').each(function(this: any, d: any) {
      const sourceId = d.source.id || d.source;
      const targetId = d.target.id || d.target;
      
      const isConnectedToSelected = selectedNodeId && (sourceId === selectedNodeId || targetId === selectedNodeId);
      const isConnectedToHovered = hoveredNodeId && (sourceId === hoveredNodeId || targetId === hoveredNodeId);
      
      const isPath = pathEdges.has(`${sourceId}-${targetId}`);

      let opacity = 0.6;
      let strokeWidth = 1;
      let stroke = '#E5E5E5';

      if (pathStartNodeId && pathEndNodeId) {
        if (isPath) {
          opacity = 1;
          strokeWidth = 4;
          stroke = '#2563EB'; // Bright blue for path
          d3.select(this).raise();
        } else {
          opacity = 0.05;
        }
      } else if (selectedNodeId || hoveredNodeId) {
        if (isConnectedToSelected || isConnectedToHovered) {
          opacity = 1;
          strokeWidth = 2;
          stroke = '#000000';
          d3.select(this).raise(); // Bring active link to front of other links
        } else {
          opacity = exploreMode ? 0 : 0.1;
        }
      }

      d3.select(this)
        .transition().duration(400)
        .attr('opacity', opacity)
        .attr('stroke-width', strokeWidth)
        .attr('stroke', stroke);
    });

    const typeColors: Record<string, { fill: string, stroke: string, text: string }> = {
      'company': { fill: '#F8FAFC', stroke: '#0F172A', text: '#0F172A' },
      'model': { fill: '#F4F4F5', stroke: '#71717A', text: '#52525B' },
      'person': { fill: '#FAF5FF', stroke: '#9333EA', text: '#7E22CE' },
      'research': { fill: '#F0FDF4', stroke: '#16A34A', text: '#15803D' },
      'product': { fill: '#FFF7ED', stroke: '#EA580C', text: '#C2410C' },
    };

    g.selectAll('.graph-node').each(function(this: any, d: any) {
      const isCoreNode = selectedNodeId === d.id || hoveredNodeId === d.id;
      const isConnected = connectedNodeIds.has(d.id);
      const isInPath = pathNodes.has(d.id);
      
      const hasActiveState = selectedNodeId !== null || hoveredNodeId !== null;
      let isDimmed = hasActiveState && !isConnected;

      if (pathStartNodeId && pathEndNodeId) {
        isDimmed = !isInPath;
      }

      d3.select(this).select('circle.node-circle')
        .transition().duration(400)
        .attr('stroke-width', isInPath ? 3 : (isCoreNode ? 2.5 : (isConnected && hasActiveState ? 2 : 1.5)))
        .attr('stroke', isInPath ? '#2563EB' : typeColors[d.type.toLowerCase()]?.stroke || '#000000')
        .attr('fill', typeColors[d.type.toLowerCase()]?.fill || '#ffffff');
        
      if (exploreMode && isDimmed) {
         d3.select(this).transition().duration(500).style('opacity', 0).style('pointer-events', 'none');
      } else {
         d3.select(this).transition().duration(400).style('opacity', isDimmed ? 0.3 : 1).style('pointer-events', 'all');
      }

      // Raise connected nodes so they sit perfectly on top of all links and dimmed nodes
      if ((isConnected && hasActiveState) || isInPath) {
        d3.select(this).raise();
      }
    });

    // Smart camera pan on selection
    if (selectedNodeId && svgRef.current && containerRef.current) {
      const svg = d3.select(svgRef.current);
      const targetNodeElement = svg.select(`#node-${selectedNodeId}`).node();
      if (targetNodeElement) {
         const targetData = d3.select(targetNodeElement).datum() as any;
         const zoom = zoomRef.current;
         if (zoom && targetData) {
            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;
            const transform = d3.zoomIdentity.translate(width/2, height/2).scale(1.5).translate(-targetData.x, -targetData.y);
            svg.transition().duration(800).ease(d3.easeCubicOut).call(zoom.transform, transform);
         }
      }
    }

  }, [selectedNodeId, hoveredNodeId, edges, pathStartNodeId, pathEndNodeId, pathResult]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
