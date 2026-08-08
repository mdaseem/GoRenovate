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

const SITE_URL = "https://gorenovate.in";

const getVendors = cache(async function getVendors(
  token?: string,
): Promise<Vendor[]> {
  try {
    const response = await axios.get<Vendor[]>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`,
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

async function getCategoryPageData(categoryId: string) {
  const session = await getServerSession(authOptions);
  const vendors = await getVendors(session?.backendToken);
  const categories = buildCategorySummaries(vendors);
  const category = categories.find((c) => c.id === categoryId);
  const matchingVendors = vendors.filter((vendor) =>
    vendor.categories.some((c) => c.id === categoryId),
  );

  return { category, categories, matchingVendors };
}

type PageProps = {
  params: Promise<{ categoryId: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { categoryId } = await params;
  const { category, matchingVendors } = await getCategoryPageData(categoryId);

  if (!category) {
    return {
      title: "Category | Go Renovate",
      description:
        "Browse verified home renovation vendors by service category on Go Renovate.",
    };
  }

  const vendorCount = matchingVendors.length;
  const title = `${category.label} Contractors & Vendors | Go Renovate`;
  const description = `Compare ${vendorCount} verified ${category.label.toLowerCase()} vendor${
    vendorCount === 1 ? "" : "s"
  } on Go Renovate. Check ratings, pricing, and request a free quote.`;

  return {
    title,
    description,
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

export default async function CategoryPage({ params }: PageProps) {
  const { categoryId } = await params;
  const { category, categories, matchingVendors } =
    await getCategoryPageData(categoryId);

  if (!category) {
    notFound();
  }

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
        category={category}
        vendors={matchingVendors}
        otherCategories={categories.filter((c) => c.id !== categoryId)}
      />
    </div>
  );
}
