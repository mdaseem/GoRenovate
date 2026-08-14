import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import "./SearchBar.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import {
  setOpenMobileSearch,
} from "@/app/store/features/overLaySlice";
import {
  getRecentSearches,
  addRecentSearchRequest,
  removeRecentSearchRequest,
  clearRecentSearchesRequest,
} from "@/app/store/features/searchSlice";
import Overlay from "../../HOC/Overlay/Overlay";
import { Vendor } from "../../VendorPage/vendor";
import { useDebouncedValue } from "../../CustomHooks/useDebouncedValue";
import { useSearchSuggestions } from "../../CustomHooks/useSearchSuggestions";

const SUGGESTION_DEBOUNCE_MS = 250;

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

const ClockIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v5l3.5 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ArrowIcon = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Highlights the portion of `text` that matches `query`, without
// dangerouslySetInnerHTML — split into plain text nodes and wrap the
// matching slice in a <mark>.
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return <>{text}</>;

  const index = text.toLowerCase().indexOf(trimmedQuery.toLowerCase());
  if (index === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, index)}
      <mark className="search-match-highlight">
        {text.slice(index, index + trimmedQuery.length)}
      </mark>
      {text.slice(index + trimmedQuery.length)}
    </>
  );
}

type Row =
  | { kind: "recent"; term: string }
  | { kind: "suggestion"; vendor: Vendor }
  | { kind: "seeAll"; term: string };

function rowHref(row: Row): string | null {
  return row.kind === "suggestion" ? `/vendors/${row.vendor.id}` : null;
}

