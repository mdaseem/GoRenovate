import React from "react";
import ProductTile from "../../Atoms/ProductTile/productTile";
import "./ProductListPage.style.css";
import ProductFilters from "../../Atoms/Filters/ProductFilters";

function ProductListPage() {
  const products = [
    {
    id: 1,
     description: "",
    actualPrice: 122,
    discountPrice: 120,
    rating: 4,
    imageUrl: "/house.jpg"
  },
  {
    id: 2,
     description: "",
    actualPrice: 124,
    discountPrice: 180,
    rating: 5,
    imageUrl: "/house.jpg"
  },
  {
    id: 3,
     description: "",
    actualPrice: 134,
    discountPrice: 460,
    rating: 3,
    imageUrl: "/house.jpg"
  },
  {
    id: 5,
     description: "",
    actualPrice: 156,
    discountPrice: 100,
    rating: 5,
    imageUrl: "/house.jpg"
  },
  {
    id: 6,
     description: "",
    actualPrice: 156,
    discountPrice: 100,
    rating: 5,
    imageUrl: "/house.jpg"
  },
  {
    id: 7,
     description: "",
    actualPrice: 156,
    discountPrice: 100,
    rating: 5,
    imageUrl: "/house.jpg"
  },
];

  const productList = products?.map((product) => {
    return (
     <div key={product.id}>
       <ProductTile product={product} />
     </div>
    );
  });

  return (
    <div className="product-page-container">
      <div className="product-page-filters">
        <ProductFilters />
      </div>
      <div className="product-page-list">{productList}</div>
    </div>
  );
}

export default ProductListPage;
