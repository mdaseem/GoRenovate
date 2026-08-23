"use client";
import React, { useState } from "react";
import "./SlowLoadBanner.css";

export default function SlowLoadBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="slow-load-banner" role="status">
      <i
        className="fa-solid fa-circle-info slow-load-banner-icon"
        aria-hidden="true"
      />
      <p className="slow-load-banner-text">
        <span className="slow-load-banner-headline">
          Server is waking up — first load can take up to 30 seconds.
        </span>
        <span className="slow-load-banner-detail">
          {" "}
          We run on a free hosting tier that sleeps when idle. Thanks for
          your patience!
        </span>
      </p>
      <button
        type="button"
        className="slow-load-banner-close"
        onClick={() => setIsVisible(false)}
        aria-label="Dismiss notice"
      >
        ✕
      </button>
    </div>
  );
}
