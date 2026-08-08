import React from "react";
import "./VendorCard.style.css";
import MyFavorites from "../MyFavorites/view/MyFavorites.view";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";
import Link from "next/link";
import { Vendor } from "../../VendorPage/vendor";

type propType = {
  isForSearch?: boolean;
  vendor: Vendor | null;
  setIsOpen: (payload: boolean) => void;
  setProduct: React.Dispatch<React.SetStateAction<Vendor | null>>;
};

const AVATAR_PALETTE = [
  { bg: "#eef7ea", fg: "#1f6b25" },
  { bg: "#fdf1df", fg: "#8a5a12" },
  { bg: "#eef2fc", fg: "#33499e" },
  { bg: "#fdeef0", fg: "#a13a53" },
  { bg: "#f1f0fb", fg: "#5a4aa6" },
  { bg: "#e9f7f5", fg: "#187266" },
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getAvatarStyle(key: string) {
  return AVATAR_PALETTE[hashString(key) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const FullStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5.825 21L7.45 13.975L2 9.25L9.2 8.625L12 2L14.8 8.625L22 9.25L16.55 13.975L18.175 21L12 17.275L5.825 21Z"
      fill="#FFCD29"
    />
  </svg>
);

const VerifiedIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#278b2e" />
    <path
      d="M7.5 12.5L10.5 15.5L16.5 9"
      stroke="#fff"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 22s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const ClockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 7v5l3.5 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function VendorCard(props: propType) {
  const { vendor, isForSearch } = props;
  const favList = useSelector((state: RootState) => state.favoriteList);
  const isFav = favList?.filter(
    (favVendor: Vendor | null) => favVendor?.id === vendor?.id,
  );

  const rateStar = () => {
    const stars = [];
    for (let i = 0; i < (vendor?.rating || 0); i++) {
      stars.push(<FullStar key={i} />);
    }
    return stars;
  };

  const avatarStyle = getAvatarStyle(vendor?.id || vendor?.name || "vendor");
  const avatarGlyph = vendor?.categories?.[0]?.icon || getInitials(vendor?.name || "") || "🏠";

  return (
    <div key={vendor?.id} className="vendor-card">
      <div
        className="vendor-card-avatar"
        aria-hidden="true"
        style={{ background: avatarStyle.bg, color: avatarStyle.fg }}
      >
        <span className="vendor-card-avatar-glyph">{avatarGlyph}</span>
      </div>

      <div className="vendor-card-details">
        <div className="vendor-card-top">
          <p className="vendor-card-name">
            <span className="vendor-card-name-text">{vendor?.name}</span>
            {vendor?.verified && (
              <span className="vendor-card-verified" title="Verified vendor">
                <VerifiedIcon />
              </span>
            )}
          </p>
          {!isForSearch && (
            <MyFavorites
              prodData={vendor}
              isFav={isFav.length ? true : false}
            />
          )}
        </div>

        <div className="vendor-card-rating-row">
          <span className="vendor-card-stars">{rateStar()}</span>
          {typeof vendor?.rating === "number" && vendor.rating > 0 && (
            <span className="vendor-card-rating-value">
              {vendor.rating.toFixed(1)}
              {vendor.reviewCount ? ` (${vendor.reviewCount})` : ""}
            </span>
          )}
        </div>

        {!isForSearch && vendor?.tagline && (
          <p className="vendor-card-tagline">{vendor.tagline}</p>
        )}

        {!isForSearch && (vendor?.location || vendor?.responseTime) && (
          <div className="vendor-card-meta">
            {vendor?.location && (
              <span className="vendor-card-meta-item">
                <LocationIcon />
                {vendor.location}
              </span>
            )}
            {vendor?.responseTime && (
              <span className="vendor-card-meta-item">
                <ClockIcon />
                {vendor.responseTime}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="vendor-card-action">
        <Link
          href={`/vendors/${vendor?.id}`}
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
