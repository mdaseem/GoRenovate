"use client";

import React from "react";
import Link from "next/link";
import "./ErrorState.css";

type propType = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  href?: string;
  variant?: "page" | "inline";
  icon?: string;
  role?: "alert" | "status";
};

function ErrorState({
  title = "Something went wrong",
  message = "Please try again in a moment.",
  actionLabel = "Try again",
  onAction,
  href,
  variant = "inline",
  icon = "⚠",
  role = "alert",
}: propType) {
  return (
    <div className={`error-state error-state-${variant}`} role={role}>
      <p className="error-state-icon" aria-hidden="true">
        {icon}
      </p>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {href ? (
        <Link href={href} className="error-state-action">
          {actionLabel}
        </Link>
      ) : onAction ? (
        <button
          type="button"
          className="error-state-action"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default ErrorState;
