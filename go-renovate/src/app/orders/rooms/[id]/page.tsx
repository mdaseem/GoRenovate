import React from "react";
import { Metadata } from "next";
import EssentialOrderDetailPage from "@/app/component/Molecules/EssentialOrderDetailPage/EssentialOrderDetailPage";

export const metadata: Metadata = {
  title: "Order Details | Go Renovate",
  description: "See the status and shipping details for every vendor in your order.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EssentialOrderPage({ params }: PageProps) {
  const { id } = await params;
  return <EssentialOrderDetailPage id={id} />;
}
