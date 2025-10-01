"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_TYPE = "friend";

export default function LinkForm({ nodes, onCreated }) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [relationshipType, setRelationshipType] = useState(DEFAULT_TYPE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const selectableNodes = useMemo(() => {
    if (!Array.isArray(nodes)) {
      return [];
    }

    return nodes
      .filter((node) => typeof node?.id === "string")
      .map((node) => ({
        id: node.id,
        name: typeof node?.name === "string" && node.name ? node.name : node.id,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes]);

  useEffect(() => {
    if (!selectableNodes.some((node) => node.id === source)) {
      setSource(selectableNodes[0]?.id ?? "");
    }
  }, [selectableNodes, source]);

  useEffect(() => {
    if (!selectableNodes.some((node) => node.id === target)) {
      const fallback = selectableNodes.find((node) => node.id !== source);
      setTarget(fallback?.id ?? "");
    }
  }, [selectableNodes, source, target]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!source || !target) {
      setFeedback({ type: "error", message: "Choose both a source and a target node." });
      return;
    }

    if (source === target) {
      setFeedback({ type: "error", message: "Source and target nodes must be different." });
      return;
    }

    const trimmedType = relationshipType.trim();

    if (!trimmedType) {
      setFeedback({ type: "error", message: "Please describe the relationship type." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: "" });

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          target,
          type: trimmedType,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = payload?.error ?? "We couldn't create that connection right now.";
        throw new Error(errorMessage);
      }

      setFeedback({
        type: "success",
        message: `Added a ${trimmedType} connection between the selected nodes.`,
      });
      setRelationshipType(DEFAULT_TYPE);
      onCreated?.(payload?.link ?? null);
    } catch (error) {
      console.error("Error creating link via API:", error);
      setFeedback({
        type: "error",
        message: error.message || "Unable to add the connection. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasEnoughNodes = selectableNodes.length >= 2;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="link-source" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Source
        </label>
        <select
          id="link-source"
          name="source"
          value={source}
          onChange={(event) => setSource(event.target.value)}
          disabled={!hasEnoughNodes || isSubmitting}
          className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed"
        >
          {hasEnoughNodes ? null : <option value="">Add at least two nodes first</option>}
          {selectableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="link-target" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Target
        </label>
        <select
          id="link-target"
          name="target"
          value={target}
          onChange={(event) => setTarget(event.target.value)}
          disabled={!hasEnoughNodes || isSubmitting}
          className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed"
        >
          {hasEnoughNodes ? null : <option value="">Add at least two nodes first</option>}
          {selectableNodes.map((node) => (
            <option key={node.id} value={node.id}>
              {node.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="link-type" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Relationship Type
        </label>
        <input
          id="link-type"
          name="type"
          type="text"
          value={relationshipType}
          onChange={(event) => setRelationshipType(event.target.value)}
          placeholder="friend, dating, colleague..."
          className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
        />
      </div>

      <button
        type="submit"
        disabled={!hasEnoughNodes || isSubmitting}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {isSubmitting ? "Adding..." : "Add Link"}
      </button>

      {feedback.message ? (
        <p
          className={`text-sm ${
            feedback.type === "success"
              ? "text-emerald-300"
              : "text-rose-300"
          }`}
        >
          {feedback.message}
        </p>
      ) : null}
    </form>
  );
}
