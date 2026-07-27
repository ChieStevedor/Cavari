import type { CargoType, ServiceType, VehicleType } from "@/types/dispatcher";

export const CARGO_TYPE_LABELS: Record<CargoType, string> = {
  pallets: "Pallets",
  furniture: "Furniture",
  appliances: "Appliances",
  crates: "Crates",
  electronics: "Electronics",
  construction_materials: "Construction Materials",
  machinery: "Machinery",
  other: "Other",
};

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  cargo_van: "Cargo Van",
  sprinter: "Sprinter Van",
  cube_van: "Cube Van",
  five_ton: "5-Ton Truck",
  tractor: "Tractor & Trailer",
};

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  liftgate: "Liftgate",
  white_glove: "White Glove",
  inside_delivery: "Inside Delivery",
  assembly: "Assembly",
  debris_removal: "Debris Removal",
  two_movers: "Two Movers",
  three_movers: "Three Movers",
  blanket_wrap: "Blanket Wrap",
  tailgate: "Tailgate",
};
