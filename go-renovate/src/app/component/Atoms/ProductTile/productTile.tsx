import React from "react";
import "./ProductTile.style.css";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import MyFavorites from "../MyFavorites/view/MyFavorites.view";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";

type productType = {
  id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string | StaticImport;
} | null;

type propType = {
  product: productType;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setProduct: React.Dispatch<React.SetStateAction<productType>>;
};

function ProductTile(props: propType) {
  const { product } = props;
  const favList = useSelector((state: RootState) => state.favoriteList);
  const isFav = favList?.filter(
    (favprod: productType) => favprod?.id === product?.id
  );
  return (
    <div className="tile-container">
      {/* <FavoriteIcon /> */}
      <div className="tile-sub-container">
        <div className="img-container">
          <Image
            className="product-img"
            src={product?.imageUrl || ""}
            alt="product bag"
            width={230}
            height={220}
          />
        </div>
        <div className="details-container">
          <p className="details-items prod-description">
            {product?.description}
          </p>
          <p className="details-items prod-price-discount">
            {product?.discountPrice} Rs
          </p>
          <p className="details-items prod-price-actual">
            {product?.actualPrice} Rs
          </p>
          <div className="price-strike-line" />
          <p className="details-items">rating:{product?.rating}</p>
          <MyFavorites prodData={product} isFav={isFav.length ? true : false} />
        </div>
      </div>
      <div className="prod-button-container">
        <button
          onClick={() => {
            props.setIsOpen(true);
            props.setProduct(props.product);
          }}
          className="buy-prod"
        >
          Buy now
        </button>
      </div>
    </div>
  );
}

export default ProductTile;
