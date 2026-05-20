import React, { use, useEffect } from "react";
import "./SearchBar.css";
import { RootState } from "@/app/store/store";
import { useDispatch, useSelector } from "react-redux";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import ProductTile from "../ProductTile/productTile";
import { setOpenStateProductPageFromSearch } from "@/app/store/features/overLaySlice";
import Overlay from "../../HOC/Overlay/Overlay";
import ProductView from "../ProductView/ProductView";

type productType = {
  _id: number;
  description: string;
  actualPrice: number;
  discountPrice: number;
  rating: number;
  imageUrl: string[];
} | null;

function SearchBar() {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [product, setProduct] = React.useState<productType>(null);
  const [onFocus, setOnFocus] = React.useState(false);
  const store = useSelector((state: RootState) => state);
  const [filteredProducts, setFilteredProducts] = React.useState<productType[]>(
    [],
  );
  const dispatch = useDispatch();
  useEffect(() => {
    const filtered = store?.productsList?.prodList?.data?.filter(
      (product: productType) =>
        product?.description?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProducts(filtered);
  }, [searchTerm]);

  return (
    <div className={`search-bar-container ${onFocus ? "expanded" : ""}`}>
      <Overlay
        isDisable={false}
        isOpen={store.overlay.isOpenProductPageFromSearch}
        setIsOpen={(payload) =>
          dispatch(setOpenStateProductPageFromSearch(payload))
        }
        shouldReturnNull={
          product && store.overlay.isOpenProductPageFromSearch ? false : true
        }
      >
        <ProductView product={product} />
      </Overlay>
      <input
        className="search-input"
        onFocus={() => setOnFocus(true)}
        onBlur={() => setOnFocus(false)}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search..."
      />
      {onFocus && !searchTerm.length ? (
        <div className="search-results-container">
          <div className="previous-searched-container">
            <h4>Previously Searched</h4>
            <div>
              <p>Living Room</p>
            </div>
            <div>
              <p>Living Room</p>
            </div>
            <div>
              <p>Living Room</p>
            </div>
            <div>
              <p>Living Room</p>
            </div>
          </div>
          <div className="suggestion-searched-container">
            <h4>Suggestions</h4>
            <div>
              <p>Living Room</p>
            </div>
            <div>
              <p>Living Room</p>
            </div>
            <div>
              <p>Living Room</p>
            </div>
          </div>
        </div>
      ) : (
        onFocus && (
          <div className="search-results-container-results">
            <h4>Results</h4>
            <div className="search-results">
              {filteredProducts?.length > 0 ? (
                filteredProducts?.map((product: productType) => (
                  <div key={product?._id} className="search-result-item">
                    <ProductTile
                      setIsOpen={(payload) => {
                        dispatch(setOpenStateProductPageFromSearch(payload));
                      }}
                      isForSearch={true}
                      product={product}
                      setProduct={setProduct}
                    />
                  </div>
                ))
              ) : (
                <p>No results found.</p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default SearchBar;
