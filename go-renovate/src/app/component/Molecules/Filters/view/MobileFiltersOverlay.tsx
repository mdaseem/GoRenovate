"use client";

import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import { useAppDispatch } from "@/app/store/hooks";
import { setOpenStateFilters } from "@/app/store/features/overLaySlice";
import Filters from "./Filters.view";
import { Vendor } from "@/app/component/VendorPage/vendor";

function MobileFiltersOverlay() {
  const dispatch = useAppDispatch();
  const catalogSnapshot: Vendor[] = useSelector(
    (state: RootState) => state.productsList?.catalogSnapshot ?? [],
  );
  const resultCount: number = useSelector(
    (state: RootState) => state.productsList?.prodList?.data?.length ?? 0,
  );
  const isRefreshing: boolean = useSelector((state: RootState) =>
    Boolean(state.productsList?.isloading),
  );

  return (
    <Filters
      vendors={catalogSnapshot}
      resultCount={resultCount}
      isRefreshing={isRefreshing && catalogSnapshot.length > 0}
      onApply={() => dispatch(setOpenStateFilters(false))}
    />
  );
}

export default MobileFiltersOverlay;
