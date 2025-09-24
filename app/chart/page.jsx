import ChartClient from "./ChartClient";
import { getChartData } from "@/lib/supabase";

export const metadata = {
  title: "Relationship Chart | The Chart 2.0",
};

export const revalidate = 0;

export default async function ChartPage() {
  const chartData = await getChartData();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-slate-100">Relationship Chart</h1>
        <p className="text-sm text-slate-400">
          Hover to highlight, click to inspect, and use the filters to explore the network.
        </p>
      </div>
      <ChartClient data={chartData} />
    </div>
  );
}
