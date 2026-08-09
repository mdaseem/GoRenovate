"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./BackLink.module.css";

interface BackLinkProps {
  variant?: "standalone" | "inline";
  className?: string;
}

const BackLink: React.FC<BackLinkProps> = ({
  variant = "standalone",
  className,
}) => {
  const router = useRouter();
  const isInline = variant === "inline";

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  }, [router]);

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`${styles.backLink} ${
        isInline ? styles.backLinkInline : ""
      } ${className ?? ""}`}
      aria-label="Go back"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M15 6L9 12L15 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
};

export default BackLink;
