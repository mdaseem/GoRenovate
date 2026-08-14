import React from "react";
import styles from "./VendorDetails.module.css";
import { Vendor } from "../vendor";
import MyFavorites from "@/app/component/Atoms/MyFavorites/view/MyFavorites.view";
import { useAppSelector } from "@/app/store/hooks";
import { getAvatarStyle, getInitials } from "../vendorAvatar";
import { LocationIcon, ClockIcon, CalendarIcon, TagIcon } from "../vendorIcons";

interface VendorDetailsProps {
  vendor: Vendor;
  activeCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M12 2L14.8 8.625L22 9.25L16.55 13.975L18.175 21L12 17.275L5.825 21L7.45 13.975L2 9.25L9.2 8.625L12 2Z"
      fill={filled ? "#FFCD29" : "none"}
      stroke={filled ? "none" : "#d8d4cb"}
      strokeWidth={filled ? 0 : 1.5}
      strokeLinejoin="round"
    />
  </svg>
);

function formatVendorStartingPrice(vendor: Vendor): string | null {
  const prices = vendor.categories.flatMap((category) =>
    category.services.map((service) => service.price),
  );
  if (prices.length === 0) return null;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Math.min(...prices));
}

const VendorDetails: React.FC<VendorDetailsProps> = ({
  vendor,
  activeCategoryId,
  onCategorySelect,
}) => {
  const {
    name,
    tagline,
    rating,
    reviewCount,
    completedProjects,
    yearsActive,
    location,
    responseTime,
    verified,
    badges,
    categories,
  } = vendor;

  const favoriteItems = useAppSelector((state) => state.favoriteList.items);
  const isFav = favoriteItems.some((item) => item.id === vendor.id);

  const avatarStyle = getAvatarStyle(vendor.id || name || "vendor");
  const avatarGlyph = categories[0]?.icon || getInitials(name) || "🏠";
  const startingPrice = formatVendorStartingPrice(vendor);

  const roundedRating = Math.round(rating);
  const ratingLabel =
    reviewCount > 0
      ? `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} review${
          reviewCount === 1 ? "" : "s"
        }`
      : "No reviews yet";

  type StatChip = { label: string; value: string; icon: React.ReactNode };
  const statCandidates: Array<StatChip | null> = [
    location
      ? { label: "Location", value: location, icon: <LocationIcon /> }
      : null,
    responseTime
      ? { label: "Responds in", value: responseTime, icon: <ClockIcon /> }
      : null,
    yearsActive > 0
      ? {
          label: "Active",
          value: `${yearsActive}+ yrs`,
          icon: <CalendarIcon />,
        }
      : null,
    startingPrice
      ? { label: "Starting from", value: startingPrice, icon: <TagIcon /> }
      : null,
  ];
  const stats = statCandidates.filter(
    (stat): stat is StatChip => stat !== null,
  );

  return (
    <header className={styles.details}>
      <div
        className={styles.banner}
        style={{
          background: `linear-gradient(135deg, ${avatarStyle.fg}26 0%, ${avatarStyle.bg} 65%)`,
        }}
      >
        <span className={styles.bannerGlyph} aria-hidden="true">
          {avatarGlyph}
        </span>
        <div className={styles.bannerFav}>
          <MyFavorites prodData={vendor} isFav={isFav} />
        </div>
      </div>

      <div className={styles.identity}>
        <div className={styles.identityBody}>
          <div className={styles.titleRow}>
            <h1 className={styles.name}>{name}</h1>
            {verified && (
              <span className={styles.verifiedBadge}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M9 12L11 14L15 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Verified
              </span>
            )}
          </div>

          {tagline && <p className={styles.tagline}>{tagline}</p>}

          {reviewCount > 0 ? (
            <div className={styles.ratingRow}>
              <span className={styles.stars} aria-hidden="true">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon key={i} filled={i < roundedRating} />
                ))}
              </span>
              <span className={styles.ratingText}>
                <span className={styles.srOnly}>{ratingLabel}</span>
                <span aria-hidden="true">
                  {rating.toFixed(1)} · {reviewCount} review
                  {reviewCount === 1 ? "" : "s"}
                </span>
              </span>
              {completedProjects > 0 && (
                <span className={styles.projectsNote}>
                  · {completedProjects}+ projects completed
                </span>
              )}
            </div>
          ) : (
            <p className={styles.noReviews}>No reviews yet</p>
          )}
        </div>
      </div>

      {stats.length > 0 && (
        <ul className={styles.statRow} aria-label="Vendor stats">
          {stats.map((stat) => (
            <li key={stat.label} className={styles.statChip}>
              {/* <span className={styles.statIcon} aria-hidden="true">
                {stat.icon}
              </span> */}
              <span className={styles.statText}>
                <span className={styles.statLabel}>{stat.label}</span>
                <span className={styles.statValue}>{stat.value}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {badges.length > 0 && (
        <ul className={styles.badgeList} aria-label="Vendor highlights">
          {badges.map((badge) => (
            <li key={badge} className={styles.badge}>
              {badge}
            </li>
          ))}
        </ul>
      )}

      {categories.length > 0 && (
        <nav
          className={styles.categoryNav}
          aria-label="Jump to a service category"
        >
          <ul className={styles.categoryChips}>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  className={styles.categoryChip}
                  data-active={activeCategoryId === category.id || undefined}
                  onClick={() => onCategorySelect?.(category.id)}
                  aria-current={
                    activeCategoryId === category.id ? "true" : undefined
                  }
                >
                  <span aria-hidden="true">{category.icon}</span>
                  {category.label}
                  <span className={styles.categoryChipCount}>
                    {category.services.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
};

export default VendorDetails;
