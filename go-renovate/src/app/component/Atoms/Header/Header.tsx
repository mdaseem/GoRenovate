"use client";
import React, { useEffect, useRef } from "react";
import "./Header.css";
import MyIcon from "../../../../../public/user_profile.svg";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { setOpenMobileMenu } from "@/app/store/features/overLaySlice";
import SearchBar from "../SearchBar/SearchBar";
import Overlay from "../../HOC/Overlay/Overlay";
import Menu from "../Menu/Menu";

export default function Header() {
  const { data: session } = useSession();
  const dispatch = useAppDispatch();
  const isMobileMenuOpen = useAppSelector(
    (state: RootState) => state.overlay.isMobileMenuOpen,
  );
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const wasMenuOpenRef = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (wasMenuOpenRef.current && !isMobileMenuOpen) {
      profileButtonRef.current?.focus();
    }
    wasMenuOpenRef.current = isMobileMenuOpen;
  }, [isMobileMenuOpen]);

  // Publish the real, responsive header height so other fixed/sticky UI
  // (e.g. VendorPage's sticky category headings) can offset below it
  // instead of relying on a guessed pixel value.
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const publishHeight = () => {
      const height = node.offsetHeight;
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${height}px`,
      );
      window.dispatchEvent(
        new CustomEvent<number>("site-header-resize", { detail: height }),
      );
    };

    publishHeight();

    const resizeObserver = new ResizeObserver(publishHeight);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <header className="header" ref={headerRef}>
      <h1 className="header-title">
        <Image
          //  loading="lazy"
          priority={true}
          src="/MyLogo.gif"
          alt="logo"
          className="logo-image"
          width={180}
          height={80}
        />
      </h1>
      <div className="search-bar">{session && <SearchBar />}</div>
      <nav className="header-nav">
        <ul className="header-nav-list">
          <li className="list-item">
            <div className="header-profile-menu-wrapper">
              <button
                type="button"
                ref={profileButtonRef}
                className="header-nav-profile"
                aria-haspopup="menu"
                aria-expanded={isMobileMenuOpen}
                aria-controls="account-menu"
                aria-label={session ? "Account menu" : "Account and login menu"}
                onClick={() => dispatch(setOpenMobileMenu(!isMobileMenuOpen))}
              >
                <Image
                  src={session?.user?.image || MyIcon}
                  className="profile-icon"
                  alt=""
                  width={32}
                  height={32}
                />
              </button>
              <Overlay
                id="account-menu"
                isDisable={false}
                isOpen={isMobileMenuOpen}
                setIsOpen={(payload) => dispatch(setOpenMobileMenu(payload))}
                shouldReturnNull={!isMobileMenuOpen}
                variant="menu"
              >
                <Menu />
              </Overlay>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
}
