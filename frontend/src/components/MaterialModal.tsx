import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { MaterialDetail, OrderStatus } from "../types";
import { api } from "../services/api";

interface MaterialModalProps {
  materialIdOrPn: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAircraft: (serialNumber: string) => void;
}

const renderStatus = (status: OrderStatus) => {
  switch (status) {
    case "Arrived":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Arrived
        </span>
      );
    case "Pending":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Pending
        </span>
      );
    case "Requested":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          Requested
        </span>
      );
  }
};

export const MaterialModal: React.FC<MaterialModalProps> = ({
  materialIdOrPn,
  isOpen,
  onClose,
  onSelectAircraft,
}) => {
  const [data, setData] = useState<MaterialDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !materialIdOrPn) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getMaterialDetail(materialIdOrPn)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load material data");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [materialIdOrPn, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-xl border-zinc-200 text-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900">
            {loading ? "Loading Material..." : data ? data.name : "Material Details"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {data ? `Part Number: ${data.part_number}` : ""}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="py-4 text-xs text-red-600">{error}</div>
        ) : data ? (
          <div className="space-y-4 pt-1">
            {/* specs strip */}
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-4">
              <div>
                <div className="text-[11px] text-zinc-500">Type</div>
                <div className="text-xs font-semibold text-zinc-900">{data.type}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Unit Weight</div>
                <div className="text-xs font-semibold text-zinc-900 tabular-nums">{data.weight} kg</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Active Orders</div>
                <div className="text-xs font-semibold text-zinc-900 tabular-nums">{data.total_orders}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Total Weight</div>
                <div className="text-xs font-semibold text-zinc-900 tabular-nums">
                  {(parseFloat(data.weight) * data.total_orders).toFixed(1)} kg
                </div>
              </div>
            </div>

            {/* aircraft table */}
            <div>
              <div className="mb-1.5 text-xs font-semibold text-zinc-900">
                Aircraft Requesting This Part ({data.orders.length})
              </div>
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="border-b border-zinc-200">
                      <TableHead className="text-xs text-zinc-600">Aircraft</TableHead>
                      <TableHead className="text-xs text-zinc-600">Manufacturer</TableHead>
                      <TableHead className="text-xs text-zinc-600">Date</TableHead>
                      <TableHead className="text-xs text-zinc-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-xs text-zinc-500">
                          No aircraft currently requesting this part.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.orders.map((order) => (
                        <TableRow key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <TableCell className="py-2.5">
                            <button
                              onClick={() => onSelectAircraft(order.aircraft_serial)}
                              className="text-left group"
                            >
                              <div className="text-xs font-medium text-zinc-900 group-hover:text-blue-600">
                                {order.aircraft_model}
                              </div>
                              <div className="text-[11px] text-zinc-500">{order.aircraft_serial}</div>
                            </button>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-zinc-600">
                            {order.aircraft_manufacturer}
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-zinc-600 tabular-nums">{order.arrival_date}</TableCell>
                          <TableCell className="py-2.5">{renderStatus(order.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
