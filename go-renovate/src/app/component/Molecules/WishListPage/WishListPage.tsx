"use client";
import React from "react";
import "./WishListPage.css";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import VendorCard from "../../Atoms/VendorCard/VendorCard";
import ProductPage from "../../HOC/Overlay/Overlay";
import ProductView from "../../Atoms/ProductView/ProductView";

type productType = {
  id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

type PropsType = {
  isOpen: boolean;
};

function WishListPage(props: PropsType) {
  const favsList = useSelector((state: RootState) => state.favoriteList);
  const [product, setProduct] = React.useState<productType>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const ProductList = () => {
    return favsList?.map((product: productType) => (
      <VendorCard
        key={product?.id}
        vendor={product}
        setProduct={setProduct}
        setIsOpen={setIsOpen}
      />
    ));
  };
  return (
    <div className="product-page-container-wishlist">
      <ProductPage isDisable={false} isOpen={isOpen} setIsOpen={setIsOpen}>
        {<ProductView product={product} />}
      </ProductPage>
      <ProductList />
    </div>
  );
}

export default WishListPage;
