import React, { useEffect, useState } from "react";
import "./ProductListPage.style.css";
import Filters from "../Filters/view/Filters.view";
import { useDispatch, useSelector } from "react-redux";
import {
  getProducts,
  setProducts,
  setCatalogSnapshot,
} from "@/app/store/features/productSlice";
import { useSession } from "next-auth/react";
import { RootState } from "@/app/store/store";
import { useSearchParams } from "next/navigation";
import ProductList from "../ProductList/ProductList";
import { Loader1 } from "../Loader/Loader";
import {
  setOpenStateProductPage,
  setOpenStateFilters,
} from "@/app/store/features/overLaySlice";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import BackLink from "../../Atoms/BackLink/BackLink";
import { Vendor } from "../../VendorPage/vendor";
import { useVendorFilters } from "../Filters/hooks/useVendorFilters";
import { buildFilterQueryString } from "../Filters/filterConfig";
import { useDebouncedValue } from "../../CustomHooks/useDebouncedValue";

const FILTER_FETCH_DEBOUNCE_MS = 0;

function ProductListPage(props: {
  products: Vendor[] | undefined;
  catalogVendors?: Vendor[];
}) {
  const [product, setProduct] = React.useState<Vendor | null>(null);
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const store = useSelector((state: RootState) => state.overlay);
  const searchParams = useSearchParams();

  const productLists = useSelector((state: RootState) => state.productsList);
  const { activeCount } = useVendorFilters();

  const rawFilterQuery = buildFilterQueryString(searchParams);
  const filterQuery = useDebouncedValue(rawFilterQuery, FILTER_FETCH_DEBOUNCE_MS);

  // Redux only gets populated inside an effect, which never runs during SSR
  // or the first client paint — so until that's happened at least once,
  // render directly from the SSR-fetched props (already correctly matching
  // the current URL) instead of an empty Redux state. Once hydrated, always
  // trust Redux — including when it legitimately holds zero results, which
  // a "fall back whenever Redux looks empty" check would get wrong.
  const [hasHydrated, setHasHydrated] = useState(false);

  const retryFetchProducts = () => {
    dispatch(getProducts({ token: session?.backendToken, filters: filterQuery || undefined }));
  };

  useEffect(() => {
    if (!hasHydrated) {
      setHasHydrated(true);
      if (props.products) {
        dispatch(
          setProducts({ data: props.products, isUnfiltered: !rawFilterQuery }),
        );
        if (props.catalogVendors) {
          dispatch(setCatalogSnapshot(props.catalogVendors));
        }
        // SSR already fetched data matching the current URL — nothing to
        // refetch until the filters actually change.
        return;
      }
    }
    dispatch(
      getProducts({
        token: session?.backendToken,
        filters: filterQuery || undefined,
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterQuery, session]);

  const displayedVendors: Vendor[] = hasHydrated
    ? (productLists?.prodList?.data ?? [])
    : (props.products ?? []);
  const catalogSnapshot: Vendor[] = hasHydrated
    ? (productLists?.catalogSnapshot ?? [])
    : (props.catalogVendors ?? (rawFilterQuery ? [] : props.products) ?? []);
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
        />
      </div>
      <div className="product-page-list">
        <BackLink />
        {productLists?.isloading && !hasCatalog ? (
          <Loader1 />
        ) : productLists?.error && !hasFilteredResults ? (
          <ErrorState
            title="Couldn't load products"
            message={productLists.error}
            actionLabel="Retry"
            onAction={retryFetchProducts}
          />
        ) : !hasCatalog ? (
          <ErrorState
            title="No products found"
            message="Check back soon — new services are added regularly."
          />
        ) : !hasFilteredResults ? (
          <ErrorState
            title="No vendors match your filters"
            message="Try clearing a filter or choosing a different combination."
          />
        ) : (
          <ProductList
            productLists={{ data: displayedVendors }}
            setIsOpen={(payload) => {
              dispatch(setOpenStateProductPage(payload));
            }}
            setProduct={setProduct}
          />
        )}
      </div>
      {hasCatalog && (
        <button
          type="button"
          className={`filters-mobile-trigger${activeCount > 0 ? " filters-mobile-trigger-active" : ""}`}
          onClick={() => dispatch(setOpenStateFilters(true))}
          aria-haspopup="dialog"
          aria-label={
            activeCount > 0 ? `Filters, ${activeCount} applied` : "Filters"
          }
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="8" cy="6" r="2.5" fill="currentColor" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="12" r="2.5" fill="currentColor" />
            <line x1="3" y1="18" x2="21" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="11" cy="18" r="2.5" fill="currentColor" />
          </svg>
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
}

export default ProductListPage;
