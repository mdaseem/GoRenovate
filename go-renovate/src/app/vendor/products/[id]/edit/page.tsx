import { Metadata } from "next";
import VendorProductFormPage from "@/app/component/Features/VendorProducts/VendorProductFormPage";

// A signed-in area, not for search engines.
export const metadata: Metadata = {
  title: "Edit product | Go Renovate",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditVendorProductRoute({ params }: PageProps) {
  const { id } = await params;
  return <VendorProductFormPage productId={id} />;
}
