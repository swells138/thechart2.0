"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ChartClient from "../chart/ChartClient";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";
import { supabase } from "@/lib/supabaseClient";

export default function MyChartPage() {
  const router = useRouter();
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);
  const [status, setStatus] = useState({ loading: true, error: null });

  useEffect(() => {
    let isMounted = true;

    const loadChartForUser = async (userId) => {
      if (!isMounted) return;
      setStatus({ loading: true, error: null });

      try {
        const [
          { data: nodeRows, error: nodeError },
          { data: linkRows, error: linkError },
        ] = await Promise.all([
          supabase.from("nodes").select("*").eq("user_id", userId),
          supabase.from("links").select("*").eq("user_id", userId),
        ]);

        if (nodeError) {
          console.error("Error fetching user nodes from Supabase:", nodeError);
        }

        if (linkError) {
          console.error("Error fetching user links from Supabase:", linkError);
        }

        if (!isMounted) {
          return;
        }

        setChartData(buildChartData(nodeRows ?? [], linkRows ?? []));
        setStatus({ loading: false, error: null });
      } catch (error) {
        console.error("Unexpected error fetching user chart data from Supabase:", error);
        if (!isMounted) {
          return;
        }

        setChartData(EMPTY_CHART_DATA);
        setStatus({
          loading: false,
          error: "We couldn’t load your chart right now. Please try again.",
        });
      }
    };

    const initialize = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching the current user from Supabase:", error);
        }

        const user = data?.user ?? null;
        if (!user) {
          router.replace("/login");
          return;
        }

        await loadChartForUser(user.id);
      } catch (error) {
        console.error("Unexpected error while initializing my chart page:", error);
        if (isMounted) {
          setStatus({
            loading: false,
            error: "We couldn’t load your chart right now. Please try again.",
          });
        }
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      const authUser = session?.user ?? null;
      if (!authUser) {
        setChartData(EMPTY_CHART_DATA);
        setStatus({ loading: true, error: null });
        router.replace("/login");
        return;
      }

      await loadChartForUser(authUser.id);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">My Chart</h1>
        <p className="text-sm text-slate-400">
          Explore and maintain your personalized relationship graph.
        </p>
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
