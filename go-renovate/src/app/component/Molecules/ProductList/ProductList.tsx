import React from "react";
import ProductTile from "../../Atoms/ProductTile/productTile";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Loader from "../Loader/Loader";

type productType = {
  _id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string | StaticImport;
} | null;

type propType = {
  productLists: { data: productType[] };
  setProduct: React.Dispatch<React.SetStateAction<productType>>;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

function ProductList(props: propType) {
    if(!props.productLists.data?.length) {
        return <Loader />
    }
  const productList = props.productLists?.data?.map((product: productType) => {
    return (
      <ProductTile
        key={product?._id}
        product={product}
        setProduct={props.setProduct}
        setIsOpen={props.setIsOpen}
      />
    );
  });

  return productList;
}

export default ProductList;
