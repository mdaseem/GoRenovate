"use client";
import React from "react";
import ProductListPage from "../ProductListPage/ProductListPage";

type propType = {
  products: void | Response;
};

function Dashboard(props: propType) {
  return <ProductListPage products={props.products} />;
}

export default Dashboard;
