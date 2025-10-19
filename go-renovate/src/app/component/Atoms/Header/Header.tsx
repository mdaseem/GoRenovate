"use client";
import React from "react";
import "./Header.css";
import Link from "next/link";
import MyIcon from "../../../../../public/user_profile.svg";
import MyHome from "../../../../../public/house_icon.svg";
import Image from "next/image";

export default function Header() {
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
          <li className="list-item">
            <Link className="header-nav-item" href="/Login">
              Login
            </Link>
          </li>
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
                className="profile-icon"
                src={MyIcon}
                alt="My Icon"
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
