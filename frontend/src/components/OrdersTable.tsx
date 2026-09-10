import React, { useState } from "react";
import { Search, RotateCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import { Order, OrderStatus } from "../types";

interface OrdersTableProps {
  orders: Order[];
  loading: boolean;
  onRefresh: () => void;
  onSelectAircraft: (serialNumber: string) => void;
  onSelectMaterial: (partNumber: string) => void;
}

type SortField = "aircraft" | "material" | "type" | "weight" | "arrival_date" | "status";
type SortDirection = "asc" | "desc";

const renderStatus = (status: OrderStatus) => {
  switch (status) {
    case "Arrived":
      return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>Arrived</span>
        </div>
      );
    case "Pending":
      return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span>Pending</span>
        </div>
      );
    case "Requested":
      return (
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          <span>Requested</span>
        </div>
      );
  }
};

export const OrdersTable: React.FC<OrdersTableProps> = ({
  orders,
  loading,
  onRefresh,
  onSelectAircraft,
  onSelectMaterial,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>("arrival_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesStatus;

    return (
      matchesStatus &&
      (order.aircraft.model.toLowerCase().includes(query) ||
        order.aircraft.serial_number.toLowerCase().includes(query) ||
        order.material.name.toLowerCase().includes(query) ||
        order.material.part_number.toLowerCase().includes(query) ||
        order.material.type.toLowerCase().includes(query))
    );
  });

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;
    switch (sortField) {
      case "aircraft": {
        const modelA = a.aircraft.model.toLowerCase();
        const modelB = b.aircraft.model.toLowerCase();
        comparison = modelA.localeCompare(modelB);
        if (comparison === 0) {
          comparison = a.aircraft.serial_number.toLowerCase().localeCompare(b.aircraft.serial_number.toLowerCase());
        }
        break;
      }
      case "material": {
        const nameA = a.material.name.toLowerCase();
        const nameB = b.material.name.toLowerCase();
        comparison = nameA.localeCompare(nameB);
        if (comparison === 0) {
          comparison = a.material.part_number.toLowerCase().localeCompare(b.material.part_number.toLowerCase());
        }
        break;
      }
      case "type": {
        comparison = a.material.type.toLowerCase().localeCompare(b.material.type.toLowerCase());
        break;
      }
      case "weight": {
        const weightA = parseFloat(String(a.material.weight)) || 0;
        const weightB = parseFloat(String(b.material.weight)) || 0;
        comparison = weightA - weightB;
        break;
      }
      case "arrival_date": {
        const timeA = new Date(a.arrival_date).getTime() || 0;
        const timeB = new Date(b.arrival_date).getTime() || 0;
        comparison = timeA - timeB;
        break;
      }
      case "status": {
        comparison = a.status.toLowerCase().localeCompare(b.status.toLowerCase());
        break;
      }
    }
    return sortDirection === "asc" ? comparison : -comparison;
  });

  const counts = {
    all: orders.length,
    arrived: orders.filter((o) => o.status === "Arrived").length,
    pending: orders.filter((o) => o.status === "Pending").length,
    requested: orders.filter((o) => o.status === "Requested").length,
  };

  const renderSortHeader = (field: SortField, label: string) => {
    const isActive = sortField === field;
    return (
      <TableHead
        className="text-xs font-semibold text-zinc-600 select-none cursor-pointer hover:text-zinc-900"
        onClick={() => handleSort(field)}
      >
        <div className="inline-flex items-center gap-1 group">
          <span className={isActive ? "text-zinc-900 font-semibold" : ""}>{label}</span>
          <span className="shrink-0">
            {isActive ? (
              sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5 text-zinc-900" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-zinc-900" />
              )
            ) : (
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </span>
        </div>
      </TableHead>
    );
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white">
      {/* filter & search toolbar */}
      <div className="flex flex-col gap-3 border-b border-zinc-200 p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* filter tabs */}
        <div className="flex items-center gap-1">
          {(
            [
              { key: "all", label: "All", count: counts.all },
              { key: "arrived", label: "Arrived", count: counts.arrived },
              { key: "pending", label: "Pending", count: counts.pending },
              { key: "requested", label: "Requested", count: counts.requested },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === tab.key
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <span>{tab.label}</span>
              <span className="ml-1.5 opacity-60 text-[11px] tabular-nums">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* search and reload */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-60">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <Input
              type="text"
              placeholder="Search aircraft or part..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs border-zinc-200 focus-visible:ring-zinc-900"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0 text-zinc-600 hover:bg-zinc-100"
            title="Refresh"
          >
            <RotateCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-50/70">
            <TableRow className="border-b border-zinc-200">
              {renderSortHeader("aircraft", "Aircraft")}
              {renderSortHeader("material", "Material & Part")}
              {renderSortHeader("type", "Type")}
              {renderSortHeader("weight", "Weight")}
              {renderSortHeader("arrival_date", "Arrival Date")}
              {renderSortHeader("status", "Status")}
              <TableHead className="text-right text-xs font-semibold text-zinc-600">Specs</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-b border-zinc-100">
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="ml-auto h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : sortedOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-xs text-zinc-500">
                  No orders match your search criteria.
                </TableCell>
              </TableRow>
            ) : (
              sortedOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/60"
                >
                  <TableCell className="py-3">
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

                  <TableCell className="py-3">
                    <button
                      onClick={() => onSelectMaterial(order.material.part_number)}
                      className="text-left group"
                    >
                      <div className="text-xs font-medium text-zinc-900 group-hover:text-blue-600">
                        {order.material.name}
                      </div>
                      <div className="text-[11px] text-zinc-500">PN: {order.material.part_number}</div>
                    </button>
                  </TableCell>

                  <TableCell className="py-3 text-xs text-zinc-600">
                    {order.material.type}
                  </TableCell>

                  <TableCell className="py-3 text-xs text-zinc-600 tabular-nums">
                    {order.material.weight} kg
                  </TableCell>

                  <TableCell className="py-3 text-xs text-zinc-600 tabular-nums">
                    {order.arrival_date}
                  </TableCell>

                  <TableCell className="py-3">
                    {renderStatus(order.status)}
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => onSelectAircraft(order.aircraft.serial_number)}
                        className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        Plane
                      </button>
                      <button
                        onClick={() => onSelectMaterial(order.material.part_number)}
                        className="rounded px-1.5 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      >
                        Part
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="border-t border-zinc-200 px-4 py-2.5 text-xs text-zinc-500">
        Showing <span className="font-medium text-zinc-900">{sortedOrders.length}</span> of{" "}
        <span className="font-medium text-zinc-900">{orders.length}</span> orders
      </div>
    </div>
  );
};
