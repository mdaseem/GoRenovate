import React from "react";
import styles from "../VendorPage.module.css";

interface ToastProps {
  text: string;
}

const Toast: React.FC<ToastProps> = ({ text }) => (
  <div className={styles.toast} role="status" aria-live="polite">
    {text}
  </div>
);

export default Toast;
