import React from "react";
import "./LoginContainer.css";
import LiveBackground from "../../Atoms/LiveBackground/LiveBackground";
import Login from "../../Atoms/Login/Login";

const highlights = [
  "Verified vendors, vetted for quality and reliability",
  "Transparent, itemized quotes — no hidden costs",
  "Real-time chat support from quote to completion",
];

const stats = [
  { value: "2,400+", label: "Projects Completed" },
  { value: "98%", label: "Client Satisfaction" },
  { value: "12+", label: "Years of Expertise" },
];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const LoginContainer: React.FC = () => {
  return (
    <section className="login-container-wrapper">
      <div className="login-children-content1 login-children-content">
        <LiveBackground />
        <div className="login-showcase">
          <p className="login-showcase-eyebrow">✦ Go Renovate</p>
          <h2 className="login-showcase-heading">
            Your Renovation, <em>Simplified.</em>
          </h2>
          <p className="login-showcase-sub">
            Connect with verified vendors, compare transparent quotes, and
            manage your entire renovation from one place.
          </p>

          <ul className="login-showcase-list">
            {highlights.map((text) => (
              <li key={text} className="login-showcase-item">
                <span className="login-showcase-icon">
                  <CheckIcon />
                </span>
                {text}
              </li>
            ))}
          </ul>

          <div className="login-showcase-stats">
            {stats.map((stat) => (
              <div key={stat.label} className="login-showcase-stat">
                <span className="login-showcase-stat-value">
                  {stat.value}
                </span>
                <span className="login-showcase-stat-label">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="login-children-content2 login-children-content">
        <Login />
      </div>
    </section>
  );
};

export default LoginContainer;
