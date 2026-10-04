"use client";
import React from "react";
import ProductListPage from "../ProductListPage/ProductListPage";
import { Vendor } from "@/app/types/vendor";

type propType = {
  products: Vendor[] | undefined;
  catalogVendors?: Vendor[];
};

function Dashboard(props: propType) {
  return (
    <ProductListPage
      products={props.products}
      catalogVendors={props.catalogVendors}
    />
  );
}

export default Dashboard;
