import React from "react";
import { Metadata } from "next";
import OrdersListPage from "@/app/component/Molecules/OrdersListPage/OrdersListPage";
import { SERVICES_ENABLED } from "@/app/utils/features";

export const metadata: Metadata = {
  title: "My Orders | Go Renovate",
  description: SERVICES_ENABLED
    ? "Track the status of every renovation quote you've checked out."
    : "Track the status of every order you've placed.",
};

export default function OrdersPage() {
  return <OrdersListPage />;
}
