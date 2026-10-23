import { Metadata } from "next";
import AdminProductReview from "@/app/component/Features/VendorProducts/AdminProductReview";

// The owner's area, not for search engines.
export const metadata: Metadata = {
  title: "Product review | Go Renovate",
  robots: { index: false, follow: false },
};

export default function AdminProductsRoute() {
  return <AdminProductReview />;
}
