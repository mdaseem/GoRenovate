import React from "react";
import "./VendorCard.style.css";
import Image from "next/image";
import MyFavorites from "../MyFavorites/view/MyFavorites.view";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";
import Link from "next/link";

type vendorType = {
  id: number;
  name: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

type propType = {
  isForSearch?: boolean;
  vendor: vendorType;
  setIsOpen: (payload: boolean) => void;
  setProduct: React.Dispatch<React.SetStateAction<vendorType>>;
};

function VendorCard(props: propType) {
  const { vendor } = props;
  const imageUrl = vendor?.imageUrl?.[0] || "";
  const favList = useSelector((state: RootState) => state.favoriteList);
  const isFav = favList?.filter(
    (favVendor: vendorType) => favVendor?.id === vendor?.id,
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
    for (let i = 0; i < (vendor?.rating || 0); i++) {
      stars.push(<FullStar key={i} />);
    }
    return stars;
  };

  return (
    <div key={vendor?.id} className="vendor-card">
      <Link
        href={`/products/${vendor?.id}`}
        className="vendor-card-img-link"
        aria-hidden="true"
        tabIndex={-1}
      >
        {imageUrl ? (
          <Image
            className="vendor-card-img"
            src={imageUrl}
            alt=""
            width={160}
            height={160}
          />
        ) : (
          <Image
            className="vendor-card-img"
            src="/house.jpg"
            alt="this is placeholder image"
            width={160}
            height={160}
          />
        )}
      </Link>

      <div className="vendor-card-details">
        <div className="vendor-card-top">
          <p className="vendor-card-name">{vendor?.name}</p>
          {!props.isForSearch && (
            <MyFavorites
              prodData={vendor}
              isFav={isFav.length ? true : false}
            />
          )}
        </div>
        <p className="vendor-card-rating">{rateStar()}</p>
      </div>

      <div className="vendor-card-action">
        <Link
          href={`/products/${vendor?.id}`}
          className="vendor-card-view-btn"
          aria-label={`View ${vendor?.name ?? "vendor"}`}
          onClick={() => props.setProduct(props.vendor)}
        >
          View
        </Link>
      </div>
    </div>
  );
}

export default VendorCard;
