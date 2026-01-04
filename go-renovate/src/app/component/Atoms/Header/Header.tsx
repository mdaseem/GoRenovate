"use client";
import React, { useEffect } from "react";
import "./Header.css";
import Link from "next/link";
import MyIcon from "../../../../../public/user_profile.svg";
import MyHome from "../../../../../public/house_icon.svg";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { loginRequest, logout } from "@/app/store/features/authSlice";

export default function Header() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const { user, loading, error, token } = useAppSelector((state) => state.auth);
  console.log("Header auth state:", { user, loading, error, token });

  useEffect(() => {
    if (session?.user?.email && token && token != undefined) {
      dispatch(loginRequest({ email: session?.user?.email || "", token: token || "" }));
    }
  }, [session]);
  
  return (
    <header className="header">
      <h1 className="header-title">
        <p className="logo-title">
          <span className="logo-title">GoRe</span>
          <span className="logo-title logo-n">{`n`}</span>
          <span className="logo-title">ovate</span>
        </p>
        <Image
          src={MyHome}
          className="logo-title lolo-icon"
          alt="My Icon"
          width={15}
          height={15}
        />
      </h1>
      <nav className="header-nav">
        <ul className="header-nav-list">
          {session && (
            <li className="list-item logout-item">
              <Link
                className="header-nav-item"
                onClick={() => {
                  signOut();
                  dispatch(logout());
                }}
                href="/"
              >
                Logout
              </Link>
              {/* {loading &&  <div className="loader" />} */}
            </li>
          )}
          <li className="list-item">
            <Link className="header-nav-item" href="/">
              Home
            </Link>
          </li>
          <li className="list-item">
            <Link className="header-nav-item" href="/contact">
              Contact
            </Link>
          </li>
          <li className="list-item">
            <button className="header-nav-profile">
              <Image
                src={session?.user?.image || MyIcon}
                className="profile-icon"
                alt="User Image"
                width={30}
                height={30}
              />
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
