import React from "react";
import { Skeleton } from "./ui/skeleton";
import { OrdersSummary } from "../types";

interface SummaryCardsProps {
  summary: OrdersSummary | null;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ summary, loading }) => {
  if (loading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-5 sm:gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: "Total Orders", value: summary.total_orders },
    {
      label: "Arrived",
      value: summary.status_counts.Arrived || 0,
      dot: "bg-emerald-500",
      valueColor: "text-emerald-700",
    },
    {
      label: "Pending",
      value: summary.status_counts.Pending || 0,
      dot: "bg-amber-500",
      valueColor: "text-amber-700",
    },
    {
      label: "Requested",
      value: summary.status_counts.Requested || 0,
      dot: "bg-zinc-400",
      valueColor: "text-zinc-600",
    },
    { label: "Total Weight", value: `${summary.total_weight.toLocaleString()} kg` },
  ];

  return (
    <div className="grid grid-cols-2 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white sm:grid-cols-5 sm:divide-x sm:divide-y-0">
      {items.map((item) => (
        <div key={item.label} className="p-4 sm:p-5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
            {item.dot ? <span className={`h-2 w-2 rounded-full ${item.dot}`} /> : null}
            <span>{item.label}</span>
          </div>
          <div
            className={`mt-1.5 text-2xl font-semibold tracking-tight tabular-nums ${
              item.valueColor || "text-zinc-900"
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};
