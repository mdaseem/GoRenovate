"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./VendorPage.module.css";
import { ServiceOption } from "./vendor";
import { MOCK_VENDOR } from "./VendorData";
import { useCart } from "../CustomHooks/useCart";
import ServiceCard from "../Atoms/ServiceCard/ServiceCard";
import CartDrawer from "../Atoms/CartDrawer/CartDrawer";
import { useSession } from "next-auth/react";
import LoginContainer from "../Molecules/LoginContainer/LoginContainer";

interface ToastMessage {
  id: number;
  text: string;
}

const VendorPage: React.FC = () => {
  const vendor = MOCK_VENDOR;
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    vendor.categories[0]?.id ?? "",
  );
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(vendor.categories[0]?.id ? [vendor.categories[0].id] : []),
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryMenuButtonRef = useRef<HTMLButtonElement>(null);
  const categoryMenuPanelRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();

  const {
    items,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    getQuantity,
    clearCart,
  } = useCart();

  const showToast = useCallback((text: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), text });
    toastTimerRef.current = setTimeout(() => setToast(null), 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleAddService = useCallback(
    (service: ServiceOption, categoryLabel: string) => {
      addItem(service, categoryLabel);
      showToast(`${service.name} added to quote`);
    },
    [addItem, showToast],
  );

  const handleIncrement = useCallback(
    (serviceId: string) => {
      const currentQty = getQuantity(serviceId);
      updateQuantity(serviceId, currentQty + 1);
    },
    [getQuantity, updateQuantity],
  );

  const handleDecrement = useCallback(
    (serviceId: string) => {
      const currentQty = getQuantity(serviceId);
      updateQuantity(serviceId, currentQty - 1);
    },
    [getQuantity, updateQuantity],
  );

  const toggleCategory = useCallback((categoryId: string) => {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    const el = document.getElementById(`category-section-${categoryId}`);
    if (el) {
      const headerHeight = 90; // approx sticky site header height
      const y = el.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const toggleCategoryMenu = useCallback(() => {
    setIsCategoryMenuOpen((prev) => !prev);
  }, []);

  const closeCategoryMenu = useCallback((focusTrigger: boolean) => {
    setIsCategoryMenuOpen(false);
    if (focusTrigger) {
      categoryMenuButtonRef.current?.focus();
    }
  }, []);

  const handleCategoryMenuSelect = useCallback(
    (categoryId: string) => {
      setOpenCategoryIds((prev) => {
        if (prev.has(categoryId)) return prev;
        const next = new Set(prev);
        next.add(categoryId);
        return next;
      });
      handleCategoryChange(categoryId);
      closeCategoryMenu(true);
    },
    [handleCategoryChange, closeCategoryMenu],
  );

  // Close the jump-menu on outside click / Escape, matching the WAI-ARIA menu button pattern.
  useEffect(() => {
    if (!isCategoryMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        categoryMenuPanelRef.current?.contains(target) ||
        categoryMenuButtonRef.current?.contains(target)
      ) {
        return;
      }
      setIsCategoryMenuOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCategoryMenu(true);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCategoryMenuOpen, closeCategoryMenu]);

  // Move focus into the menu when it opens, for keyboard users.
  useEffect(() => {
    if (isCategoryMenuOpen) {
      categoryMenuPanelRef.current
        ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
        ?.focus();
    }
  }, [isCategoryMenuOpen]);

  // Avoid two floating overlays fighting for attention.
  useEffect(() => {
    if (isCartOpen) setIsCategoryMenuOpen(false);
  }, [isCartOpen]);

  const handleCategoryMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const items = Array.from(
        categoryMenuPanelRef.current?.querySelectorAll<HTMLButtonElement>(
          '[role="menuitem"]',
        ) ?? [],
      );
      if (!items.length) return;
      const currentIndex = items.indexOf(
        document.activeElement as HTMLButtonElement,
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        items[(currentIndex + 1) % items.length]?.focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        items[(currentIndex - 1 + items.length) % items.length]?.focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        items[0]?.focus();
      } else if (event.key === "End") {
        event.preventDefault();
        items[items.length - 1]?.focus();
      }
    },
    [],
  );

  const handleCategoryMenuBlur = useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsCategoryMenuOpen(false);
      }
    },
    [],
  );

  const handleRequestQuote = useCallback(() => {
    setIsCartOpen(false);
    showToast("We'll contact you within 2 hours with a detailed quote!");
  }, [showToast]);

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  if (!session?.loading && !session?.backendToken) {
    if (status === "unauthenticated") {
      return <LoginContainer />;
    }
  }

  return (
    <div className={styles.page}>
      {/* <VendorHeader
        vendor={vendor}
        activeCategoryId={activeCategoryId}
        onCategoryChange={handleCategoryChange}
        onBack={handleBack}
      /> */}

      <main className={styles.main} id="main-content">
        {vendor.categories.map((category) => {
          const isOpen = openCategoryIds.has(category.id);
          const toggleId = `category-toggle-${category.id}`;
          const panelId = `category-panel-${category.id}`;

          return (
            <section
              key={category.id}
              id={`category-section-${category.id}`}
              className={styles.categorySection}
            >
              <h2 className={styles.categoryHeading}>
                <button
                  type="button"
                  id={toggleId}
                  className={styles.categoryToggle}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className={styles.categoryIcon} aria-hidden="true">
                    {category.icon}
                  </span>
                  <span className={styles.categoryTitle}>
                    {category.label}
                    <span className={styles.serviceCount}>
                      · {category.services.length} services
                    </span>
                  </span>
                  <svg
                    className={`${styles.chevron} ${
                      isOpen ? styles.chevronOpen : ""
                    }`}
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </h2>

              <ul
                id={panelId}
                className={styles.servicesGrid}
                role="list"
                aria-labelledby={toggleId}
                hidden={!isOpen}
              >
                {category.services.map((service) => (
                  <li key={service.id} role="listitem">
                    <ServiceCard
                      service={service}
                      categoryLabel={category.label}
                      quantity={getQuantity(service.id)}
                      onAdd={handleAddService}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>

      <button
        type="button"
        ref={categoryMenuButtonRef}
        className={styles.categoryMenuFab}
        onClick={toggleCategoryMenu}
        aria-haspopup="menu"
        aria-expanded={isCategoryMenuOpen}
        aria-controls="category-jump-menu"
      >
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M4 6H20M4 12H20M4 18H14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>Menu</span>
      </button>

      {isCategoryMenuOpen && (
        <div
          id="category-jump-menu"
          ref={categoryMenuPanelRef}
          role="menu"
          aria-label="Jump to category"
          className={`${styles.categoryMenuPanel} ${
            totalItems > 0 ? styles.categoryMenuPanelRaised : ""
          }`}
          onKeyDown={handleCategoryMenuKeyDown}
          onBlur={handleCategoryMenuBlur}
        >
          {vendor.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              role="menuitem"
              className={styles.categoryMenuItem}
              aria-current={
                activeCategoryId === category.id ? "true" : undefined
              }
              onClick={() => handleCategoryMenuSelect(category.id)}
            >
              <span className={styles.categoryMenuItemIcon} aria-hidden="true">
                {category.icon}
              </span>
              <span className={styles.categoryMenuItemLabel}>
                {category.label}
              </span>
              <span className={styles.categoryMenuItemCount} aria-hidden="true">
                {category.services.length}
              </span>
            </button>
          ))}
        </div>
      )}

      {totalItems > 0 && (
        <button
          className={styles.cartFab}
          onClick={() => setIsCartOpen(true)}
          type="button"
          aria-label={`Open quote cart — ${totalItems} services, total ${formattedTotal}`}
        >
          <span className={styles.fabIcon} aria-hidden="true">
            🗂️
          </span>
          <span>View Cart</span>
          <span className={styles.fabBadge} aria-hidden="true">
            {totalItems}
          </span>
          <span className={styles.fabPrice} aria-hidden="true">
            {formattedTotal}
          </span>
        </button>
      )}

      {toast && (
        <div
          className={styles.toast}
          role="status"
          aria-live="polite"
          key={toast?.id}
        >
          {toast?.text}
        </div>
      )}

      <CartDrawer
        items={items}
        totalPrice={totalPrice}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onClear={clearCart}
        onRequestQuote={handleRequestQuote}
      />
    </div>
  );
};

export default VendorPage;
