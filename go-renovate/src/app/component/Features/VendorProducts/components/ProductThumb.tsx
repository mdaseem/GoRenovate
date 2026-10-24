"use client";

import React, { useState } from "react";
import Image from "next/image";
import styles from "../VendorProducts.module.css";
import { PRODUCT_PLACEHOLDER_IMAGE } from "@/app/utils/productFacts";
import { productImageProps } from "@/app/utils/productImage";

// A product's main picture in the vendor and owner lists. A product without a photo shows the default
// picture with a small "No photo yet" caption; a picture that fails to load falls back to the same default.
const ProductThumb: React.FC<{ imageUrl: string | null }> = ({ imageUrl }) => {
  const [failed, setFailed] = useState(false);
  const showReal = Boolean(imageUrl) && !failed;
  return (
    <div className={styles.thumbBox}>
      <Image
        src={showReal ? (imageUrl as string) : PRODUCT_PLACEHOLDER_IMAGE}
        alt=""
        width={84}
        height={84}
        {...productImageProps(showReal ? (imageUrl as string) : PRODUCT_PLACEHOLDER_IMAGE)}
        className={styles.thumb}
        onError={() => setFailed(true)}
      />
      {!showReal && <span className={styles.thumbCaption}>No photo yet</span>}
    </div>
  );
};

export default ProductThumb;
