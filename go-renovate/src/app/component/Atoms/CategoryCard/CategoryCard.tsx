import React from "react";
import Link from "next/link";
import "./CategoryCard.css";
import { Category } from "@/app/types/category";

type Props = {
  category: Category;
};

export default function CategoryCard({ category }: Props) {
  return (
    <Link href={`/roomCategory/${category.slug}`} className="category-card">
      <span className="category-card-icon" aria-hidden="true">
        {category.icon}
      </span>
      <span className="category-card-name">{category.name}</span>
      <span className="category-card-arrow" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
