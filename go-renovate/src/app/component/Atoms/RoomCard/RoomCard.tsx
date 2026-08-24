import React from "react";
import Image from "next/image";
import "./RoomCard.css";
import { Room } from "../../CategoryPage/category";

type Props = {
  room: Room;
  onOpen: () => void;
};

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

export default function RoomCard({ room, onOpen }: Props) {
  return (
    <button type="button" className="room-card" onClick={onOpen}>
      <div className="room-card-media">
        {room.heroImageUrl ? (
          <Image
            src={room.heroImageUrl}
            alt=""
            width={220}
            height={160}
            className="room-card-image"
          />
        ) : (
          <span className="room-card-placeholder" aria-hidden="true">
            🖼️
          </span>
        )}
      </div>
      <p className="room-card-title">{room.title}</p>
      <p className="room-card-price">{formatPrice(room.totalPrice)}</p>
      {room.styleTags.length > 0 && (
        <ul className="room-card-tags" aria-label="Style">
          {room.styleTags.map((tag) => (
            <li key={tag} className="room-card-tag">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}
