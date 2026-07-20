import React from "react";
import styles from "../VendorPage.module.css";
import { ServiceCategory } from "../vendor";

interface CategoryJumpMenuProps {
  categories: ServiceCategory[];
  activeCategoryId: string;
  isOpen: boolean;
  isRaised: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onSelect: (categoryId: string) => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onBlur: (event: React.FocusEvent<HTMLDivElement>) => void;
}

const CategoryJumpMenu: React.FC<CategoryJumpMenuProps> = ({
  categories,
  activeCategoryId,
  isOpen,
  isRaised,
  buttonRef,
  panelRef,
  onToggle,
  onSelect,
  onKeyDown,
  onBlur,
}) => (
  <>
    <button
      type="button"
      ref={buttonRef}
      className={styles.categoryMenuFab}
      onClick={onToggle}
      aria-haspopup="menu"
      aria-expanded={isOpen}
      aria-controls="category-jump-menu"
    >
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 6H20M4 12H20M4 18H14"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span>Menu</span>
    </button>

    {isOpen && (
      <div
        id="category-jump-menu"
        ref={panelRef}
        role="menu"
        aria-label="Jump to category"
        className={`${styles.categoryMenuPanel} ${
          isRaised ? styles.categoryMenuPanelRaised : ""
        }`}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            role="menuitem"
            className={styles.categoryMenuItem}
            aria-current={activeCategoryId === category.id ? "true" : undefined}
            onClick={() => onSelect(category.id)}
          >
            <span className={styles.categoryMenuItemIcon} aria-hidden="true">
              {category.icon}
            </span>
            <span className={styles.categoryMenuItemLabel}>{category.label}</span>
            <span className={styles.categoryMenuItemCount} aria-hidden="true">
              {category.services.length}
            </span>
          </button>
        ))}
      </div>
    )}
  </>
);

export default CategoryJumpMenu;
