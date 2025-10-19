"use client";
import React from "react";
import "./AuthButtons.css";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import GoogleIcon from "../../../../../public/google_icon.svg";

export default function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  console.log("session -", session?.user);

  return session ? (
    <div>
      <p>Welcome, {session.user?.name}</p>
      <button className="auth-button" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  ) : (
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
  );
}
