import React from "react";
import "./Overlay.style.css";
import Image from "next/image";
import MyHome from "../../../../../public/house_icon.svg";

type PropsType = {
  children?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDisable: boolean;
  isLoginPage?: boolean;
  shouldReturnNull?: boolean;
};

function Overlay(props: PropsType) {
  if (props.shouldReturnNull) return;
  if (props.isDisable) {
    return <>{props.children}</>;
  }
  return (
    <div
      className={` product-detail-page-container product-overlay ${
        props.isOpen ? "open" : ""
      }`}
    >
      <div className="overlay-sub-container">
        <div className="overlay-header-container">
          <div className="header-back">
            {props.isLoginPage ? null : (
              <button
                className="go-back"
                onClick={() => props.setIsOpen(false)}
              >
                <Image src="/back.svg" width={20} height={20} alt="Back" />
              </button>
            )}
          </div>
          <div className="temp-space" />
        </div>
        <div className="overlay-content">{props.children}</div>
      </div>
    </div>
  );
}

export default Overlay;
