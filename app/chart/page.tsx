"use client";

import { useEffect, useState } from "react";

import ChartClient from "./ChartClient";
import { supabase } from "@/lib/supabaseClient";

type GraphNode = {
  id: string;
  name: string;
  group: string;
};

type GraphLink = {
  source: string;
  target: string;
  type: string;
};

type ChartData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

const EMPTY_CHART_DATA: ChartData = { nodes: [], links: [] };

type NodeRow = {
  id?: string | number | null;
  name?: string | null;
  group?: string | null;
  group_type?: string | null;
};

type LinkRow = {
  source?: string | number | null;
  target?: string | number | null;
  type?: string | null;
  relationship_type?: string | null;
};

function normalizeString(value: string | number | null | undefined): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return null;
}

export default function ChartPage() {
  const [chartData, setChartData] = useState<ChartData>(EMPTY_CHART_DATA);

  useEffect(() => {
    let isActive = true;

    async function loadData() {
      try {
        const [{ data: nodeRows, error: nodeError }, { data: linkRows, error: linkError }] = await Promise.all([
          supabase.from("nodes").select("*"),
          supabase.from("links").select("*"),
        ]);

        if (nodeError) {
          console.error("Error fetching nodes from Supabase:", nodeError);
        }

        if (linkError) {
          console.error("Error fetching links from Supabase:", linkError);
        }

        if (!isActive) {
          return;
        }

        const typedNodeRows = (nodeRows as NodeRow[] | null | undefined) ?? [];
        const nodes = typedNodeRows
          .map((row) => {
            const id = normalizeString(row?.id) ?? normalizeString(row?.name);
            const name = normalizeString(row?.name) ?? normalizeString(row?.id);
            const group = normalizeString(row?.group) ?? normalizeString(row?.group_type);

            if (!id || !name || !group) {
              return null;
            }

            return {
              id,
              name,
              group,
            } satisfies GraphNode;
          })
          .filter((node): node is GraphNode => Boolean(node));

        const typedLinkRows = (linkRows as LinkRow[] | null | undefined) ?? [];
        const links = typedLinkRows
          .map((row) => {
            const source = normalizeString(row?.source);
            const target = normalizeString(row?.target);
            const type = normalizeString(row?.type) ?? normalizeString(row?.relationship_type);

            if (!source || !target || !type) {
              return null;
            }

            return {
              source,
              target,
              type,
            } satisfies GraphLink;
          })
          .filter((link): link is GraphLink => Boolean(link));

        setChartData({ nodes, links });
      } catch (error) {
        console.error("Unexpected error fetching chart data from Supabase:", error);
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
