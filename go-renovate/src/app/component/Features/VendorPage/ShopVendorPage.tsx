"use client";

import React, { useCallback } from "react";
import styles from "./VendorPage.module.css";
import { ServiceOption, Vendor } from "@/app/types/vendor";
import { useProductCart } from "@/app/component/CustomHooks/useProductCart";
import Overlay from "@/app/component/HOC/Overlay/Overlay";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import BackLink from "@/app/component/Atoms/BackLink/BackLink";
import { useToast } from "./hooks/useToast";
import { useCatalogueLayout } from "./hooks/useCatalogueLayout";
import { useServiceNavigation } from "./hooks/useServiceNavigation";
import CategorySection from "./components/CategorySection";
import VendorDetails from "./components/VendorDetails";
import CategoryJumpMenu from "./components/CategoryJumpMenu";
import Toast from "./components/Toast";
import ServiceDetailPanel from "./components/ServiceDetailPanel";
import ServiceNavHeader from "./components/ServiceNavHeader";

type propType = {
  vendor?: Vendor;
};

// The vendor page while services are switched off: the same page as VendorPage (header, category
// menu, collapsible sections, cards, "View more" panel) listing the vendor's PRODUCTS, grouped by
// product type. The cart is the shop cart, which spans vendors; its button, drawer and checkout live
// in ShopCart (mounted once in the layout), so this page only adds to it.
const ShopVendorPage: React.FC<propType> = ({ vendor }) => {
  const categories = vendor?.categories ?? [];
  const {
    openCategoryIds,
    toggleCategory,
    activeCategoryId,
    registerSectionRef,
    handleCategoryMenuSelect,
    menu: {
      isOpen: isCategoryMenuOpen,
      buttonRef: categoryMenuButtonRef,
      panelRef: categoryMenuPanelRef,
      toggle: toggleCategoryMenu,
      selectCategory: selectCategoryFromMenu,
      handleKeyDown: handleCategoryMenuKeyDown,
      handleBlur: handleCategoryMenuBlur,
    },
  } = useCatalogueLayout(categories);
  const serviceNav = useServiceNavigation(categories);
  const { totalItems, addProduct, getQuantity, setQuantity } = useProductCart();
  const { toast, showToast } = useToast();

  const handleAddProduct = useCallback(
    (product: ServiceOption, categoryLabel: string) => {
      if (!vendor) return;
      addProduct(product, categoryLabel, { id: vendor.id, name: vendor.name });
      showToast(`${product.name} added to cart`);
    },
    [addProduct, showToast, vendor],
  );

  const handleIncrement = useCallback(
    (productId: string) => setQuantity(productId, getQuantity(productId) + 1),
    [getQuantity, setQuantity],
  );

  const handleDecrement = useCallback(
    (productId: string) => setQuantity(productId, getQuantity(productId) - 1),
    [getQuantity, setQuantity],
  );

  const closeDetail = serviceNav.close;
  const handleDetailOpenChange = useCallback<
    React.Dispatch<React.SetStateAction<boolean>>
  >(
    (value) => {
      const next =
        typeof value === "function"
          ? (value as (prev: boolean) => boolean)(serviceNav.isOpen)
          : value;
      if (!next) closeDetail();
    },
    [serviceNav.isOpen, closeDetail],
  );

  if (!vendor) {
    return (
      <ErrorState
        variant="page"
        title="Couldn't load this vendor"
        message="This vendor may no longer be available. Please try again or go back to browsing."
        actionLabel="Back to vendors"
        href="/vendors"
      />
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main} id="main-content">
        <BackLink className={styles.backLink} />
        <VendorDetails
          vendor={vendor}
          activeCategoryId={activeCategoryId}
          onCategorySelect={handleCategoryMenuSelect}
        />
        {categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            isActive={activeCategoryId === category.id}
            isOpen={openCategoryIds.has(category.id)}
            registerRef={registerSectionRef(category.id)}
            onToggle={toggleCategory}
            getQuantity={getQuantity}
            onAddService={handleAddProduct}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onViewMore={serviceNav.open}
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

      {toast && <Toast key={toast.id} text={toast.text} />}

      <Overlay
        isOpen={serviceNav.isOpen}
        setIsOpen={handleDetailOpenChange}
        isDisable={false}
        shouldReturnNull={!serviceNav.isOpen}
        headerExtra={
          serviceNav.isOpen && serviceNav.index !== null ? (
            <ServiceNavHeader
              index={serviceNav.index}
              total={serviceNav.total}
              hasPrev={serviceNav.hasPrev}
              hasNext={serviceNav.hasNext}
              onPrev={serviceNav.goPrev}
              onNext={serviceNav.goNext}
              noun="product"
            />
          ) : undefined
        }
      >
        {serviceNav.current && (
          <ServiceDetailPanel
            service={serviceNav.current.service}
            categoryLabel={serviceNav.current.categoryLabel}
            quantity={getQuantity(serviceNav.current.service.id)}
            hasPrev={serviceNav.hasPrev}
            hasNext={serviceNav.hasNext}
            direction={serviceNav.direction}
            onAdd={handleAddProduct}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onPrev={serviceNav.goPrev}
            onNext={serviceNav.goNext}
          />
        )}
      </Overlay>
    </div>
  );
};

export default ShopVendorPage;
