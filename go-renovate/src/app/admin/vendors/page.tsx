import { Metadata } from "next";
import AdminApplications from "@/app/component/Features/VendorAccount/AdminApplications";

// An internal admin page, not for search engines.
export const metadata: Metadata = {
  title: "Vendor applications | Go Renovate",
  robots: { index: false, follow: false },
};

export default function AdminVendorsRoute() {
  return <AdminApplications />;
}
