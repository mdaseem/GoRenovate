import React, { useEffect } from "react";
import "./ProductListPage.style.css";
import ProductPage from "../../HOC/Overlay/Overlay";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Filters from "../Filters/view/Filters.view";
import ProductView from "../../Atoms/ProductView/ProductView";
import { useDispatch, useSelector } from "react-redux";
import { getProducts } from "@/app/store/features/productSlice";
import { useSession } from "next-auth/react";
import { RootState } from "@/app/store/store";
import ProductList from "../ProductList/ProductList";
import { Loader1 } from "../Loader/Loader";

type productType = {
  _id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string | StaticImport;
} | null;

function ProductListPage(props: { products: void | Response }) {
  const [product, setProduct] = React.useState<productType>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const dispatch = useDispatch();
  const { data: session } = useSession();

  const productLists = useSelector((state: RootState) => state.productsList);
  const productListsData =
    props.products != undefined
      ? { data: props.products, isloading: false, error: null }
      : {
          data: productLists?.prodList?.data,
          isloading: productLists?.isloading,
          error: null,
        };

  useEffect(() => {
    if (session?.backendToken && !props.products) {
      dispatch(getProducts({ token: session?.backendToken }));
    }
  }, [session]);

  return (
    <div className="product-page-container">
      <ProductPage isDisable={false} isOpen={isOpen} setIsOpen={setIsOpen}>
        <ProductView product={product} />
      </ProductPage>
      <div className="product-page-filters">{<Filters />}</div>
      <div className="product-page-list">
        {productListsData?.isloading && !props.products ? (
          <Loader1 />
        ) : (
          <ProductList
            productLists={productListsData}
            setIsOpen={setIsOpen}
            setProduct={setProduct}
          />
        )}
      </div>
    </div>
  );
}

export default ProductListPage;
