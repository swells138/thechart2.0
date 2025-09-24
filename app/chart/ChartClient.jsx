"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const DEFAULT_WIDTH = 900;
const DEFAULT_HEIGHT = 540;

const groupColors = {
  friend: "#38bdf8",
  ex: "#f87171",
  dating: "#c084fc",
  family: "#facc15",
  colleague: "#22d3ee",
};

function getGroupColor(group) {
  return groupColors[group] ?? "#818cf8";
}

export default function ChartClient({ data }) {
  const processedLinks = useMemo(
    () =>
      data.links.map((link, index) => ({
        ...link,
        id: `${link.source}|${link.target}|${link.type}|${index}`,
      })),
    [data.links],
  );

  const relationshipTypes = useMemo(() => {
    const unique = Array.from(new Set(processedLinks.map((link) => link.type)));
    return ["all", ...unique];
  }, [processedLinks]);

  const adjacencyMap = useMemo(() => {
    const map = new Map();
    processedLinks.forEach((link) => {
      const forward = map.get(link.source) ?? [];
      forward.push({ nodeId: link.target, type: link.type, linkId: link.id });
      map.set(link.source, forward);

      const reverse = map.get(link.target) ?? [];
      reverse.push({ nodeId: link.source, type: link.type, linkId: link.id });
      map.set(link.target, reverse);
    });
    return map;
  }, [processedLinks]);

  const relationshipsByPerson = useMemo(() => {
    const map = new Map();
    processedLinks.forEach((link) => {
      const sourceSet = map.get(link.source) ?? new Set();
      sourceSet.add(link.type);
      map.set(link.source, sourceSet);

      const targetSet = map.get(link.target) ?? new Set();
      targetSet.add(link.type);
      map.set(link.target, targetSet);
    });
    return map;
  }, [processedLinks]);

  const simulationNodesRef = useRef([]);
  const linksRef = useRef([]);
  const focusNodeIdRef = useRef(null);
  const focusFrameRef = useRef(0);

  const [renderNodes, setRenderNodes] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  });

  useEffect(() => {
    const nodes = data.nodes.map((node, index, arr) => {
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
    linksRef.current = processedLinks.map((link) => ({
      ...link,
      source: nodeById.get(link.source) ?? null,
      target: nodeById.get(link.target) ?? null,
    }));

    setRenderNodes(nodes.map((node) => ({ ...node })));
  }, [data.nodes, processedLinks]);

  useEffect(() => {
    if (!containerRef.current) return;

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
  }, [dimensions.height, dimensions.width, processedLinks.length]);

  useEffect(() => {
    if (!searchMessage) return undefined;
    const timeout = setTimeout(() => setSearchMessage(""), 4000);
    return () => clearTimeout(timeout);
  }, [searchMessage]);

  const visibleNodeIds = useMemo(() => {
    if (filterType === "all") return null;
    const ids = new Set();
    processedLinks.forEach((link) => {
      if (link.type === filterType) {
        ids.add(link.source);
        ids.add(link.target);
      }
    });
    return ids;
  }, [processedLinks, filterType]);

  useEffect(() => {
    if (filterType === "all" || !selectedNodeId || !visibleNodeIds) return;
    if (!visibleNodeIds.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [filterType, selectedNodeId, visibleNodeIds]);

  useEffect(() => {
    if (filterType === "all" || !hoverNodeId || !visibleNodeIds) return;
    if (!visibleNodeIds.has(hoverNodeId)) {
      setHoverNodeId(null);
    }
  }, [filterType, hoverNodeId, visibleNodeIds]);

  const linkById = useMemo(() => {
    const map = new Map();
    processedLinks.forEach((link) => map.set(link.id, link));
    return map;
  }, [processedLinks]);

  const highlightInfo = useMemo(() => {
    const nodeIds = new Set();
    const linkIds = new Set();

    const addHighlights = (nodeId) => {
      if (!nodeId) return;
      nodeIds.add(nodeId);
      const connections = adjacencyMap.get(nodeId) ?? [];
      connections.forEach((connection) => {
        const link = linkById.get(connection.linkId);
        if (!link) return;
        if (filterType !== "all" && link.type !== filterType) return;
        nodeIds.add(connection.nodeId);
        linkIds.add(connection.linkId);
      });
    };

    addHighlights(hoverNodeId);
    if (selectedNodeId && selectedNodeId !== hoverNodeId) {
      addHighlights(selectedNodeId);
    }

    return { nodeIds, linkIds };
  }, [adjacencyMap, filterType, hoverNodeId, linkById, selectedNodeId]);

  const nodePositions = useMemo(() => {
    const map = new Map();
    renderNodes.forEach((node) => {
      map.set(node.id, node);
    });
    return map;
  }, [renderNodes]);

  const selectedNodeDetails = useMemo(
    () => data.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [data.nodes, selectedNodeId],
  );

  const selectedRelationships = useMemo(() => {
    if (!selectedNodeId) return [];
    return Array.from(relationshipsByPerson.get(selectedNodeId) ?? []);
  }, [relationshipsByPerson, selectedNodeId]);

  const selectedConnections = useMemo(() => {
    if (!selectedNodeId) return [];
    const items = adjacencyMap.get(selectedNodeId) ?? [];
    const unique = new Map();
    items.forEach((item) => {
      if (!unique.has(item.linkId)) {
        unique.set(item.linkId, item);
      }
    });
    return Array.from(unique.values());
  }, [adjacencyMap, selectedNodeId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      setSearchMessage("Enter a name to search.");
      return;
    }

    const match = data.nodes.find(
      (node) => node.id.toLowerCase() === term.toLowerCase(),
    );

    if (!match) {
      setSearchMessage(`No person named "${term}" found.`);
      return;
    }

    setSearchMessage("");

    if (filterType !== "all" && visibleNodeIds && !visibleNodeIds.has(match.id)) {
      setFilterType("all");
    }

    setSelectedNodeId(match.id);
    focusNodeIdRef.current = match.id;
    focusFrameRef.current = 120;
  };

  const filterLinks = processedLinks.filter(
    (link) => filterType === "all" || link.type === filterType,
  );

  const makeTypeLabel = (value) => value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="glass-panel flex-1 overflow-hidden p-4">
        <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-sm items-center gap-2">
            <div className="flex-1">
              <label htmlFor="search" className="sr-only">
                Search people
              </label>
              <input
                id="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name"
                className="w-full rounded-xl border border-slate-700/80 px-3 py-2 text-sm shadow-inner focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800/80"
            >
              Search
            </button>
          </form>
          <div className="flex items-center gap-2">
            <label htmlFor="relationship-filter" className="text-xs uppercase tracking-wide text-slate-400">
              Filter
            </label>
            <select
              id="relationship-filter"
              value={filterType}
              onChange={(event) => setFilterType(event.target.value)}
              className="rounded-xl border border-slate-700/80 bg-slate-900 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              {relationshipTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "all" ? "All relationships" : makeTypeLabel(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {searchMessage ? (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {searchMessage}
          </div>
        ) : null}
        <div ref={containerRef} className="mt-4 min-h-[540px] w-full">
          <svg
            width={dimensions.width}
            height={dimensions.height}
            className="h-full w-full"
            onMouseLeave={() => setHoverNodeId(null)}
          >
            <defs>
              <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#facc15" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="links">
              {filterLinks.map((link) => {
                const source = nodePositions.get(link.source);
                const target = nodePositions.get(link.target);
                if (!source || !target) return null;
                const highlighted = highlightInfo.linkIds.has(link.id);
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
              {renderNodes
                .filter((node) => !visibleNodeIds || visibleNodeIds.has(node.id))
                .map((node) => {
                  const highlighted = highlightInfo.nodeIds.has(node.id);
                  const radius = highlighted ? 9 : 6;
                  const fill = getGroupColor(node.group);
                  const stroke = highlighted ? "url(#nodeGlow)" : "#0f172a";
                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoverNodeId(node.id)}
                      onMouseLeave={() => setHoverNodeId(null)}
                      onClick={() => {
                        setSelectedNodeId(node.id);
                        setSearchMessage("");
                        focusNodeIdRef.current = node.id;
                        focusFrameRef.current = 90;
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
      </div>
      <aside className="glass-panel w-full max-w-lg space-y-4 p-6 lg:w-80">
        {selectedNodeId ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">{selectedNodeId}</h2>
              <p className="text-sm text-slate-400">
                Group: {makeTypeLabel(selectedNodeDetails?.group ?? "unassigned")}
              </p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-slate-400">
                Relationship types
              </h3>
              {selectedRelationships.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRelationships.map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      {makeTypeLabel(type)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No relationships recorded.</p>
              )}
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-slate-400">Connections</h3>
              {selectedConnections.length ? (
                <ul className="mt-3 space-y-2">
                  {selectedConnections.map((connection) => (
                    <li
                      key={connection.linkId}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
                    >
                      <span>{connection.nodeId}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                        {makeTypeLabel(connection.type)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No visible connections.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-slate-400">
            <p>Select a person in the chart to view their relationships and connections.</p>
            <p>
              Tip: use the filter to focus on a relationship type or the search bar to jump directly to
              someone.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
