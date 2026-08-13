import React from "react";
import { Metadata } from "next";
import OrdersListPage from "@/app/component/Molecules/OrdersListPage/OrdersListPage";

export const metadata: Metadata = {
  title: "My Orders | Go Renovate",
  description: "Track the status of every renovation quote you've checked out.",
};

export default function OrdersPage() {
  return <OrdersListPage />;
}
