"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ChartClient from "../chart/ChartClient";
import { buildChartData, EMPTY_CHART_DATA } from "@/lib/chartData";
import { supabase } from "@/lib/supabaseClient";

const LOCAL_STORAGE_KEY = "my-chart-data";

function generateLocalNodeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `local-${crypto.randomUUID()}`;
  }

  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function persistChartDataLocally(data) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const nodes = Array.isArray(data?.nodes)
      ? data.nodes
          .map((node) => {
            const id = typeof node?.id === "string" ? node.id : null;
            const name = typeof node?.name === "string" ? node.name : id;
            const group = typeof node?.group === "string" ? node.group : null;
            if (!id || !name || !group) {
              return null;
            }

            return { id, name, group };
          })
          .filter(Boolean)
      : [];

    const links = Array.isArray(data?.links)
      ? data.links
          .map((link) => {
            const source = typeof link?.source === "string" ? link.source : null;
            const target = typeof link?.target === "string" ? link.target : null;
            const type = typeof link?.type === "string" ? link.type : null;
            if (!source || !target || !type) {
              return null;
            }

            return { source, target, type };
          })
          .filter(Boolean)
      : [];

    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ nodes, links }));
  } catch (storageError) {
    console.warn("Unable to persist chart data locally:", storageError);
  }
}

function readLocalChartData() {
  if (typeof window === "undefined") {
    return EMPTY_CHART_DATA;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      return EMPTY_CHART_DATA;
    }

    const parsed = JSON.parse(raw);
    const nodes = Array.isArray(parsed?.nodes)
      ? parsed.nodes
          .map((node) => {
            const id = typeof node?.id === "string" ? node.id : null;
            const name = typeof node?.name === "string" ? node.name : id;
            const group = typeof node?.group === "string" ? node.group : null;
            if (!id || !name || !group) {
              return null;
            }

            return { id, name, group };
          })
          .filter(Boolean)
      : [];

    const links = Array.isArray(parsed?.links)
      ? parsed.links
          .map((link) => {
            const source = typeof link?.source === "string" ? link.source : null;
            const target = typeof link?.target === "string" ? link.target : null;
            const type = typeof link?.type === "string" ? link.type : null;
            if (!source || !target || !type) {
              return null;
            }

            return { source, target, type };
          })
          .filter(Boolean)
      : [];

    return { nodes, links };
  } catch (storageError) {
    console.warn("Unable to read chart data from local storage:", storageError);
    return EMPTY_CHART_DATA;
  }
}

export default function MyChartPage() {
  const router = useRouter();
  const isMountedRef = useRef(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [chartData, setChartData] = useState(EMPTY_CHART_DATA);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [formValues, setFormValues] = useState({ name: "", group: "friend" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: null, message: "" });
  const [isUsingLocalData, setIsUsingLocalData] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState("");

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadChartFromLocalStorage = useCallback(() => {
    if (!isMountedRef.current) {
      return false;
    }

    const stored = readLocalChartData();
    const hasStoredData = stored.nodes.length > 0 || stored.links.length > 0;

    setChartData(hasStoredData ? stored : EMPTY_CHART_DATA);
    setStatus({
      loading: false,
      error: hasStoredData ? null : "We couldn’t load your chart right now. Please try again.",
    });
    setIsUsingLocalData(hasStoredData);
    setFallbackNotice(
      hasStoredData
        ? "You're viewing your saved offline chart. Changes will sync when we reconnect."
        : ""
    );

    return hasStoredData;
  }, []);

  const loadChartForUser = useCallback(
    async (userId) => {
      if (!userId || !isMountedRef.current) {
        return false;
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
          return true;
        }

        const nextData = buildChartData(nodeRows ?? [], linkRows ?? []);
        setChartData(nextData);
        setStatus({ loading: false, error: null });
        setIsUsingLocalData(false);
        setFallbackNotice("");
        persistChartDataLocally(nextData);
        return true;
      } catch (error) {
        console.error("Unexpected error fetching user chart data from Supabase:", error);
        if (!isMountedRef.current) {
          return false;
        }

        const hasStoredData = loadChartFromLocalStorage();
        if (!hasStoredData) {
          setIsUsingLocalData(false);
          setFallbackNotice("");
        }
        return hasStoredData;
      }
    },
    [loadChartFromLocalStorage]
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
          const hasStoredData = loadChartFromLocalStorage();
          if (!hasStoredData) {
            router.replace("/login");
          }
          return;
        }

        if (isMountedRef.current) {
          setCurrentUserId(user.id);
        }

        await loadChartForUser(user.id);
      } catch (error) {
        console.error("Unexpected error while initializing my chart page:", error);
        if (!loadChartFromLocalStorage() && isMountedRef.current) {
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
        const hasStoredData = loadChartFromLocalStorage();
        if (!hasStoredData) {
          setChartData(EMPTY_CHART_DATA);
          setStatus({ loading: true, error: null });
          router.replace("/login");
        }
        return;
      }

      setCurrentUserId(authUser.id);
      await loadChartForUser(authUser.id);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [loadChartForUser, loadChartFromLocalStorage, router]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPerson = async (event) => {
    event.preventDefault();

    const trimmedName = formValues.name.trim();
    const normalizedName = trimmedName.toLowerCase();
    if (!trimmedName) {
      setFormFeedback({
        type: "error",
        message: "Please enter a name before adding a person.",
      });
      return;
    }

    if (!isUsingLocalData && !currentUserId) {
      setFormFeedback({
        type: "error",
        message: "We couldn’t verify your account. Please reload and try again.",
      });
      return;
    }

    if (chartData.nodes.some((node) => node.name?.toLowerCase() === normalizedName)) {
      setFormFeedback({
        type: "error",
        message: `${trimmedName} is already on your chart.`,
      });
      return;
    }

    setIsSubmitting(true);
    setFormFeedback({ type: null, message: "" });

    const addLocally = (messageSuffix = "") => {
      if (!isMountedRef.current) {
        return;
      }

      setChartData((prev) => {
        const newNode = {
          id: generateLocalNodeId(),
          name: trimmedName,
          group: formValues.group,
        };
        const updated = {
          nodes: [...prev.nodes, newNode],
          links: prev.links,
        };

        persistChartDataLocally(updated);
        return updated;
      });

      setIsUsingLocalData(true);
      setFallbackNotice(
        "You're working offline. We'll sync your changes once we're back online."
      );
      setFormValues({ name: "", group: "friend" });
      setFormFeedback({
        type: "success",
        message: `${trimmedName} has been added to your chart.${messageSuffix}`,
      });
    };

    try {
      if (isUsingLocalData) {
        addLocally();
        return;
      }

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

      const loadedFromSupabase = await loadChartForUser(currentUserId);

      if (isMountedRef.current && loadedFromSupabase) {
        setFormValues({ name: "", group: "friend" });
        setFormFeedback({
          type: "success",
          message: `${trimmedName} has been added to your chart.`,
        });
      }

      if (isMountedRef.current && !loadedFromSupabase) {
        addLocally(" We'll show it here until the live data is available.");
      }
    } catch (error) {
      console.error("Error adding person to chart:", error);
      if (isMountedRef.current) {
        addLocally(" We'll sync this once we reconnect.");
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

      {fallbackNotice ? (
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
          {fallbackNotice}
        </div>
      ) : null}

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
