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

type productType = {
  _id: number;
  description: string;
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
          error: null,
        };

  useEffect(() => {
    if (session?.backendToken && !props.products) {
      dispatch(getProducts({ token: session?.backendToken }));
    } else if (props.products) {
      dispatch(setProducts({ data: props.products }));
    }
  }, [session]);

  return (
    <div className="product-page-container">
      <Overlay
        isDisable={false}
        isOpen={store.isOpenProductPage}
        setIsOpen={(payload) => dispatch(setOpenStateProductPage(payload))}
        shouldReturnNull={product && store.isOpenProductPage ? false : true}
      >
        <ProductView product={product} />
      </Overlay>
      <div className="product-page-filters">{<Filters />}</div>
      <div className="product-page-list">
        {productListsData?.isloading && !props.products ? (
          <Loader1 />
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
