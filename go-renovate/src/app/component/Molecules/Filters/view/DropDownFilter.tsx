import React, { useState } from "react";
import "../style/Filters.style.css";

type FilterType = {
  filterName: string;
  filterValue: string[];
};
type propType = {
  filtersData: FilterType;
};

type filtersType = FilterType[];

function DropDownFilter({ filtersData }: propType) {
  const [isDropDownOn, setIsDropDownOn] = useState(false);

  return (
    <div className="dropdown-container">
      <div className="filter-name-drop-down-container">
        <>
          <button
            className="filter-name"
            onClick={() => {
              if (isDropDownOn) {
                setIsDropDownOn(false);
              } else {
                setIsDropDownOn(true);
              }
            }}
          >
            <p className="filter-name-value">{filtersData.filterName}</p>
            {isDropDownOn ? (
              <i className="fa-solid fa-angle-up arrow-down"></i>
            ) : (
              <i className="fa-solid fa-chevron-down arrow-down"></i>
            )}
          </button>
          {isDropDownOn && (
            <div className="values-container">
              {filtersData.filterValue.map((filterValues: string, index: number) => {
                return (
                  <label key={index} className="filter-value-container">
                    <input type="checkbox" className="filter-values-list" />
                    <p className="filter-value">{filterValues}</p>
                  </label>
                );
              })}
            </div>
          )}
        </>
      </div>
    </div>
  );
}

export default DropDownFilter;
