import { Order, Aircraft, Material, ImportStats } from "../types";

const API_BASE = "http://localhost:8000/api";

export const api = {
  async getOrders(): Promise<Order[]> {
    const res = await fetch(`${API_BASE}/orders/`);
    if (!res.ok) throw new Error(`Failed to fetch orders: ${res.statusText}`);
    return res.json();
  },

  async getAircraft(serialNumber: string): Promise<Aircraft> {
    const res = await fetch(`${API_BASE}/aircraft/${encodeURIComponent(serialNumber)}/`);
    if (!res.ok) throw new Error(`Failed to fetch aircraft: ${res.statusText}`);
    return res.json();
  },

  async getMaterial(partNumber: string): Promise<Material> {
    const res = await fetch(`${API_BASE}/materials/${encodeURIComponent(partNumber)}/`);
    if (!res.ok) throw new Error(`Failed to fetch material: ${res.statusText}`);
    return res.json();
  },

  async importExcel(file: File): Promise<ImportStats> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/etl/import/`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to import Excel file");
    }
    return data.stats;
  },

  getExportUrl(): string {
    return `${API_BASE}/etl/export/`;
  },
};
