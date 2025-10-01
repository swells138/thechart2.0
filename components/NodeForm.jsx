"use client";

import { useState } from "react";

const GROUP_OPTIONS = [
  { value: "friend", label: "Friend" },
  { value: "dating", label: "Dating" },
  { value: "ex", label: "Ex" },
  { value: "family", label: "Family" },
  { value: "colleague", label: "Colleague" },
  { value: "self", label: "Self" },
];

export default function NodeForm({ onCreated }) {
  const [name, setName] = useState("");
  const [groupType, setGroupType] = useState(GROUP_OPTIONS[0]?.value ?? "friend");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setFeedback({ type: "error", message: "Please provide a name for the node." });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: "" });

    try {
      const response = await fetch("/api/nodes", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          group_type: groupType,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = payload?.error ?? "We couldn't add that node just yet.";
        throw new Error(errorMessage);
      }

      setFeedback({
        type: "success",
        message: `${payload?.node?.name ?? trimmedName} has been added to your chart.`,
      });
      setName("");
      setGroupType(GROUP_OPTIONS[0]?.value ?? "friend");
      onCreated?.(payload?.node ?? null);
    } catch (error) {
      console.error("Error creating node via API:", error);
      setFeedback({
        type: "error",
        message: error.message || "Unable to add the node. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="node-name" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Name
        </label>
        <input
          id="node-name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Add someone new"
          className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="node-group" className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Group
        </label>
        <select
          id="node-group"
          name="group_type"
          value={groupType}
          onChange={(event) => setGroupType(event.target.value)}
          className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
        >
          {GROUP_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700"
      >
        {isSubmitting ? "Adding..." : "Add Node"}
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
