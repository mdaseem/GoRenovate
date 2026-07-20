import React, { useEffect, useRef } from "react";
import "./SearchBar.css";
import { RootState } from "@/app/store/store";
import { useDispatch, useSelector } from "react-redux";
import VendorCard from "../VendorCard/VendorCard";
import {
  setOpenStateProductPageFromSearch,
  setOpenMobileSearch,
} from "@/app/store/features/overLaySlice";
import Overlay from "../../HOC/Overlay/Overlay";
import ProductView from "../ProductView/ProductView";

type productType = {
  id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

const SearchIcon = () => (
  <svg
    className="search-input-icon"
    aria-hidden="true"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path
      d="M20 20L16.5 16.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function SearchBar() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [product, setProduct] = React.useState<productType>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const productsList = useSelector((state: RootState) => state.productsList);
  
  const overlay = useSelector((state: RootState) => state.overlay.overlay);
  const isMobileSearchOpen = useSelector(
    (state: RootState) => state.overlay.isMobileSearchOpen,
  );
  const [filteredProducts, setFilteredProducts] = React.useState<productType[]>(
    [],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const dispatch = useDispatch();
  useEffect(() => {
    const filtered = productsList?.prodList?.data?.filter(
      (product: productType) =>
        product?.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProducts(filtered);
  }, [searchTerm, productsList?.prodList?.data]);

  // Close on outside click / Escape instead of onBlur, so clicking inside
  // the results panel (e.g. a result's link) doesn't tear the panel down
  // before the click can register.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const renderResults = (idPrefix: string, onSelectResult: () => void) =>
    !searchTerm.length ? (
      <div className="search-results-container">
        <div className="previous-searched-container">
          <h4>Previously Searched</h4>
          <div>
            <p>Living Room</p>
          </div>
          <div>
            <p>Living Room</p>
          </div>
          <div>
            <p>Living Room</p>
          </div>
          <div>
            <p>Living Room</p>
          </div>
        </div>
        <div className="suggestion-searched-container">
          <h4>Suggestions</h4>
          <div>
            <p>Living Room</p>
          </div>
          <div>
            <p>Living Room</p>
          </div>
          <div>
            <p>Living Room</p>
          </div>
        </div>
      </div>
    ) : (
      <div className="search-results-container-results">
        <h4 id={`${idPrefix}-heading`}>Results</h4>
        {filteredProducts?.length > 0 ? (
          <ul
            id={`${idPrefix}-listbox`}
            className="search-results"
            role="list"
            aria-labelledby={`${idPrefix}-heading`}
          >
            {filteredProducts?.map((product: productType) => (
              <li
                key={product?.id}
                className="search-result-item"
                onClick={onSelectResult}
              >
                <VendorCard
                  setIsOpen={(payload) => {
                    dispatch(setOpenStateProductPageFromSearch(payload));
                  }}
                  isForSearch={true}
                  vendor={product}
                  setProduct={setProduct}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="search-no-results" role="status" aria-live="polite">
            No results found.
          </p>
        )}
      </div>
    );

  return (
    <>
      <button
        type="button"
        className="search-mobile-trigger"
        aria-label="Open search"
        onClick={() => dispatch(setOpenMobileSearch(true))}
      >
        <SearchIcon />
      </button>

      <div
        ref={containerRef}
        className={`search-bar-container ${isOpen ? "expanded" : ""}`}
      >
        <Overlay
          isDisable={false}
          isOpen={overlay?.isOpenProductPageFromSearch}
          setIsOpen={(payload) =>
            dispatch(setOpenStateProductPageFromSearch(payload))
          }
          shouldReturnNull={
            product && overlay?.isOpenProductPageFromSearch ? false : true
          }
        >
          <ProductView product={product} />
        </Overlay>

        <div className="search-input-wrapper">
          <SearchIcon />
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            role="combobox"
            aria-label="Search vendors"
            aria-expanded={isOpen}
            aria-controls="search-results-listbox"
            autoComplete="off"
            onFocus={() => setIsOpen(true)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendors..."
          />
          {searchTerm.length > 0 && (
            <button
              type="button"
              className="search-clear-btn"
              aria-label="Clear search"
              onClick={() => {
                setSearchTerm("");
                inputRef.current?.focus();
              }}
            >
              ✕
            </button>
          )}
        </div>

        {isOpen && renderResults("search-results", () => setIsOpen(false))}
      </div>
      
      <Overlay
        isDisable={false}
        isOpen={isMobileSearchOpen}
        setIsOpen={(payload) => dispatch(setOpenMobileSearch(payload))}
        shouldReturnNull={!isMobileSearchOpen}
      >
        <div className="mobile-search-panel">
          <div className="search-input-wrapper">
            <SearchIcon />
            <input
              ref={mobileInputRef}
              className="search-input"
              type="search"
              aria-label="Search vendors"
              autoComplete="off"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors..."
            />
            {searchTerm.length > 0 && (
              <button
                type="button"
                className="search-clear-btn"
                aria-label="Clear search"
                onClick={() => {
                  setSearchTerm("");
                  mobileInputRef.current?.focus();
                }}
              >
                ✕
              </button>
            )}
          </div>
          {renderResults("mobile-search-results", () =>
            dispatch(setOpenMobileSearch(false)),
          )}
        </div>
      </Overlay>
    </>
  );
}

export default SearchBar;
