"use client";

import React from "react";
import "../Filters/style/Filters.style.css";
import DropDownFilter from "../Filters/view/DropDownFilter";
import { FILTER_DEFINITIONS } from "./roomFilterConfig";
import { Room } from "../../CategoryPage/category";
import { useRoomFilters } from "./useRoomFilters";

interface RoomFiltersProps {
  rooms: Room[];
  resultCount: number;
  isRefreshing?: boolean;
}

function RoomFilters({ rooms, resultCount, isRefreshing }: RoomFiltersProps) {
  const {
    activeFilters,
    activeCount,
    toggleCheckboxOption,
    setRadioValue,
    clearAll,
  } = useRoomFilters();

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
              : `${resultCount} room${resultCount === 1 ? "" : "s"} found`}
          </p>
        </div>
        <fieldset className="filters-body" disabled={isRefreshing}>
          <legend className="sr-only">Filter options</legend>

          <div className="filter-name-drop-down-container main-comtainer-filter">
            {FILTER_DEFINITIONS.map((definition) => (
              <DropDownFilter
                key={definition.id}
                definition={definition}
                items={rooms}
                activeFilters={activeFilters}
                onToggleCheckboxOption={toggleCheckboxOption}
                onSetRadioValue={setRadioValue}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

export default RoomFilters;
