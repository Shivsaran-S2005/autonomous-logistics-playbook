// Cadbury-only supply chain: public API.
// All products and queries are scoped to supplier Cadbury.

export {
  addCadburyProduct,
  getCadburyProducts,
  getCadburyProductById,
  getCadburyStockAndDistributionStatus,
  updateCadburyInventory,
  getCadburyDistributionReportByLocation,
  getCadburyDistributionReportByProductType,
} from "./database";

export {
  CADBURY_SUPPLIER_ID,
  CADBURY_SUPPLIER_NAME,
  type CadburyProduct,
  type CadburyProductType,
  type StockStatus,
  type DistributionPerformanceByLocation,
  type DistributionPerformanceByType,
} from "./types";
