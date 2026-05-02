import React, { useState } from "react";
import "../style/Filters.style.css";
import { FilterValueType } from "./Filters.view";

type FilterType = {
  filterName: string;
  filterValue: string[];
};
type propType = {
  filtersData: FilterType;
  setFilterValue: React.Dispatch<React.SetStateAction<FilterValueType>>;
  filterValues: FilterValueType;
};

type filtersType = FilterType[];

function DropDownFilter({ filtersData, setFilterValue, filterValues }: propType) {
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
                    <div className="custom-checkbox"/>
                    <input type="checkbox" value={filterValues} onClick={(e)=> console.log('CALLED----',e.target)
                    } className="filter-values-list" />
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
