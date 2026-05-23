"use client";
import React, { useEffect } from "react";
import "./Header.css";
import MyIcon from "../../../../../public/user_profile.svg";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { loginRequest } from "@/app/store/features/authSlice";
import { setOpenMobileMenu } from "@/app/store/features/overLaySlice";
import SearchBar from "../SearchBar/SearchBar";

export default function Header() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (session?.user?.email && store.token && store.token != undefined) {
      dispatch(
        loginRequest({
          email: session?.user?.email || "",
          password: "",
          token: store.token || "",
        }),
      );
    }
  }, [session]);

  return (
    <header className="header">
      <h1 className="header-title">
        <Image
          //  loading="lazy"
          priority={true}
          src="/MyLogo.gif"
          alt="logo"
          width={180}
          height={80}
        />
      </h1>
      <div className="search-bar">{session && <SearchBar />}</div>
      <nav className="header-nav">
        <ul className="header-nav-list">
          <li className="list-item">
            {session && (
              <button className="header-nav-profile">
                <Image
                  src={session?.user?.image || MyIcon}
                  onClick={() => dispatch(setOpenMobileMenu(true))}
                  className="profile-icon"
                  alt="User Image"
                  width={30}
                  height={30}
                />
              </button>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
