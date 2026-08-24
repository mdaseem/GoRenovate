import { Metadata } from "next";
import CategoryListPage from "@/app/component/Molecules/CategoryListPage/CategoryListPage";

export const metadata: Metadata = {
  title: "Shop by Room | Go Renovate",
  description:
    "Browse curated furniture, décor, and essentials by room — mixed and matched from vendors across the city.",
  alternates: {
    canonical: "/roomCategory",
  },
};

export default function RoomCategoryPage() {
  return <CategoryListPage />;
}
