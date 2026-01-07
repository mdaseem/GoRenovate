import React from "react";
import "./ProductPage.style.css";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

type PropsType = {
  product: {
    description: string;
    actualPrice: number;
    discountPrice: number;
    rating: number;
    imageUrl: string | StaticImport;
  } | null;
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
        Back
      </button>
      <div className="product-detail-page-content">
        {props.product?.imageUrl && (
          <Image
            className="product-img"
            src={props.product?.imageUrl.toString() || ""}
            alt="product bag"
            width={230}
            height={220}
          />
        )}
        <div className="product-detail-info">
          <p className="prod-description">{props.product?.description}</p>
          <p className="prod-price-discount">
            {props.product?.discountPrice} Rs
          </p>
          <p className="prod-price-actual">{props.product?.actualPrice} Rs</p>
          <div className="price-strike-line" />
          <p className="prod-rating">Rating: {props.product?.rating}</p>
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
