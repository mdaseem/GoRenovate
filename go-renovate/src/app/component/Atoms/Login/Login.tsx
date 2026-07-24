"use client";
import React, { FormEvent } from "react";
import "./Login.css";
import AuthButtons from "../AuthButtons/AuthButtons";
import { signIn } from "next-auth/react";

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPassword = (password: string) => password.length >= 8;

function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export default function Login() {
  const [isLogin, setIsLogin] = React.useState(true);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

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

    const res = await fetch(`${process.env.NEXT_PUBLIC_EXPRESS_API_URL}/signup`, {
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

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit();
  };

  const toggleMode = () => {
    setIsLogin((prev) => !prev);
    setFormError(null);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">
          {"Let's "}
          <span className="go-title">Go</span>
          {" Renovate"}
        </h2>

        <AuthButtons />

        <div className="or-line" role="separator">
          <div className="line" />
          <p className="or-para">or continue with email</p>
          <div className="line" />
        </div>

        <form className="login-form" onSubmit={onFormSubmit} noValidate>
          <div className="form-field">
            <label className="login-label" htmlFor="email">
              Email
            </label>
            <input
              className={`login-input ${
                emailTouched
                  ? emailError
                    ? "input-error"
                    : "input-success"
                  : ""
              }`}
              placeholder="you@example.com"
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              required
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
            />
            {emailError && (
              <span
                id="email-error"
                role="alert"
                className="validation-message error-message"
              >
                {emailError}
              </span>
            )}
            {emailTouched && !emailError && email && (
              <span className="validation-message success-message">
                Looks good!
              </span>
            )}
          </div>

          <div className="password-container">
            <div className="form-field password-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  className={`login-input ${
                    passwordTouched
                      ? passwordError
                        ? "input-error"
                        : "input-success"
                      : ""
                  }`}
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  required
                  aria-invalid={!!passwordError}
                  aria-describedby={
                    passwordError ? "password-error" : undefined
                  }
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setPasswordTouched(true)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && (
                <span
                  id="password-error"
                  role="alert"
                  className="validation-message error-message"
                >
                  {passwordError}
                </span>
              )}
              {passwordTouched && !passwordError && password && (
                <span className="validation-message success-message">
                  Strong password!
                </span>
              )}
            </div>

            <div
              className={`form-field password-field ${
                isLogin ? "hide-field" : ""
              }`}
            >
              <label className="login-label" htmlFor="confirm-password">
                Confirm password
              </label>
              <div className="password-input-wrapper">
                <input
                  className={`login-input ${
                    confirmPasswordTouched
                      ? confirmPasswordError
                        ? "input-error"
                        : "input-success"
                      : ""
                  }`}
                  placeholder="Re-enter your password"
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  name="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  required={!isLogin}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby={
                    confirmPasswordError ? "confirm-password-error" : undefined
                  }
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmPasswordTouched(true)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {confirmPasswordError && (
                <span
                  id="confirm-password-error"
                  role="alert"
                  className="validation-message error-message"
                >
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
            </div>
          </div>

          <div className="submit-buttons-container">
            <button
              type="submit"
              className={`login-submit submit-buttons ${
                !isFormValid || isSubmitting ? "btn-disabled" : ""
              }`}
              disabled={!isFormValid || isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </>
              ) : isLogin ? (
                "Login"
              ) : (
                "Signup"
              )}
            </button>
            {formError && (
              <span role="alert" className="validation-message error-message">
                {formError}
              </span>
            )}
          </div>
        </form>

        <div className="link-buttons">
          <p>{isLogin ? "New here?" : "Already a user?"}</p>
          <button type="button" className="signup-submit" onClick={toggleMode}>
            {isLogin ? "Signup" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
