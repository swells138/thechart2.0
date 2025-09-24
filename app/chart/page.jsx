"use client";

import { useEffect, useState } from "react";

import ChartClient from "./ChartClient";
import { supabase } from "@/lib/supabaseClient";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";

export default function ChartPage() {
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);

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

        if (!isActive) {
          return;
        }

        setChartData(buildChartData(nodeRows ?? [], linkRows ?? []));
      } catch (error) {
        console.error("Unexpected error fetching public chart data from Supabase:", error);
        if (isActive) {
          setChartData(EMPTY_CHART_DATA);
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
      <ChartClient data={chartData} />
    </div>
  );
}
