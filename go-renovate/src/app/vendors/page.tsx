import React from "react";
import axios, { AxiosResponse } from "axios";
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

  return axios
    .get<Response>(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
    .then(
      (
        response: AxiosResponse<
          Response,
          {
            data: {
              _id: number;
              description: string;
              actualPrice: number;
              discountPrice: number;
              rating: number;
              imageUrl: string[];
            } | null;
          }
        >,
      ) => response.data,
    )
    .catch((error) => {
      console.error("Error fetching products:", error);
    });
}

export default async function Home() {
  const res: void | Response = await getProducts();

  return (
    <div>
      <Dashboard products={res} />
    </div>
  );
}
