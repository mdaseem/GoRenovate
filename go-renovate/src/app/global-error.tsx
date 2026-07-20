"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application crashed:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textAlign: "center",
          padding: 24,
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', sans-serif",
          background: "#f4faf4",
          color: "#0d1a0d",
        }}
      >
        <p style={{ fontSize: 28, margin: 0 }}>⚠</p>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>
          Something went wrong
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#4a6350",
            maxWidth: 420,
            margin: 0,
          }}
        >
          The application ran into an unexpected error. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 12,
            padding: "10px 22px",
            border: "none",
            borderRadius: 8,
            background: "#07e207",
            color: "#0d1a0d",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
