import React, { useCallback } from "react";
import Image from "next/image";
import styles from "./ServiceCard.module.css";
import { ServiceOption } from "@/app/types/vendor";
import { MATERIAL_COLORS, UNIT_LABELS } from "@/app/types/vendorConstants";
import {
  formatDimensions,
  isOutOfStock,
  maxQuantityFor,
  PRODUCT_PLACEHOLDER_IMAGE,
  stockNote,
} from "@/app/utils/productFacts";

interface ServiceCardProps {
  service: ServiceOption;
  categoryLabel: string;
  quantity: number;
  onAdd: (service: ServiceOption, categoryLabel: string) => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onViewMore: (service: ServiceOption, categoryLabel: string) => void;
}

// Same fallback ServiceDetail uses when a service has no photo of its own,
// so the card and the detail overlay never disagree on what image to show.
const FALLBACK_IMAGE = "/house.jpg";

const MAX_VISIBLE_INCLUDES = 3;

// The card is shared by services and (while services are switched off) products. A product carries a
// `product` block; it swaps the service-only lines (material, includes, unit, turnaround) for the
// product's size and stock, and the add control for what can really be bought here.
const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  categoryLabel,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onViewMore,
}) => {
  const product = service.product;
  const material =
    !product && service.materialTag ? MATERIAL_COLORS[service.materialTag] : undefined;
  const unitLabel =
    !product && service.unit ? (UNIT_LABELS[service.unit] ?? `per ${service.unit}`) : null;
  const includes = service.includes ?? [];
  const visibleIncludes = includes.slice(0, MAX_VISIBLE_INCLUDES);
  const hiddenIncludesCount = includes.length - visibleIncludes.length;
  const dimensions = product ? formatDimensions(product.dimensionsCm) : null;
  const note = product ? stockNote(product) : null;
  const maxQuantity = product ? maxQuantityFor(product) : Infinity;
  const noun = product ? "Product" : "Service";

  const handleAdd = useCallback(() => {
    onAdd(service, categoryLabel);
  }, [service, categoryLabel, onAdd]);

  const handleViewMore = useCallback(() => {
    onViewMore(service, categoryLabel);
  }, [service, categoryLabel, onViewMore]);

  const handleIncrement = useCallback(() => {
    onIncrement(service.id);
  }, [service.id, onIncrement]);

  const handleDecrement = useCallback(() => {
    onDecrement(service.id);
  }, [service.id, onDecrement]);

  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(service.price);

  const renderAddControl = () => {
    if (product && product.purchaseMode === "external-store") {
      return product.externalStoreUrl ? (
        <a
          className={styles.addButton}
          href={product.externalStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Visit the store to buy ${service.name} (opens in a new tab)`}
        >
          Visit store
        </a>
      ) : null;
    }
    if (product && isOutOfStock(product)) {
      return (
        <button className={styles.addButton} type="button" disabled>
          Out of stock
        </button>
      );
    }
    if (quantity === 0) {
      return (
        <button
          className={styles.addButton}
          onClick={handleAdd}
          type="button"
          aria-label={product ? `Add ${service.name} to cart` : `Add ${service.name} to quote`}
        >
          + Add
        </button>
      );
    }
    return (
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
        <span className={styles.qtyValue} aria-live="polite" aria-atomic="true">
          {quantity}
        </span>
        <button
          className={styles.qtyButton}
          onClick={handleIncrement}
          type="button"
          aria-label="Increase quantity"
          disabled={quantity >= maxQuantity}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <article className={styles.card} aria-label={`${noun}: ${service.name}`}>
      <div className={styles.media}>
        <Image
          src={service.imageUrl || (product ? PRODUCT_PLACEHOLDER_IMAGE : FALLBACK_IMAGE)}
          alt=""
          fill
          sizes="(max-width: 480px) 80px, 112px"
          className={styles.mediaImage}
          loading="lazy"
        />
        {service.popular && (
          <span className={styles.popularBadge} aria-label="Popular service">
            Popular
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        <div className={styles.cardTop}>
          <h3 className={styles.serviceName}>{service.name}</h3>
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

        <p className={styles.serviceDescription}>{service.description}</p>

        <button
          type="button"
          className={styles.viewMoreButton}
          onClick={handleViewMore}
          aria-label={`View more details about ${service.name}`}
        >
          View more
          <svg
            aria-hidden="true"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M9 6L15 12L9 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {product
          ? dimensions && (
              <ul className={styles.includesList} aria-label="Size">
                <li className={styles.includeChip}>{dimensions}</li>
              </ul>
            )
          : (
              <ul className={styles.includesList} aria-label="What's included">
                {visibleIncludes.map((item) => (
                  <li key={item} className={styles.includeChip}>
                    ✓ {item}
                  </li>
                ))}
                {hiddenIncludesCount > 0 && (
                  <li className={styles.includeChipMore} aria-hidden="true">
                    +{hiddenIncludesCount} more
                  </li>
                )}
              </ul>
            )}

        <div className={styles.cardFooter}>
          <div className={styles.pricing}>
            <span
              className={styles.price}
              aria-label={`Price: ${formattedPrice}`}
            >
              {formattedPrice}
            </span>
            {unitLabel && <span className={styles.priceUnit}>{unitLabel}</span>}
            {product
              ? note && <span className={styles.estimatedDays}>{note}</span>
              : service.estimatedDays !== undefined && (
                  <span
                    className={styles.estimatedDays}
                    aria-label={`Estimated ${service.estimatedDays} days`}
                  >
                    ~{service.estimatedDays}{" "}
                    {service.estimatedDays === 1 ? "day" : "days"}
                  </span>
                )}
          </div>

          <div className={styles.addControl}>{renderAddControl()}</div>
        </div>
      </div>
    </article>
  );
};

export default React.memo(ServiceCard);
