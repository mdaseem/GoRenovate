import React, { useEffect } from "react";
import "./ProductListPage.style.css";
import Overlay from "../../HOC/Overlay/Overlay";
import Filters from "../Filters/view/Filters.view";
import ProductView from "../../Atoms/ProductView/ProductView";
import { useDispatch, useSelector } from "react-redux";
import { getProducts, setProducts } from "@/app/store/features/productSlice";
import { useSession } from "next-auth/react";
import { RootState } from "@/app/store/store";
import ProductList from "../ProductList/ProductList";
import { Loader1 } from "../Loader/Loader";
import { setOpenStateProductPage } from "@/app/store/features/overLaySlice";
import VendorPage from "../../VendorPage/VendorPage";
import ErrorState from "../../Atoms/ErrorState/ErrorState";

type productType = {
  id: number;
  name: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

function ProductListPage(props: { products: void | Response }) {
  const [product, setProduct] = React.useState<productType>(null);
  const dispatch = useDispatch();
  const { data: session } = useSession();
  const store = useSelector((state: RootState) => state.overlay);

  const productLists = useSelector((state: RootState) => state.productsList);
  const productListsData =
    props.products != undefined
      ? { data: props.products, isloading: false, error: null }
      : {
          data: productLists?.prodList?.data,
          isloading: productLists?.isloading,
          error: productLists?.error ?? null,
        };

  const retryFetchProducts = () => {
    dispatch(getProducts({ token: session?.backendToken }));
  };

  useEffect(() => {
    if (props.products) {
      dispatch(setProducts({ data: props.products }));
    } else {
      dispatch(getProducts({ token: session?.backendToken }));
    }
  }, [session]);

  const hasProducts = (productListsData?.data?.length ?? 0) > 0;

  return (
    <div className="product-page-container">
      <div className="product-page-filters">{<Filters />}</div>
      <div className="product-page-list">
        {productListsData?.isloading && !props.products ? (
          <Loader1 />
        ) : productListsData?.error && !hasProducts ? (
          <ErrorState
            title="Couldn't load products"
            message={productListsData.error}
            actionLabel="Retry"
            onAction={retryFetchProducts}
          />
        ) : !hasProducts ? (
          <ErrorState
            title="No products found"
            message="Check back soon — new services are added regularly."
          />
        ) : (
          <ProductList
            productLists={productListsData}
            setIsOpen={(payload) => {
              dispatch(setOpenStateProductPage(payload));
            }}
            setProduct={setProduct}
          />
        )}
      </div>
    </div>
  );
}

export default ProductListPage;
