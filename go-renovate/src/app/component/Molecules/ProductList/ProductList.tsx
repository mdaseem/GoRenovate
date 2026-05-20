import React from "react";
import ProductTile from "../../Atoms/ProductTile/productTile";

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
