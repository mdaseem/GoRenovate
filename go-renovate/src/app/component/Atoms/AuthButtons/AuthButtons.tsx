"use client";
import React from "react";
import "./AuthButtons.css";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import GoogleIcon from "../../../../../public/google_icon.svg";
import { useRequireAuth } from "../../HOC/RequireAuth/useRequireAuth";

export default function AuthButtons() {
  const { data: session, status } = useSession();
  const { isLoading } = useRequireAuth();
  const [isLogin, setIsLogin] = React.useState(false);

  const renderSignin = (shouldLoad: boolean) => {
    return (
      <div className="auth-button-container">
        <button className="auth-button" onClick={() => signIn("google")}>
          <p className="signin-text">{`Sign in with Google`}</p>
          <Image
            className="signin-text"
            src={GoogleIcon}
            alt="Google Icon"
            height={16}
            width={16}
          />
        </button>
        {shouldLoad && <div className="loader" />}
      </div>
    );
  };
  if (status === "loading") return renderSignin(true);

  return session ? (
    <div>
      <p>Welcome, {session.user?.name}</p>
      <button
        className="auth-button"
        onClick={() => {
          signOut();
          setIsLogin(true);
        }}
      >
        Sign out
      </button>
    </div>
  ) : (
    renderSignin(false)
  );
}
