import React from "react";
import "./ProductPage.style.css";
import Image from "next/image";

type PropsType = {
  children?: React.ReactNode;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function ProductPage(props: PropsType) {
  return (
    <div
      className={` product-detail-page-container product-overlay ${
        props.isOpen ? "open" : ""
      }`}
    >
      <button className="go-back" onClick={() => props.setIsOpen(false)}>
        <Image src="/back.svg" width={20} height={20} alt="Back" />
      </button>
      <div className="overlay-content">{props.children}</div>
    </div>
  );
}

export default ProductPage;
