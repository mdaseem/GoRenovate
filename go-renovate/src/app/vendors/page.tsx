import React from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Dashboard from "../component/Molecules/Dashboard/Dashboard";
import { authOptions } from "../authOptions";
import { Vendor } from "../component/VendorPage/vendor";
import { buildFilterQueryString } from "../component/Molecules/Filters/filterConfig";

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

async function getProducts(queryString?: string): Promise<Vendor[] | undefined> {
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;

  try {
    const url = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors${
      queryString ? `?${queryString}` : ""
    }`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      ...(token
        ? { cache: "no-store" as const }
        : { next: { revalidate: 60 } }),
    });

    if (!res.ok) {
      throw new Error(`Vendors request failed with status ${res.status}`);
    }

    return (await res.json()) as Vendor[];
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlSearchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") urlSearchParams.set(key, value);
  });
  const filterQuery = buildFilterQueryString(urlSearchParams);

  // When filters are active, fetch the filtered list to display plus the
  // full catalog (for filter option labels) in parallel — one request when
  // unfiltered, two only when a filtered URL is loaded directly (deep link,
  // refresh, shared link), so results and options are both correct on the
  // very first paint instead of flashing unfiltered data before correcting.
  const [vendors, catalogVendors] = await Promise.all([
    getProducts(filterQuery || undefined),
    filterQuery ? getProducts() : Promise.resolve(undefined),
  ]);

  return (
    <div>
      <Dashboard products={vendors} catalogVendors={catalogVendors} />
    </div>
  );
}
