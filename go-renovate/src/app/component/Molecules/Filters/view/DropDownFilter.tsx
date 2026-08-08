"use client";

import React, { useId, useState } from "react";
import "../style/Filters.style.css";
import { ActiveFilters, FilterDefinition } from "../filterConfig";
import { Vendor } from "../../../VendorPage/vendor";

interface DropDownFilterProps {
  definition: FilterDefinition;
  vendors: Vendor[];
  activeFilters: ActiveFilters;
  onToggleCheckboxOption: (filterId: string, value: string) => void;
  onSetRadioValue: (filterId: string, value: string) => void;
}

function DropDownFilter({
  definition,
  vendors,
  activeFilters,
  onToggleCheckboxOption,
  onSetRadioValue,
}: DropDownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const reactId = useId();

  if (definition.type === "toggle") return null;

  const options =
    definition.type === "checkbox-group"
      ? definition.getOptions(vendors)
      : definition.options;

  if (options.length === 0) return null;

  const toggleId = `filter-toggle-${reactId}`;
  const panelId = `filter-panel-${reactId}`;

  const selectedValues =
    definition.type === "checkbox-group"
      ? ((activeFilters[definition.id] as string[]) ?? [])
      : [];
  const selectedRadio =
    definition.type === "radio"
      ? ((activeFilters[definition.id] as string) ?? "")
      : "";
  const activeCount =
    definition.type === "checkbox-group" ? selectedValues.length : selectedRadio ? 1 : 0;

  return (
    <div className="dropdown-container">
      <div className="filter-name-drop-down-container">
        <button
          type="button"
          id={toggleId}
          className="filter-name"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span className="filter-name-value">
            {definition.label}
            {activeCount > 0 && (
              <span className="filter-active-count">({activeCount})</span>
            )}
          </span>
          <svg
            className={`arrow-down ${isOpen ? "arrow-down-open" : ""}`}
            aria-hidden="true"
            width="14"
            height="14"
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

        {isOpen && (
          <fieldset
            id={panelId}
            className="values-container"
            aria-labelledby={toggleId}
          >
            <legend className="sr-only">{definition.label}</legend>
            {definition.type === "radio" && (
              <label className="filter-value-container">
                <input
                  type="radio"
                  name={definition.id}
                  className="filter-values-list"
                  checked={selectedRadio === ""}
                  onChange={() => onSetRadioValue(definition.id, "")}
                />
                <p className="filter-value">Any</p>
              </label>
            )}
            {options.map((option) => (
              <label key={option.value} className="filter-value-container">
                <input
                  type={definition.type === "radio" ? "radio" : "checkbox"}
                  name={definition.type === "radio" ? definition.id : undefined}
                  className="filter-values-list"
                  checked={
                    definition.type === "radio"
                      ? selectedRadio === option.value
                      : selectedValues.includes(option.value)
                  }
                  onChange={() =>
                    definition.type === "radio"
                      ? onSetRadioValue(definition.id, option.value)
                      : onToggleCheckboxOption(definition.id, option.value)
                  }
                />
                <p className="filter-value">
                  {option.icon && <span aria-hidden="true">{option.icon} </span>}
                  {option.label}
                </p>
              </label>
            ))}
          </fieldset>
        )}
      </div>
    </div>
  );
}

export default DropDownFilter;
