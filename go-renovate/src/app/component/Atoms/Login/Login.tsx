"use client";
import React from "react";
import "./Login.css";
import AuthButtons from "../AuthButtons/AuthButtons";
import Link from "next/link";

export default function Login() {
  const [isLogin, setIsLogin] = React.useState(true);
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
          <div className="password-container">
            <label
              className={`login-label password-label ${
                isLogin ? "expanded" : ""
              }`}
              htmlFor="password"
            >
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
            <label
              className={`login-label ${isLogin ? "hide-label" : ""}`}
              htmlFor="confirm-password"
            >
              {`Confirm Password `}
              <input
                className="login-input"
                placeholder="Enter your password"
                type="password"
                id="confirm-password"
                name="confirm-password"
                required
              />
            </label>
          </div>
          <div className="submit-buttons-container">
            <button className="login-submit submit-buttons" type="submit">
              {isLogin ? "Login" : "Signup"}
            </button>
            <div className="or-line">
              <div className="line" />
              <p className="or-para">or</p>
            </div>
            <AuthButtons />
            <div className="link-buttons">
              {isLogin ? <p>new here ?</p> : "already a user ?"}
              <Link
                href=""
                className="signup-submit"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Signup" : "Login"}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
