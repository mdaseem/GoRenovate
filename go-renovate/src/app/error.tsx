"use client";

import { useEffect } from "react";
import ErrorState from "./component/Atoms/ErrorState/ErrorState";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <ErrorState
      variant="page"
      title="Something went wrong"
      message="We hit a snag loading this page. Please try again."
      actionLabel="Try again"
      onAction={reset}
    />
  );
}
