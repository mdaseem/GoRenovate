import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://go-renovate.vercel.app",
      lastModified: new Date(),
    },
  ];
}
