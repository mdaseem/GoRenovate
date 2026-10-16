"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { AccountInfo } from "@/app/types/vendorAccount";
import { fetchAccount } from "@/app/utils/vendorAccountApi";

interface AccountInfoState {
  account: AccountInfo | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

// The signed-in account's current role, straight from the server (GET /auth/me). The role is not
// kept in the NextAuth session on purpose: an admin approving a vendor must show up on the next
// visit without logging out and in again.
export function useAccountInfo(): AccountInfoState {
  const { data: session, status } = useSession();
  const token = session?.backendToken;
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !token) {
      setAccount(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    fetchAccount(token, controller.signal)
      .then((info) => setAccount(info))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setAccount(null);
        setError(
          "We couldn't check your account. Please sign in again, or try in a moment.",
        );
        console.error("Failed to load account info:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [status, token, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);

  return { account, isLoading, error, reload };
}
