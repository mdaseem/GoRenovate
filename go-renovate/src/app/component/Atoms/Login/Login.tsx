"use client";
import React, { KeyboardEvent } from "react";
import "./Login.css";
import AuthButtons from "../AuthButtons/AuthButtons";
import Link from "next/link";
import { useAppDispatch } from "@/app/store/hooks";
import { SignupRequest } from "@/app/store/features/authSlice";
import { signIn, useSession } from "next-auth/react";

export default function Login() {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const dispatch = useAppDispatch();
  const { data: session } = useSession();

  const signInOrSignUp = async () => {
    if (isLogin) {
      await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
    } else if (!isLogin && password === confirmPassword) {
      dispatch(
        SignupRequest({
          email: email,
          password: "password",
        }),
      );
    }
  };

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      signInOrSignUp();
    }
  };
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
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => onEnter(e)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => onEnter(e)}
                required
              />
            </label>
          </div>
        </form>
        <div className="submit-buttons-container">
          <button
            className="login-submit submit-buttons"
            onClick={async () => {
              await signInOrSignUp();
            }}
          >
            {isLogin ? "Login" : "Signup"}
          </button>
          {/* {!session?.loading ? <div className="loader" /> : null} */}
          <div className="or-line">
            <div className="line" />
            <p className="or-para">or</p>
          </div>
          <AuthButtons />
        </div>
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
    </div>
  );
}
