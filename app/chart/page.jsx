"use client";

import { useEffect, useState } from "react";

import ChartClient from "./ChartClient";
import fallbackChart from "@/data/chart.json";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";

export default function ChartPage() {
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const response = await fetch("/api/chart/public", { cache: "no-store" });
        const payload = await response.json().catch(() => null);

        if (!response.ok) {
          const errorMessage = payload?.error ?? "Failed to load the public chart.";
          throw new Error(errorMessage);
        }

        if (!isActive) {
          return;
        }

        setChartData(
          buildChartData(payload?.nodes ?? [], payload?.links ?? []),
        );
        setIsUsingFallback(false);
        setFallbackMessage("");
      } catch (error) {
        console.error("Unexpected error fetching public chart data:", error);
        if (isActive) {
          setChartData(buildChartData(fallbackChart.nodes, fallbackChart.links));
          setIsUsingFallback(true);
          setFallbackMessage(
            "Showing cached sample data while we reconnect to the live chart."
          );
        }
      }
    }

    loadData();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">Public Chart</h1>
        <p className="text-sm text-slate-400">
          Hover to highlight, click to inspect, and use the filters to explore the network.
        </p>
      </div>
      {isUsingFallback && fallbackMessage ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          {fallbackMessage}
        </div>
      ) : null}
      <ChartClient data={chartData} />
    </div>
  );
}
