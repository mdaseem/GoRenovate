import React from "react";
import Image from "next/image";
import "./RoomCard.css";
import { Room, humanizeStyleTag } from "@/app/types/category";

type Props = {
  room: Room;
  onOpen: () => void;
};

function formatPrice(price: number): string {
  return `₹${price.toLocaleString("en-IN")}`;
}

const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 12h14M13 6l6 6-6 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function RoomCard({ room, onOpen }: Props) {
  const pieceCount = room.essentialIds.length;
  const pieceLabel = `${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`;

  return (
    <button
      type="button"
      className="room-card"
      onClick={onOpen}
      aria-label={`Configure ${room.title} — ${pieceLabel}, ${formatPrice(room.totalPrice)}`}
    >
      <div className="room-card-media">
        {room.heroImageUrl ? (
          <Image
            src={room.heroImageUrl}
            alt=""
            width={140}
            height={140}
            className="room-card-image"
          />
        ) : (
          <span className="room-card-placeholder" aria-hidden="true">
            🖼️
          </span>
        )}
      </div>

      <div className="room-card-body">
        <span className="room-card-eyebrow">Curated Room</span>
        <p className="room-card-title">{room.title}</p>
        <p className="room-card-piece-count">{pieceLabel} · multi-vendor bundle</p>
        {room.styleTags.length > 0 && (
          <ul className="room-card-tags" aria-label="Style">
            {room.styleTags.map((tag) => (
              <li key={tag} className="room-card-tag">
                {humanizeStyleTag(tag)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="room-card-action">
        <span className="room-card-price">{formatPrice(room.totalPrice)}</span>
        <span className="room-card-cta">
          Configure
          <ArrowIcon />
        </span>
      </div>
    </button>
  );
}
