import React from "react";
import styles from "../VendorPage.module.css";

interface CartFabProps {
  totalItems: number;
  formattedTotal: string;
  onClick: () => void;
  // "products" = the shop cart; the default is the services quote cart.
  mode?: "services" | "products";
}

const CartFab: React.FC<CartFabProps> = ({
  totalItems,
  formattedTotal,
  onClick,
  mode = "services",
}) => (
  <button
    className={styles.cartFab}
    onClick={onClick}
    type="button"
    aria-label={
      mode === "products"
        ? `Open cart — ${totalItems} ${totalItems === 1 ? "product" : "products"}, total ${formattedTotal}`
        : `Open quote cart — ${totalItems} services, total ${formattedTotal}`
    }
  >
    <span className={styles.fabIcon} aria-hidden="true">
      🗂️
    </span>
    <span className={styles.fabLabel}>View Cart</span>
    <span className={styles.fabBadge} aria-hidden="true">
      {totalItems}
    </span>
    <span className={styles.fabPrice} aria-hidden="true">
      {formattedTotal}
    </span>
  </button>
);

export default CartFab;
