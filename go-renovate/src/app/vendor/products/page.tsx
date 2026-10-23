import { Metadata } from "next";
import VendorProductsPage from "@/app/component/Features/VendorProducts/VendorProductsPage";

// A signed-in area, not for search engines.
export const metadata: Metadata = {
  title: "My products | Go Renovate",
  robots: { index: false, follow: false },
};

export default function VendorProductsRoute() {
  return <VendorProductsPage />;
}
