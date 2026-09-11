import React, { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { ImportLog } from "../types";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface ImportActivityProps {
  logs: ImportLog[];
  loading: boolean;
}

const formatDate = (isoString: string) => {
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
};

export const ImportActivity: React.FC<ImportActivityProps> = ({ logs, loading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2 font-medium text-zinc-800">
          <Clock className="h-4 w-4 text-zinc-400" />
          <span>No import activity recorded yet</span>
        </div>
        <div className="mt-1 text-zinc-500">
          Upload an Excel workbook via &quot;Import Data&quot; to populate aircraft, materials, and orders.
        </div>
      </div>
    );
  }

  const latest = logs[0];
  const isImport = latest.action === "import";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* primary summary banner */}
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${
                latest.status === "success"
                  ? isImport
                    ? "bg-emerald-500"
                    : "bg-amber-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {isImport ? "Latest Import" : "Database Wipe"}
            </span>
            <span className="text-xs text-zinc-400">&bull;</span>
            <span className="text-xs font-medium text-zinc-900">
              {latest.file_name || (isImport ? "Workbook Upload" : "Database Wipe")}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 tabular-nums">
              {formatDate(latest.created_at)}
            </span>

            {logs.length > 1 ? (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              >
                <span>{isExpanded ? "Hide History" : `History (${logs.length})`}</span>
                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            ) : null}
          </div>
        </div>

        {/* stats strip */}
        <div className="mt-3 grid grid-cols-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-zinc-50/50 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <div className="p-3">
            <div className="text-[11px] font-medium text-zinc-500">Created</div>
            <div className="mt-0.5 text-base font-semibold text-emerald-700 tabular-nums">
              +{latest.total_created}
            </div>
          </div>

          <div className="p-3">
            <div className="text-[11px] font-medium text-zinc-500">Updated</div>
            <div className="mt-0.5 text-base font-semibold text-amber-700 tabular-nums">
              {latest.total_updated}
            </div>
          </div>

          <div className="p-3">
            <div className="text-[11px] font-medium text-zinc-500">Deleted</div>
            <div className="mt-0.5 text-base font-semibold text-rose-700 tabular-nums">
              -{latest.total_deleted}
            </div>
          </div>

          <div className="p-3">
            <div className="text-[11px] font-medium text-zinc-500">Total Records</div>
            <div className="mt-0.5 text-base font-semibold text-zinc-900 tabular-nums">
              {latest.total_records}
            </div>
          </div>
        </div>
      </div>

      {/* expandable previous history table */}
      {isExpanded && logs.length > 1 ? (
        <div className="border-t border-zinc-200">
          <div className="bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
            Previous Operation History
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/50">
                <TableRow className="border-b border-zinc-200">
                  <TableHead className="text-xs font-semibold text-zinc-600">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-600">Operation</TableHead>
                  <TableHead className="text-xs font-semibold text-zinc-600">Source</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-zinc-600">Created</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-zinc-600">Updated</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-zinc-600">Deleted</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-zinc-900">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.slice(1).map((log) => (
                  <TableRow key={log.id} className="border-b border-zinc-100 hover:bg-zinc-50/50">
                    <TableCell className="py-2.5 text-xs text-zinc-600 tabular-nums">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell className="py-2.5 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          log.action === "import" ? "text-emerald-700" : "text-amber-700"
                        }`}
                      >
                        {log.action === "import" ? "Import" : "Clear All"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2.5 text-xs text-zinc-800 font-medium truncate max-w-[180px]">
                      {log.file_name || "—"}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-xs text-emerald-700 tabular-nums">
                      +{log.total_created}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-xs text-amber-700 tabular-nums">
                      {log.total_updated}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-xs text-rose-700 tabular-nums">
                      -{log.total_deleted}
                    </TableCell>
                    <TableCell className="py-2.5 text-right text-xs font-semibold text-zinc-900 tabular-nums">
                      {log.total_records}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
