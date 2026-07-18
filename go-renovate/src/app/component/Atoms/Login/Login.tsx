"use client";
import React, { KeyboardEvent } from "react";
import "./Login.css";
import AuthButtons from "../AuthButtons/AuthButtons";
import Link from "next/link";
import { signIn } from "next-auth/react";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password: string) => password.length >= 4;

export default function Login() {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [emailTouched, setEmailTouched] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] =
    React.useState(false);

  const emailError =
    emailTouched && !isValidEmail(email)
      ? "Please enter a valid email address."
      : null;

  const passwordError =
    passwordTouched && !isValidPassword(password)
      ? "Password must be at least 8 characters."
      : null;

  const confirmPasswordError =
    !isLogin && confirmPasswordTouched && confirmPassword !== password
      ? "Passwords do not match."
      : null;

  const isFormValid = isLogin
    ? isValidEmail(email) && isValidPassword(password)
    : isValidEmail(email) &&
      isValidPassword(password) &&
      password === confirmPassword;

  const touchAllFields = () => {
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!isLogin) setConfirmPasswordTouched(true);
  };

  const signInOrSignUp = async () => {
    if (isLogin) {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setFormError("Invalid email or password.");
      }
      return;
    }

    // https://go-renovate-server.onrender.com/signup
    const res = await fetch("https://go-renovate-server.onrender.com/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      setFormError(data?.message || "Signup failed. Please try again.");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (result?.error) {
      setFormError(
        "Account created, but automatic sign-in failed. Please log in.",
      );
    }
  };

  const handleSubmit = async () => {
    touchAllFields();
    if (!isFormValid || isSubmitting) return;
    setFormError(null);
    setIsSubmitting(true);
    try {
      await signInOrSignUp();
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onEnter = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
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
              className={`login-input ${
                emailTouched
                  ? emailError
                    ? "input-error"
                    : "input-success"
                  : ""
              }`}
              placeholder="Enter your email"
              type="email"
              id="email"
              name="email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
            {emailError && (
              <span className="validation-message error-message">
                {emailError}
              </span>
            )}
            {emailTouched && !emailError && email && (
              <span className="validation-message success-message">
                Looks good!
              </span>
            )}
          </label>
          <div className="password-container">
            <label
              className={`login-label password-label ${isLogin ? "expanded" : ""}`}
              htmlFor="password"
            >
              {`Password `}
              <input
                className={`login-input ${
                  passwordTouched
                    ? passwordError
                      ? "input-error"
                      : "input-success"
                    : ""
                }`}
                placeholder="Enter your password"
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                onKeyDown={(e) => onEnter(e)}
                required
              />
              {passwordError && (
                <span className="validation-message error-message">
                  {passwordError}
                </span>
              )}
              {passwordTouched && !passwordError && password && (
                <span className="validation-message success-message">
                  Strong password!
                </span>
              )}
            </label>
            <label
              className={`login-label ${isLogin ? "hide-label" : ""}`}
              htmlFor="confirm-password"
            >
              {`Confirm Password `}
              <input
                className={`login-input ${
                  confirmPasswordTouched
                    ? confirmPasswordError
                      ? "input-error"
                      : "input-success"
                    : ""
                }`}
                placeholder="Enter your password"
                type="password"
                id="confirm-password"
                name="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setConfirmPasswordTouched(true)}
                onKeyDown={(e) => onEnter(e)}
                required
              />
              {confirmPasswordError && (
                <span className="validation-message error-message">
                  {confirmPasswordError}
                </span>
              )}
              {confirmPasswordTouched &&
                !confirmPasswordError &&
                confirmPassword && (
                  <span className="validation-message success-message">
                    Passwords match!
                  </span>
                )}
            </label>
          </div>
        </form>
        <div className="submit-buttons-container">
          <button
            className={`login-submit submit-buttons ${!isFormValid || isSubmitting ? "btn-disabled" : ""}`}
            disabled={!isFormValid || isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "..." : isLogin ? "Login" : "Signup"}
          </button>
          {formError && (
            <span className="validation-message error-message">
              {formError}
            </span>
          )}
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
            onClick={() => {
              setIsLogin(!isLogin);
              setFormError(null);
            }}
          >
            {isLogin ? "Signup" : "Login"}
          </Link>
        </div>
      </div>
    </div>
  );
}
