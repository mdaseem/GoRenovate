"use client";
import React, { useState } from "react";
import "./CategoryDetailView.css";
import RoomConfigurator from "../RoomConfigurator/RoomConfigurator";
import RoomGrid from "../RoomGrid/RoomGrid";
import BackLink from "../../Atoms/BackLink/BackLink";

type Tab = "configurator" | "browse";

type Props = {
  categorySlug: string;
};

export default function CategoryDetailView({ categorySlug }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("configurator");

  return (
    <div className="category-detail-view">
      <BackLink className="category-detail-view-back" />
      <div
        role="tablist"
        aria-label="Room view"
        className="category-detail-view-tablist"
      >
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
        {activeTab === "browse" && <RoomGrid categorySlug={categorySlug} />}
      </div>
    </div>
  );
}
