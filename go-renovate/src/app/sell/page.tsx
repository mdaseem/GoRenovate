import { Metadata } from "next";
import SellPage from "@/app/component/Features/VendorAccount/SellPage";

export const metadata: Metadata = {
  title: "Sell on Go Renovate | Go Renovate",
  description: "Apply to list your renovation business on Go Renovate.",
};

export default function SellRoute() {
  return <SellPage />;
}
