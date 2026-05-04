import React from "react";
import "./Loader.css";

function ProductLoader() {
  return (
    <div className="tile-container">
      <div className="tile-sub-container">
        <div className="img-container-loader">
          <div className="product-img-loader" />
        </div>
        <div className="details-container">
          <p className="details-items prod-description loader-item"></p>
          <p className="details-items prod-price-discount loader-item"></p>
          <p className="details-items prod-price-actual loader-item"></p>
          <div className="price-strike-line loader-item" />
          <p className="details-items loader-item"></p>
        </div>
      </div>
      <div className="prod-button-container">
        <button className="buy-prod" />
      </div>
    </div>
  );
}

export default function Loader() {
  return (
    <div className="loader-main-container">
      <div className="product-filters" />
      <div className="loader-container">
        <div className="product-page-list">
          {[1, 2, 3, 4, 5, 6, 7].map((item: number, index: number) => (
            <ProductLoader key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
