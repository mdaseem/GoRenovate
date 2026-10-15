import { Metadata } from "next";
import ViewerLab from "@/app/component/Molecules/ViewerLab/ViewerLab";

// An internal test bench, not a page for shoppers or search engines.
export const metadata: Metadata = {
  title: "3D viewer lab | Go Renovate",
  robots: { index: false, follow: false },
};

export default function ViewerLabPage() {
  return <ViewerLab />;
}
