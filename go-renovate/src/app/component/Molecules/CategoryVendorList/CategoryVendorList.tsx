"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import styles from "./CategoryVendorList.module.css";
// Reuses ProductListPage's own layout CSS (not a module — global classnames
// on purpose) so the filters/results split, the fixed-position desktop
// filter panel, and the mobile filter trigger are pixel-for-pixel the same
// component behavior as /vendors, not a lookalike reimplementation.
import "@/app/component/Molecules/ProductListPage/ProductListPage.style.css";
import { Vendor } from "@/app/component/VendorPage/vendor";
import BackLink from "@/app/component/Atoms/BackLink/BackLink";
import MyFavorites from "@/app/component/Atoms/MyFavorites/view/MyFavorites.view";
import Filters from "@/app/component/Molecules/Filters/view/Filters.view";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { Loader1 } from "@/app/component/Molecules/Loader/Loader";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  getProducts,
  setProducts,
  setCatalogSnapshot,
} from "@/app/store/features/productSlice";
import { setOpenStateFilters } from "@/app/store/features/overLaySlice";
import {
  buildCategoryScopedFilterQuery,
} from "@/app/component/Molecules/Filters/filterConfig";
import { useVendorFilters } from "@/app/component/Molecules/Filters/hooks/useVendorFilters";
import { useDebouncedValue } from "@/app/component/CustomHooks/useDebouncedValue";

const FILTER_FETCH_DEBOUNCE_MS = 0;

export type CategorySummary = {
  id: string;
  label: string;
  icon: string;
  vendorCount: number;
};

interface CategoryVendorListProps {
  categoryId: string;
  category: CategorySummary;
  vendors: Vendor[];
  catalogVendors: Vendor[];
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

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="6" r="2.5" fill="currentColor" />
      <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="12" r="2.5" fill="currentColor" />
      <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="11" cy="18" r="2.5" fill="currentColor" />
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
  categoryId,
  category,
  vendors,
  catalogVendors,
  otherCategories,
}) => {
  const dispatch = useAppDispatch();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const productLists = useAppSelector((state) => state.productsList);
  const favoriteItems = useAppSelector((state) => state.favoriteList.items);
  const favoriteIds = useMemo(
    () => new Set(favoriteItems.map((item) => item.id)),
    [favoriteItems],
  );
  const { activeCount } = useVendorFilters();

  const { fullQuery, extraQuery } = buildCategoryScopedFilterQuery(
    searchParams,
    categoryId,
  );
  const debouncedQuery = useDebouncedValue(fullQuery, FILTER_FETCH_DEBOUNCE_MS);

  // Same hydration handoff as ProductListPage: Redux only fills in inside an
  // effect, so render straight from SSR props (already correct for the
  // current URL) until that first effect has run, then trust Redux — even
  // once it legitimately holds zero results.
  const [hasHydrated, setHasHydrated] = useState(false);

  const retryFetchProducts = () => {
    dispatch(
      getProducts({
        token: session?.backendToken,
        filters: fullQuery,
        isUnfiltered: !extraQuery,
      }),
    );
  };

  useEffect(() => {
    if (!hasHydrated) {
      setHasHydrated(true);
      dispatch(setProducts({ data: vendors, isUnfiltered: !extraQuery }));
      dispatch(setCatalogSnapshot(catalogVendors));
      // SSR already fetched data matching the current URL — nothing to
      // refetch until the filters actually change.
      return;
    }
    dispatch(
      getProducts({
        token: session?.backendToken,
        filters: debouncedQuery,
        isUnfiltered: !extraQuery,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, session]);

  const displayedVendors: Vendor[] = hasHydrated
    ? (productLists?.prodList?.data ?? [])
    : vendors;
  const catalogSnapshot: Vendor[] = hasHydrated
    ? (productLists?.catalogSnapshot ?? [])
    : catalogVendors;
  const hasCatalog = catalogSnapshot.length > 0;
  const hasFilteredResults = displayedVendors.length > 0;
  const isRefreshing = Boolean(productLists?.isloading) && hasCatalog;

  return (
    <div className="product-page-container">
      <div className="product-page-filters">
        <Filters
          vendors={catalogSnapshot}
          resultCount={displayedVendors.length}
          isRefreshing={isRefreshing}
          hiddenFilterIds={["category"]}
        />
      </div>

      <div className="product-page-list">
        <BackLink />

        <header className={styles.header}>
          <span className={styles.headerIcon} aria-hidden="true">
            {category.icon}
          </span>
          <div>
            <h1 className={styles.heading}>{category.label} Vendors</h1>
            <p className={styles.subheading}>
              {displayedVendors.length} verified vendor
              {displayedVendors.length === 1 ? "" : "s"} offering{" "}
              {category.label.toLowerCase()} services
            </p>
          </div>
        </header>

        {productLists?.isloading && !hasCatalog ? (
              <Loader1 />
            ) : productLists?.error && !hasFilteredResults ? (
              <ErrorState
                title="Couldn't load vendors"
                message={productLists.error}
                actionLabel="Retry"
                onAction={retryFetchProducts}
              />
            ) : !hasCatalog ? (
              <ErrorState
                title="No vendors found"
                message="Check back soon — new vendors are added regularly."
              />
            ) : !hasFilteredResults ? (
              <ErrorState
                title="No vendors match your filters"
                message="Try clearing a filter or choosing a different combination."
              />
            ) : (
              <ul className={styles.vendorGrid} role="list">
                {displayedVendors.map((vendor) => {
                  const matchedCategory = vendor.categories.find(
                    (c) => c.id === categoryId,
                  );
                  const startingPrice = formatStartingPrice(vendor, categoryId);
                  const roundedRating = Math.round(vendor.rating);

                  return (
                    <li key={vendor.id} className={styles.vendorCard}>
                      <div className={styles.vendorTop}>
                        <div className={styles.vendorTopInfo}>
                          <h2 className={styles.vendorName}>{vendor.name}</h2>
                          {vendor.verified && (
                            <span className={styles.verifiedBadge}>
                              <VerifiedIcon />
                              Verified
                            </span>
                          )}
                        </div>
                        <MyFavorites
                          prodData={vendor}
                          isFav={favoriteIds.has(vendor.id)}
                        />
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
            )}

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

      {hasCatalog && (
        <button
          type="button"
          className={`filters-mobile-trigger${
            activeCount > 0 ? " filters-mobile-trigger-active" : ""
          }`}
          onClick={() => dispatch(setOpenStateFilters(true))}
          aria-haspopup="dialog"
          aria-label={
            activeCount > 0 ? `Filters, ${activeCount} applied` : "Filters"
          }
        >
          <FilterIcon />
          Filters
          {activeCount > 0 && (
            <span className="filters-mobile-badge" aria-hidden="true">
              {activeCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default CategoryVendorList;
