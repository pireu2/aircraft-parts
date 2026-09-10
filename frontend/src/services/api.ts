import { Order, OrdersSummary, AircraftDetail, MaterialDetail, ETLResponse } from "../types";

const API_BASE = "http://localhost:8000/api";

export const api = {
  async getOrders(params?: { status?: string; search?: string; ordering?: string }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== "all") query.append("status", params.status);
    if (params?.search) query.append("search", params.search);
    if (params?.ordering) query.append("ordering", params.ordering);

    const url = `${API_BASE}/orders/${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`failed to fetch orders: ${res.statusText}`);
    return res.json();
  },

  async getSummary(): Promise<OrdersSummary> {
    const res = await fetch(`${API_BASE}/orders/summary/`);
    if (!res.ok) throw new Error(`failed to fetch summary: ${res.statusText}`);
    return res.json();
  },

  async getAircraftDetail(idOrSerial: string): Promise<AircraftDetail> {
    const res = await fetch(`${API_BASE}/aircraft/${encodeURIComponent(idOrSerial)}/`);
    if (!res.ok) throw new Error(`failed to fetch aircraft: ${res.statusText}`);
    return res.json();
  },

  async getMaterialDetail(idOrPn: string): Promise<MaterialDetail> {
    const res = await fetch(`${API_BASE}/materials/${encodeURIComponent(idOrPn)}/`);
    if (!res.ok) throw new Error(`failed to fetch material: ${res.statusText}`);
    return res.json();
  },

  async importExcel(file: File): Promise<ETLResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/etl/import/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || "failed to import excel data");
    }
    return data;
  },

  async clearData(): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/etl/clear/`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || data.message || "failed to delete data");
    }
    return data;
  },

  getExportUrl(): string {
    return `${API_BASE}/etl/export/`;
  },
};
