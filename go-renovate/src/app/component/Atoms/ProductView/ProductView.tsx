"use client";
import React from "react";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { ImageCarousel } from "../../Molecules/ImageCarousel/ImageCarousel";
type productType = {
  id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

type PropsType = {
  product: productType;
};

function ProductView(props: PropsType) {
  return (
    <div className="product-container-in-overlay">
      <div className="product-detail-page-content">
        {props.product?.imageUrl && (
          <ImageCarousel imageUrl={props.product?.imageUrl || []} />
        )}
      </div>
    </div>
  );
}

export default ProductView;
