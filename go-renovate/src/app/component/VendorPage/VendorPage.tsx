"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import styles from "./VendorPage.module.css";
import { ServiceOption, Vendor } from "./vendor";
import { useCart } from "../CustomHooks/useCart";
import CartDrawer from "../Atoms/CartDrawer/CartDrawer";
import LoginContainer from "../Molecules/LoginContainer/LoginContainer";
import Overlay from "../HOC/Overlay/Overlay";
import ServiceDetail from "../Molecules/ServiceDetail/ServiceDetail";
import ErrorState from "../Atoms/ErrorState/ErrorState";
import { useHeaderHeight } from "./hooks/useHeaderHeight";
import { useToast } from "./hooks/useToast";
import { useCategoryScrollSpy } from "./hooks/useCategoryScrollSpy";
import { useCategoryMenu } from "./hooks/useCategoryMenu";
import CategorySection from "./components/CategorySection";
import CategoryJumpMenu from "./components/CategoryJumpMenu";
import CartFab from "./components/CartFab";
import Toast from "./components/Toast";

type propType = {
  vendor?: Vendor;
};

const VendorPage: React.FC<propType> = ({ vendor }) => {
  const { data: session, status } = useSession();
  const categories = vendor?.categories ?? [];

  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(categories[0]?.id ? [categories[0].id] : []),
  );
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<{
    service: ServiceOption;
    categoryLabel: string;
  } | null>(null);

  const {
    items,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    getQuantity,
    clearCart,
  } = useCart();

  const { toast, showToast } = useToast();
  const headerHeight = useHeaderHeight();
  const { activeCategoryId, setActiveCategoryId, registerSectionRef } =
    useCategoryScrollSpy(categories, headerHeight);

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

  const handleViewMore = useCallback(
    (service: ServiceOption, categoryLabel: string) => {
      setSelectedService({ service, categoryLabel });
      setIsDetailOpen(true);
    },
    [],
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

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      setActiveCategoryId(categoryId);
      const el = document.getElementById(`category-section-${categoryId}`);
      if (el) {
        const y =
          el.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    },
    [headerHeight, setActiveCategoryId],
  );

  const handleCategoryMenuSelect = useCallback(
    (categoryId: string) => {
      setOpenCategoryIds((prev) => {
        if (prev.has(categoryId)) return prev;
        const next = new Set(prev);
        next.add(categoryId);
        return next;
      });
      handleCategoryChange(categoryId);
    },
    [handleCategoryChange],
  );

  const {
    isOpen: isCategoryMenuOpen,
    buttonRef: categoryMenuButtonRef,
    panelRef: categoryMenuPanelRef,
    toggle: toggleCategoryMenu,
    close: closeCategoryMenu,
    selectCategory: selectCategoryFromMenu,
    handleKeyDown: handleCategoryMenuKeyDown,
    handleBlur: handleCategoryMenuBlur,
  } = useCategoryMenu({ onSelectCategory: handleCategoryMenuSelect });

  // Avoid two floating overlays fighting for attention.
  useEffect(() => {
    if (isCartOpen) closeCategoryMenu();
  }, [isCartOpen, closeCategoryMenu]);

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

  if (!vendor) {
    return (
      <ErrorState
        variant="page"
        title="Couldn't load this vendor"
        message="This vendor may no longer be available. Please try again or go back to browsing."
        actionLabel="Back to products"
        href="/products"
      />
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} id="main-content">
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            isActive={activeCategoryId === category.id}
            isOpen={openCategoryIds.has(category.id)}
            registerRef={registerSectionRef(category.id)}
            onToggle={toggleCategory}
            getQuantity={getQuantity}
            onAddService={handleAddService}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onViewMore={handleViewMore}
          />
        ))}
      </main>

      <CategoryJumpMenu
        categories={categories}
        activeCategoryId={activeCategoryId}
        isOpen={isCategoryMenuOpen}
        isRaised={totalItems > 0}
        buttonRef={categoryMenuButtonRef}
        panelRef={categoryMenuPanelRef}
        onToggle={toggleCategoryMenu}
        onSelect={selectCategoryFromMenu}
        onKeyDown={handleCategoryMenuKeyDown}
        onBlur={handleCategoryMenuBlur}
      />

      {totalItems > 0 && (
        <CartFab
          totalItems={totalItems}
          formattedTotal={formattedTotal}
          onClick={() => setIsCartOpen(true)}
        />
      )}

      {toast && <Toast key={toast.id} text={toast.text} />}

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

      <Overlay
        isOpen={isDetailOpen}
        setIsOpen={setIsDetailOpen}
        isDisable={false}
        shouldReturnNull={!isDetailOpen}
      >
        {selectedService && (
          <ServiceDetail
            service={selectedService.service}
            categoryLabel={selectedService.categoryLabel}
            quantity={getQuantity(selectedService.service.id)}
            onAdd={handleAddService}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
          />
        )}
      </Overlay>
    </div>
  );
};

export default VendorPage;
