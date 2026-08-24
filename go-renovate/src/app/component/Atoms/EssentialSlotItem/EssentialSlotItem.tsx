import React from "react";
import Image from "next/image";
import "./EssentialSlotItem.css";
import { Essential, CategorySlot } from "../../CategoryPage/category";

type Props = {
  slot: CategorySlot;
  essential: Essential;
  onSwap: () => void;
};

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function EssentialSlotItem({ slot, essential, onSwap }: Props) {
  const image = essential.images[0];

  return (
    <li className="essential-slot-item">
      <div className="essential-slot-item-media">
        {image ? (
          <Image
            src={image}
            alt=""
            width={72}
            height={72}
            className="essential-slot-item-image"
          />
        ) : (
          <span
            className="essential-slot-item-placeholder"
            aria-hidden="true"
          >
            📦
          </span>
        )}
      </div>
      <div className="essential-slot-item-details">
        <span className="essential-slot-item-slot-label">{slot.label}</span>
        <p className="essential-slot-item-name">{essential.name}</p>
        <p className="essential-slot-item-meta">
          {formatPrice(essential.price)} · {essential.vendorName}
        </p>
      </div>
      <button
        type="button"
        className="essential-slot-item-swap"
        onClick={onSwap}
        aria-label={`Swap ${slot.label}`}
      >
        Swap
      </button>
    </li>
  );
}
