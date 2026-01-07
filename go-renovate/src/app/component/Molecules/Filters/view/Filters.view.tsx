import React, { useState } from "react";
import "../style/Filters.style.css";
import DropDownFilter from "./DropDownFilter";

type FilterType = {
  filterName: string;
  filterValue: string[];
};

type filtersType = FilterType[];

function Filters() {
  const [isDropDownOn, setIsDropDownOn] = useState(false);
  const filterData: filtersType = [
    {
      filterName: "Availability",
      filterValue: ["in stock", "coming soon", "out of stock"],
    },
    {
      filterName: "genere",
      filterValue: ["anime", "biography", "poetics"],
    },
    {
      filterName: "prices",
      filterValue:["<1000","<2000","<3000"],
    },
    {
      filterName: "Rating",
      filterValue:["2","3","4","5"],
    }
  ];

  const a = [0, 0, 0, 0, 0, 0, 0, 0];
  const subA = [
    [1, 2, 3],
    [3, 5, 6],
  ];
  const temp = a;
  for (let j = 0; j < subA.length; j++) {
    const index = subA[j][0];
    const addValue = subA[j][1];
    const endIndex = subA[j][2];
    for (let i = 0; i < a.length; i++) {
      if (i === index) {
        temp[i] = temp[i] + addValue;
      } else if (i > index && i <= endIndex) {
        temp[i] = temp[i] + addValue;
      } else {
        temp[i] = temp[i];
      }
    }
  }

  // console.log("called----------", temp);

  // const a = [0, 0, 0, 0, 0, 0, 0, 0];
  // const subA = [
  //   [1, 3, 4],
  //   [3, 5, 6],
  // ];
  // let temp = a;
  // let index = 0
  //   let addValue = 0
  //   let endIndex = 0;
  // for (let j = 0; j < subA.length; j++) {

  //  index = subA[j][0];
  //    addValue = subA[j][1];
  //    endIndex = subA[j][2];
  //   if (j <= a.length)
  //   {
  //      index = subA[j][0];
  //    addValue = subA[j][1];
  //    endIndex = subA[j][2];
  //   }
  // }
  //   for (let i = 0; i < a.length; i++) {
  //     if (i === index) {
  //       temp[i] = temp[i] + addValue;
  //     } else if (i > index && i <= endIndex) {
  //       temp[i] = temp[i] + addValue;
  //     } else {
  //       temp[i] = temp[i];
  //     }

  // }
  // console.log("called----------", temp);

  return (
    <div className="filters-container">
      <div className="container-item">
      <h3>Filters</h3>
      <div className="filter-name-drop-down-container">
        {filterData.map((filtersData: FilterType, index: number) => {
          return <DropDownFilter key={index} filtersData={filtersData} />;
        })}
      </div>
      </div>
    </div>
  );
}

export default Filters;
