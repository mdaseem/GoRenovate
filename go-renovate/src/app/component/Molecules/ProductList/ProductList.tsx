import React from "react";
import VendorCard from "../../Atoms/VendorCard/VendorCard";
import { Vendor } from "../../VendorPage/vendor";

type propType = {
  productLists: { data: (Vendor | null)[] };
  setProduct: React.Dispatch<React.SetStateAction<Vendor | null>>;
  setIsOpen: (payload: boolean) => void;
};

function ProductList(props: propType) {
  const productList = props.productLists?.data?.map((product: Vendor | null) => {
    return (
      <VendorCard
        key={product?.id}
        vendor={product}
        setProduct={props.setProduct}
        setIsOpen={props.setIsOpen}
      />
    );
  });

  return productList;
}

export default ProductList;
