// Mirrors go-renovate-server/server/src/models/essentialOrderModel.ts. The
// two repos don't share a package, so this is kept in sync by hand.
//
// vendorOrders[].status reuses the exact same OrderStatus state machine as
// the single-vendor Orders model (backend: orderModel.ts, deliberately
// imported there rather than duplicated) — so it's imported here too,
// rather than re-declared, which is what lets OrderStatusBadge/
// OrderStatusTimeline be reused as-is for a Room order's per-vendor
// sub-orders instead of needing parallel components.
import { OrderStatus, OrderStatusHistoryEntry } from "./order";

export type EssentialOrderStatus = OrderStatus;
export type EssentialOrderStatusHistoryEntry = OrderStatusHistoryEntry;

export interface EssentialOrderItem {
  essentialId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface EssentialOrderAddress {
  contactName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface EssentialShiprocketInfo {
  orderId?: string;
  shipmentId?: string;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  status?: string;
}

export interface VendorOrder {
  _id: string;
  vendorId: string;
  vendorName: string;
  items: EssentialOrderItem[];
  subtotal: number;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  shiprocket: EssentialShiprocketInfo | null;
}

export interface EssentialOrder {
  _id: string;
  orderNumber: string;
  userId?: number;
  userEmail: string;
  userName?: string;
  address: EssentialOrderAddress;
  total: number;
  vendorOrders: VendorOrder[];
  createdAt: string;
  updatedAt: string;
}

// The `GET /essentials/orders` list endpoint computes a single aggregate
// status server-side (the earliest active status among vendorOrders[]) so
// the list card can still show one OrderStatusBadge, the same way a
// single-vendor order's card does — see essentialOrderRoutes.ts's
// computeAggregateStatus.
export interface EssentialOrderSummary {
  id: string;
  orderNumber: string;
  vendorCount: number;
  itemCount: number;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

export interface CreateEssentialOrderPayload {
  items: { essentialId: string; quantity: number }[];
  address: EssentialOrderAddress;
}
