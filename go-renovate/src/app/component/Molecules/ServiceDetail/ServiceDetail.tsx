"use client";

import React, { useCallback, useRef, useState } from "react";
import Image from "next/image";
import styles from "./ServiceDetail.module.css";
import { ServiceOption } from "../../VendorPage/vendor";
import { MATERIAL_COLORS, UNIT_LABELS } from "../../VendorPage/VendorData";

interface ServiceDetailProps {
  service: ServiceOption;
  categoryLabel: string;
  quantity: number;
  onAdd: (service: ServiceOption, categoryLabel: string) => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
}

const PLACEHOLDER_GALLERY = ["/house.jpg", "/house.jpg", "/house.jpg", "/house.jpg"];

interface ServiceImageCarouselProps {
  images: string[];
  altText: string;
}

const ServiceImageCarousel: React.FC<ServiceImageCarouselProps> = ({
  images,
  altText,
}) => {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % images.length) + images.length) % images.length);
    },
    [images.length],
  );

  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);
  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
    },
    [goPrev, goNext],
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      touchStartX.current = event.touches[0].clientX;
    },
    [],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      if (touchStartX.current === null) return;
      const deltaX = event.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      const SWIPE_THRESHOLD = 40;
      if (deltaX > SWIPE_THRESHOLD) goPrev();
      else if (deltaX < -SWIPE_THRESHOLD) goNext();
    },
    [goPrev, goNext],
  );

  if (!images.length) return null;

  return (
    <div
      className={styles.carousel}
      role="group"
      aria-label={`${altText} photos`}
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={styles.carouselTrack}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {images.map((src, i) => (
          <div className={styles.carouselSlide} key={`${src}-${i}`}>
            <Image
              src={src}
              alt={`${altText} — photo ${i + 1} of ${images.length}`}
              fill
              sizes="(max-width: 768px) 100vw, 760px"
              className={styles.carouselImage}
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.carouselNav} ${styles.carouselNavPrev}`}
            onClick={goPrev}
            aria-label="Previous photo"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`${styles.carouselNav} ${styles.carouselNavNext}`}
            onClick={goNext}
            aria-label="Next photo"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>

          <div className={styles.carouselCounter} aria-hidden="true">
            {index + 1} / {images.length}
          </div>

          <div className={styles.carouselDots} role="tablist" aria-label="Choose photo">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Photo ${i + 1}`}
                className={`${styles.carouselDot} ${
                  i === index ? styles.carouselDotActive : ""
                }`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ServiceDetail: React.FC<ServiceDetailProps> = ({
  service,
  categoryLabel,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
}) => {
  const images = service.imageUrl ? [service.imageUrl] : PLACEHOLDER_GALLERY;
  const material = MATERIAL_COLORS[service.materialTag];
  const unitLabel = UNIT_LABELS[service.unit] ?? `per ${service.unit}`;

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(service.price);

  const handleAdd = useCallback(() => {
    onAdd(service, categoryLabel);
  }, [service, categoryLabel, onAdd]);

  const handleIncrement = useCallback(() => {
    onIncrement(service.id);
  }, [service.id, onIncrement]);

  const handleDecrement = useCallback(() => {
    onDecrement(service.id);
  }, [service.id, onDecrement]);

  return (
    <div className={styles.detail}>
      <ServiceImageCarousel images={images} altText={service.name} />

      <div className={styles.body}>
        <p className={styles.category}>{categoryLabel}</p>

        <div className={styles.headingRow}>
          <h2 className={styles.name}>{service.name}</h2>
          {material && (
            <span
              className={styles.materialTag}
              style={{ background: material.bg, color: material.text }}
              aria-label={`Material: ${material.label}`}
            >
              <span
                className={styles.materialSwatch}
                style={{ background: material.text }}
                aria-hidden="true"
              />
              {material.label}
            </span>
          )}
        </div>

        {service.popular && (
          <span className={styles.popularBadge}>Popular choice</span>
        )}

        <p className={styles.description}>{service.description}</p>

        <ul className={styles.includesList} aria-label="What's included">
          {service.includes.map((item) => (
            <li key={item} className={styles.includeChip}>
              ✓ {item}
            </li>
          ))}
        </ul>

        <p className={styles.estimatedDays}>
          Estimated turnaround: ~{service.estimatedDays}{" "}
          {service.estimatedDays === 1 ? "day" : "days"}
        </p>
      </div>

      <div className={styles.footer}>
        <div className={styles.pricing}>
          <span
            className={styles.price}
            aria-label={`Price: ${formattedPrice}`}
          >
            {formattedPrice}
          </span>
          <span className={styles.priceUnit}>{unitLabel}</span>
        </div>

        {quantity === 0 ? (
          <button
            className={styles.addButton}
            onClick={handleAdd}
            type="button"
            aria-label={`Add ${service.name} to quote`}
          >
            + Add to quote
          </button>
        ) : (
          <div
            className={styles.quantityControl}
            role="group"
            aria-label={`Quantity of ${service.name}`}
          >
            <button
              className={styles.qtyButton}
              onClick={handleDecrement}
              type="button"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span
              className={styles.qtyValue}
              aria-live="polite"
              aria-atomic="true"
            >
              {quantity}
            </span>
            <button
              className={styles.qtyButton}
              onClick={handleIncrement}
              type="button"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceDetail;
