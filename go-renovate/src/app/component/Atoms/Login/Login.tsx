"use client";
import React from "react";
import "./Login.css";
import AuthButtons from "../AuthButtons/AuthButtons";

export default function Login() {
  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">
          <p className="login-subtitle">{`Let's `}</p>
          <p className="login-subtitle go-title">Go</p>
          <p className="login-subtitle">Renovate</p>
        </h2>
        <form className="login-form">
          <label className="login-label" htmlFor="email">
            {`Email `}
            <input
              className="login-input"
              placeholder="Enter your email"
              type="email"
              id="email"
              name="email"
              required
            />
          </label>
          <label className="login-label" htmlFor="password">
            {`Password `}
            <input
              className="login-input"
              placeholder="Enter your password"
              type="password"
              id="password"
              name="password"
              required
            />
          </label>
          <AuthButtons />
        </form>
      </div>
    </div>
  );
}
