import { Metadata } from "next";
import VendorOrdersPage from "@/app/component/Features/VendorOrders/VendorOrdersPage";

// A signed-in area, not for search engines.
export const metadata: Metadata = {
  title: "Orders | Go Renovate",
  robots: { index: false, follow: false },
};

export default function VendorOrdersRoute() {
  return <VendorOrdersPage />;
}
