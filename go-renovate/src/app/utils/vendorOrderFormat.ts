import { VendorOrder } from "@/app/types/vendorOrders";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatRupees = (value: number): string => currencyFormatter.format(value);

// "Just now", "12 min ago", "3 h ago", "2 days ago", then a plain date. `now` is passed in so a list
// can re-render every minute without each card keeping its own timer.
export function timeAgo(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const minutes = Math.floor((now - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function fullDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// "Queen Platform Bed ×1, Oak Coffee Table ×2 +1 more" for a card.
export function summariseItems(order: VendorOrder, maxNames = 2): string {
  const shown = order.items.slice(0, maxNames).map((item) => `${item.name} ×${item.quantity}`);
  const hidden = order.items.length - shown.length;
  return hidden > 0 ? `${shown.join(", ")} +${hidden} more` : shown.join(", ");
}

// The address as the vendor would write it on a parcel, for the "Copy address" button.
export function addressAsText(order: VendorOrder): string {
  const { contactName, phone, line1, line2, city, state, pincode } = order.delivery;
  return [
    contactName,
    phone,
    [line1, line2].filter(Boolean).join(", "),
    [city, state].filter(Boolean).join(", ") + (pincode ? ` - ${pincode}` : ""),
  ]
    .filter((line) => line && line.trim())
    .join("\n");
}
