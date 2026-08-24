"use client";
import React, { useEffect } from "react";
import "./CategoryListPage.css";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { RootState } from "@/app/store/store";
import { getCategories } from "@/app/store/features/categorySlice";
import CategoryCard from "../../Atoms/CategoryCard/CategoryCard";
import ErrorState from "../../Atoms/ErrorState/ErrorState";
import BackLink from "../../Atoms/BackLink/BackLink";
import { Loader1 } from "../Loader/Loader";

export default function CategoryListPage() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector(
    (state: RootState) => state.categoryState.categories,
  );
  const isLoading = useAppSelector(
    (state: RootState) => state.categoryState.isLoadingCategories,
  );
  const error = useAppSelector(
    (state: RootState) => state.categoryState.categoriesError,
  );

  const fetchCategories = () => dispatch(getCategories());

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  return (
    <div className="category-list-page">
      <BackLink />
      <header className="category-list-page-header">
        <h1 className="category-list-page-title">Shop by Room</h1>
        <p className="category-list-page-sub">
          Curated furniture, décor, and essentials — mixed and matched from
          vendors across the city.
        </p>
      </header>

      {isLoading && (
        <div className="category-list-page-status">
          <Loader1 />
        </div>
      )}
      {error && (
        <ErrorState
          title="Couldn't load categories"
          message={error}
          actionLabel="Retry"
          onAction={fetchCategories}
        />
      )}

      {!isLoading && !error && (
        <div className="category-list-page-grid">
          {categories.map((category) => (
            <CategoryCard key={category.slug} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
