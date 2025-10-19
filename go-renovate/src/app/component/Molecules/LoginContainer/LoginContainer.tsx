import React from "react";
import "./LoginContainer.css";
import LiveBackground from "../../Atoms/LiveBackground/LiveBackground";
import Login from "../../Atoms/Login/Login";



export const LoginContainer: React.FC = () => {
  return (
    <section className="login-container-wrapper">
      <div className="login-children-content1 login-children-content"><LiveBackground /></div>
      <div className="login-children-content2 login-children-content">
          <Login />
      </div>
    </section>
  );
};
