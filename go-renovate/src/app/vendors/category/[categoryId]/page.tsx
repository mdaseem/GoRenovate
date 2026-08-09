import React from "react";
import { cache } from "react";
import axios from "axios";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/app/authOptions";
import { Vendor } from "@/app/component/VendorPage/vendor";
import CategoryVendorList, {
  CategorySummary,
} from "@/app/component/Molecules/CategoryVendorList/CategoryVendorList";
import { buildCategoryScopedFilterQuery } from "@/app/component/Molecules/Filters/filterConfig";

const SITE_URL = "https://gorenovate.in";

const getVendors = cache(async function getVendors(
  token?: string,
  queryString?: string,
): Promise<Vendor[]> {
  try {
    const response = await axios.get<Vendor[]>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors${
        queryString ? `?${queryString}` : ""
      }`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching vendors for category page:", error);
    return [];
  }
});

function buildCategorySummaries(vendors: Vendor[]): CategorySummary[] {
  const summaries = new Map<string, CategorySummary>();

  vendors.forEach((vendor) => {
    vendor.categories.forEach((category) => {
      const existing = summaries.get(category.id);
      if (existing) {
        existing.vendorCount += 1;
        return;
      }
      summaries.set(category.id, {
        id: category.id,
        label: category.label,
        icon: category.icon,
        vendorCount: 1,
      });
    });
  });

  return Array.from(summaries.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

// Every category catalog is derived from one unfiltered fetch (deduped via
// React's cache() across generateMetadata + the page component within the
// same request) — cheap because we already need the full vendor set to
// build the "browse other categories" list and each category's label/icon.
async function getCategoryMeta(token?: string) {
  const allVendors = await getVendors(token);
  const categories = buildCategorySummaries(allVendors);
  return { allVendors, categories };
}

type PageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: Omit<PageProps, "searchParams">): Promise<Metadata> {
  const { categoryId } = await params;
  const session = await getServerSession(authOptions);
  const { categories } = await getCategoryMeta(session?.backendToken);
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return {
      title: "Category | Go Renovate",
      description:
        "Browse verified home renovation vendors by service category on Go Renovate.",
    };
  }

  const vendorCount = category.vendorCount;
  const title = `${category.label} Contractors & Vendors | Go Renovate`;
  const description = `Compare ${vendorCount} verified ${category.label.toLowerCase()} vendor${
    vendorCount === 1 ? "" : "s"
  } on Go Renovate. Check ratings, pricing, and request a free quote.`;

  return {
    title,
    description,
    // Canonical stays filter-agnostic (rating/verified/location query params
    // narrow the same page rather than describing a distinct resource) so
    // filtered URL variants aren't indexed as separate, near-duplicate pages.
    alternates: {
      canonical: `/vendors/category/${categoryId}`,
    },
    openGraph: {
      title,
      description,
      url: `/vendors/category/${categoryId}`,
      type: "website",
    },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { categoryId } = await params;
  const query = await searchParams;
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;

  const { allVendors, categories } = await getCategoryMeta(token);
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    notFound();
  }

  const urlSearchParams = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string") urlSearchParams.set(key, value);
  });
  const { fullQuery, extraQuery } = buildCategoryScopedFilterQuery(
    urlSearchParams,
    categoryId,
  );

  const categoryScopedVendors = allVendors.filter((vendor) =>
    vendor.categories.some((c) => c.id === categoryId),
  );

  // Only hit the backend a second time when rating/verified/location narrow
  // the category further — otherwise the category slice already fetched
  // above (part of the free `allVendors` request) is both the result set
  // and the catalog used to build filter option lists.
  const matchingVendors = extraQuery
    ? await getVendors(token, fullQuery)
    : categoryScopedVendors;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.label} Vendors`,
    url: `${SITE_URL}/vendors/category/${categoryId}`,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: matchingVendors.map((vendor, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/vendors/${vendor.id}`,
        name: vendor.name,
      })),
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryVendorList
        categoryId={categoryId}
        category={category}
        vendors={matchingVendors}
        catalogVendors={categoryScopedVendors}
        otherCategories={categories.filter((c) => c.id !== categoryId)}
      />
    </div>
  );
}
