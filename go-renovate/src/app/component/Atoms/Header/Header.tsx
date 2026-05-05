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
import {
  setOpenState,
  setOpenStateLogin,
  setOpenStateUserList,
} from "@/app/store/features/overLaySlice";

export default function Header() {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state) => state);

  useEffect(() => {
    if (
      session?.user?.email &&
      store.auth.token &&
      store.auth.token != undefined
    ) {
      dispatch(
        loginRequest({
          email: session?.user?.email || "",
          password: "",
          token: store.auth.token || "",
        }),
      );
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
            <>
              {!store.overlay.isUserListOpen ? (
                <li className="list-item logout-item">
                  <Link
                    onClick={() => dispatch(setOpenStateUserList(true))}
                    className="header-nav-item"
                    href=""
                  >
                    Chat
                  </Link>
                </li>
              ) : (
                ""
              )}
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
            </>
          )}
          {/* {status === "authenticated" || store.overlay.isOpenLogin ? null : (
            <li className="list-item">
              <Link
                onClick={() => dispatch(setOpenStateLogin(true))}
                className="header-nav-item"
                href=""
              >
                Login
              </Link>
            </li>
          )} */}
          {!store.overlay.isOpen && status === "authenticated" ? (
            <li className="list-item">
              <Link
                className="header-nav-item1"
                href=" "
                onClick={() => dispatch(setOpenState(true))}
              >
                WishList
                {store.favoriteList.length > 0 && (
                  <p className="fav-count">{store.favoriteList.length}</p>
                )}
              </Link>
            </li>
          ) : (
            ""
          )}
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
