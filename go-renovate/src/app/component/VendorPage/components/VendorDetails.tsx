import React from "react";
import styles from "./VendorDetails.module.css";
import { Vendor } from "../vendor";

interface VendorDetailsProps {
  vendor: Vendor;
}

const StarIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 2L14.8 8.625L22 9.25L16.55 13.975L18.175 21L12 17.275L5.825 21L7.45 13.975L2 9.25L9.2 8.625L12 2Z"
      fill={filled ? "#FFCD29" : "none"}
      stroke={filled ? "none" : "#d8d4cb"}
      strokeWidth={filled ? 0 : 1.5}
      strokeLinejoin="round"
    />
  </svg>
);

const VendorDetails: React.FC<VendorDetailsProps> = ({ vendor }) => {
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
  } = vendor;

  const roundedRating = Math.round(rating);
  const ratingLabel =
    reviewCount > 0
      ? `Rated ${rating.toFixed(1)} out of 5 from ${reviewCount} review${
          reviewCount === 1 ? "" : "s"
        }`
      : "No reviews yet";

  const stats = [
    location && { label: "Location", value: location },
    responseTime && { label: "Responds in", value: responseTime },
    completedProjects > 0
      ? { label: "Projects completed", value: `${completedProjects}+` }
      : null,
    yearsActive > 0 ? { label: "Years active", value: `${yearsActive}` } : null,
  ].filter((stat): stat is { label: string; value: string } => Boolean(stat));

  return (
    <header className={styles.details}>
      <div className={styles.titleRow}>
        <h1 className={styles.name}>{name}</h1>
        {verified && (
          <span className={styles.verifiedBadge}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
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
        </div>
      ) : (
        <p className={styles.noReviews}>No reviews yet</p>
      )}

      {stats.length > 0 && (
        <dl className={styles.statGrid}>
          {stats.map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <dt className={styles.statLabel}>{stat.label}</dt>
              <dd className={styles.statValue}>{stat.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {badges.length > 0 && (
        <ul className={styles.badgeList} aria-label="Vendor badges">
          {badges.map((badge) => (
            <li key={badge} className={styles.badge}>
              {badge}
            </li>
          ))}
        </ul>
      )}
    </header>
  );
};

export default VendorDetails;
