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
  // Lets a page lock a filter to a value fixed elsewhere (e.g. the category
  // page pins `category` to its route segment) without duplicating this
  // component just to drop one dropdown.
  hiddenFilterIds?: string[];
}

function Filters({
  vendors,
  resultCount,
  isRefreshing,
  onApply,
  hiddenFilterIds,
}: FiltersProps) {
  const {
    activeFilters,
    activeCount,
    toggleCheckboxOption,
    setRadioValue,
    setToggleValue,
    clearAll,
  } = useVendorFilters();

  const visibleDefinitions = FILTER_DEFINITIONS.filter(
    (definition) => !hiddenFilterIds?.includes(definition.id),
  );
  const groupFilters = visibleDefinitions.filter(
    (definition) => definition.type !== "toggle",
  );
  const toggleFilters = visibleDefinitions.filter(
    (definition) => definition.type === "toggle",
  );

  return (
    <div className="filters-container">
      <div className="container-item">
        <div className="filters-sticky-header">
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
        </div>
        <fieldset className="filters-body" disabled={isRefreshing}>
          <legend className="sr-only">Filter options</legend>

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
                  className="filter-toggle-input"
                  type="checkbox"
                  role="switch"
                  checked={checked}
                  onChange={(event) =>
                    setToggleValue(definition.id, event.target.checked)
                  }
                />
                <span>{definition.label}</span>
              </label>
            );
          })}
        </fieldset>

        {onApply && (
          <div className="filters-footer">
            <button type="button" className="filters-apply" onClick={onApply}>
              Show {resultCount} result{resultCount === 1 ? "" : "s"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Filters;
