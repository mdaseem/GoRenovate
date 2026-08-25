"use client";
import React, { useEffect, useState } from "react";
import "./CategoryDetailView.css";
import { useAppDispatch } from "@/app/store/hooks";
import { getCategoryDetail } from "@/app/store/features/categorySlice";
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

          <div
            role="tabpanel"
            id="category-tabpanel-configurator"
            aria-labelledby="category-tab-configurator"
            hidden={activeTab !== "configurator"}
          >
            {activeTab === "configurator" && (
              <RoomConfigurator categorySlug={categorySlug} />
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
