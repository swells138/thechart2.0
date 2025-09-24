"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ChartClient from "../chart/ChartClient";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";
import { supabase } from "@/lib/supabaseClient";

export default function MyChartPage() {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [formValues, setFormValues] = useState({ name: "", group: "friend" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: null, message: "" });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadChartForUser = useCallback(
    async (userId) => {
      if (!userId || !isMountedRef.current) {
        return;
      }

      setStatus({ loading: true, error: null });

      try {
        const [
          { data: nodeRows, error: nodeError },
          { data: linkRows, error: linkError },
        ] = await Promise.all([
          supabase.from("nodes").select("*").eq("user_id", userId),
          supabase.from("links").select("*").eq("user_id", userId),
        ]);

        if (nodeError || linkError) {
          if (nodeError) {
            console.error("Error fetching user nodes from Supabase:", nodeError);
          }
          if (linkError) {
            console.error("Error fetching user links from Supabase:", linkError);
          }
          throw new Error("Failed to load chart data");
        }

        if (!isMountedRef.current) {
          return;
        }

        setChartData(buildChartData(nodeRows ?? [], linkRows ?? []));
        setStatus({ loading: false, error: null });
      } catch (error) {
        console.error("Unexpected error fetching user chart data from Supabase:", error);
        if (!isMountedRef.current) {
          return;
        }

        setChartData(EMPTY_CHART_DATA);
        setStatus({
          loading: false,
          error: "We couldn’t load your chart right now. Please try again.",
        });
      }
    },
    []
  );

  useEffect(() => {
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

        if (isMountedRef.current) {
          setCurrentUserId(user.id);
        }

        await loadChartForUser(user.id);
      } catch (error) {
        console.error("Unexpected error while initializing my chart page:", error);
        if (isMountedRef.current) {
          setStatus({
            loading: false,
            error: "We couldn’t load your chart right now. Please try again.",
          });
        }
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMountedRef.current) return;

      const authUser = session?.user ?? null;
      if (!authUser) {
        setChartData(EMPTY_CHART_DATA);
        setStatus({ loading: true, error: null });
        router.replace("/login");
        return;
      }

      setCurrentUserId(authUser.id);
      await loadChartForUser(authUser.id);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadChartForUser, router]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPerson = async (event) => {
    event.preventDefault();

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFormFeedback({
        type: "error",
        message: "Please enter a name before adding a person.",
      });
      return;
    }

    if (!currentUserId) {
      setFormFeedback({
        type: "error",
        message: "We couldn’t verify your account. Please reload and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback({ type: null, message: "" });

    try {
      const { data: privateNode, error: privateNodeError } = await supabase
        .from("nodes")
        .insert([
          {
            name: trimmedName,
            group_type: formValues.group,
            user_id: currentUserId,
          },
        ])
        .select()
        .single();

      if (privateNodeError) {
        throw privateNodeError;
      }

      const { error: publicNodeError } = await supabase.from("nodes").insert([
        {
          name: trimmedName,
          group_type: formValues.group,
          user_id: null,
        },
      ]);

      if (publicNodeError) {
        throw publicNodeError;
      }

      if (!privateNode?.id) {
        throw new Error("Private node was not created successfully");
      }

      const { error: linkError } = await supabase.from("links").insert([
        {
          source: currentUserId,
          target: privateNode.id,
          type: "friend",
          user_id: currentUserId,
        },
      ]);

      if (linkError) {
        throw linkError;
      }

      await loadChartForUser(currentUserId);

      if (isMountedRef.current) {
        setFormValues({ name: "", group: "friend" });
        setFormFeedback({
          type: "success",
          message: `${trimmedName} has been added to your chart.`,
        });
      }
    } catch (error) {
      console.error("Error adding person to chart:", error);
      if (isMountedRef.current) {
        setFormFeedback({
          type: "error",
          message: "We couldn’t add that person right now. Please try again.",
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">My Chart</h1>
        <p className="text-sm text-slate-400">
          Explore and maintain your personalized relationship graph.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-900/70 p-5 shadow-lg shadow-slate-950/40">
        <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleAddPerson}>
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formValues.name}
              onChange={handleInputChange}
              placeholder="Add someone new"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
            />
          </div>

          <div className="w-full space-y-2 md:w-52">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-400" htmlFor="group">
              Group
            </label>
            <select
              id="group"
              name="group"
              value={formValues.group}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="friend">Friend</option>
              <option value="ex">Ex</option>
              <option value="dating">Dating</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-sky-500 px-4 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 md:w-auto"
          >
            {isSubmitting ? "Adding..." : "Add Person"}
          </button>
        </form>
        {formFeedback.message ? (
          <div
            className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
              formFeedback.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/40 bg-rose-500/10 text-rose-200"
            }`}
          >
            {formFeedback.message}
          </div>
        ) : null}
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
