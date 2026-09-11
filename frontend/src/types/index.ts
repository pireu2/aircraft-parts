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

export interface ImportLog {
  id: string;
  action: "import" | "clear";
  status: "success" | "failed";
  file_name?: string | null;
  error_message?: string | null;
  diff?: ETLDiff | Record<string, any>;
  total_created: number;
  total_updated: number;
  total_deleted: number;
  total_records: number;
  created_at: string;
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
