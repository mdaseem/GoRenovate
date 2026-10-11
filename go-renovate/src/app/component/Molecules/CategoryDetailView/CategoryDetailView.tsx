"use client";
import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import "./CategoryDetailView.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import {
  acknowledgeCustomizeRequest,
  getCategoryDetail,
} from "@/app/store/features/categorySlice";
import { dismissLoadError, loadDesignRequest } from "@/app/store/features/designSlice";
import RoomConfigurator from "../RoomConfigurator/RoomConfigurator";
import RoomGrid from "../RoomGrid/RoomGrid";
import RoomGridFilters from "../RoomGrid/RoomGridFilters";
import BackLink from "../../Atoms/BackLink/BackLink";

type Tab = "configurator" | "browse";

type Props = {
  categorySlug: string;
};

export default function CategoryDetailView({ categorySlug }: Props) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState<Tab>("browse");

  useEffect(() => {
    dispatch(getCategoryDetail({ slug: categorySlug }));
  }, [dispatch, categorySlug]);

  // A shared link (?design=<id>): once the category is loaded, open that design
  // in Customize. Each id is requested once per visit.
  const designId = useSearchParams().get("design");
  const isCategoryLoaded = useAppSelector(
    (state: RootState) => state.categoryState.activeCategoryDetail?.category.slug === categorySlug,
  );
  const designLoadError = useAppSelector((state: RootState) => state.designState.loadError);
  const requestedDesignRef = useRef<string | null>(null);
  useEffect(() => {
    if (!designId || !isCategoryLoaded || requestedDesignRef.current === designId) return;
    requestedDesignRef.current = designId;
    dispatch(loadDesignRequest({ id: designId, categorySlug }));
  }, [designId, isCategoryLoaded, categorySlug, dispatch]);

  // "Customize this room" (Room-detail overlay) asks for the Customize tab.
  const customizeRequested = useAppSelector(
    (state: RootState) => state.categoryState.customizeRequested,
  );
  useEffect(() => {
    if (!customizeRequested) return;
    setActiveTab("configurator");
    dispatch(acknowledgeCustomizeRequest());
  }, [customizeRequested, dispatch]);

  return (
    <div className="category-detail-view">
      <div className="category-detail-view-layout">
        <div className="category-detail-view-filters-col">
          {activeTab === "browse" && <RoomGridFilters />}
        </div>

        <div className="category-detail-view-main-col">
          <div
            role="tablist"
            aria-label="Room view"
            className="category-detail-view-tablist"
          >
            <BackLink variant="inline" />
            <span
              className="category-detail-view-tablist-divider"
              aria-hidden="true"
            />
            <button
              type="button"
              role="tab"
              id="category-tab-browse"
              aria-selected={activeTab === "browse"}
              aria-controls="category-tabpanel-browse"
              tabIndex={activeTab === "browse" ? 0 : -1}
              className="category-detail-view-tab"
              onClick={() => setActiveTab("browse")}
            >
              Browse All
            </button>
            <button
              type="button"
              role="tab"
              id="category-tab-configurator"
              aria-selected={activeTab === "configurator"}
              aria-controls="category-tabpanel-configurator"
              tabIndex={activeTab === "configurator" ? 0 : -1}
              className="category-detail-view-tab"
              onClick={() => setActiveTab("configurator")}
            >
              Customize
            </button>
          </div>

          {designLoadError && (
            <p className="category-detail-view-design-error" role="alert">
              <span>{designLoadError}</span>
              <button type="button" onClick={() => dispatch(dismissLoadError())}>
                Dismiss
              </button>
            </p>
          )}

          <div
            role="tabpanel"
            id="category-tabpanel-configurator"
            aria-labelledby="category-tab-configurator"
            hidden={activeTab !== "configurator"}
          >
            {activeTab === "configurator" && (
              <RoomConfigurator
                categorySlug={categorySlug}
                onBrowseRooms={() => setActiveTab("browse")}
              />
            )}
          </div>
          <div
            role="tabpanel"
            id="category-tabpanel-browse"
            aria-labelledby="category-tab-browse"
            hidden={activeTab !== "browse"}
          >
            {activeTab === "browse" && (
              <RoomGrid categorySlug={categorySlug} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
