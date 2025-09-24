import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 540;

function getNodeId(value) {
  if (!value) return null;
  if (typeof value === "object") {
    return value.id ?? null;
  }
  return value;
}

export function ForceGraph2D({
  graphData,
  filterLinks,
  visibleNodeIds,
  highlightNodeIds,
  highlightLinkIds,
  focusCommand,
  onNodeHover,
  onNodeClick,
  onBackgroundClick,
  className = "",
  backgroundColor = "transparent",
}) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  const simulationNodesRef = useRef([]);
  const linksRef = useRef([]);
  const focusNodeIdRef = useRef(null);
  const focusFrameRef = useRef(0);

  const [renderNodes, setRenderNodes] = useState([]);

  const nodePositions = useMemo(() => {
    const map = new Map();
    renderNodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [renderNodes]);

  useEffect(() => {
    if (!graphData) {
      simulationNodesRef.current = [];
      linksRef.current = [];
      setRenderNodes([]);
      return;
    }

    const nodes = graphData.nodes.map((node, index, arr) => {
      const angle = (index / Math.max(arr.length, 1)) * Math.PI * 2;
      return {
        ...node,
        x: DEFAULT_WIDTH / 2 + Math.cos(angle) * 180,
        y: DEFAULT_HEIGHT / 2 + Math.sin(angle) * 180,
        vx: 0,
        vy: 0,
      };
    });

    simulationNodesRef.current = nodes;

    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    linksRef.current = graphData.links.map((link) => {
      const sourceId = getNodeId(link.source);
      const targetId = getNodeId(link.target);
      return {
        ...link,
        source: nodeById.get(sourceId) ?? null,
        target: nodeById.get(targetId) ?? null,
      };
    });

    setRenderNodes(nodes.map((node) => ({ ...node })));
  }, [graphData]);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions((current) => ({
          width: width || current.width,
          height: Math.max(height, DEFAULT_HEIGHT),
        }));
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!simulationNodesRef.current.length) {
      return undefined;
    }

    let animationFrame;

    const step = () => {
      const nodes = simulationNodesRef.current;
      const links = linksRef.current;
      const width = dimensions.width || DEFAULT_WIDTH;
      const height = dimensions.height || DEFAULT_HEIGHT;

      const chargeStrength = 1600;
      const springLength = 140;
      const springStiffness = 0.02;
      const centerStrength = 0.005;
      const damping = 0.9;
      const timeStep = 0.02;
      const maxSpeed = 6;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        for (let j = i + 1; j < nodes.length; j += 1) {
          const other = nodes[j];
          let dx = node.x - other.x;
          let dy = node.y - other.y;
          const distSq = dx * dx + dy * dy || 0.001;
          const distance = Math.sqrt(distSq);
          const force = chargeStrength / distSq;
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          node.vx += fx;
          node.vy += fy;
          other.vx -= fx;
          other.vy -= fy;
        }
      }

      for (const link of links) {
        const source = link.source;
        const target = link.target;
        if (!source || !target) continue;
        let dx = target.x - source.x;
        let dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const displacement = distance - springLength;
        const force = displacement * springStiffness;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }

      if (focusFrameRef.current > 0 && focusNodeIdRef.current) {
        const focusNode = nodes.find((node) => node.id === focusNodeIdRef.current);
        if (focusNode) {
          const focusStrength = 0.08;
          focusNode.vx += (width / 2 - focusNode.x) * focusStrength;
          focusNode.vy += (height / 2 - focusNode.y) * focusStrength;
        }
        focusFrameRef.current -= 1;
      } else {
        focusNodeIdRef.current = null;
      }

      for (const node of nodes) {
        node.vx += (width / 2 - node.x) * centerStrength;
        node.vy += (height / 2 - node.y) * centerStrength;

        node.vx *= damping;
        node.vy *= damping;

        node.vx = Math.max(Math.min(node.vx, maxSpeed), -maxSpeed);
        node.vy = Math.max(Math.min(node.vy, maxSpeed), -maxSpeed);

        node.x += node.vx * timeStep * 60;
        node.y += node.vy * timeStep * 60;

        const margin = 24;
        node.x = Math.min(Math.max(node.x, margin), width - margin);
        node.y = Math.min(Math.max(node.y, margin), height - margin);
      }

      setRenderNodes(nodes.map((node) => ({ ...node })));
      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [dimensions.height, dimensions.width, graphData?.links?.length]);

  useEffect(() => {
    if (!focusCommand) return;
    focusNodeIdRef.current = focusCommand.nodeId;
    focusFrameRef.current = 120;
  }, [focusCommand]);

  const visibleNodes = useMemo(() => {
    if (!visibleNodeIds) return renderNodes;
    return renderNodes.filter((node) => visibleNodeIds.has(node.id));
  }, [renderNodes, visibleNodeIds]);

  const appliedLinks = useMemo(() => {
    if (!filterLinks) return [];
    return filterLinks;
  }, [filterLinks]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ backgroundColor }}
      onMouseLeave={() => onNodeHover?.(null)}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="h-full w-full"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onBackgroundClick?.();
          }
        }}
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className="links">
          {appliedLinks.map((link) => {
            const sourceId = getNodeId(link.source);
            const targetId = getNodeId(link.target);
            const source = nodePositions.get(sourceId);
            const target = nodePositions.get(targetId);
            if (!source || !target) return null;
            if (visibleNodeIds && (!visibleNodeIds.has(sourceId) || !visibleNodeIds.has(targetId))) {
              return null;
            }
            const highlighted = highlightLinkIds?.has?.(link.id);
            const stroke = highlighted ? "#facc15" : "#475569";
            const opacity = highlighted ? 0.95 : 0.5;
            const width = highlighted ? 2.4 : 1.1;
            return (
              <line
                key={link.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke={stroke}
                strokeOpacity={opacity}
                strokeWidth={width}
              />
            );
          })}
        </g>
        <g className="nodes">
          {visibleNodes.map((node) => {
            const highlighted = highlightNodeIds?.has?.(node.id);
            const radius = highlighted ? 9 : 6;
            const fill = node.color ?? "#818cf8";
            const stroke = highlighted ? "url(#nodeGlow)" : "#0f172a";
            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => onNodeHover?.(node.id)}
                onMouseLeave={() => onNodeHover?.(null)}
                onClick={(event) => {
                  event.stopPropagation();
                  onNodeClick?.(node.id);
                }}
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={highlighted ? 2 : 1}
                  opacity={highlighted ? 1 : 0.9}
                />
                <text
                  x={node.x + radius + 4}
                  y={node.y + 4}
                  fontSize={12}
                  fill="#cbd5f5"
                  pointerEvents="none"
                >
                  {node.id}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
