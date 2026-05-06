"use client";
import React from "react";
import "./Menu.css";
import Link from "next/link";
import {
  setOpenMobileMenu,
  setOpenState,
  setOpenStateUserList,
} from "@/app/store/features/overLaySlice";
import { logout } from "@/app/store/features/authSlice";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import MyIcon from "../../../../../public/user_profile.svg";

interface MenuProps {
  children?: React.ReactNode;
}

const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state) => state);

  return (
    <div className="hamburger-menu-container">
      <nav className="header-nav">
        {session && (
          <>
            {!store.overlay.isUserListOpen ? (
              <Link
                onClick={() => {
                  dispatch(setOpenMobileMenu(false));
                  dispatch(setOpenStateUserList(true));
                }}
                className="header-link-menu"
                href=""
              >
                Chat
              </Link>
            ) : (
              ""
            )}
            <Link
              className="header-link-menu"
              onClick={() => {
                signOut();
                dispatch(setOpenMobileMenu(false));
                dispatch(logout());
              }}
              href="/"
            >
              Logout
            </Link>
            {/* {loading &&  <div className="loader" />} */}
          </>
        )}
        {!store.overlay.isOpen && status === "authenticated" ? (
          <Link
            className="header-link-menu"
            href=" "
            onClick={() => {
              dispatch(setOpenMobileMenu(false));
              dispatch(setOpenState(true));
            }}
          >
            WishList
            {/* {store.favoriteList.length > 0 && (
              <p className="fav-count">{store.favoriteList.length}</p>
            )} */}
          </Link>
        ) : (
          ""
        )}
        {/* <div>
              <button className="header-nav-profile header-link-menu">
                <Image
                  src={session?.user?.image || MyIcon}
                  className="profile-icon"
                  alt="User Image"
                  width={30}
                  height={30}
                />
              </button>

              </div> */}
      </nav>
    </div>
  );
};

export default Menu;
