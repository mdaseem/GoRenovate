import React from "react";
import styles from "../VendorPage.module.css";
import { ServiceCategory, ServiceOption } from "../vendor";
import ServiceCard from "../../Atoms/ServiceCard/ServiceCard";

interface CategorySectionProps {
  category: ServiceCategory;
  isActive: boolean;
  isOpen: boolean;
  registerRef: (el: HTMLElement | null) => void;
  onToggle: (categoryId: string) => void;
  getQuantity: (serviceId: string) => number;
  onAddService: (service: ServiceOption, categoryLabel: string) => void;
  onIncrement: (serviceId: string) => void;
  onDecrement: (serviceId: string) => void;
  onViewMore: (service: ServiceOption, categoryLabel: string) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  isActive,
  isOpen,
  registerRef,
  onToggle,
  getQuantity,
  onAddService,
  onIncrement,
  onDecrement,
  onViewMore,
}) => {
  const toggleId = `category-toggle-${category.id}`;
  const panelId = `category-panel-${category.id}`;

  return (
    <section
      id={`category-section-${category.id}`}
      ref={registerRef}
      className={styles.categorySection}
    >
      <h2
        className={`${styles.categoryHeading} ${
          isActive ? styles.categoryHeadingActive : ""
        }`}
      >
        <button
          type="button"
          id={toggleId}
          className={styles.categoryToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => onToggle(category.id)}
        >
          <span className={styles.categoryIcon} aria-hidden="true">
            {category.icon}
          </span>
          <span className={styles.categoryTitle}>
            {category.label}
            <span className={styles.serviceCount}>
              · {category.services.length} services
            </span>
          </span>
          <svg
            className={`${styles.chevron} ${
              isOpen ? styles.chevronOpen : ""
            }`}
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M6 9L12 15L18 9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </h2>

      <ul
        id={panelId}
        className={styles.servicesGrid}
        role="list"
        aria-labelledby={toggleId}
        hidden={!isOpen}
      >
        {category.services.map((service) => (
          <li key={service.id} role="listitem">
            <ServiceCard
              service={service}
              categoryLabel={category.label}
              quantity={getQuantity(service.id)}
              onAdd={onAddService}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onViewMore={onViewMore}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CategorySection;
