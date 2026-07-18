import React from "react";
import VendorCard from "../../Atoms/VendorCard/VendorCard";

type productType = {
  _id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

type propType = {
  productLists: { data: productType[] };
  setProduct: React.Dispatch<React.SetStateAction<productType>>;
  setIsOpen: (payload: boolean) => void;
};

function ProductList(props: propType) {
  const productList = props.productLists?.data?.map((product: productType) => {
    return (
      <VendorCard
        key={product?._id}
        vendor={product}
        setProduct={props.setProduct}
        setIsOpen={props.setIsOpen}
      />
    );
  });

  return productList;
}

export default ProductList;
