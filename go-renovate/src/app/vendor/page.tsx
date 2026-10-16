import { Metadata } from "next";
import VendorHome from "@/app/component/Features/VendorAccount/VendorHome";

// A signed-in area, not for search engines.
export const metadata: Metadata = {
  title: "Vendor area | Go Renovate",
  robots: { index: false, follow: false },
};

export default function VendorRoute() {
  return <VendorHome />;
}
