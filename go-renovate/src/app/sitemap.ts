import { MetadataRoute } from "next";
import axios from "axios";

const SITE_URL = "https://gorenovate.in";

type VendorSitemapEntry = {
  id: string;
  categories: Array<{ id: string }>;
};

async function getVendors(): Promise<VendorSitemapEntry[]> {
  try {
    const response = await axios.get<VendorSitemapEntry[]>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`,
    );
    return response.data;
  } catch (error) {
    console.error("Failed to build vendor sitemap entries:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const vendors = await getVendors();
  const categoryIds = Array.from(
    new Set(vendors.flatMap((vendor) => vendor.categories.map((c) => c.id))),
  );

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/vendors`,
      lastModified,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categoryIds.map((id) => ({
      url: `${SITE_URL}/vendors/category/${id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...vendors.map((vendor) => ({
      url: `${SITE_URL}/vendors/${vendor.id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
