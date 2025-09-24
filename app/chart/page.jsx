"use client";

import { useEffect, useState } from "react";

import ChartClient from "./ChartClient";
import fallbackChart from "@/data/chart.json";
import { supabase } from "@/lib/supabaseClient";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";

export default function ChartPage() {
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackMessage, setFallbackMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const [
          { data: nodeRows, error: nodeError },
          { data: linkRows, error: linkError },
        ] = await Promise.all([
          supabase.from("nodes").select("*").is("user_id", null),
          supabase.from("links").select("*").is("user_id", null),
        ]);

        if (nodeError) {
          console.error("Error fetching public nodes from Supabase:", nodeError);
        }

        if (linkError) {
          console.error("Error fetching public links from Supabase:", linkError);
        }

        if (nodeError || linkError) {
          throw nodeError ?? linkError;
        }

        if (!isActive) {
          return;
        }

        setChartData(buildChartData(nodeRows ?? [], linkRows ?? []));
        setIsUsingFallback(false);
        setFallbackMessage("");
      } catch (error) {
        console.error("Unexpected error fetching public chart data from Supabase:", error);
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
