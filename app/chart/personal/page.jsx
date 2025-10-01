"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ChartClient from "../ChartClient";
import NodeForm from "@/components/NodeForm";
import LinkForm from "@/components/LinkForm";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";

export default function PersonalChartPage() {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [rawNodes, setRawNodes] = useState([]);
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadPersonalChart = useCallback(async () => {
    if (!isMountedRef.current) {
      return false;
    }

    setStatus({ loading: true, error: null });

    try {
      const response = await fetch("/api/chart/personal", {
        credentials: "include",
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (response.status === 401) {
        if (isMountedRef.current) {
          setStatus({
            loading: false,
            error: "Please sign in to view your personal chart.",
          });
        }
        router.replace("/login");
        return false;
      }

      if (!response.ok) {
        const errorMessage = payload?.error ?? "Unable to load your chart.";
        throw new Error(errorMessage);
      }

      if (!isMountedRef.current) {
        return true;
      }

      const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
      const links = Array.isArray(payload?.links) ? payload.links : [];

      setRawNodes(nodes);
      setChartData(buildChartData(nodes, links));
      setStatus({ loading: false, error: null });
      return true;
    } catch (error) {
      console.error("Error loading personal chart via API:", error);
      if (isMountedRef.current) {
        setStatus({
          loading: false,
          error: error.message || "We couldn’t load your chart. Please try again.",
        });
      }
      return false;
    }
  }, [router]);

  useEffect(() => {
    loadPersonalChart();
  }, [loadPersonalChart]);

  const handleRefresh = useCallback(async () => {
    await loadPersonalChart();
  }, [loadPersonalChart]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">Personal Chart</h1>
        <p className="text-sm text-slate-400">
          Add your own relationships and explore the network that only you can see.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Add a node
          </h2>
          <NodeForm onCreated={handleRefresh} />
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
            Add a link
          </h2>
          <LinkForm nodes={rawNodes} onCreated={handleRefresh} />
        </div>
      </div>

      {status.error ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {status.error}
        </div>
      ) : null}

      {status.loading ? (
        <div className="glass-panel flex min-h-[300px] items-center justify-center text-sm text-slate-400">
          Loading your chart...
        </div>
      ) : (
        <ChartClient data={chartData} />
      )}
    </div>
  );
}
