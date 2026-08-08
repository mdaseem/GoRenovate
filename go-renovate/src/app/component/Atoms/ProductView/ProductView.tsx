"use client";
import React from "react";
import { Vendor } from "../../VendorPage/vendor";

type PropsType = {
  product: Vendor | null;
};

function ProductView(props: PropsType) {
  return (
    <div className="product-container-in-overlay">
      <div className="product-detail-page-content">
        {props.product?.name && <h2>{props.product.name}</h2>}
      </div>
    </div>
  );
}

export default ProductView;
