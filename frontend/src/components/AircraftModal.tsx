import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Skeleton } from "./ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AircraftDetail, OrderStatus } from "../types";
import { api } from "../services/api";

interface AircraftModalProps {
  aircraftIdOrSerial: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectMaterial: (partNumber: string) => void;
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

export const AircraftModal: React.FC<AircraftModalProps> = ({
  aircraftIdOrSerial,
  isOpen,
  onClose,
  onSelectMaterial,
}) => {
  const [data, setData] = useState<AircraftDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !aircraftIdOrSerial) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getAircraftDetail(aircraftIdOrSerial)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        if (isMounted) setError(err.message || "Failed to load aircraft data");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [aircraftIdOrSerial, isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-xl border-zinc-200 text-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900">
            {loading ? "Loading Aircraft..." : data ? data.model : "Aircraft Details"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            {data ? `Serial: ${data.serial_number}` : ""}
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
                <div className="text-[11px] text-zinc-500">Manufacturer</div>
                <div className="text-xs font-semibold text-zinc-900">{data.manufacturer}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Capacity</div>
                <div className="text-xs font-semibold text-zinc-900">{data.capacity} seats</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Layout</div>
                <div className="text-xs font-semibold text-zinc-900">{data.configuration}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Total Orders</div>
                <div className="text-xs font-semibold text-zinc-900">{data.total_orders} items</div>
              </div>
            </div>

            {/* parts table */}
            <div>
              <div className="mb-1.5 text-xs font-semibold text-zinc-900">
                Associated Orders ({data.orders.length})
              </div>
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="border-b border-zinc-200">
                      <TableHead className="text-xs text-zinc-600">Part</TableHead>
                      <TableHead className="text-xs text-zinc-600">Material</TableHead>
                      <TableHead className="text-xs text-zinc-600">Weight</TableHead>
                      <TableHead className="text-xs text-zinc-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.orders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-xs text-zinc-500">
                          No orders associated with this aircraft.
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.orders.map((order) => (
                        <TableRow key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <TableCell className="py-2.5">
                            <button
                              onClick={() => onSelectMaterial(order.part_number)}
                              className="text-left group"
                            >
                              <div className="text-xs font-medium text-zinc-900 group-hover:text-blue-600">
                                {order.material_name}
                              </div>
                              <div className="text-[11px] text-zinc-500">{order.part_number}</div>
                            </button>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-zinc-600">{order.material_type}</TableCell>
                          <TableCell className="py-2.5 text-xs text-zinc-600 tabular-nums">{order.weight} kg</TableCell>
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
