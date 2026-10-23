import { OrderStatus, OrderStatusHistoryEntry } from "@/app/types/order";

// Mirrors go-renovate-server/server/src/services/vendorOrderRules.ts and routes/vendorOrderRoutes.ts.
// The two repos share no package, so keep these in sync by hand.

export type VendorStage = "new" | "accepted" | "shipped" | "delivered" | "closed";

export const VENDOR_STAGES: VendorStage[] = ["new", "accepted", "shipped", "delivered", "closed"];

// Tab names. "Accepted" is called "To ship" because that is what the vendor has left to do.
export const STAGE_TAB_LABELS: Record<VendorStage, string> = {
  new: "New",
  accepted: "To ship",
  shipped: "Shipped",
  delivered: "Delivered",
  closed: "Closed",
};

// What a card's chip says, by the order's exact status.
export const VENDOR_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "New",
  APPROVED: "Accepted",
  SHIPMENT_CREATED: "Shipped",
  PICKUP_SCHEDULED: "Shipped",
  IN_TRANSIT: "Shipped",
  DELIVERED: "Delivered",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
};

export type VendorOrderCounts = Record<VendorStage, number>;

export interface VendorOrderItem {
  essentialId: string | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}

// The list only carries the city; the detail has the full delivery details.
export interface VendorOrderDelivery {
  contactName?: string;
  phone?: string;
  line1?: string;
  line2?: string;
  city: string;
  state: string;
  pincode?: string;
}

export interface VendorOrderShipment {
  courierName: string;
  trackingNumber: string;
  trackingUrl: string;
}

export interface VendorOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: OrderStatus;
  stage: VendorStage;
  subtotal: number;
  itemCount: number;
  items: VendorOrderItem[];
  delivery: VendorOrderDelivery;
  statusHistory: OrderStatusHistoryEntry[];
  shipment: VendorOrderShipment | null;
}

export interface VendorOrdersPage {
  orders: VendorOrder[];
  nextCursor: string | null;
  counts: VendorOrderCounts;
}

export type VendorOrderAction = "accept" | "decline" | "ship" | "deliver" | "cancel";

export type ReasonCode = "OUT_OF_STOCK" | "CANT_DELIVER" | "OTHER";

export const REASON_OPTIONS: { code: ReasonCode; label: string }[] = [
  { code: "OUT_OF_STOCK", label: "Out of stock" },
  { code: "CANT_DELIVER", label: "Can't deliver to this pincode" },
  { code: "OTHER", label: "Something else" },
];

export interface VendorOrderActionPayload {
  action: VendorOrderAction;
  reason?: ReasonCode;
  note?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export type ActionField = "reason" | "note" | "courierName" | "trackingNumber" | "trackingUrl";
export type ActionFieldErrors = Partial<Record<ActionField, string>>;

// The status an order is in decides which single next step the vendor is offered.
export function nextAction(status: OrderStatus): "accept" | "ship" | "deliver" | null {
  if (status === "PLACED") return "accept";
  if (status === "APPROVED") return "ship";
  if (status === "SHIPMENT_CREATED" || status === "PICKUP_SCHEDULED" || status === "IN_TRANSIT") {
    return "deliver";
  }
  return null;
}
