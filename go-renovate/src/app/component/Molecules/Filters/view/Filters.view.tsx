"use client";

import React from "react";
import "../style/Filters.style.css";
import DropDownFilter from "./DropDownFilter";
import { FILTER_DEFINITIONS } from "../filterConfig";
import { Vendor } from "../../../VendorPage/vendor";
import { useVendorFilters } from "../hooks/useVendorFilters";

interface FiltersProps {
  vendors: Vendor[];
  resultCount: number;
  isRefreshing?: boolean;
  onApply?: () => void;
}

function Filters({ vendors, resultCount, isRefreshing, onApply }: FiltersProps) {
  const {
    activeFilters,
    activeCount,
    toggleCheckboxOption,
    setRadioValue,
    setToggleValue,
    clearAll,
  } = useVendorFilters();

  const groupFilters = FILTER_DEFINITIONS.filter(
    (definition) => definition.type !== "toggle",
  );
  const toggleFilters = FILTER_DEFINITIONS.filter(
    (definition) => definition.type === "toggle",
  );

  return (
    <div className="filters-container">
      <div className="container-item">
        <div className="filters-header">
          <h2 className="filters-title">Filters</h2>
          {activeCount > 0 && (
            <button
              type="button"
              className="filters-clear"
              onClick={clearAll}
            >
              Clear all
            </button>
          )}
        </div>

        <p className="filters-result-count" role="status" aria-live="polite">
          {isRefreshing
            ? "Updating…"
            : `${resultCount} vendor${resultCount === 1 ? "" : "s"} found`}
        </p>

        <div className="filter-name-drop-down-container main-comtainer-filter">
          {groupFilters.map((definition) => (
            <DropDownFilter
              key={definition.id}
              definition={definition}
              vendors={vendors}
              activeFilters={activeFilters}
              onToggleCheckboxOption={toggleCheckboxOption}
              onSetRadioValue={setRadioValue}
            />
          ))}
        </div>

        {toggleFilters.map((definition) => {
          if (definition.type !== "toggle") return null;
          const checked = Boolean(activeFilters[definition.id]);
          const inputId = `filter-toggle-input-${definition.id}`;

          return (
            <label
              key={definition.id}
              className="filter-toggle-row"
              htmlFor={inputId}
            >
              <input
                id={inputId}
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                  setToggleValue(definition.id, event.target.checked)
                }
              />
              <span>{definition.label}</span>
            </label>
          );
        })}

        {onApply && (
          <button type="button" className="filters-apply" onClick={onApply}>
            Show {resultCount} result{resultCount === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </div>
  );
}

export default Filters;
