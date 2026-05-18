import React from "react";
import "./ProductTile.style.css";
import Image from "next/image";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import MyFavorites from "../MyFavorites/view/MyFavorites.view";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";
import Link from "next/link";

type productType = {
  _id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string | StaticImport;
} | null;

type propType = {
  isForSearch?: boolean;
  product: productType;
  setIsOpen: (payload: boolean) => void;
  setProduct: React.Dispatch<React.SetStateAction<productType>>;
};

function ProductTile(props: propType) {
  const { product } = props;
  const favList = useSelector((state: RootState) => state.favoriteList);
  const isFav = favList?.filter(
    (favprod: productType) => favprod?._id === product?._id,
  );

  const FullStar = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M5.825 21L7.45 13.975L2 9.25L9.2 8.625L12 2L14.8 8.625L22 9.25L16.55 13.975L18.175 21L12 17.275L5.825 21Z"
        fill="#FFCD29"
      />
    </svg>
  );

  const rateStar = () => {
    const stars = [];
    for (let i = 0; i < (product?.rating || 0); i++) {
      stars.push(<FullStar key={i} />);
    }
    return stars;
  };

  return (
    <div className="tile-container">
      {/* <FavoriteIcon /> */}
      <div className="tile-sub-container">
        <Link href="" className="img-container">
          <Image
            className="product-img"
            src={product?.imageUrl || ""}
            alt="product bag"
            width={230}
            height={220}
          />
        </Link>
        <div className="details-container">
          <p className="details-items prod-description">
            {product?.description}
          </p>
          {/* <p className="details-items prod-price-discount">
            {product?.discountPrice} Rs
          </p> */}
          {/* <p className="details-items prod-price-actual">
            {product?.actualPrice} Rs
          </p> */}
          <div className="price-strike-line" />
          <p className="details-items">{rateStar()}</p>
          {!props.isForSearch && (
            <MyFavorites
              prodData={product}
              isFav={isFav.length ? true : false}
            />
          )}
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
          View
        </button>
      </div>
    </div>
  );
}

export default ProductTile;
