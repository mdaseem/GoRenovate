import React from "react";
import ProductTile from "../../Atoms/ProductTile/productTile";
import "./ProductListPage.style.css";
import ProductPage from "../../HOC/ProductPage/ProductPage";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Filters from "../Filters/view/Filters.view";
import ProductView from "../../Atoms/ProductView/ProductView";

function ProductListPage() {
  const products = [
    {
      id: 1,
      description: "",
      actualPrice: 122,
      discountPrice: 120,
      rating: 4,
      imageUrl: "/house.jpg",
    },
    {
      id: 2,
      description: "",
      actualPrice: 124,
      discountPrice: 180,
      rating: 5,
      imageUrl: "/house.jpg",
    },
    {
      id: 3,
      description: "",
      actualPrice: 134,
      discountPrice: 460,
      rating: 3,
      imageUrl: "/house.jpg",
    },
    {
      id: 5,
      description: "",
      actualPrice: 156,
      discountPrice: 100,
      rating: 5,
      imageUrl: "/house.jpg",
    },
    {
      id: 6,
      description: "",
      actualPrice: 156,
      discountPrice: 100,
      rating: 5,
      imageUrl: "/house.jpg",
    },
    {
      id: 7,
      description: "",
      actualPrice: 156,
      discountPrice: 100,
      rating: 5,
      imageUrl: "/house.jpg",
    },
  ];
  type productType = {
    id: number;
    description: string;
    actualPrice: number;
    discountPrice: number;
    rating: number;
    imageUrl: string | StaticImport;
  } | null;
  const [product, setProduct] = React.useState<productType>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const productList = products?.map((product) => {
    return (
      <ProductTile
        key={product.id}
        product={product}
        setProduct={setProduct}
        setIsOpen={setIsOpen}
      />
    );
  });

  return (
    <div className="product-page-container">
      <ProductPage isDisable={false} isOpen={isOpen} setIsOpen={setIsOpen}>
        <ProductView product={product} />
      </ProductPage>
      <div className="product-page-filters">
        <Filters />
      </div>
      <div className="product-page-list">{productList}</div>
    </div>
  );
}

export default ProductListPage;
