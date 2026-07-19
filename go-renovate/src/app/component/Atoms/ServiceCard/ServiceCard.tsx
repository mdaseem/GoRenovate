import React, { useCallback } from "react";
import styles from "./ServiceCard.module.css";
import { ServiceOption } from "../../VendorPage/vendor";
import { MATERIAL_COLORS, UNIT_LABELS } from "../../VendorPage/VendorData";

interface ServiceCardProps {
  service: ServiceOption;
  categoryLabel: string;
  quantity: number;
  onAdd: (service: ServiceOption, categoryLabel: string) => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onViewMore: (service: ServiceOption, categoryLabel: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  categoryLabel,
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  onViewMore,
}) => {
  const material = MATERIAL_COLORS[service.materialTag];
  const unitLabel = UNIT_LABELS[service.unit] ?? `per ${service.unit}`;

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

  return (
    <article className={styles.card} aria-label={`Service: ${service.name}`}>
      {service.popular && (
        <div className={styles.popularRibbon} aria-label="Popular service">
          Popular
        </div>
      )}

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

        <ul className={styles.includesList} aria-label="What's included">
          {service.includes.map((item) => (
            <li key={item} className={styles.includeChip}>
              ✓ {item}
            </li>
          ))}
        </ul>

        <div className={styles.cardFooter}>
          <div className={styles.pricing}>
            <span
              className={styles.price}
              aria-label={`Price: ${formattedPrice}`}
            >
              {formattedPrice}
            </span>
            <span className={styles.priceUnit}>{unitLabel}</span>
            <span
              className={styles.estimatedDays}
              aria-label={`Estimated ${service.estimatedDays} days`}
            >
              ~{service.estimatedDays}{" "}
              {service.estimatedDays === 1 ? "day" : "days"}
            </span>
          </div>

          <div className={styles.addControl}>
            {quantity === 0 ? (
              <button
                className={styles.addButton}
                onClick={handleAdd}
                type="button"
                aria-label={`Add ${service.name} to quote`}
              >
                + Add
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
      </div>
    </article>
  );
};

export default ServiceCard;
