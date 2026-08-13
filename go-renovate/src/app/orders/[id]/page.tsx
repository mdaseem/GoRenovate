import React from "react";
import { Metadata } from "next";
import OrderDetailPage from "@/app/component/Molecules/OrderDetailPage/OrderDetailPage";

export const metadata: Metadata = {
  title: "Order Details | Go Renovate",
  description: "See the full status timeline and shipping details for your order.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: PageProps) {
  const { id } = await params;
  return <OrderDetailPage id={id} />;
}
