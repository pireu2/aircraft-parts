export type OrderStatus = "Arrived" | "Pending" | "Requested";

export interface Aircraft {
  serial_number: string;
  name: string;
  model: string;
  manufacturer: string;
  capacity: number;
  configuration: string;
}

export interface Material {
  part_number: string;
  name: string;
  type: string;
  weight: string;
}

export interface Order {
  id: string;
  aircraft: Aircraft;
  material: Material;
  arrival_date: string;
  status: OrderStatus;
}

export interface OrdersSummary {
  total_orders: number;
  status_counts: {
    Arrived: number;
    Pending: number;
    Requested: number;
  };
  total_weight: number;
  total_aircraft: number;
  total_materials: number;
}

export interface EntityStats {
  created: number;
  updated: number;
  deleted: number;
  total: number;
}

export interface ImportStats {
  aircraft: EntityStats;
  materials: EntityStats;
  orders: EntityStats;
}
