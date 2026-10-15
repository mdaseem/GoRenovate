"use client";
import React from "react";
import Image from "next/image";
import "./RoomCard.css";
import { Essential, Room, humanizeStyleTag } from "@/app/types/category";
import RoomScene from "../RoomScene/RoomScene";
import { useInView } from "../../CustomHooks/useInView";
import { ResolvedScene } from "@/app/utils/sceneSpec";
import View3DButton from "../View3DButton/View3DButton";

type Props = {
  room: Room;
  onOpen: () => void;
  // The room's pieces drawn in its space. Only passed when at least one piece
  // has a vendor cutout; otherwise the card keeps its hero image / placeholder.
  preview?: {
    scene: ResolvedScene;
    items: Essential[];
    spaceName?: string;
  };
  // The room's pieces that have a 3D model. The card shows a "3D" button when there
  // is at least one; with several, the viewer lets you switch between them.
  modelPieces?: { id: string; name: string }[];
  onView3D?: (firstId: string, groupIds: string[]) => void;
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

export default function RoomCard({ room, onOpen, preview, modelPieces, onView3D }: Props) {
  const pieceCount = room.essentialIds.length;
  const pieceLabel = `${pieceCount} ${pieceCount === 1 ? "piece" : "pieces"}`;
  // The scene thumbnail (SVG backdrop + one image per piece) is only built once
  // its card is near the screen; until then the sized box below holds the space.
  const [mediaRef, isNearScreen] = useInView<HTMLDivElement>();

  const has3D = Boolean(onView3D && modelPieces && modelPieces.length > 0);

  // The card itself is one <button>, and a button cannot sit inside a button, so
  // the "3D" pill is its sibling inside this wrapper, laid over the card's corner.
  return (
    <div className="room-card-shell">
    <button
      type="button"
      className="room-card"
      onClick={onOpen}
      aria-label={`Configure ${room.title} — ${pieceLabel}, ${formatPrice(room.totalPrice)}`}
    >
      <div
        ref={mediaRef}
        className={`room-card-media${preview ? " room-card-media--scene" : ""}`}
      >
        {preview ? (
          isNearScreen && (
            <RoomScene scene={preview.scene} items={preview.items} compact />
          )
        ) : room.heroImageUrl ? (
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
        {preview?.spaceName && (
          <p className="room-card-space">In: {preview.spaceName}</p>
        )}
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
    {has3D && modelPieces && onView3D && (
      <View3DButton
        label={modelPieces.length === 1 ? modelPieces[0].name : `${room.title} (${modelPieces.length} pieces)`}
        className="room-card-3d"
        onClick={() => onView3D(modelPieces[0].id, modelPieces.map((piece) => piece.id))}
      />
    )}
    </div>
  );
}
