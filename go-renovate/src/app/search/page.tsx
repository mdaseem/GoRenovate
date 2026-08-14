import React from "react";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import Dashboard from "../component/Molecules/Dashboard/Dashboard";
import { authOptions } from "../authOptions";
import { Vendor } from "../component/VendorPage/vendor";
import {
  buildVendorsQueryString,
  SEARCH_PARAM,
} from "../component/Molecules/Filters/filterConfig";
import ErrorState from "../component/Atoms/ErrorState/ErrorState";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toURLSearchParams(
  query: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const urlSearchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") urlSearchParams.set(key, value);
  });
  return urlSearchParams;
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const query = typeof params[SEARCH_PARAM] === "string" ? params[SEARCH_PARAM] : "";

  const title = query
    ? `Search results for "${query}" | Go Renovate`
    : "Search | Go Renovate";
  const description = query
    ? `Vendors and services matching "${query}" on Go Renovate.`
    : "Search for renovation vendors and services on Go Renovate.";

  return {
    title,
    description,
    // Search-result URLs shouldn't be indexed — infinite query variations
    // would otherwise read as near-duplicate, low-value pages.
    robots: { index: false, follow: true },
  };
}

async function getProducts(queryString?: string): Promise<Vendor[] | undefined> {
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;

  try {
    const url = `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors${
      queryString ? `?${queryString}` : ""
    }`;
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Vendors request failed with status ${res.status}`);
    }

    return (await res.json()) as Vendor[];
  } catch (error) {
    console.error("Error fetching search results:", error);
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const urlSearchParams = toURLSearchParams(params);
  const query = urlSearchParams.get(SEARCH_PARAM)?.trim();

  if (!query) {
    return (
      <div>
        <ErrorState
          variant="page"
          title="Search Go Renovate"
          message="Search for a vendor, service, or category using the search bar above."
        />
      </div>
    );
  }

  const vendorsQuery = buildVendorsQueryString(urlSearchParams);

  const [vendors, catalogVendors] = await Promise.all([
    getProducts(vendorsQuery),
    getProducts(),
  ]);

  return (
    <div>
      <Dashboard products={vendors} catalogVendors={catalogVendors} />
    </div>
  );
}
