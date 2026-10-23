import { Metadata } from "next";
import VendorProductFormPage from "@/app/component/Features/VendorProducts/VendorProductFormPage";

// A signed-in area, not for search engines.
export const metadata: Metadata = {
  title: "Add a product | Go Renovate",
  robots: { index: false, follow: false },
};

export default function NewVendorProductRoute() {
  return <VendorProductFormPage />;
}
