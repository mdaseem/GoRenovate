"use client";
import React from "react";
import "./WishListPage.css";
import { useSession } from "next-auth/react";
import VendorCard from "../../Atoms/VendorCard/VendorCard";
import ProductPage from "../../HOC/Overlay/Overlay";
import ProductView from "../../Atoms/ProductView/ProductView";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import { Loader1 } from "../Loader/Loader";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { getFavorites } from "@/app/store/features/favroites";
import { Vendor } from "../../VendorPage/vendor";

type productType = Vendor | null;

type PropsType = {
  isOpen: boolean;
};

function WishListPage(props: PropsType) {
  const { items, isLoading, error, hasLoaded } = useAppSelector(
    (state) => state.favoriteList,
  );
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const [product, setProduct] = React.useState<productType>(null);
  const [isProductOpen, setIsProductOpen] = React.useState(false);

  const fetchFavorites = React.useCallback(() => {
    if (session?.backendToken) {
      dispatch(getFavorites({ token: session.backendToken }));
    }
  }, [dispatch, session?.backendToken]);

  React.useEffect(() => {
    if (!hasLoaded && !isLoading) {
      fetchFavorites();
    }
    // Only needs to run once per mount — RenderFromOverlay already hydrates
    // favorites as soon as a session exists; this is just a safety net.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="wishlist-page">
      <ProductPage
        isDisable={false}
        isOpen={isProductOpen}
        setIsOpen={setIsProductOpen}
      >
        <ProductView product={product} />
      </ProductPage>

      <div className="wishlist-page-header">
        <h2 className="wishlist-page-title">My Wishlist</h2>
        {hasLoaded && items.length > 0 && (
          <span className="wishlist-page-count">
            {items.length} saved
          </span>
        )}
      </div>

      {isLoading && !hasLoaded ? (
        <Loader1 />
      ) : error && items.length === 0 ? (
        <ErrorState
          variant="page"
          title="Couldn't load your wishlist"
          message={error}
          actionLabel="Retry"
          onAction={fetchFavorites}
        />
      ) : hasLoaded && items.length === 0 ? (
        <ErrorState
          variant="page"
          role="status"
          icon="🤍"
          title="Your wishlist is empty"
          message="Tap the heart icon on any vendor to save it here — it'll show up in this list."
          actionLabel="Browse vendors"
          href="/vendors"
        />
      ) : (
        <ul className="wishlist-page-grid" role="list">
          {items.map((vendor, index) => (
            <li
              key={vendor.id}
              className="wishlist-page-grid-item"
              style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
            >
              <VendorCard
                vendor={vendor}
                setProduct={setProduct}
                setIsOpen={setIsProductOpen}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WishListPage;
