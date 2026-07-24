import React from "react";
import { cache } from "react";
import axios from "axios";
import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import VendorPage from "@/app/component/VendorPage/VendorPage";
import { authOptions } from "@/app/authOptions";
import { Vendor } from "@/app/component/VendorPage/vendor";

const getVendor = cache(async function getVendor(
  id: string,
  token?: string,
): Promise<Vendor | undefined> {
  try {
    const response = await axios.get<Vendor>(
      `${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/vendors/${id}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      notFound();
    }

    console.error("Error fetching vendor detail:", error);
    return undefined;
  }
});

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const vendor = await getVendor(id, session?.backendToken);

  if (!vendor) {
    return {
      title: "Vendor | Go Renovate",
      description:
        "Discover verified home renovation vendors and request a free quote on Go Renovate.",
    };
  }

  const title = `${vendor.name} — Renovation Services | Go Renovate`;
  const description = vendor.tagline
    ? `${vendor.tagline} ${vendor.location ? `Serving ${vendor.location}.` : ""} Rated ${vendor.rating}/5 from ${vendor.reviewCount} reviews. Get a free quote today.`.trim()
    : `Explore renovation services from ${vendor.name} and request a free, no-obligation quote.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/vendors/${id}`,
    },
    openGraph: {
      title,
      description,
      url: `/vendors/${id}`,
      type: "website",
    },
  };
}

export default async function VendorDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const token = session?.backendToken;

  const vendor = await getVendor(id, token);

  const jsonLd = vendor
    ? {
        "@context": "https://schema.org",
        "@type": "HomeAndConstructionBusiness",
        name: vendor.name,
        description: vendor.tagline,
        address: vendor.location
          ? { "@type": "PostalAddress", addressLocality: vendor.location }
          : undefined,
        aggregateRating:
          vendor.reviewCount > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: vendor.rating,
                reviewCount: vendor.reviewCount,
              }
            : undefined,
      }
    : null;

  return (
    <div>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <VendorPage vendor={vendor} />
    </div>
  );
}
