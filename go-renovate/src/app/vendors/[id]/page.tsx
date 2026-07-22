import React from "react";
import axios from "axios";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import VendorPage from "@/app/component/VendorPage/VendorPage";
import { authOptions } from "@/app/authOptions";
import { Vendor } from "@/app/component/VendorPage/vendor";

async function getVendor(id: string, token: string): Promise<Vendor> {
  try {
    const response = await axios.get<Vendor>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }

    console.error("Error fetching vendor detail:", error);
    throw new Error("Failed to load vendor details. Please try again.");
  }
}

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;

  const vendor = token ? await getVendor(id, token) : undefined;

  return (
    <div>
      <VendorPage vendor={vendor} />
    </div>
  );
}
