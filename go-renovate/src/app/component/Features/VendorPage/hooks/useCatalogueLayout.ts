import { useCallback, useState } from "react";
import { ServiceCategory } from "@/app/types/vendor";
import { useHeaderHeight } from "./useHeaderHeight";
import { useCategoryScrollSpy } from "./useCategoryScrollSpy";
import { useCategoryMenu } from "./useCategoryMenu";

// The page behaviour shared by a vendor's catalogue, whether it lists services (VendorPage) or
// products (ShopVendorPage): which category sections are open, which one the scroll position is in,
// scrolling to a category, and the floating "Menu" that jumps between categories.
export function useCatalogueLayout(categories: ServiceCategory[]) {
  const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(
    () => new Set(categories[0]?.id ? [categories[0].id] : []),
  );
  const headerHeight = useHeaderHeight();
  const { activeCategoryId, setActiveCategoryId, registerSectionRef } =
    useCategoryScrollSpy(categories, headerHeight);

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

  const menu = useCategoryMenu({ onSelectCategory: handleCategoryMenuSelect });

  return {
    openCategoryIds,
    toggleCategory,
    activeCategoryId,
    registerSectionRef,
    handleCategoryMenuSelect,
    menu,
  };
}
