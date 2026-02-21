// Cadbury-only supply chain: types and constants.
// All products are implicitly supplied by Cadbury; no other suppliers exist.

export const CADBURY_SUPPLIER_ID = "cadbury";
export const CADBURY_SUPPLIER_NAME = "Cadbury";

export type CadburyProductType =
  | "Chocolate Bar"
  | "Wafer"
  | "Countline"
  | "Dark Chocolate"
  | "Gems/Confectionery";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock" | "reserved";

export interface CadburyProduct {
  id: string;
  productName: string;
  type: CadburyProductType;
  quantity: number;
  distributionLocation: string;
  price: number;
  expiryDate: string; // ISO date
  stockStatus: StockStatus;
  /** Always Cadbury — all products belong to this supplier */
  supplierId: string;
  supplierName: string;
  updatedAt: string; // ISO datetime
}

export interface DistributionPerformanceByLocation {
  location: string;
  totalQuantity: number;
  productCount: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export interface DistributionPerformanceByType {
  productType: CadburyProductType;
  totalQuantity: number;
  productCount: number;
  totalValue: number;
  locations: string[];
}
