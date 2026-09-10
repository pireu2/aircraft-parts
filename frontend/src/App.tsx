import React, { useEffect, useState, useCallback } from "react";
import { Navbar } from "./components/Navbar";
import { SummaryCards } from "./components/SummaryCards";
import { OrdersTable } from "./components/OrdersTable";
import { AircraftModal } from "./components/AircraftModal";
import { MaterialModal } from "./components/MaterialModal";
import { ImportModal } from "./components/ImportModal";
import { Order, OrdersSummary } from "./types";
import { api } from "./services/api";

export const App: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // modal states
  const [selectedAircraft, setSelectedAircraft] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersData, summaryData] = await Promise.all([
        api.getOrders(),
        api.getSummary(),
      ]);
      setOrders(ordersData);
      setSummary(summaryData);
    } catch (err: any) {
      setError(err.message || "Failed to connect to API backend");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportUrl = api.getExportUrl();
      const link = document.createElement("a");
      link.href = exportUrl;
      link.setAttribute("download", "aircraft_materials_export.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("Failed to export Excel workbook");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/60 text-zinc-900">
      <Navbar
        onOpenImport={() => setIsImportOpen(true)}
        onExport={handleExport}
        isExporting={isExporting}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* error message */}
        {error ? (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            <span className="font-semibold">Backend Connection Issue:</span> {error}
            <button
              onClick={() => loadData()}
              className="ml-2 font-medium underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* metrics summary */}
        <div className="mb-6">
          <SummaryCards summary={summary} loading={loading} />
        </div>

        {/* orders table */}
        <div>
          <OrdersTable
            orders={orders}
            loading={loading}
            onRefresh={loadData}
            onSelectAircraft={(serial) => setSelectedAircraft(serial)}
            onSelectMaterial={(pn) => setSelectedMaterial(pn)}
          />
        </div>
      </main>

      {/* modal detail views */}
      <AircraftModal
        aircraftIdOrSerial={selectedAircraft}
        isOpen={!!selectedAircraft}
        onClose={() => setSelectedAircraft(null)}
        onSelectMaterial={(pn) => {
          setSelectedAircraft(null);
          setSelectedMaterial(pn);
        }}
      />

      <MaterialModal
        materialIdOrPn={selectedMaterial}
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        onSelectAircraft={(serial) => {
          setSelectedMaterial(null);
          setSelectedAircraft(serial);
        }}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={loadData}
      />
    </div>
  );
};

export default App;
