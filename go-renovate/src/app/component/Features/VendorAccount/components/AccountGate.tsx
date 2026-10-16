"use client";

import React from "react";
import { useSession } from "next-auth/react";
import styles from "../VendorAccount.module.css";
import BackLink from "@/app/component/Atoms/BackLink/BackLink";
import ErrorState from "@/app/component/Atoms/ErrorState/ErrorState";
import { useAccountInfo } from "@/app/component/CustomHooks/useAccountInfo";
import { useAppDispatch } from "@/app/store/hooks";
import { setOpenStateLogin } from "@/app/store/features/overLaySlice";
import { AccountInfo } from "@/app/types/vendorAccount";

interface AccountGateProps {
  heading: string;
  intro?: string;
  wide?: boolean;
  signedOutTitle: string;
  signedOutMessage: string;
  // Rendered once we know who the signed-in account is and what role it has.
  children: (account: AccountInfo, token: string) => React.ReactNode;
}

// Shared shell for the vendor-account pages: back link, the page's single h1, and the three states
// every one of them has before real content (still loading, signed out, couldn't check the account).
const AccountGate: React.FC<AccountGateProps> = ({
  heading,
  intro,
  wide,
  signedOutTitle,
  signedOutMessage,
  children,
}) => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const { account, error, reload } = useAccountInfo();
  const token = session?.backendToken;

  let body: React.ReactNode;
  if (status === "unauthenticated") {
    body = (
      <ErrorState
        variant="inline"
        role="status"
        icon="🔒"
        title={signedOutTitle}
        message={signedOutMessage}
        actionLabel="Sign in"
        onAction={() => dispatch(setOpenStateLogin(true))}
      />
    );
  } else if (status === "authenticated" && error) {
    body = (
      <ErrorState
        variant="inline"
        title="We couldn't check your account"
        message={error}
        actionLabel="Try again"
        onAction={reload}
      />
    );
  } else if (account && token) {
    body = children(account, token);
  } else {
    body = (
      <div className={styles.skeleton} role="status" aria-label="Loading">
        <div className={styles.skeletonBlock} />
        <div className={styles.skeletonBlock} />
      </div>
    );
  }

  return (
    <div className={`${styles.page} ${wide ? styles.pageWide : ""}`}>
      <BackLink className={styles.backLink} />
      <h1 className={styles.heading}>{heading}</h1>
      {intro && <p className={styles.intro}>{intro}</p>}
      {body}
    </div>
  );
};

export default AccountGate;
