import React from "react";
import Link from "next/link";
import styles from "./CategoryVendorList.module.css";
import { Vendor } from "@/app/component/VendorPage/vendor";
import BackLink from "@/app/component/Atoms/BackLink/BackLink";

export type CategorySummary = {
  id: string;
  label: string;
  icon: string;
  vendorCount: number;
};

interface CategoryVendorListProps {
  category: CategorySummary;
  vendors: Vendor[];
  otherCategories: CategorySummary[];
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2L14.8 8.625L22 9.25L16.55 13.975L18.175 21L12 17.275L5.825 21L7.45 13.975L2 9.25L9.2 8.625L12 2Z"
        fill={filled ? "#FFCD29" : "none"}
        stroke={filled ? "none" : "#d8d4cb"}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerifiedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatStartingPrice(vendor: Vendor, categoryId: string): string | null {
  const category = vendor.categories.find((c) => c.id === categoryId);
  if (!category || category.services.length === 0) return null;

  const lowestPrice = Math.min(...category.services.map((s) => s.price));
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(lowestPrice);
}

const CategoryVendorList: React.FC<CategoryVendorListProps> = ({
  category,
  vendors,
  otherCategories,
}) => {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <BackLink href="/vendors" label="All vendors" />

        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">
            {category.icon}
          </span>
          <div>
            <h1 className={styles.heading}>{category.label} Vendors</h1>
            <p className={styles.subheading}>
              {vendors.length} verified vendor{vendors.length === 1 ? "" : "s"}{" "}
              offering {category.label.toLowerCase()} services
            </p>
          </div>
        </header>

        <ul className={styles.vendorGrid} role="list">
          {vendors.map((vendor) => {
            const matchedCategory = vendor.categories.find(
              (c) => c.id === category.id,
            );
            const startingPrice = formatStartingPrice(vendor, category.id);
            const roundedRating = Math.round(vendor.rating);

            return (
              <li key={vendor.id} className={styles.vendorCard}>
                <div className={styles.vendorTop}>
                  <h2 className={styles.vendorName}>{vendor.name}</h2>
                  {vendor.verified && (
                    <span className={styles.verifiedBadge}>
                      <VerifiedIcon />
                      Verified
                    </span>
                  )}
                </div>

                {vendor.tagline && (
                  <p className={styles.vendorTagline}>{vendor.tagline}</p>
                )}

                {vendor.reviewCount > 0 && (
                  <div className={styles.ratingRow}>
                    <span className={styles.stars} aria-hidden="true">
                      {Array.from({ length: 5 }, (_, i) => (
                        <StarIcon key={i} filled={i < roundedRating} />
                      ))}
                    </span>
                    <span className={styles.ratingText}>
                      {vendor.rating.toFixed(1)} ({vendor.reviewCount})
                    </span>
                  </div>
                )}

                <div className={styles.vendorMeta}>
                  {vendor.location && (
                    <span className={styles.metaItem}>{vendor.location}</span>
                  )}
                  {matchedCategory && (
                    <span className={styles.metaItem}>
                      {matchedCategory.services.length}{" "}
                      {category.label.toLowerCase()} service
                      {matchedCategory.services.length === 1 ? "" : "s"}
                    </span>
                  )}
                </div>

                <div className={styles.vendorBottom}>
                  {startingPrice && (
                    <span className={styles.startingPrice}>
                      From {startingPrice}
                    </span>
                  )}
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className={styles.viewLink}
                    aria-label={`View ${vendor.name}`}
                  >
                    View vendor →
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        {otherCategories.length > 0 && (
          <nav
            className={styles.otherCategories}
            aria-label="Other service categories"
          >
            <p className={styles.otherCategoriesLabel}>
              Browse other categories
            </p>
            <ul className={styles.categoryChips} role="list">
              {otherCategories.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/vendors/category/${other.id}`}
                    className={styles.categoryChip}
                  >
                    <span aria-hidden="true">{other.icon}</span>
                    {other.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
};

export default CategoryVendorList;
