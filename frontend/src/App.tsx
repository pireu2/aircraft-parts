import React, { useEffect, useState, useCallback, useMemo } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";
import { Navbar } from "./components/Navbar";
import { SummaryCards } from "./components/SummaryCards";
import { OrdersTable } from "./components/OrdersTable";
import { AircraftModal } from "./components/AircraftModal";
import { MaterialModal } from "./components/MaterialModal";
import { Order, OrdersSummary, ImportStats } from "./types";
import { api } from "./services/api";

export const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const refreshOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    api.getOrders()
      .then((data) => {
        if (!ignore) {
          setOrders(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load orders");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    try {
      const exportUrl = api.getExportUrl();
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", "aircraft_materials_export.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      setError("Failed to export Excel file");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    setImportError(null);
    setImportStats(null);
    try {
      const stats = await api.importExcel(file);
      setImportStats(stats);
      const updatedOrders = await api.getOrders();
      setOrders(updatedOrders);
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Failed to import Excel file");
    } finally {
      setIsImporting(false);
    }
  };

  const summary: OrdersSummary = useMemo(() => {
    const counts = { Arrived: 0, Pending: 0, Requested: 0 };
    let totalWeight = 0;

    for (const order of orders) {
      if (order.status in counts) {
        counts[order.status]++;
      }
      totalWeight += parseFloat(order.material?.weight || "0");
    }

    const aircraftSerials = new Set(orders.map((o) => o.aircraft?.serial_number).filter(Boolean));
    const materialPns = new Set(orders.map((o) => o.material?.part_number).filter(Boolean));

    return {
      total_orders: orders.length,
      status_counts: counts,
      total_weight: Math.round(totalWeight * 100) / 100,
      total_aircraft: aircraftSerials.size,
      total_materials: materialPns.size,
    };
  }, [orders]);

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900">
      <Navbar
        onExport={handleExport}
        isExporting={isExporting}
        onImportFile={handleImportFile}
        isImporting={isImporting}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* Backend Connection Error */}
        {error ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>
                <strong className="font-semibold">Backend Connection Issue:</strong> {error}
              </span>
            </div>
            <button
              onClick={refreshOrders}
              className="font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* Import Error Banner */}
        {importError ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>
                <strong className="font-semibold">Import Failed:</strong> {importError}
              </span>
            </div>
            <button
              onClick={() => setImportError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        {/* Import Success & Stats Card */}
        {importStats ? (
          <div className="mb-6 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <CheckCircle2 className="h-3 w-3" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900">
                    Import Completed Successfully
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Database synchronized with uploaded Excel file
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportStats(null)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3">
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Aircraft
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-semibold tabular-nums text-zinc-900">
                    {importStats.aircraft.total}
                  </span>
                  <span className="text-xs text-zinc-500">total in DB</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] tabular-nums text-zinc-600">
                  <span className="font-medium text-zinc-900">+{importStats.aircraft.created}</span> added
                  <span className="text-zinc-300">·</span>
                  <span>{importStats.aircraft.updated} modified</span>
                  {importStats.aircraft.deleted > 0 && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <span className="text-red-600 font-medium">-{importStats.aircraft.deleted} removed</span>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3">
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Materials & Parts
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-semibold tabular-nums text-zinc-900">
                    {importStats.materials.total}
                  </span>
                  <span className="text-xs text-zinc-500">total in DB</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] tabular-nums text-zinc-600">
                  <span className="font-medium text-zinc-900">+{importStats.materials.created}</span> added
                  <span className="text-zinc-300">·</span>
                  <span>{importStats.materials.updated} modified</span>
                  {importStats.materials.deleted > 0 && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <span className="text-red-600 font-medium">-{importStats.materials.deleted} removed</span>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-zinc-200 bg-zinc-50/50 p-3">
                <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  Orders
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-lg font-semibold tabular-nums text-zinc-900">
                    {importStats.orders.total}
                  </span>
                  <span className="text-xs text-zinc-500">total in DB</span>
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] tabular-nums text-zinc-600">
                  <span className="font-medium text-zinc-900">+{importStats.orders.created}</span> added
                  <span className="text-zinc-300">·</span>
                  <span>{importStats.orders.updated} modified</span>
                  {importStats.orders.deleted > 0 && (
                    <>
                      <span className="text-zinc-300">·</span>
                      <span className="text-red-600 font-medium">-{importStats.orders.deleted} removed</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mb-6">
          <SummaryCards summary={summary} loading={loading} />
        </div>

        <div>
          <OrdersTable
            orders={orders}
            loading={loading}
            onRefresh={refreshOrders}
            onSelectAircraft={(serial) => setSelectedAircraft(serial)}
            onSelectMaterial={(pn) => setSelectedMaterial(pn)}
          />
        </div>
      </main>

      <AircraftModal
        serialNumber={selectedAircraft}
        orders={orders}
        isOpen={!!selectedAircraft}
        onClose={() => setSelectedAircraft(null)}
        onSelectMaterial={(pn) => {
          setSelectedAircraft(null);
          setSelectedMaterial(pn);
        }}
      />

      <MaterialModal
        partNumber={selectedMaterial}
        orders={orders}
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onSelectAircraft={(serial) => {
          setSelectedMaterial(null);
          setSelectedAircraft(serial);
        }}
      />
    </div>
  );
};

export default App;
