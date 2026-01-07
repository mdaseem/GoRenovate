"use client";
import React from "react";
import "./AuthButtons.css";

import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import GoogleIcon from "../../../../../public/google_icon.svg";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  const dispatch = useAppDispatch();

  const renderSignin = (shouldLoad: boolean) => {
    return (
      <div className="auth-button-container">
        <button
          className="auth-button"
          onClick={() => {
            signIn("google");
          }}
        >
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

  return !session ? renderSignin(false) : null;
}
