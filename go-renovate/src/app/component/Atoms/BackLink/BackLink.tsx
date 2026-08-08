import React from "react";
import Link from "next/link";
import styles from "./BackLink.module.css";

interface BackLinkProps {
  href: string;
  label: string;
  variant?: "standalone" | "inline";
  className?: string;
}

const BackLink: React.FC<BackLinkProps> = ({
  href,
  label,
  variant = "standalone",
  className,
}) => {
  const isInline = variant === "inline";

  return (
    <Link
      href={href}
      className={`${styles.backLink} ${
        isInline ? styles.backLinkInline : ""
      } ${className ?? ""}`}
      aria-label={label}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M15 6L9 12L15 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {!isInline && <span className={styles.label}>{label}</span>}
    </Link>
  );
};

export default BackLink;
