import React from "react";
import "./ProductTile.style.css";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
// import { Link } from "react-router-dom";
// import FavoriteIcon from "../FavoriteIcon/FavoriteIcon";

type propType = {
  product: {
    description: string,
    actualPrice: number,
    discountPrice: number,
    rating: number,
    imageUrl: string | StaticImport
  }
}

function ProductTile(props:propType) {
  const { product} = props;
  return (
    <div className="tile-container">
      {/* <FavoriteIcon /> */}
      <div className="tile-sub-container">
        <div className="img-container">
          {/* <Link to={"/productPage"}> */}
            <Image className="product-img" src={product.imageUrl} alt="product bag" width={230} height={220} />
          {/* </Link> */}
        </div>
        <div className="details-container">
          <p className="details-items prod-description">
           {product.description}
          </p>
          <p className="details-items prod-price-discount">{product.discountPrice} Rs</p>
          <p className="details-items prod-price-actual">{product.actualPrice} Rs</p>
          <div className="price-strike-line" />
          <p className="details-items">rating:{product.rating}</p>
        </div>
      </div>
      <div className="prod-button-container">
        <button className="buy-prod">Buy now</button>
      </div>
    </div>
  );
}

export default ProductTile;
