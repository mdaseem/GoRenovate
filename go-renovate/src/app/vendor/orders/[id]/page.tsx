import { Metadata } from "next";
import VendorOrderDetailPage from "@/app/component/Features/VendorOrders/VendorOrderDetailPage";

// A signed-in area, not for search engines.
export const metadata: Metadata = {
  title: "Order details | Go Renovate",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorOrderRoute({ params }: PageProps) {
  const { id } = await params;
  return <VendorOrderDetailPage orderId={id} />;
}