function SearchBar() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const { data: session } = useSession();
  const token = session?.backendToken;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const recentSearches = useAppSelector((state) => state.search.recentSearches);
  const recentSearchesError = useAppSelector((state) => state.search.error);
  const isMobileSearchOpen = useAppSelector(
    (state) => state.overlay.isMobileSearchOpen,
  );

  const debouncedTerm = useDebouncedValue(searchTerm, SUGGESTION_DEBOUNCE_MS);
  const {
    suggestions,
    isLoading: suggestionsLoading,
    error: suggestionsError,
  } = useSearchSuggestions(debouncedTerm, token);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    dispatch(getRecentSearches({ token }));
  }, [token, dispatch]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchTerm, isOpen, isMobileSearchOpen]);

  const isTyping = searchTerm.trim().length > 0;

  const rows: Row[] = useMemo(() => {
    if (!isTyping) {
      return recentSearches.map((term) => ({ kind: "recent", term }) as Row);
    }
    const suggestionRows: Row[] = suggestions.map(
      (vendor) => ({ kind: "suggestion", vendor }) as Row,
    );
    return [...suggestionRows, { kind: "seeAll", term: searchTerm.trim() }];
  }, [isTyping, recentSearches, suggestions, searchTerm]);

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

  const submitSearch = (term: string, blurTarget?: HTMLInputElement | null) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    if (token) dispatch(addRecentSearchRequest({ term: trimmed, token }));
    setIsOpen(false);
    dispatch(setOpenMobileSearch(false));
    blurTarget?.blur();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const selectRow = (row: Row, blurTarget?: HTMLInputElement | null) => {
    if (row.kind === "recent" || row.kind === "seeAll") {
      submitSearch(row.term, blurTarget);
      return;
    }
    setIsOpen(false);
    dispatch(setOpenMobileSearch(false));
    blurTarget?.blur();
    router.push(`/vendors/${row.vendor.id}`);
  };

  const handleInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, rows.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, -1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = event.currentTarget;
      if (activeIndex >= 0 && rows[activeIndex]) {
        selectRow(rows[activeIndex], target);
      } else {
        submitSearch(searchTerm, target);
      }
    }
  };

  const renderPanel = (idPrefix: string, onSelect: () => void) => {
    const listboxId = `${idPrefix}-listbox`;

    if (!isTyping) {
      return (
        <div className="search-results-container">
          <div className="previous-searched-container">
            <div className="search-panel-heading-row">
              <h4>Previously Searched</h4>
              {recentSearches.length > 0 && (
                <button
                  type="button"
                  className="search-clear-recent-btn"
                  onClick={() => token && dispatch(clearRecentSearchesRequest({ token }))}
                >
                  Clear all
                </button>
              )}
            </div>
            {recentSearches.length === 0 ? (
              <p
                className={recentSearchesError ? "search-error-hint" : "search-empty-hint"}
                role={recentSearchesError ? "alert" : undefined}
              >
                {recentSearchesError
                  ? "Couldn't load your recent searches."
                  : "Your recent searches will show up here."}
              </p>
            ) : (
              <ul
                id={listboxId}
                className="search-results"
                role="listbox"
                aria-label="Recent searches"
              >
                {rows.map((row, index) => {
                  if (row.kind !== "recent") return null;
                  const optionId = `${idPrefix}-option-${index}`;
                  return (
                    <li
                      key={optionId}
                      id={optionId}
                      role="option"
                      aria-selected={activeIndex === index}
                      className={`search-recent-row${
                        activeIndex === index ? " search-row-active" : ""
                      }`}
                    >
                      <button
                        type="button"
                        className="search-recent-term"
                        onClick={() => {
                          selectRow(row);
                          onSelect();
                        }}
                      >
                        <ClockIcon />
                        <span>{row.term}</span>
                      </button>
                      <button
                        type="button"
                        className="search-recent-remove"
                        aria-label={`Remove "${row.term}" from recent searches`}
                        onClick={() =>
                          token &&
                          dispatch(
                            removeRecentSearchRequest({ term: row.term, token }),
                          )
                        }
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="search-results-container-results">
        <h4 id={`${idPrefix}-heading`}>Suggestions</h4>
        {suggestionsLoading && (
          <p className="search-loading-hint" role="status" aria-live="polite">
            Searching…
          </p>
        )}
        {!suggestionsLoading && suggestionsError && (
          <p className="search-error-hint" role="alert">
            {suggestionsError} You can still press Enter to search everything.
          </p>
        )}
        <ul
          id={listboxId}
          className="search-results"
          role="listbox"
          aria-labelledby={`${idPrefix}-heading`}
        >
          {rows.map((row, index) => {
            const optionId = `${idPrefix}-option-${index}`;
            const isActive = activeIndex === index;
            const href = rowHref(row);

            if (row.kind === "suggestion") {
              return (
                <li
                  key={optionId}
                  id={optionId}
                  role="option"
                  aria-selected={isActive}
                  className={`search-result-item${isActive ? " search-row-active" : ""}`}
                >
                  <Link
                    href={href as string}
                    className="search-suggestion-row"
                    onClick={() => {
                      setIsOpen(false);
                      dispatch(setOpenMobileSearch(false));
                      onSelect();
                    }}
                  >
                    <span className="search-suggestion-name">
                      <HighlightMatch text={row.vendor.name} query={searchTerm} />
                    </span>
                    {row.vendor.categories?.[0]?.label && (
                      <span className="search-suggestion-meta">
                        {row.vendor.categories[0].label}
                      </span>
                    )}
                  </Link>
                </li>
              );
            }

            return (
              <li
                key={optionId}
                id={optionId}
                role="option"
                aria-selected={isActive}
                className={`search-see-all-item${isActive ? " search-row-active" : ""}`}
              >
                <button
                  type="button"
                  className="search-see-all-btn"
                  onClick={() => {
                    selectRow(row);
                    onSelect();
                  }}
                >
                  <span>See all results for &ldquo;{row.term}&rdquo;</span>
                  <ArrowIcon />
                </button>
              </li>
            );
          })}
          {!suggestionsLoading && !suggestionsError && suggestions.length === 0 && (
            <li className="search-no-results" role="status" aria-live="polite">
              No vendors match yet — press Enter to search everything.
            </li>
          )}
        </ul>
      </div>
    );
  };

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
            aria-autocomplete="list"
            aria-activedescendant={
              isOpen && activeIndex >= 0 ? `search-results-option-${activeIndex}` : undefined
            }
            autoComplete="off"
            onFocus={() => setIsOpen(true)}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleInputKeyDown}
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

        {isOpen && renderPanel("search-results", () => setIsOpen(false))}
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
              role="combobox"
              aria-label="Search vendors"
              aria-expanded={isMobileSearchOpen}
              aria-controls="mobile-search-results-listbox"
              aria-autocomplete="list"
              aria-activedescendant={
                activeIndex >= 0
                  ? `mobile-search-results-option-${activeIndex}`
                  : undefined
              }
              autoComplete="off"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleInputKeyDown}
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
          {renderPanel("mobile-search-results", () => {})}
        </div>
      </Overlay>
    </>
  );
}

export default SearchBar;
