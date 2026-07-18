"use client";
import React from "react";
import "./Menu.css";
import Image from "next/image";
import MyIcon from "../../../../../public/user_profile.svg";
import {
  setOpenMobileMenu,
  setOpenState,
  setOpenStateUserList,
} from "@/app/store/features/overLaySlice";
import { logout } from "@/app/store/features/authSlice";
import { signOut, useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";

const Menu: React.FC = () => {
  const { data: session, status } = useSession();
  const dispatch = useAppDispatch();
  const store = useAppSelector((state) => state.overlay);

  const closeMenu = () => dispatch(setOpenMobileMenu(false));

  return (
    <div className="account-menu">
      {session && (
        <div className="account-menu-header">
          <Image
            src={session.user?.image || MyIcon}
            alt=""
            width={36}
            height={36}
            className="account-menu-avatar"
          />
          <div className="account-menu-identity">
            <span className="account-menu-name">
              {session.user?.name || "My Account"}
            </span>
            {session.user?.email && (
              <span className="account-menu-email">{session.user.email}</span>
            )}
          </div>
        </div>
      )}

      <div className="account-menu-items">
        {session && !store.isUserListOpen && (
          <button
            type="button"
            role="menuitem"
            className="account-menu-item"
            onClick={() => {
              closeMenu();
              dispatch(setOpenStateUserList(true));
            }}
          >
            Chat
          </button>
        )}

        {!store.isOpen && status === "authenticated" && (
          <button
            type="button"
            role="menuitem"
            className="account-menu-item"
            onClick={() => {
              closeMenu();
              dispatch(setOpenState(true));
            }}
          >
            Wishlist
          </button>
        )}
      </div>

      {session && (
        <>
          <div className="account-menu-divider" role="separator" />
          <button
            type="button"
            role="menuitem"
            className="account-menu-item account-menu-item-danger"
            onClick={() => {
              signOut();
              closeMenu();
              dispatch(logout());
            }}
          >
            <span className="account-menu-item-icon" aria-hidden="true">
              ↪
            </span>
            Logout
          </button>
        </>
      )}
    </div>
  );
};

export default Menu;
