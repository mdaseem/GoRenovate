"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import styles from "./VendorPage.module.css";
import { ServiceOption } from "./vendor";
import { MOCK_VENDOR } from "./VendorData";
import { useCart } from "../CustomHooks/useCart";
import ServiceCard from "../Atoms/ServiceCard/ServiceCard";
import CartDrawer from "../Atoms/CartDrawer/CartDrawer";

interface ToastMessage {
  id: number;
  text: string;
}

const VendorPage: React.FC = () => {
  const vendor = MOCK_VENDOR;
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    vendor.categories[0]?.id ?? "",
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleCategoryChange = useCallback((categoryId: string) => {
    setActiveCategoryId(categoryId);
    const el = document.getElementById(`category-section-${categoryId}`);
    if (el) {
      const headerHeight = 200; // approx header height
      const y = el.getBoundingClientRect().top + window.scrollY - headerHeight;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  const handleRequestQuote = useCallback(() => {
    setIsCartOpen(false);
    showToast("We'll contact you within 2 hours with a detailed quote!");
  }, [showToast]);

  const formattedTotal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(totalPrice);

  return (
    <div className={styles.page}>
      {/* <VendorHeader
        vendor={vendor}
        activeCategoryId={activeCategoryId}
        onCategoryChange={handleCategoryChange}
        onBack={handleBack}
      /> */}

      <main className={styles.main} id="main-content">
        {vendor.categories.map((category) => (
          <section
            key={category.id}
            id={`category-section-${category.id}`}
            className={styles.categorySection}
            aria-labelledby={`category-heading-${category.id}`}
          >
            <div className={styles.categorySectionHeader}>
              <span className={styles.categoryIcon} aria-hidden="true">
                {category.icon}
              </span>
              <h2
                id={`category-heading-${category.id}`}
                className={styles.categoryTitle}
              >
                {category.label}
                <span className={styles.serviceCount}>
                  · {category.services.length} services
                </span>
              </h2>
            </div>

            <ul
              className={styles.servicesGrid}
              role="list"
              aria-label={`${category.label} services`}
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
        ))}
      </main>

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
          <span>View Quote</span>
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
