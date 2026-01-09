"use client";
import React from "react";
import "./WishListPage.css";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { useSelector } from "react-redux";
import { RootState } from "@/app/store/store";
import ProductTile from "../../Atoms/ProductTile/productTile";
import ProductPage from "../../HOC/ProductPage/ProductPage";
import ProductView from "../../Atoms/ProductView/ProductView";

type productType = {
  id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string | StaticImport;
} | null;

type PropsType = {
  isOpen: boolean;
  // setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function WishListPage(props: PropsType) {
  const favsList = useSelector((state: RootState) => state.favoriteList);
  const [product, setProduct] = React.useState<productType>(null);
  const [isProductOpen, setIsProductOpen] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const ProductList = () => {
    return favsList?.map((product: productType) => (
      <ProductTile
        key={product?.id}
        product={product}
        setProduct={setProduct}
        setIsOpen={setIsOpen}
      />
    ));
  };
  return (
    <div className="product-page-container-wishlist">
      <ProductPage isOpen={isOpen} setIsOpen={setIsOpen}>
        {<ProductView product={product}/>}
      </ProductPage>
      <ProductList />
    </div>
  );
}

export default WishListPage;
