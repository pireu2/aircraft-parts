import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Order, OrderStatus } from "../types";

interface MaterialModalProps {
  partNumber: string | null;
  orders: Order[];
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
  partNumber,
  orders,
  isOpen,
  onClose,
  onSelectAircraft,
}) => {
  const associatedOrders = useMemo(() => {
    if (!partNumber) return [];
    return orders.filter((o) => o.material.part_number === partNumber);
  }, [partNumber, orders]);

  const material = useMemo(() => {
    if (associatedOrders.length > 0) {
      return associatedOrders[0].material;
    }
    return null;
  }, [associatedOrders]);

  const totalWeight = useMemo(() => {
    if (!material) return 0;
    return parseFloat(material.weight || "0") * associatedOrders.length;
  }, [material, associatedOrders]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-xl border-zinc-200 text-zinc-900">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-zinc-900">
            {material ? material.name : "Material Details"}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-500">
            Part Number: {partNumber}
          </DialogDescription>
        </DialogHeader>

        {material ? (
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 sm:grid-cols-4">
              <div>
                <div className="text-[11px] text-zinc-500">Type</div>
                <div className="text-xs font-semibold text-zinc-900">{material.type}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Unit Weight</div>
                <div className="text-xs font-semibold text-zinc-900 tabular-nums">{material.weight} kg</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Active Orders</div>
                <div className="text-xs font-semibold text-zinc-900 tabular-nums">{associatedOrders.length}</div>
              </div>
              <div>
                <div className="text-[11px] text-zinc-500">Total Weight</div>
                <div className="text-xs font-semibold text-zinc-900 tabular-nums">
                  {totalWeight.toFixed(1)} kg
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-xs font-semibold text-zinc-900">
                Aircraft Requesting This Part ({associatedOrders.length})
              </div>
              <div className="rounded-lg border border-zinc-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-zinc-50">
                    <TableRow className="border-b border-zinc-200">
                      <TableHead className="text-xs text-zinc-600">Aircraft</TableHead>
                      <TableHead className="text-xs text-zinc-600">Manufacturer</TableHead>
                      <TableHead className="text-xs text-zinc-600">Arrival Date</TableHead>
                      <TableHead className="text-xs text-zinc-600">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {associatedOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-6 text-center text-xs text-zinc-500">
                          No aircraft currently requesting this part.
                        </TableCell>
                      </TableRow>
                    ) : (
                      associatedOrders.map((order) => (
                        <TableRow key={order.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                          <TableCell className="py-2.5">
                            <button
                              onClick={() => onSelectAircraft(order.aircraft.serial_number)}
                              className="text-left group"
                            >
                              <div className="text-xs font-medium text-zinc-900 group-hover:text-blue-600">
                                {order.aircraft.model}
                              </div>
                              <div className="text-[11px] text-zinc-500">{order.aircraft.serial_number}</div>
                            </button>
                          </TableCell>
                          <TableCell className="py-2.5 text-xs text-zinc-600">
                            {order.aircraft.manufacturer}
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
