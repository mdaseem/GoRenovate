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
import { signOut, useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";

interface MenuProps {
  children?: React.ReactNode;
}

const Menu: React.FC<MenuProps> = (props: MenuProps) => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state) => state.overlay);

  return (
    <div className="hamburger-menu-container">
      <nav className="header-nav">
        {session && (
          <>
            {!store.isUserListOpen ? (
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
          </>
        )}
        {!store.isOpen && status === "authenticated" ? (
          <Link
            className="header-link-menu"
            href=" "
            onClick={() => {
              dispatch(setOpenMobileMenu(false));
              dispatch(setOpenState(true));
            }}
          >
            WishList
          </Link>
        ) : (
          ""
        )}
      </nav>
    </div>
  );
};

export default Menu;
