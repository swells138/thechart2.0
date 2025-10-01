"use client";

import { useEffect, useMemo, useState } from "react";
import { ForceGraph2D } from "react-force-graph";

const groupColors = {
  friend: "#38bdf8",
  ex: "#f87171",
  dating: "#c084fc",
  family: "#facc15",
  colleague: "#22d3ee",
  self: "#fde68a",
};

function getGroupColor(group) {
  return groupColors[group] ?? "#818cf8";
}

function makeTypeLabel(value) {
  return value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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

  const graphNodes = useMemo(
    () => data.nodes.map((node) => ({ ...node, color: getGroupColor(node.group) })),
    [data.nodes],
  );

  const graphData = useMemo(
    () => ({
      nodes: graphNodes,
      links: processedLinks.map((link) => ({ ...link })),
    }),
    [graphNodes, processedLinks],
  );

  const graphSignature = JSON.stringify({
    nodes: Array.isArray(data?.nodes)
      ? data.nodes.map((node) => [node.id ?? "", node.name ?? "", node.group ?? ""])
      : [],
    links: Array.isArray(data?.links)
      ? data.links.map((link) => [link.source ?? "", link.target ?? "", link.type ?? ""])
      : [],
  });

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

  const [filterType, setFilterType] = useState("all");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoverNodeId, setHoverNodeId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMessage, setSearchMessage] = useState("");
  const [focusCommand, setFocusCommand] = useState(null);

  useEffect(() => {
    if (!searchMessage) return undefined;
    const timeout = setTimeout(() => setSearchMessage(""), 4000);
    return () => clearTimeout(timeout);
  }, [searchMessage]);

  const filterLinks = useMemo(
    () => processedLinks.filter((link) => filterType === "all" || link.type === filterType),
    [processedLinks, filterType],
  );

  const visibleNodeIds = useMemo(() => {
    if (filterType === "all") return null;
    const ids = new Set();
    filterLinks.forEach((link) => {
      ids.add(link.source);
      ids.add(link.target);
    });
    return ids;
  }, [filterType, filterLinks]);

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

  const highlightInfo = useMemo(() => {
    const nodeIds = new Set();
    const linkIds = new Set();

    const addHighlights = (nodeId) => {
      if (!nodeId) return;
      nodeIds.add(nodeId);
      const connections = adjacencyMap.get(nodeId) ?? [];
      connections.forEach((connection) => {
        if (filterType !== "all" && connection.type !== filterType) return;
        nodeIds.add(connection.nodeId);
        linkIds.add(connection.linkId);
      });
    };

    addHighlights(hoverNodeId);
    if (selectedNodeId && selectedNodeId !== hoverNodeId) {
      addHighlights(selectedNodeId);
    }

    return { nodeIds, linkIds };
  }, [adjacencyMap, filterType, hoverNodeId, selectedNodeId]);

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
      if (filterType !== "all" && item.type !== filterType) return;
      if (!unique.has(item.linkId)) {
        unique.set(item.linkId, item);
      }
    });
    return Array.from(unique.values());
  }, [adjacencyMap, filterType, selectedNodeId]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) {
      setSearchMessage("Enter a name to search.");
      return;
    }

    const termLower = term.toLowerCase();
    const match = data.nodes.find((node) => {
      if (typeof node.id === "string" && node.id.toLowerCase() === termLower) {
        return true;
      }

      if (typeof node.name === "string" && node.name.toLowerCase() === termLower) {
        return true;
      }

      return false;
    });

    if (!match) {
      setSearchMessage(`No person named "${term}" found.`);
      return;
    }

    setSearchMessage("");

    if (filterType !== "all" && visibleNodeIds && !visibleNodeIds.has(match.id)) {
      setFilterType("all");
    }

    setSelectedNodeId(match.id);
    setFocusCommand({ nodeId: match.id, timestamp: Date.now() });
  };

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
        <ForceGraph2D
          key={graphSignature}
          className="mt-4 min-h-[540px] w-full"
          graphData={graphData}
          filterLinks={filterLinks}
          visibleNodeIds={visibleNodeIds}
          highlightNodeIds={highlightInfo.nodeIds}
          highlightLinkIds={highlightInfo.linkIds}
          focusCommand={focusCommand}
          onNodeHover={(id) => setHoverNodeId(id)}
          onNodeClick={(id) => {
            setSelectedNodeId(id);
            setSearchMessage("");
            setFocusCommand({ nodeId: id, timestamp: Date.now() });
          }}
          onBackgroundClick={() => setHoverNodeId(null)}
          backgroundColor="transparent"
        />
      </div>
      <aside className="glass-panel w-full max-w-lg space-y-4 p-6 lg:w-80">
        {selectedNodeId ? (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                {selectedNodeDetails?.name ?? selectedNodeId}
              </h2>
              <p className="text-sm text-slate-400">
                Group: {makeTypeLabel(selectedNodeDetails?.group ?? "unassigned")}
              </p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wide text-slate-400">Relationship types</h3>
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
              Tip: use the filter to focus on a relationship type or the search bar to jump directly to someone.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
