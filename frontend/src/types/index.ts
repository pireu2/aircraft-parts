export type OrderStatus = "Arrived" | "Pending" | "Requested";

export interface Aircraft {
  id: string;
  serial_number: string;
  model: string;
  manufacturer: string;
  capacity: number;
  configuration: string;
  orders_count?: number;
}

export interface OrderInAircraft {
  id: string;
  material_id: string;
  part_number: string;
  material_name: string;
  material_type: string;
  weight: string;
  arrival_date: string;
  status: OrderStatus;
}

export interface AircraftDetail extends Aircraft {
  total_orders: number;
  orders: OrderInAircraft[];
}

export interface Material {
  id: string;
  part_number: string;
  name: string;
  type: string;
  weight: string;
  orders_count?: number;
}

export interface OrderInMaterial {
  id: string;
  aircraft_id: string;
  aircraft_serial: string;
  aircraft_model: string;
  aircraft_manufacturer: string;
  arrival_date: string;
  status: OrderStatus;
}

export interface MaterialDetail extends Material {
  total_orders: number;
  orders: OrderInMaterial[];
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

export interface ETLDiffEntity {
  created: number;
  updated: number;
  deleted: number;
  total: number;
}

export interface ETLDiff {
  aircraft: ETLDiffEntity;
  materials: ETLDiffEntity;
  orders: ETLDiffEntity;
}

export interface ETLResponse {
  status: "success" | "error";
  message: string;
  source?: string;
  diff?: ETLDiff;
}
