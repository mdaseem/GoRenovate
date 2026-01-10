import React from "react";
import "./ProductPage.style.css";
import Image from "next/image";

type PropsType = {
  children?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDisable: boolean;
  isLoginPage?: boolean;
};

function ProductPage(props: PropsType) {
  if(props.isDisable) {
    return <>{props.children}</>;
  }
  return (
    <div
      className={` product-detail-page-container product-overlay ${
        props.isOpen ? "open" : ""
      }`}
    >
      {props.isLoginPage ? null : (<button className="go-back" onClick={() => props.setIsOpen(false)}>
        <Image src="/back.svg" width={20} height={20} alt="Back" />
      </button>)}
      <div className="overlay-content">{props.children}</div>
    </div>
  );
}

export default ProductPage;
