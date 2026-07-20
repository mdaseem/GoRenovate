import React from "react";
import styles from "../VendorPage.module.css";

interface CartFabProps {
  totalItems: number;
  formattedTotal: string;
  onClick: () => void;
}

const CartFab: React.FC<CartFabProps> = ({
  totalItems,
  formattedTotal,
  onClick,
}) => (
  <button
    className={styles.cartFab}
    onClick={onClick}
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
);

export default CartFab;
