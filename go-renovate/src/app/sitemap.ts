import { MetadataRoute } from "next";
import axios from "axios";

const SITE_URL = "https://gorenovate.in";

async function getVendorIds(): Promise<string[]> {
  try {
    const response = await axios.get<Array<{ id: string }>>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors`,
    );
    return response.data.map((vendor) => vendor.id);
  } catch (error) {
    console.error("Failed to build vendor sitemap entries:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const vendorIds = await getVendorIds();

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
    ...vendorIds.map((id) => ({
      url: `${SITE_URL}/vendors/${id}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
