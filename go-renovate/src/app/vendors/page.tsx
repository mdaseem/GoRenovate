import React from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Dashboard from "../component/Molecules/Dashboard/Dashboard";
import { authOptions } from "../authOptions";

export const metadata: Metadata = {
  title: "Browse Renovation Vendors | Go Renovate",
  description:
    "Compare verified home renovation vendors and contractors near you. Explore services, pricing, and reviews, then request a free quote — no sign-up required to browse.",
  alternates: {
    canonical: "/vendors",
  },
  openGraph: {
    title: "Browse Renovation Vendors | Go Renovate",
    description:
      "Compare verified home renovation vendors and contractors. Explore services, pricing, and reviews, then request a free quote.",
    url: "/vendors",
    type: "website",
  },
};

async function getProducts() {
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        ...(token
          ? { cache: "no-store" as const }
          : { next: { revalidate: 60 } }),
      },
    );

    if (!res.ok) {
      throw new Error(`Vendors request failed with status ${res.status}`);
    }

    return (await res.json()) as Response;
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

export default async function Home() {
  const res: void | Response = await getProducts();

  return (
    <div>
      <Dashboard products={res} />
    </div>
  );
}
