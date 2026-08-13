// Mirrors go-renovate-server/server/src/models/orderModel.ts. The two repos
// don't share a package, so this enum/labels list is kept in sync by hand.
export type OrderStatus =
  | "PLACED"
  | "APPROVED"
  | "REJECTED"
  | "SHIPMENT_CREATED"
  | "PICKUP_SCHEDULED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  "PLACED",
  "APPROVED",
  "SHIPMENT_CREATED",
  "PICKUP_SCHEDULED",
  "IN_TRANSIT",
  "DELIVERED",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: "Order placed",
  APPROVED: "Approved by vendor",
  SHIPMENT_CREATED: "Shipment created",
  PICKUP_SCHEDULED: "Pickup scheduled",
  IN_TRANSIT: "In transit",
  DELIVERED: "Delivered",
  REJECTED: "Rejected by vendor",
  CANCELLED: "Cancelled",
};

export interface OrderItem {
  serviceId: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  quantity: number;
  categoryLabel: string;
  imageUrl?: string;
}

export interface OrderAddress {
  contactName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderStatusHistoryEntry {
  status: OrderStatus;
  note?: string;
  changedAt: string;
}

export interface ShiprocketInfo {
  orderId?: string;
  shipmentId?: string;
  awbCode?: string;
  courierName?: string;
  trackingUrl?: string;
  status?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId?: number;
  userEmail: string;
  userName?: string;
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  address: OrderAddress;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryEntry[];
  shiprocket: ShiprocketInfo | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  vendorName: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface CreateOrderPayload {
  vendorId: string;
  vendorName: string;
  items: OrderItem[];
  address: OrderAddress;
}
